import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";

import { MAKE_SENTENCE_THEMES, THEME_KEYS, getRandomTheme, detectThemeCommand } from "../../themes/makeSentenceThemes";

import { BASIC_VOCABULARY } from "../../data/BasicLevel/index";
import { VOCABULARY_FOUNDATION } from "../../data/IeltsFoundation/index";
import { VOCABULARY_GRADUATION } from "../../data/IeltsGraduation/index";

import { getLearnedWords } from "../../services/learnedContent";

import "./Games.css";

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

async function getAIResponse(userSentence, word, definition, userName, level, attempt) {
  try {
    const apiKey = import.meta.env.VITE_DEEPSEEK_KEY;
    if (!apiKey) return null;
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: `You are Atlas, a friendly English teacher. Student: ${userName}. Level: ${level}.
Word: "${word}" — meaning: ${definition}.
Attempt: ${attempt}.

⚠️ CRITICAL — BE 100% HONEST WITH SCORES:
Students DEPEND on real scores to improve. If you lie, you HURT them.

STRICT SCORING RULES:
- 95-100: Sentence is PERFECT. Flawless grammar. Natural. Creative use of "${word}". RARE.
- 85-94: Very good but has 1 small issue.
- 70-84: Word used correctly but 2-3 grammar mistakes.
- 50-69: Word used but sentence sounds unnatural or has many errors.
- 30-49: Major problems. Word used wrong way.
- 10-29: Wrong meaning. Doesn't make sense.
- 0-9: Just the word, no real sentence.

DO NOT round up. If 67, give 67.

RESPONSE FORMAT (use exactly this):
SCORE: X/100
EXAMPLE: [One simple, perfect sentence using "${word}"]
FEEDBACK: [2-3 SHORT sentences in SIMPLE English with emojis. Tell them what's wrong and how to fix it.]

Use VERY SIMPLE English in feedback.`
          },
          {
            role: "user",
            content: `My sentence: "${userSentence}"`
          }
        ],
        max_tokens: 220
      })
    });
    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (e) { console.log(e); return null; }
}

function ScoreRing({ score, color }) {
  const radius = 30;
  const circ = 2 * Math.PI * radius;
  const fill = (score / 100) * circ;
  return (
    <svg width="76" height="76" viewBox="0 0 76 76" style={{ flexShrink: 0 }}>
      <circle cx="38" cy="38" r={radius} fill="none" stroke="rgba(245,240,232,0.06)" strokeWidth="5.5" />
      <circle cx="38" cy="38" r={radius} fill="none" stroke={color} strokeWidth="5.5"
        strokeDasharray={`${fill} ${circ}`}
        strokeLinecap="round"
        strokeDashoffset={circ / 4}
        style={{ transition: "stroke-dasharray 1s cubic-bezier(.23,1,.32,1)" }} />
      <text x="38" y="34" textAnchor="middle" fill={color}
        style={{ fontFamily: "Lora, Georgia, serif", fontSize: "18px", fontWeight: "700" }}>{score}</text>
      <text x="38" y="48" textAnchor="middle" fill="rgba(245,240,232,0.3)"
        style={{ fontFamily: "Lora, Georgia, serif", fontSize: "8px" }}>/100</text>
    </svg>
  );
}

function getScoreColor(score) {
  if (score >= 95) return "#4CAF50";
  if (score >= 75) return "#FFD700";
  if (score >= 50) return "#FF9800";
  return "#C0392B";
}

function getScoreLabel(score) {
  if (score >= 95) return "Perfect! ✨";
  if (score >= 80) return "Almost there!";
  if (score >= 60) return "Good effort";
  if (score >= 40) return "Keep trying";
  return "Needs work";
}

