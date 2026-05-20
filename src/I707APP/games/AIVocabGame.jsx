import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";

import { BASIC_VOCABULARY } from '../../data/BasicLevel/index';



import { VOCABULARY_FOUNDATION } from "../../data/IeltsFoundation/index";

import { VOCABULARY_GRADUATION } from "../../data/IeltsGraduation/index";

import "./Games.css";

async function sendToAI(messages, level) {
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
            content: `You are a friendly English vocabulary teacher having a chat with a student. Level: ${level}.

      Your job:
    - Ask the student what a word means and to make a sentence with beautiful smiles and emojis
    - When they answer, give SHORT friendly feedback (max from 2 to 3 sentences)
    - Tell them the correct meaning a bit simply and advance see their level
    - Give a score like "Score: 85/100" the score should be honest
    - They should learn the words with sentences make sentences then write specifical emojis for sentences 
    - Then say "Ready for the next word? Type yes to continue." 
    - When they say yes, move to the next word from the list
    - At the end say "Session complete! Well done." with final summary


    - overall the conversation should be honest then they should learn even minimum 90% percent be honest then make sure exaples and other seciton should write in different line

    Keep responses short, warm, encouraging. Use simple English. Never be formal.`
          },
          ...messages
        ],
        max_tokens: 150
      })
    });
    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (e) { return null; }
}

function getScoreColor(score) {
  if (score >= 80) return "#4CAF50";
  if (score >= 55) return "#FFD700";
  return "#C0392B";
}

