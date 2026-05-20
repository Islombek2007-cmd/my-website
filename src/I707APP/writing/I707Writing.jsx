import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";

import { WRITING_FOUNDATION } from "../../data/foundationData/writingFoundation";
import { WRITING_GRADUATION } from "../../data/graduationData/writingGraduation";
import "./I707Writing.css";


import { BASIC_WRITING } from "../../data/BasicLevel/index";







const WRITING_TOPICS = {
  A1: ["My family", "My house", "My school", "My pet", "My day"],
  A2: ["My weekend", "My favorite food", "My best friend", "My hobby", "My town"],
  B1: ["My future plans", "A trip I remember", "My favorite book", "Technology in my life", "My dream job"],
  B2: ["Social media and society", "The importance of education", "Climate change", "City vs countryside life", "The role of technology"],
  C1: ["The impact of globalization", "Artificial intelligence and the future", "Democracy and freedom", "Cultural identity", "Economic inequality"],
  C2: ["Philosophical concepts of freedom", "Postmodern society", "Ethics of technology", "The nature of consciousness", "Power and language"],
};

function getLevelColor(level) {
  const colors = { A1: "#4CAF50", A2: "#8BC34A", B1: "#2196F3", B2: "#9C27B0", C1: "#FF9800", C2: "#C0392B", IELTS_FOUNDATION: "#C0392B", IELTS_GRADUATION: "#FFD700" };
  return colors[level] || "#4CAF50";
}

async function getAIFeedback(uzbekSentence, userTranslation, correctTranslation, level) {
  try {
    const apiKey = import.meta.env.VITE_DEEPSEEK_KEY;
    if (!apiKey) return null;
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: `You are an expert English language teacher specializing in IELTS preparation. The student's level is ${level}. Give concise, encouraging feedback on their translation. Focus on: grammar, vocabulary choice, and accuracy. Keep feedback to 2-3 sentences maximum. Be specific about what was good and what needs improvement.` },
          { role: "user", content: `Uzbek sentence: "${uzbekSentence}"\nStudent's translation: "${userTranslation}"\nCorrect translation: "${correctTranslation}"\n\nGive brief feedback on the student's translation.` }
        ],
        max_tokens: 150
      })
    });
    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (e) { return null; }
}

async function getAIWritingFeedback(topic, userWriting, level) {
  try {
    const apiKey = import.meta.env.VITE_DEEPSEEK_KEY;
    if (!apiKey) return null;
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: `You are an expert English language teacher specializing in IELTS preparation. The student's level is ${level}. Give concise, constructive feedback on their free writing. Focus on: grammar, vocabulary, sentence structure, and coherence. Keep feedback to 3-4 sentences. Be encouraging and specific.` },
          { role: "user", content: `Topic: "${topic}"\nStudent's writing: "${userWriting}"\n\nGive feedback on this writing.` }
        ],
        max_tokens: 200
      })
    });
    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (e) { return null; }
}