function parseAIResponse(text) {
  if (!text) return { score: null, example: "", feedback: "" };
  const score = text.match(/SCORE:\s*(\d+)\/100/i)?.[1];
  const example = text.match(/EXAMPLE:\s*([\s\S]*?)(?=FEEDBACK:|$)/i)?.[1]?.trim().replace(/^["']|["']$/g, "") || "";
  const feedback = text.match(/FEEDBACK:\s*([\s\S]*?)$/i)?.[1]?.trim() || "";
  return { score: score ? parseInt(score) : null, example, feedback };
}

export default function MakeSentence() {
  const navigate = useNavigate();
  const { user, userData, loading } = useUser();
  const [words, setWords] = useState([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [aiTyping, setAiTyping] = useState(false);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [waitingNext, setWaitingNext] = useState(false);
  const [lastScore, setLastScore] = useState(null);
  const [attemptCount, setAttemptCount] = useState(1);
  const [bestScore, setBestScore] = useState(0);

  // THEME STATES
  const [themeKey, setThemeKey] = useState(() => localStorage.getItem("i707_ms_theme") || "cinematic");
  const [showThemePicker, setShowThemePicker] = useState(false);
  const theme = MAKE_SENTENCE_THEMES[themeKey];

  const bestScoreRef = useRef(0);
  const currentWordRef = useRef(null);
  const chatEndRef = useRef(null);
  const initializedRef = useRef(false);

  const changeTheme = (newKey) => {
    setThemeKey(newKey);
    localStorage.setItem("i707_ms_theme", newKey);
  };

  useEffect(() => {
    if (!loading && !user) navigate("/i707/login");
  }, [user, loading]);

  useEffect(() => {
    if (!userData) return;
    if (initializedRef.current) return;
    initializedRef.current = true;

    const level = userData.level || "A1";
    const allWords =
      level === "IELTS_FOUNDATION" ? (VOCABULARY_FOUNDATION.IELTS_FOUNDATION || []) :
      level === "IELTS_GRADUATION" ? (VOCABULARY_GRADUATION.IELTS_GRADUATION || []) :
      BASIC_VOCABULARY[level] || BASIC_VOCABULARY.A1 || [];
    // In MakeSentence.jsx — around line 95
    const learned = getLearnedWords(userData, allWords, level);


    
      if (learned.length < 4) {
      alert("Learn at least 4 words first in Vocabulary!");
      navigate("/i707/games");
    return;
    }
    const shuffled = shuffle(learned);
    setWords(shuffled);
    startWordChat(shuffled[0]);
  }, [userData]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, aiTyping]);

  const startWordChat = (word) => {
    if (!word) return;
    currentWordRef.current = word;
    setFlipped(false);
    setWaitingNext(false);
    setLastScore(null);
    setAttemptCount(1);
    setBestScore(0);
    bestScoreRef.current = 0;
    setInput("");
    const userName = userData?.fullName?.split(" ")[0] || "there";
    setMessages([{
      role: "ai",
      type: "greeting",
      text: `Hello ${userName}! 😊 Please write a sentence using "${word.word}". Score 95+ to advance!`,
    }]);
  };

  const sendMessage = async () => {
    if (!input.trim() || aiTyping || waitingNext) return;
    const userText = input.trim();

    // ★ THEME COMMAND CHECK — BEFORE word check ★
    const themeCmd = detectThemeCommand(userText);
    if (themeCmd) {
      setMessages(prev => [...prev, { role: "user", type: "text", text: userText }]);
      setInput("");
      let newThemeKey, themeMsg;
      if (themeCmd.action === "random") {
        newThemeKey = getRandomTheme(themeKey);
        themeMsg = `✨ Switched to ${MAKE_SENTENCE_THEMES[newThemeKey].icon} ${MAKE_SENTENCE_THEMES[newThemeKey].name}! Enjoy the new vibe.`;
      } else {
        newThemeKey = themeCmd.theme;
        themeMsg = `${MAKE_SENTENCE_THEMES[newThemeKey].icon} ${MAKE_SENTENCE_THEMES[newThemeKey].name} theme activated!`;
      }
      changeTheme(newThemeKey);
      setTimeout(() => {
        setMessages(prev => [...prev, { role: "ai", type: "warning", text: themeMsg }]);
      }, 300);
      return;
    }

    const current = currentWordRef.current;
    if (!current) return;

    const userName = userData?.fullName?.split(" ")[0] || "there";
    const level = userData?.level || "A1";

    if (!userText.toLowerCase().includes(current.word.toLowerCase())) {
      setMessages(prev => [
        ...prev,
        { role: "user", type: "text", text: userText },
        { role: "ai", type: "warning", text: `I don't see "${current.word}" in your sentence. Please include it! 😊` }
      ]);
      setInput("");
      return;
    }

    setMessages(prev => [...prev, { role: "user", type: "text", text: userText }]);
    setInput("");
    setAiTyping(true);

    const aiReply = await getAIResponse(userText, current.word, current.definition, userName, level, attemptCount);
    const parsed = parseAIResponse(aiReply);

    const newBest = Math.max(bestScoreRef.current, parsed.score || 0);
    bestScoreRef.current = newBest;
    setBestScore(newBest);
    setLastScore(parsed.score);

    const coins = parsed.score
      ? parsed.score >= 95 ? 10
      : parsed.score >= 80 ? 5
      : parsed.score >= 60 ? 3
      : 1
      : 1;

    setCoinsEarned(prev => prev + coins);

    if (user && userData) {
      try {
        await updateDoc(doc(db, "users", user.uid), {
          coins: (userData.coins || 0) + coins
        });
      } catch (e) { console.log(e); }
    }

    setMessages(prev => [...prev, {
      role: "ai",
      type: "feedback",
      score: parsed.score,
      example: parsed.example,
      feedback: parsed.feedback,
    }]);
    setAiTyping(false);
    setWaitingNext(true);

    if (parsed.score !== null && parsed.score >= 95 && attemptCount < 2) {
      setLastScore(94);
    }
  };

  const tryAgain = () => {
    const current = currentWordRef.current;
    if (!current) return;
    const newAttempt = attemptCount + 1;
    setAttemptCount(newAttempt);
    setWaitingNext(false);
    setLastScore(null);
    setMessages(prev => [
      ...prev,
      {
        role: "ai",
        type: "retry",
        text: `Attempt ${newAttempt} — try again with "${current.word}"! Best so far: ${bestScoreRef.current}/100. Need 95+ to advance! 💪`
      }
    ]);
  };

  const nextWord = () => {
    const nextIndex = index + 1 >= words.length ? 0 : index + 1;
    setIndex(nextIndex);
    startWordChat(words[nextIndex]);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading || !userData) return (
    <div style={{ background: "#1A1A1A", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", color: "#F5F0E8", fontSize: "14px", letterSpacing: "3px" }}>
      Loading...
    </div>
  );

  const current = currentWordRef.current || words[index];

  return (
    <div className="i707-game i707-ms-themed" style={{
      background: theme.bg,
      "--theme-bg": theme.bg,
      "--theme-bg2": theme.bg2,
      "--theme-cream": theme.cream,
      "--theme-muted": theme.textMuted,
      "--theme-accent": theme.accent,
      "--theme-accent2": theme.accent2,
      "--theme-border": theme.border,
      "--theme-ai-bubble": theme.aiBubble,
      "--theme-ai-border": theme.aiBubbleBorder,
      "--theme-user-bubble": theme.userBubble,
      "--theme-user-border": theme.userBubbleBorder,
      "--theme-input-bg": theme.inputBg,
      "--theme-orb": theme.orbColor,
      "--theme-card-bg": theme.cardBg,
      "--theme-chat-bg": theme.chatBg,
    }}>
      <div className="i707-game-orb i707-game-orb--a" />
      <div className="i707-game-orb i707-game-orb--b" />

      <header className="i707-game-topbar">
  <button className="i707-game-back" onClick={() => navigate("/i707/games")}>← Games</button>
  <span className="i707-game-title">Make a Sentence</span>
  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    <span className="i707-game-score">🪙 {coinsEarned}</span>
    <button className="i707-ms-theme-orb" onClick={() => setShowThemePicker(true)}
      style={{ 
        borderColor: theme.border,
        background: theme.aiBubble,
      }}>
      <span style={{ fontSize: "16px" }}>{theme.icon}</span>
      <div className="i707-ms-theme-orb__pulse" style={{ background: theme.accent }} />
    </button>
  </div>
</header>

      <div className="i707-ms-screen">

        {/* WORD FLIP CARD */}
        {current && (
          <div className={`i707-ms-flipcard ${flipped ? "flipped" : ""}`}
            onClick={() => setFlipped(f => !f)}>
            <div className="i707-ms-flipcard__inner">
              <div className="i707-ms-word-badge">
                {index + 1} / {words.length}
                {attemptCount > 1 && (
                  <span style={{ marginLeft: 6, color: "#FFD700" }}>· Attempt {attemptCount}</span>
                )}
              </div>

              <div className="i707-ms-flipcard__front">
                <div className="i707-ms-flipcard__topline" />
                <div className="i707-ms-flipcard__shimmer" />
                <span className="i707-ms-flipcard__pos">{current.partOfSpeech}</span>
                <span className="i707-ms-flipcard__word">{current.word}</span>
                <span className="i707-ms-flipcard__def">{current.definition}</span>
                {bestScore > 0 && (
                  <div style={{
                    marginTop: 6, fontFamily: "Lora, serif", fontSize: "10px",
                    fontStyle: "italic", color: "rgba(245,240,232,0.4)", letterSpacing: "1px"
                  }}>
                    Best: <span style={{ color: getScoreColor(bestScore), fontWeight: 700 }}>{bestScore}/100</span>
                    {" · Need "}<span style={{ color: "#4CAF50" }}>95+</span>
                  </div>
                )}
                <div className="i707-ms-flipcard__hint">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" style={{ width: 10, height: 10 }}>
                    <path d="M8 1v8M4 5l4-4 4 4M3 13h10"/>
                  </svg>
                  Tap to see translation
                </div>
              </div>

              <div className="i707-ms-flipcard__back">
                <div className="i707-ms-flipcard__topline" style={{ background: "linear-gradient(90deg, transparent, #FFD700, transparent)" }} />
                <span className="i707-ms-flipcard__pos">Translation</span>
                <span className="i707-ms-flipcard__word" style={{ fontSize: "30px", color: "#FFD700" }}>
                  {current.uzbek || "—"}
                </span>
                <span className="i707-ms-flipcard__def">{current.word}</span>
                <div className="i707-ms-flipcard__hint">Tap to go back</div>
              </div>
            </div>
          </div>
        )}

        {/* CHAT */}
        <div className="i707-ms-chat-wrap">
          <div className="i707-ms-chat-border">
            <div className="i707-ms-chat">
              {messages.map((msg, i) => (
                <div key={i} className={`i707-ms-chat__msg ${msg.role}`}>
                  {msg.role === "ai" && <div className="i707-ms-chat__avatar">✦</div>}

                  {msg.type === "feedback" ? (
                    <div className="i707-ms-feedback-bubble">
                      <div className="i707-ms-fb__score-row">
                        <ScoreRing score={msg.score || 0} color={getScoreColor(msg.score || 0)} />
                        <div className="i707-ms-fb__score-info">
                          <span className="i707-ms-fb__score-label" style={{ color: getScoreColor(msg.score || 0) }}>
                            {getScoreLabel(msg.score || 0)}
                          </span>
                          {msg.score < 95 && (
                            <span className="i707-ms-fb__score-need">Need 95+ to advance</span>
                          )}
                        </div>
                      </div>

                      {msg.example && (
                        <div className="i707-ms-fb__section">
                          <div className="i707-ms-fb__section-header">
                            <span className="i707-ms-fb__section-icon" style={{ background: "rgba(76,175,80,0.1)", color: "#4CAF50", borderColor: "rgba(76,175,80,0.3)" }}>✨</span>
                            <span className="i707-ms-fb__section-label">Perfect Example</span>
                          </div>
                          <p className="i707-ms-fb__section-text" style={{ fontStyle: "italic" }}>"{msg.example}"</p>
                        </div>
                      )}

                      {msg.feedback && (
                        <div className="i707-ms-fb__section">
                          <div className="i707-ms-fb__section-header">
                            <span className="i707-ms-fb__section-icon" style={{ background: "rgba(255,215,0,0.1)", color: "#FFD700", borderColor: "rgba(255,215,0,0.3)" }}>💡</span>
                            <span className="i707-ms-fb__section-label">Feedback</span>
                          </div>
                          <p className="i707-ms-fb__section-text">{msg.feedback}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={`i707-ms-chat__bubble ${msg.role}`}>
                      <p className="i707-ms-chat__text">{msg.text}</p>
                    </div>
                  )}
                </div>
              ))}

              {aiTyping && (
                <div className="i707-ms-chat__msg ai">
                  <div className="i707-ms-chat__avatar">✦</div>
                  <div className="i707-ms-chat__bubble ai">
                    <div className="i707-ms-chat__typing">
                      <div className="i707-ms-chat__typing-dot" />
                      <div className="i707-ms-chat__typing-dot" style={{ animationDelay: "0.2s" }} />
                      <div className="i707-ms-chat__typing-dot" style={{ animationDelay: "0.4s" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </div>
        </div>

        {/* INPUT BAR */}
        <div className="i707-ms-input-bar">
          {waitingNext ? (
            <>
              {(lastScore === null || lastScore < 95) && (
                <button className="i707-ms-tryagain-btn-full" onClick={tryAgain}>
                  ↺ Try Again with a Better Sentence
                </button>
              )}
              {lastScore !== null && lastScore >= 95 && (
                <button className="i707-ms-next-btn-full" onClick={nextWord}>
                  Next Word →
                </button>
              )}
            </>
          ) : (
            <>
              <textarea
                className="i707-ms-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder={`Write a sentence using "${current?.word}"...`}
                rows={1}
                disabled={aiTyping}
              />
              <button className="i707-ms-send"
                onClick={sendMessage}
                disabled={!input.trim() || aiTyping}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M14 8H2M9 3l5 5-5 5"/>
                </svg>
              </button>
            </>
          )}
        </div>

      </div>

      

      {showThemePicker && (
  <div className="i707-ms-theme-overlay" onClick={() => setShowThemePicker(false)}>
    <div className="i707-ms-theme-panel" onClick={e => e.stopPropagation()}
      style={{ background: theme.bg2, borderColor: theme.border }}>
      <div className="i707-ms-theme-panel__topline" style={{ background: `linear-gradient(90deg, transparent, ${theme.accent}, ${theme.accent2}, ${theme.accent}, transparent)` }} />
      <div className="i707-ms-theme-handle" />
      
      <div className="i707-ms-theme-header">
        <span className="i707-ms-theme-eyebrow" style={{ color: theme.accent }}>✦ Aesthetic Library</span>
        <button className="i707-ms-theme-close" onClick={() => setShowThemePicker(false)} 
          style={{ color: theme.textMuted, background: theme.userBubble, borderColor: theme.userBubbleBorder }}>✕</button>
      </div>
      
      <h2 className="i707-ms-theme-title" style={{ color: theme.cream }}>
        Choose a <em style={{ color: theme.accent2, fontStyle: "italic", fontWeight: 400 }}>Theme</em>
      </h2>
      <p className="i707-ms-theme-sub" style={{ color: theme.textMuted }}>
        Or type "change theme" in chat for surprise ✨
      </p>

      {/* APP DEFAULTS */}
      <div className="i707-ms-theme-section-label" style={{ color: theme.textMuted }}>
        <span style={{ background: theme.border }} />
        <span>App Default</span>
        <span style={{ background: theme.border }} />
      </div>
      <div className="i707-ms-theme-grid">
        {THEME_KEYS.filter(k => MAKE_SENTENCE_THEMES[k].isDefault).map(key => {
          const t = MAKE_SENTENCE_THEMES[key];
          const isActive = key === themeKey;
          return (
            <div key={key}
              className={`i707-ms-theme-card ${isActive ? "active" : ""}`}
              onClick={() => { changeTheme(key); setShowThemePicker(false); }}
              style={{ background: t.cardBg, borderColor: isActive ? t.accent : t.border }}>
              <div className="i707-ms-theme-card__icon">{t.icon}</div>
              <div className="i707-ms-theme-card__info">
                <span className="i707-ms-theme-card__name" style={{ color: t.cream }}>{t.name}</span>
                <div className="i707-ms-theme-card__dots">
                  <span style={{ background: t.accent }} />
                  <span style={{ background: t.accent2 }} />
                </div>
              </div>
              {isActive && <div className="i707-ms-theme-card__check" style={{ color: t.accent }}>✓</div>}
            </div>
          );
        })}
      </div>

      {/* VIBES */}
      <div className="i707-ms-theme-section-label" style={{ color: theme.textMuted, marginTop: 22 }}>
        <span style={{ background: theme.border }} />
        <span>Cinematic Vibes</span>
        <span style={{ background: theme.border }} />
      </div>
      <div className="i707-ms-theme-grid">
        {THEME_KEYS.filter(k => !MAKE_SENTENCE_THEMES[k].isDefault).map(key => {
          const t = MAKE_SENTENCE_THEMES[key];
          const isActive = key === themeKey;
          return (
            <div key={key}
              className={`i707-ms-theme-card ${isActive ? "active" : ""}`}
              onClick={() => { changeTheme(key); setShowThemePicker(false); }}
              style={{ background: t.cardBg, borderColor: isActive ? t.accent : t.border }}>
              <div className="i707-ms-theme-card__icon">{t.icon}</div>
              <div className="i707-ms-theme-card__info">
                <span className="i707-ms-theme-card__name" style={{ color: t.cream }}>{t.name}</span>
                <div className="i707-ms-theme-card__dots">
                  <span style={{ background: t.accent }} />
                  <span style={{ background: t.accent2 }} />
                </div>
              </div>
              {isActive && <div className="i707-ms-theme-card__check" style={{ color: t.accent }}>✓</div>}
            </div>
             );
            })}
            </div>
          </div>
        </div>
        )}
    </div>
  );
}