export default function AIVocabGame() {
  const navigate = useNavigate();
  const { user, userData, loading } = useUser();
  const [isDay] = useState(() => localStorage.getItem("i707_theme") === "light");
  const [step, setStep] = useState("select");
  const [learnedWords, setLearnedWords] = useState([]);
  const [selectedWords, setSelectedWords] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [aiTyping, setAiTyping] = useState(false);
  const [results, setResults] = useState([]);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [sessionDone, setSessionDone] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (!loading && !user) navigate("/i707/login");
  }, [user, loading]);

  useEffect(() => {
    if (!userData) return;
    const level = userData.level || "A1";
    const learnedIds = (userData.learnedWords || []).filter(w => w.startsWith(level));
    const allWords =
      level === "IELTS_FOUNDATION" ? (VOCABULARY_FOUNDATION.IELTS_FOUNDATION || []) :
      level === "IELTS_GRADUATION" ? (VOCABULARY_GRADUATION.IELTS_GRADUATION || []) :
      VOCABULARY[level] || VOCABULARY.A1;
    const learned = allWords.filter(w => learnedIds.includes(`${level}_${w.word}`));
    setLearnedWords(learned);
  }, [userData]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, aiTyping]);

  const toggleSelect = (word) => {
    setSelectedWords(prev =>
      prev.find(w => w.word === word.word)
        ? prev.filter(w => w.word !== word.word)
        : [...prev, word]
    );
  };

  const startChat = async () => {
    if (selectedWords.length === 0) return;
    const level = userData?.level || "A1";
    const wordList = selectedWords.map(w => `"${w.word}" (${w.definition})`).join(", ");
    const firstMsg = {
      role: "user",
      content: `Let's practice these words: ${wordList}. Start with the first word and ask me what it means.`
    };
    setStep("chat");
    setAiTyping(true);
    const aiReply = await sendToAI([firstMsg], level);
    setMessages([
      { role: "ai", text: aiReply || "Let's start! What does the first word mean?" }
    ]);
    setAiTyping(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || aiTyping) return;
    const userText = input.trim();
    setInput("");

    const newMessages = [...messages, { role: "user", text: userText }];
    setMessages(newMessages);
    setAiTyping(true);

    // Extract score from AI response if any
    const extractScore = (text) => {
      const match = text?.match(/Score:\s*(\d+)\/100/i);
      return match ? parseInt(match[1]) : null;
    };

    const level = userData?.level || "A1";
    const apiMessages = newMessages.map(m => ({
      role: m.role === "ai" ? "assistant" : "user",
      content: m.text
    }));

    const aiReply = await sendToAI(apiMessages, level);
    const score = extractScore(aiReply);

    if (score !== null) {
      const coins = score >= 80 ? 3 : score >= 55 ? 2 : 1;
      setCoinsEarned(prev => prev + coins);
      setResults(prev => [...prev, { score }]);
    }

    const isDone = aiReply?.toLowerCase().includes("session complete") ||
      aiReply?.toLowerCase().includes("well done") ||
      aiReply?.toLowerCase().includes("finished");

    if (isDone) {
      setSessionDone(true);
      if (user && userData && coinsEarned > 0) {
        try {
          await updateDoc(doc(db, "users", user.uid), {
            coins: (userData.coins || 0) + coinsEarned
          });
        } catch (e) { console.log(e); }
      }
    }

    setMessages(prev => [...prev, { role: "ai", text: aiReply || "Great! Let's continue." }]);
    setAiTyping(false);
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

  const level = userData.level || "A1";
  const avgScore = results.length > 0 ? Math.round(results.reduce((a, b) => a + b.score, 0) / results.length) : 0;

  // ── STEP 1: SELECT ──
  if (step === "select") return (
    <div className={`i707-game ${isDay ? "light" : ""}`}>
      <div className="i707-game-orb i707-game-orb--a" />
      <div className="i707-game-orb i707-game-orb--b" />

      <header className="i707-game-topbar">
        <button className="i707-game-back" onClick={() => navigate("/i707/games")}>← Games</button>
        <span className="i707-game-title">AI Vocab</span>
        <span className="i707-game-score" style={{ color: "#00BCD4" }}>{selectedWords.length} selected</span>
      </header>

      <main className="i707-game-main">
        <div className="i707-game-hero">
          <div className="i707-game-hero__topline" style={{ background: "linear-gradient(90deg, transparent, #00BCD4, #4CAF50, transparent)" }} />
          <div className="i707-game-hero__shimmer" />
          <span className="i707-game-hero__eyebrow">✦ AI Chat · Choose your words</span>
          <h1 className="i707-game-hero__title">AI<br /><em>Vocabulary</em></h1>
          <p className="i707-game-hero__sub">Select words to practice. AI will chat with you and test your understanding naturally.</p>
        </div>

        {learnedWords.length === 0 ? (
          <div className="i707-game-result" style={{ margin: "0 22px" }}>
            <div className="i707-game-result__topline" />
            <div className="i707-game-result__icon">📚</div>
            <h2 className="i707-game-result__title">No learned words yet</h2>
            <p className="i707-game-result__sub">Go to Vocabulary and learn some words first.</p>
            <button className="i707-game-result__btn" onClick={() => navigate("/i707/vocabulary")}>Go to Vocabulary</button>
          </div>
        ) : (
          <>
            <div className="i707-aivocab-select-header">
              <span className="i707-aivocab-select-label">Learned Words · {learnedWords.length} total</span>
              <button className="i707-aivocab-select-all"
                onClick={() => setSelectedWords(selectedWords.length === learnedWords.length ? [] : [...learnedWords])}>
                {selectedWords.length === learnedWords.length ? "Deselect All" : "Select All"}
              </button>
            </div>

            <div className="i707-aivocab-grid">
              {learnedWords.map((word, i) => {
                const isSelected = selectedWords.find(w => w.word === word.word);
                return (
                  <div key={i} className={`i707-aivocab-word ${isSelected ? "selected" : ""}`}
                    onClick={() => toggleSelect(word)}>
                    <div className="i707-aivocab-word__check">{isSelected ? "✓" : ""}</div>
                    <div className="i707-aivocab-word__content">
                      <span className="i707-aivocab-word__name">{word.word}</span>
                      <span className="i707-aivocab-word__pos">{word.partOfSpeech}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ padding: "0 22px" }}>
              <button className="i707-game-btn i707-game-btn--primary"
                onClick={startChat}
                disabled={selectedWords.length === 0}
                style={{ background: selectedWords.length > 0 ? "#00BCD4" : undefined, width: "100%" }}>
                Start AI Chat · {selectedWords.length} words
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );

  // ── STEP 2: CHAT ──
  if (step === "chat") return (
    <div className={`i707-game ${isDay ? "light" : ""}`}
      style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <div className="i707-game-orb i707-game-orb--a" />
      <div className="i707-game-orb i707-game-orb--b" />

      <header className="i707-game-topbar" style={{ flexShrink: 0 }}>
        <button className="i707-game-back" onClick={() => setStep("select")}>← Back</button>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
          <span className="i707-game-title">AI Vocab</span>
          <span style={{ fontFamily: "Lora, Georgia, serif", fontSize: "9px", letterSpacing: "2px", color: "#00BCD4", fontStyle: "italic" }}>
            {selectedWords.length} words · {level}
          </span>
        </div>
        <span className="i707-game-score">🪙 +{coinsEarned}</span>
      </header>

      {/* CHAT MESSAGES */}
      <div className="i707-aivocab-chat" style={{ flex: 1, overflowY: "auto" }}>
        {messages.map((msg, i) => (
          <div key={i} className={`i707-aivocab-msg ${msg.role === "ai" ? "ai" : "user"}`}>
            {msg.role === "ai" && (
              <div className="i707-aivocab-msg__avatar">✦</div>
            )}
            <div className={`i707-aivocab-msg__bubble ${msg.role === "ai" ? "ai" : "user"}`}>
              <p className="i707-aivocab-msg__text">{msg.text}</p>
            </div>
          </div>
        ))}

        {aiTyping && (
          <div className="i707-aivocab-msg ai">
            <div className="i707-aivocab-msg__avatar">✦</div>
            <div className="i707-aivocab-msg__bubble ai">
              <div className="i707-aivocab-typing">
                <div className="i707-aivocab-typing__dot" />
                <div className="i707-aivocab-typing__dot" style={{ animationDelay: "0.2s" }} />
                <div className="i707-aivocab-typing__dot" style={{ animationDelay: "0.4s" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* INPUT */}
      {!sessionDone ? (
        <div className="i707-aivocab-input-bar" style={{ flexShrink: 0 }}>
          <textarea
            className="i707-aivocab-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type your answer..."
            rows={1}
            disabled={aiTyping}
          />
          <button className="i707-aivocab-send"
            onClick={sendMessage}
            disabled={!input.trim() || aiTyping}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M14 8H2M9 3l5 5-5 5"/>
            </svg>
          </button>
        </div>
      ) : (
        <div className="i707-aivocab-input-bar" style={{ flexShrink: 0 }}>
          <button className="i707-game-btn i707-game-btn--primary"
            onClick={() => setStep("result")}
            style={{ background: "#00BCD4", width: "100%", margin: "0" }}>
            See Results →
          </button>
        </div>
      )}
    </div>
  );

  // ── STEP 3: RESULT ──
  return (
    <div className={`i707-game ${isDay ? "light" : ""}`}>
      <div className="i707-game-orb i707-game-orb--a" />
      <div className="i707-game-orb i707-game-orb--b" />

      <header className="i707-game-topbar">
        <button className="i707-game-back" onClick={() => navigate("/i707/games")}>← Games</button>
        <span className="i707-game-title">AI Vocab</span>
        <span className="i707-game-score">🪙 +{coinsEarned}</span>
      </header>

      <main className="i707-game-main">
        <div className="i707-game-hero">
          <div className="i707-game-hero__topline" style={{ background: "linear-gradient(90deg, transparent, #00BCD4, #FFD700, transparent)" }} />
          <div className="i707-game-hero__shimmer" />
          <span className="i707-game-hero__eyebrow">Session Complete</span>
          <h1 className="i707-game-hero__title">Your<br /><em>Results</em></h1>
        </div>

        <div className="i707-aivocab-result">
          <div className="i707-aivocab-result__topline" style={{
            background: `linear-gradient(90deg, transparent, ${getScoreColor(avgScore)}, transparent)`
          }} />
          <div className="i707-aivocab-result__top">
            <div className="i707-aivocab-result__circle"
              style={{ borderColor: getScoreColor(avgScore), boxShadow: `0 0 28px ${getScoreColor(avgScore)}25` }}>
              <span className="i707-aivocab-result__circle-num" style={{ color: getScoreColor(avgScore) }}>{avgScore}</span>
              <span className="i707-aivocab-result__circle-pct">/100</span>
            </div>
            <div className="i707-aivocab-result__top-info">
              <span className="i707-aivocab-result__eyebrow">Average Score</span>
              <span className="i707-aivocab-result__verdict">
                {avgScore >= 80 ? "Excellent!" : avgScore >= 55 ? "Good work!" : "Keep studying!"}
              </span>
            </div>
          </div>
          <div className="i707-aivocab-result__stats">
            <div className="i707-aivocab-result__stat">
              <span className="i707-aivocab-result__stat-num" style={{ color: "#00BCD4" }}>{selectedWords.length}</span>
              <span className="i707-aivocab-result__stat-lbl">Words</span>
            </div>
            <div className="i707-aivocab-result__stat-sep" />
            <div className="i707-aivocab-result__stat">
              <span className="i707-aivocab-result__stat-num" style={{ color: "#FFD700" }}>+{coinsEarned}</span>
              <span className="i707-aivocab-result__stat-lbl">Coins</span>
            </div>
            <div className="i707-aivocab-result__stat-sep" />
            <div className="i707-aivocab-result__stat">
              <span className="i707-aivocab-result__stat-num" style={{ color: "#4CAF50" }}>{results.length}</span>
              <span className="i707-aivocab-result__stat-lbl">Scored</span>
            </div>
          </div>
        </div>

        <div style={{ padding: "0 22px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <button className="i707-game-result__btn"
            onClick={() => { setStep("select"); setSelectedWords([]); setMessages([]); setResults([]); setCoinsEarned(0); setSessionDone(false); }}>
            Play Again
          </button>
          <button className="i707-game-result__btn-secondary" onClick={() => navigate("/i707/games")}>
            Back to Games
          </button>
        </div>
        <div style={{ height: 24 }} />
      </main>
    </div>
  );
}