export default function I707Writing() {
  const navigate = useNavigate();
  const { userData, loading } = useUser();
  const [isDay, setIsDay] = useState(() => localStorage.getItem("i707_theme") === "light");
  const [mode, setMode] = useState(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [checking, setChecking] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [activeNav, setActiveNav] = useState("home");
  const [topicIndex, setTopicIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [aiFeedback, setAiFeedback] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsDay(localStorage.getItem("i707_theme") === "light");
    }, 500);
    return () => clearInterval(interval);
  }, []);

  if (loading || !userData) return (
    <div style={{ background: "#1A1A1A", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", color: "#F5F0E8", fontSize: "14px", letterSpacing: "3px" }}>
      Loading...
    </div>
  );

  const level = userData.level || "A1";
  const levelColor = getLevelColor(level);

  const allWriting =
    level === "IELTS_FOUNDATION" ? (WRITING_FOUNDATION?.IELTS_FOUNDATION || []) :
    level === "IELTS_GRADUATION" ? (WRITING_GRADUATION?.IELTS_GRADUATION || []) :
    BASIC_WRITING[level] || BASIC_WRITING.A1 || [];

  const sentences = allWriting.filter(w => w.type === "translate" || (!w.type && w.uzbek));
  const writeTopics = allWriting.filter(w => w.type === "write" && w.topic);
  const currentTopicObj = writeTopics[topicIndex];
  const currentTopic = currentTopicObj?.topic || "";
  const currentHint = currentTopicObj?.hint || "";
  const current = sentences[currentIndex];
  

  const checkAnswer = async () => {
    if (!userAnswer.trim()) return;
    setChecking(true);
    setAiFeedback(null);
    const userClean = userAnswer.trim().toLowerCase().replace(/[.,!?]/g, "");
    const correctClean = current.english.toLowerCase().replace(/[.,!?]/g, "");
    const userWords = userClean.split(" ");
    const correctWords = correctClean.split(" ");
    const matchedWords = userWords.filter(w => correctWords.includes(w));
    const matchPercent = Math.round((matchedWords.length / correctWords.length) * 100);
    const isExact = userClean === correctClean;
    const finalScore = isExact ? 100 : matchPercent;
    let feedbackType, message;
    if (finalScore >= 90) {
      feedbackType = "perfect";
      message = "Excellent! Your translation is accurate and well-formed.";
      setScore(prev => ({ correct: prev.correct + 1, total: prev.total + 1 }));
    } else if (finalScore >= 60) {
      feedbackType = "good";
      message = `Good attempt. Your translation captures ${finalScore}% of the meaning.`;
      setScore(prev => ({ ...prev, total: prev.total + 1 }));
    } else {
      feedbackType = "wrong";
      message = "Your translation needs improvement. Study the suggested answer carefully.";
      setScore(prev => ({ ...prev, total: prev.total + 1 }));
    }
    setFeedback({ type: feedbackType, message, correct: current.english, percent: finalScore });
    setShowAnswer(true);
    setChecking(false);
    setAiLoading(true);
    const ai = await getAIFeedback(current.uzbek, userAnswer.trim(), current.english, level);
    setAiFeedback(ai);
    setAiLoading(false);
  };

  const nextSentence = () => {
    setCurrentIndex(prev => (prev + 1) % sentences.length);
    setUserAnswer("");
    setFeedback(null);
    setShowAnswer(false);
    setAiFeedback(null);
  };

  const submitWriting = async () => {
    if (!userAnswer.trim()) return;
    setSubmitted(true);
    setAiLoading(true);
    const ai = await getAIWritingFeedback(currentTopic, userAnswer.trim(), level);
    setAiFeedback(ai);
    setAiLoading(false);
  };

  const nextTopic = () => {
    setTopicIndex(prev => (prev + 1) % writeTopics.length);
    setUserAnswer("");
    setSubmitted(false);
    setAiFeedback(null);
  };

  return (
    <div className={`i707-writing ${isDay ? "light" : ""}`}>
      <div className="i707-writing-orb i707-writing-orb--top" />
      <div className="i707-writing-orb i707-writing-orb--bottom" />

      {/* TOPBAR */}
      <header className="i707-writing-topbar">
        <button className="i707-writing-back" onClick={() => mode ? setMode(null) : navigate("/i707/home")}>
          {mode ? "← Back" : "← Home"}
        </button>
        <div className="i707-writing-topbar__center">
          <span className="i707-writing-topbar__title">Writing</span>
          <span className="i707-writing-topbar__level" style={{ background: `${levelColor}18`, color: levelColor, borderColor: `${levelColor}30` }}>
            {level === "IELTS_FOUNDATION" ? "IF" : level === "IELTS_GRADUATION" ? "IG" : level}
          </span>
        </div>
        {mode === "translate" ? (
          <div className="i707-writing-score">
            <span className="i707-writing-score__val">{score.correct}/{score.total}</span>
          </div>
        ) : (
          <div style={{ width: 60 }} />
        )}
      </header>

      <main className="i707-writing-main">

        {/* HERO */}
        {!mode && (
          <div className="i707-writing-hero">
            <div className="i707-writing-hero__topline" />
            <div className="i707-writing-hero__shimmer" />
            <div className="i707-writing-hero__dots" />
            <div className="i707-writing-hero__content">
              <span className="i707-writing-hero__eyebrow">✦ AI Powered · {level} Level</span>
              <h1 className="i707-writing-hero__title">The Art of<br /><em>Writing</em></h1>
              <p className="i707-writing-hero__sub">Translate sentences or write freely. Get instant AI feedback on your English.</p>
            </div>
            <div className="i707-writing-hero__stats">
              <div className="i707-writing-hero__stat">
                <span className="i707-writing-hero__stat-val" style={{ color: "#C0392B" }}>{sentences.length}</span>
                <span className="i707-writing-hero__stat-lbl">Sentences</span>
              </div>
              <div className="i707-writing-hero__stat-sep" />
              <div className="i707-writing-hero__stat">
                <span className="i707-writing-hero__stat-val" style={{ color: "#2196F3" }}>{writeTopics.length}</span>

                <span className="i707-writing-hero__stat-lbl">Topics</span>
              </div>
              <div className="i707-writing-hero__stat-sep" />
              <div className="i707-writing-hero__stat">
                <span className="i707-writing-hero__stat-val" style={{ color: "#FFD700" }}>AI</span>
                <span className="i707-writing-hero__stat-lbl">Feedback</span>
              </div>
            </div>
          </div>
        )}

        {/* MODE SELECTION */}
        {!mode && (
          <div className="i707-writing-modes">
            <div className="i707-writing-modes__label">
              <span className="i707-writing-modes__line" />
              <span className="i707-writing-modes__text">Choose Mode</span>
              <span className="i707-writing-modes__line" />
            </div>

            <div className="i707-writing-mode-card" onClick={() => setMode("translate")}>
              <div className="i707-writing-mode-card__accent" style={{ background: "#C0392B" }} />
              <div className="i707-writing-mode-card__shimmer" />
              <div className="i707-writing-mode-card__icon" style={{ background: "rgba(192,57,43,0.1)", borderColor: "rgba(192,57,43,0.22)" }}>
                <svg viewBox="0 0 20 20" fill="none" stroke="#C0392B" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M3 5h8M7 3v2M11 5c0 3.5-2.5 6-6 7M9 12c1.5.5 3.5.5 5-1"/>
                  <rect x="10" y="10" width="8" height="8" rx="1.5"/>
                  <path d="M12 14h4M14 12v4"/>
                </svg>
              </div>
              <div className="i707-writing-mode-card__content">
                <span className="i707-writing-mode-card__title">Uzbek → English</span>
                <span className="i707-writing-mode-card__sub">Translate sentences and get instant AI feedback on your accuracy.</span>
                <span className="i707-writing-mode-card__badge" style={{ color: "#C0392B", background: "rgba(192,57,43,0.08)", borderColor: "rgba(192,57,43,0.2)" }}>
                  {sentences.length} sentences · {level}
                </span>
              </div>
              <div className="i707-writing-mode-card__arrow">→</div>
            </div>

            <div className="i707-writing-mode-card" onClick={() => setMode("write")}>
              <div className="i707-writing-mode-card__accent" style={{ background: "#2196F3" }} />
              <div className="i707-writing-mode-card__shimmer" />
              <div className="i707-writing-mode-card__icon" style={{ background: "rgba(33,150,243,0.1)", borderColor: "rgba(33,150,243,0.22)" }}>
                <svg viewBox="0 0 20 20" fill="none" stroke="#2196F3" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M4 16l3-3 9-9-3-3-9 9-3 3 3 3z"/>
                  <path d="M14 4l3 3"/>
                </svg>
              </div>
              <div className="i707-writing-mode-card__content">
                <span className="i707-writing-mode-card__title">Free Writing</span>
                <span className="i707-writing-mode-card__sub">Write freely on a given topic. AI evaluates grammar, vocabulary and style.</span>
                <span className="i707-writing-mode-card__badge" style={{ color: "#2196F3", background: "rgba(33,150,243,0.08)", borderColor: "rgba(33,150,243,0.2)" }}>
                  {writeTopics.length} topics · {level}
                </span>
              </div>
              <div className="i707-writing-mode-card__arrow">→</div>
            </div>
          </div>
        )}

        {/* MODE 1 — TRANSLATE */}
        {mode === "translate" && (
          <>
            <div className="i707-writing-progress">
              <div className="i707-writing-progress__bar">
                <div className="i707-writing-progress__fill" style={{ width: `${((currentIndex + 1) / sentences.length) * 100}%` }} />
              </div>
              <span className="i707-writing-progress__text">{currentIndex + 1} / {sentences.length}</span>
            </div>

            <div className="i707-writing-card">
              <div className="i707-writing-card__topbar" />
              <div className="i707-writing-card__shimmer" />
              <span className="i707-writing-card__label">Translate to English</span>
              <p className="i707-writing-card__sentence">{current?.uzbek}</p>
            </div>

            <div className="i707-writing-input-wrap">
              <label className="i707-writing-input-label">Your Translation</label>
              <textarea className="i707-writing-textarea" value={userAnswer}
                onChange={e => setUserAnswer(e.target.value)}
                placeholder="Write your English translation here..."
                rows={3} disabled={showAnswer} />
            </div>

            {feedback && (
              <div className={`i707-writing-feedback i707-writing-feedback--${feedback.type}`}>
                <div className="i707-writing-feedback__topbar" />
                <div className="i707-writing-feedback__score-row">
                  <div className="i707-writing-feedback__score-circle"
                    style={{ borderColor: feedback.type === "perfect" ? "#4CAF50" : feedback.type === "good" ? "#FFD700" : "#C0392B" }}>
                    <span className="i707-writing-feedback__score-num"
                      style={{ color: feedback.type === "perfect" ? "#4CAF50" : feedback.type === "good" ? "#FFD700" : "#C0392B" }}>
                      {feedback.percent}
                    </span>
                    <span className="i707-writing-feedback__score-pct">%</span>
                  </div>
                  <div className="i707-writing-feedback__score-info">
                    <span className="i707-writing-feedback__score-label">Translation Score</span>
                    <p className="i707-writing-feedback__msg">{feedback.message}</p>
                  </div>
                </div>
                <div className="i707-writing-feedback__ai">
                  <div className="i707-writing-feedback__ai-header">
                    <div className="i707-writing-feedback__ai-icon">
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                        <circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/>
                      </svg>
                    </div>
                    <span className="i707-writing-feedback__ai-label">AI Feedback</span>
                    {aiLoading && <span className="i707-writing-feedback__ai-soon">Analyzing...</span>}
                  </div>
                  {aiLoading && <p className="i707-writing-feedback__ai-text" style={{ color: "var(--red)", opacity: 0.8 }}>AI is analyzing your translation...</p>}
                  {aiFeedback && !aiLoading && <p className="i707-writing-feedback__ai-text" style={{ color: "var(--cream)", fontStyle: "normal", fontSize: "13px", lineHeight: "1.7" }}>{aiFeedback}</p>}
                  {!aiFeedback && !aiLoading && <p className="i707-writing-feedback__ai-text">AI will analyze your grammar, vocabulary and sentence structure.</p>}
                </div>
                <div className="i707-writing-feedback__suggested">
                  <div className="i707-writing-feedback__suggested-header">
                    <svg viewBox="0 0 16 16" fill="none" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round"><path d="M3 8l3.5 3.5L13 4"/></svg>
                    <span className="i707-writing-feedback__suggested-label">Suggested Answer</span>
                  </div>
                  <p className="i707-writing-feedback__suggested-text">"{feedback.correct}"</p>
                </div>
              </div>
            )}

            <div className="i707-writing-btns">
              {!showAnswer ? (
                <button className="i707-writing-btn i707-writing-btn--primary" onClick={checkAnswer} disabled={checking || !userAnswer.trim()}>
                  {checking ? "Checking..." : "Check My Answer"}
                </button>
              ) : (
                <button className="i707-writing-btn i707-writing-btn--next" onClick={nextSentence}>
                  Next Sentence →
                </button>
              )}
            </div>

            {score.total > 0 && (
              <div className="i707-writing-scoreboard">
                <div className="i707-writing-scoreboard__item">
                  <span className="i707-writing-scoreboard__val" style={{ color: "#4CAF50" }}>{score.correct}</span>
                  <span className="i707-writing-scoreboard__label">Correct</span>
                </div>
                <div className="i707-writing-scoreboard__divider" />
                <div className="i707-writing-scoreboard__item">
                  <span className="i707-writing-scoreboard__val" style={{ color: "#C0392B" }}>{score.total - score.correct}</span>
                  <span className="i707-writing-scoreboard__label">Wrong</span>
                </div>
                <div className="i707-writing-scoreboard__divider" />
                <div className="i707-writing-scoreboard__item">
                  <span className="i707-writing-scoreboard__val" style={{ color: "#FFD700" }}>{score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}%</span>
                  <span className="i707-writing-scoreboard__label">Accuracy</span>
                </div>
              </div>
            )}
          </>
        )}

        {/* MODE 2 — FREE WRITE */}
        {mode === "write" && (
          <>
            <div className="i707-writing-progress">
              <div className="i707-writing-progress__bar">
                <div className="i707-writing-progress__fill" style={{ width: `${((topicIndex + 1) / writeTopics.length) * 100}%`, background: "linear-gradient(90deg, #2196F3, #9C27B0)" }} />
              </div>
              <span className="i707-writing-progress__text">{topicIndex + 1} / {writeTopics.length}</span>
            </div>

            <div className="i707-writing-card">
              <div className="i707-writing-card__topbar" style={{ background: "linear-gradient(90deg, transparent, #2196F3 30%, #9C27B0 70%, transparent)" }} />
              <div className="i707-writing-card__shimmer" />
              <span className="i707-writing-card__label">Write about this topic</span>
              <p className="i707-writing-card__sentence">{currentTopic}</p>
                {currentHint && (
                  <p style={{
                    fontFamily: "Lora, serif",
                    fontSize: "12px",
                    color: "rgba(245,240,232,0.45)",
                    fontStyle: "italic",
                    marginTop: 8,
                    letterSpacing: "0.5px",
                    lineHeight: 1.6,
                  }}>💡 {currentHint}</p>
                )}
            </div>

            <div className="i707-writing-input-wrap">
              <label className="i707-writing-input-label">Your Writing</label>
              <textarea className="i707-writing-textarea" value={userAnswer}
                onChange={e => setUserAnswer(e.target.value)}
                placeholder="Write in English about this topic..."
                rows={6} disabled={submitted} />
            </div>

            {submitted && (
              <div className="i707-writing-feedback i707-writing-feedback--good">
                <div className="i707-writing-feedback__topbar" />
                <div className="i707-writing-feedback__ai">
                  <div className="i707-writing-feedback__ai-header">
                    <div className="i707-writing-feedback__ai-icon">
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                        <circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/>
                      </svg>
                    </div>
                    <span className="i707-writing-feedback__ai-label">AI Feedback</span>
                    {aiLoading && <span className="i707-writing-feedback__ai-soon">Analyzing...</span>}
                  </div>
                  {aiLoading && <p className="i707-writing-feedback__ai-text" style={{ color: "var(--red)", opacity: 0.8 }}>AI is analyzing your writing...</p>}
                  {aiFeedback && !aiLoading && <p className="i707-writing-feedback__ai-text" style={{ color: "var(--cream)", fontStyle: "normal", fontSize: "13px", lineHeight: "1.7" }}>{aiFeedback}</p>}
                  {!aiFeedback && !aiLoading && <p className="i707-writing-feedback__ai-text">Great work! Add your DeepSeek key to enable AI feedback.</p>}
                </div>
              </div>
            )}

            <div className="i707-writing-btns">
              {!submitted ? (
                <button className="i707-writing-btn i707-writing-btn--blue" onClick={submitWriting} disabled={!userAnswer.trim()}>
                  Submit Writing
                </button>
              ) : (
                <button className="i707-writing-btn i707-writing-btn--next" onClick={nextTopic}>
                  Next Topic →
                </button>
              )}
            </div>
          </>
        )}

      </main>

      {/* BOTTOM NAV */}
      <nav className="i707-writing-bottom-nav">
        {[
          { id: "home", label: "Home", icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M1 7.5L8 1l7 6.5V15h-4.5v-4h-5V15H1z"/></svg> },
          { id: "vocab", label: "Vocab", icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><rect x="2" y="2" width="12" height="12" rx="1.5"/><path d="M5 6h6M5 9h4"/></svg> },
          { id: "games", label: "Games", icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M3 13l2.5-2.5L8 13l5-9"/><circle cx="8" cy="4" r="1.5" fill="currentColor"/></svg> },
          { id: "profile", label: "Profile", icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><circle cx="8" cy="5.5" r="3"/><path d="M2 15c0-3 2.7-5 6-5s6 2 6 5"/></svg> },
        ].map(nav => (
          <div key={nav.id}
            className={`i707-writing-nav-item ${activeNav === nav.id ? "active" : ""}`}
            onClick={() => {
              setActiveNav(nav.id);
              if (nav.id === "home") navigate("/i707/home");
              if (nav.id === "vocab") navigate("/i707/vocabulary");
              if (nav.id === "games") navigate("/i707/games");
              if (nav.id === "profile") navigate("/i707/profile");
            }}>
            <div className="i707-writing-nav-item__icon">{nav.icon}</div>
            <span className="i707-writing-nav-item__label">{nav.label}</span>
          </div>
        ))}
      </nav>
    </div>
  );
}