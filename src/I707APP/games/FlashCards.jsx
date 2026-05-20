import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";


import { BASIC_VOCABULARY } from '../../data/BasicLevel/index';


import { VOCABULARY_FOUNDATION } from "../../data/IeltsFoundation/index";
import { VOCABULARY_GRADUATION } from "../../data/IeltsGraduation/index";
import { getLearnedWords } from "../../services/learnedContent";
import "./Games.css";

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

export default function FlashCards() {
  const navigate = useNavigate();
  const { user, userData, loading } = useUser();
  const [isDay, setIsDay] = useState(() => localStorage.getItem("i707_theme") === "light");
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [unknown, setUnknown] = useState(0);
  const [done, setDone] = useState(false);
  const [streak, setStreak] = useState(0);
  const initRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsDay(localStorage.getItem("i707_theme") === "light");
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!loading && !user) navigate("/i707/login");
  }, [user, loading]);

  useEffect(() => {
    if (!userData || initRef.current) return;
    initRef.current = true;
    const level = userData.level || "A1";
    const allWords =
      level === "IELTS_FOUNDATION" ? (VOCABULARY_FOUNDATION.IELTS_FOUNDATION || []) :
      level === "IELTS_GRADUATION" ? (VOCABULARY_GRADUATION.IELTS_GRADUATION || []) :
      VOCABULARY[level] || VOCABULARY.A1;
    const learned = getLearnedWords(userData, allWords, level);
    if (learned.length < 4) {
      alert("Learn at least 4 words first in Vocabulary!");
      navigate("/i707/games");
      return;
    }
    setCards(shuffle(learned));
  }, [userData]);

  const handleKnow = (knows) => {
    if (knows) {
      setKnown(k => k + 1);
      setStreak(s => s + 1);
    } else {
      setUnknown(u => u + 1);
      setStreak(0);
    }
    setFlipped(false);
    setTimeout(() => {
      if (index + 1 >= cards.length) setDone(true);
      else setIndex(i => i + 1);
    }, 250);
  };

  const restart = () => {
    setCards(shuffle(cards));
    setIndex(0);
    setFlipped(false);
    setKnown(0);
    setUnknown(0);
    setStreak(0);
    setDone(false);
  };

  if (loading || !userData) return (
    <div style={{ background: "#1A1A1A", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", color: "#F5F0E8", fontSize: "14px", letterSpacing: "3px" }}>Loading...</div>
  );

  const current = cards[index];
  const progress = cards.length > 0 ? (index / cards.length) * 100 : 0;
  const accuracy = (known + unknown) > 0 ? Math.round((known / (known + unknown)) * 100) : 0;

  if (done) {
    return (
      <div className={`i707-game ${isDay ? "light" : ""}`}>
        <div className="i707-game-orb i707-game-orb--a" />
        <div className="i707-game-orb i707-game-orb--b" />
        <header className="i707-game-topbar">
          <button className="i707-game-back" onClick={() => navigate("/i707/games")}>← Games</button>
          <span className="i707-game-title">Complete!</span>
          <span className="i707-game-score">{cards.length} cards</span>
        </header>
        <div className="i707-fc-result">
          <div className="i707-fc-result__topline" />
          <div className="i707-fc-result__icon">{accuracy >= 80 ? "🎯" : accuracy >= 50 ? "📚" : "💪"}</div>
          <h2 className="i707-fc-result__title">
            {accuracy >= 80 ? "Excellent Memory!" : accuracy >= 50 ? "Good Review!" : "Keep Studying!"}
          </h2>
          <p className="i707-fc-result__sub">You reviewed {cards.length} cards · {accuracy}% known</p>

          <div className="i707-fc-result__stats">
            <div className="i707-fc-result__stat">
              <span className="i707-fc-result__stat-val" style={{ color: "#4CAF50" }}>{known}</span>
              <span className="i707-fc-result__stat-lbl">Known</span>
            </div>
            <div className="i707-fc-result__stat-sep" />
            <div className="i707-fc-result__stat">
              <span className="i707-fc-result__stat-val" style={{ color: "#FF9800" }}>{unknown}</span>
              <span className="i707-fc-result__stat-lbl">Learning</span>
            </div>
            <div className="i707-fc-result__stat-sep" />
            <div className="i707-fc-result__stat">
              <span className="i707-fc-result__stat-val" style={{ color: "#2196F3" }}>{accuracy}%</span>
              <span className="i707-fc-result__stat-lbl">Accuracy</span>
            </div>
          </div>

          <button className="i707-fc-result__btn" onClick={restart}>↻ Review Again</button>
          <button className="i707-fc-result__btn-secondary" onClick={() => navigate("/i707/games")}>Back to Games</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`i707-game ${isDay ? "light" : ""}`}>
      <div className="i707-game-orb i707-game-orb--a" />
      <div className="i707-game-orb i707-game-orb--b" />

      <header className="i707-game-topbar">
        <button className="i707-game-back" onClick={() => navigate("/i707/games")}>← Games</button>
        <span className="i707-game-title">Flash Cards</span>
        <span className="i707-game-score" style={{ color: "#2196F3" }}>{index + 1}/{cards.length}</span>
      </header>

      <div className="i707-fc-screen">

        {/* TOP STATS */}
        <div className="i707-fc-stats">
          <div className="i707-fc-stat-pill" style={{ borderColor: "rgba(76,175,80,0.3)", background: "rgba(76,175,80,0.06)" }}>
            <span className="i707-fc-stat-pill__icon">✓</span>
            <div className="i707-fc-stat-pill__info">
              <span className="i707-fc-stat-pill__val" style={{ color: "#4CAF50" }}>{known}</span>
              <span className="i707-fc-stat-pill__lbl">Known</span>
            </div>
          </div>
          <div className="i707-fc-stat-pill" style={{ borderColor: "rgba(255,165,0,0.3)", background: "rgba(255,165,0,0.06)" }}>
            <span className="i707-fc-stat-pill__icon">🔥</span>
            <div className="i707-fc-stat-pill__info">
              <span className="i707-fc-stat-pill__val" style={{ color: "#FF9800" }}>{streak}</span>
              <span className="i707-fc-stat-pill__lbl">Streak</span>
            </div>
          </div>
          <div className="i707-fc-stat-pill" style={{ borderColor: "rgba(33,150,243,0.3)", background: "rgba(33,150,243,0.06)" }}>
            <span className="i707-fc-stat-pill__icon">📊</span>
            <div className="i707-fc-stat-pill__info">
              <span className="i707-fc-stat-pill__val" style={{ color: "#2196F3" }}>{accuracy}%</span>
              <span className="i707-fc-stat-pill__lbl">Acc</span>
            </div>
          </div>
        </div>

        {/* PROGRESS BAR */}
        <div className="i707-fc-progress">
          <div className="i707-fc-progress__fill" style={{ width: `${progress}%` }} />
        </div>

        {/* FLIP CARD */}
        {current && (
          <div className={`i707-fc-flipcard ${flipped ? "flipped" : ""}`}
            onClick={() => setFlipped(f => !f)}>
            <div className="i707-fc-flipcard__inner">

              {/* FRONT — ENGLISH WORD */}
              <div className="i707-fc-flipcard__front">
                <div className="i707-fc-flipcard__topline" />
                <div className="i707-fc-flipcard__shimmer" />
                <div className="i707-fc-flipcard__glow" />
                <span className="i707-fc-flipcard__pos-badge">{current.partOfSpeech}</span>
                <span className="i707-fc-flipcard__word">{current.word}</span>
                <div className="i707-fc-flipcard__hint">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" style={{ width: 11, height: 11 }}>
                    <path d="M2 8h12M8 2l-4 6 4 6M14 2l-4 6 4 6"/>
                  </svg>
                  Tap to reveal meaning
                </div>
              </div>

              {/* BACK — DEFINITION + UZBEK */}
              <div className="i707-fc-flipcard__back">
                <div className="i707-fc-flipcard__topline" style={{ background: "linear-gradient(90deg, transparent, #00BCD4, transparent)" }} />
                <span className="i707-fc-flipcard__back-eyebrow">DEFINITION</span>
                <p className="i707-fc-flipcard__def">{current.definition}</p>
                {current.uzbek && (
                  <div className="i707-fc-flipcard__uzbek-row">
                    <span className="i707-fc-flipcard__uzbek-label">UZBEK</span>
                    <span className="i707-fc-flipcard__uzbek-text">{current.uzbek}</span>
                  </div>
                )}
                {current.example && (
                  <div className="i707-fc-flipcard__example-row">
                    <span className="i707-fc-flipcard__example-label">EXAMPLE</span>
                    <p className="i707-fc-flipcard__example-text">"{current.example}"</p>
                  </div>
                )}
                <div className="i707-fc-flipcard__hint">Tap to flip back</div>
              </div>

            </div>
          </div>
        )}

        {/* ACTION BUTTONS — only when flipped */}
        {flipped && (
          <div className="i707-fc-actions">
            <button className="i707-fc-action-btn i707-fc-action-btn--no" onClick={() => handleKnow(false)}>
              ✗ Still Learning
            </button>
            <button className="i707-fc-action-btn i707-fc-action-btn--yes" onClick={() => handleKnow(true)}>
              ✓ I Know This
            </button>
          </div>
        )}

        {!flipped && (
          <div className="i707-fc-tip">
            💡 Tip: Try to recall the meaning before flipping
          </div>
        )}

      </div>
    </div>
  );
}