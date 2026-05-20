import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { BASIC_VOCABULARY } from '../../data/BasicLevel/index';
import { VOCABULARY_FOUNDATION } from "../../data/IeltsFoundation/index";
import { VOCABULARY_GRADUATION } from "../../data/IeltsGraduation/index";
import { getLearnedWords } from "../../services/learnedContent";
import "./Games.css";

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }
function scramble(word) {
  let s = word.split("");
  do { s = shuffle(s); } while (s.join("") === word && word.length > 1);
  return s.join("");
}

export default function WordScramble() {
  const navigate = useNavigate();
  const { user, userData, loading } = useUser();
  const [isDay, setIsDay] = useState(() => localStorage.getItem("i707_theme") === "light");
  const [words, setWords] = useState([]);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [answered, setAnswered] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [done, setDone] = useState(false);
  const [scrambled, setScrambled] = useState("");
  const [flipped, setFlipped] = useState(false);
  const [streak, setStreak] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
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
    const pool = shuffle(learned).slice(0, 10);
    setWords(pool);
    setScrambled(scramble(pool[0].word));
  }, [userData]);

  // TIMER
  useEffect(() => {
    if (done || answered || words.length === 0) return;
    if (timeLeft <= 0) {
      setAnswered(true);
      setCorrect(false);
      setTotal(t => t + 1);
      setStreak(0);
      return;
    }
    const t = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, answered, done, words.length]);

  const handleCheck = async () => {
    if (!input.trim() || answered) return;
    setAnswered(true);
    setTotal(t => t + 1);
    const isCorrect = input.trim().toLowerCase() === words[index].word.toLowerCase();
    setCorrect(isCorrect);
    if (isCorrect) {
      const baseCoins = 2;
      const speedBonus = timeLeft > 30 ? 2 : timeLeft > 15 ? 1 : 0;
      const streakBonus = streak >= 3 ? 2 : 0;
      const totalCoins = baseCoins + speedBonus + streakBonus;
      const points = 10 + (speedBonus * 5) + (streakBonus * 5);
      setScore(s => s + points);
      setStreak(s => s + 1);
      if (user && userData) {
        try {
          await updateDoc(doc(db, "users", user.uid), { coins: (userData.coins || 0) + totalCoins });
        } catch (e) {}
      }
    } else {
      setStreak(0);
    }
  };

  const next = () => {
    const nextIndex = index + 1;
    if (nextIndex >= words.length) { setDone(true); return; }
    setIndex(nextIndex);
    setInput("");
    setAnswered(false);
    setCorrect(false);
    setFlipped(false);
    setShowHint(false);
    setTimeLeft(60);
    setScrambled(scramble(words[nextIndex].word));
  };

  const playAgain = () => {
    const shuffled = shuffle(words);
    setWords(shuffled);
    setIndex(0);
    setInput("");
    setAnswered(false);
    setCorrect(false);
    setFlipped(false);
    setShowHint(false);
    setScore(0);
    setTotal(0);
    setStreak(0);
    setDone(false);
    setTimeLeft(60);
    setScrambled(scramble(shuffled[0].word));
  };

  if (loading || !userData) return (
    <div style={{ background: "#1A1A1A", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", color: "#F5F0E8", fontSize: "14px", letterSpacing: "3px" }}>Loading...</div>
  );

  const current = words[index];
  const accuracy = total > 0 ? Math.round((score / (total * 10)) * 100) : 0;
  const timerColor = timeLeft > 30 ? "#4CAF50" : timeLeft > 15 ? "#FFD700" : "#C0392B";

  if (done) {
    const stars = accuracy >= 90 ? 3 : accuracy >= 60 ? 2 : 1;
    return (
      <div className={`i707-game ${isDay ? "light" : ""}`}>
        <div className="i707-game-orb i707-game-orb--a" />
        <div className="i707-game-orb i707-game-orb--b" />
        <header className="i707-game-topbar">
          <button className="i707-game-back" onClick={() => navigate("/i707/games")}>← Games</button>
          <span className="i707-game-title">Complete!</span>
          <span className="i707-game-score">🪙 {score}</span>
        </header>
        <div className="i707-ws-result">
          <div className="i707-ws-result__topline" />
          <div className="i707-ws-result__icon">{accuracy >= 90 ? "🏆" : accuracy >= 60 ? "🎯" : "💪"}</div>
          <h2 className="i707-ws-result__title">
            {accuracy >= 90 ? "Word Master!" : accuracy >= 60 ? "Great Job!" : "Keep Practicing!"}
          </h2>
          <div className="i707-ws-result__stars">
            {[1,2,3].map(i => (
              <span key={i} className={`i707-ws-result__star ${i <= stars ? "active" : ""}`}>★</span>
            ))}
          </div>
          <p className="i707-ws-result__sub">You unscrambled {Math.round(score / 10)} of {words.length} words</p>
          <div className="i707-ws-result__stats">
            <div className="i707-ws-result__stat">
              <span className="i707-ws-result__stat-val" style={{ color: "#4CAF50" }}>{score}</span>
              <span className="i707-ws-result__stat-lbl">Points</span>
            </div>
            <div className="i707-ws-result__stat-sep" />
            <div className="i707-ws-result__stat">
              <span className="i707-ws-result__stat-val" style={{ color: "#00BCD4" }}>{accuracy}%</span>
              <span className="i707-ws-result__stat-lbl">Accuracy</span>
            </div>
            <div className="i707-ws-result__stat-sep" />
            <div className="i707-ws-result__stat">
              <span className="i707-ws-result__stat-val" style={{ color: "#FFD700" }}>{streak}</span>
              <span className="i707-ws-result__stat-lbl">Best Streak</span>
            </div>
          </div>
          <button className="i707-ws-result__btn" onClick={playAgain}>Play Again ↻</button>
          <button className="i707-ws-result__btn-secondary" onClick={() => navigate("/i707/games")}>Back to Games</button>
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
        <span className="i707-game-title">Word Scramble</span>
        <span className="i707-game-score">🪙 {score}</span>
      </header>

      <div className="i707-ws-screen">

        {/* TOP STATS BAR */}
        <div className="i707-ws-stats">
          <div className="i707-ws-stat-pill" style={{ borderColor: timerColor + "40", background: timerColor + "10" }}>
            <span className="i707-ws-stat-pill__icon">⏱</span>
            <div className="i707-ws-stat-pill__info">
              <span className="i707-ws-stat-pill__val" style={{ color: timerColor }}>{timeLeft}s</span>
              <span className="i707-ws-stat-pill__lbl">Time</span>
            </div>
          </div>
          <div className="i707-ws-stat-pill" style={{ borderColor: "rgba(255,165,0,0.3)", background: "rgba(255,165,0,0.06)" }}>
            <span className="i707-ws-stat-pill__icon">🔥</span>
            <div className="i707-ws-stat-pill__info">
              <span className="i707-ws-stat-pill__val" style={{ color: "#FF9800" }}>{streak}</span>
              <span className="i707-ws-stat-pill__lbl">Streak</span>
            </div>
          </div>
          <div className="i707-ws-stat-pill" style={{ borderColor: "rgba(0,188,212,0.3)", background: "rgba(0,188,212,0.06)" }}>
            <span className="i707-ws-stat-pill__icon">📊</span>
            <div className="i707-ws-stat-pill__info">
              <span className="i707-ws-stat-pill__val" style={{ color: "#00BCD4" }}>{index + 1}/{words.length}</span>
              <span className="i707-ws-stat-pill__lbl">Word</span>
            </div>
          </div>
        </div>

        {/* PROGRESS BAR */}
        <div className="i707-ws-progress">
          <div className="i707-ws-progress__fill" style={{ width: `${((index) / words.length) * 100}%` }} />
        </div>

        {/* MAIN FLIP CARD */}
        {current && (
          <div className={`i707-ws-flipcard ${flipped ? "flipped" : ""}`}
            onClick={() => setFlipped(f => !f)}>
            <div className="i707-ws-flipcard__inner">
              {/* FRONT — SCRAMBLED LETTERS */}
              <div className="i707-ws-flipcard__front">
                <div className="i707-ws-flipcard__topline" />
                <div className="i707-ws-flipcard__shimmer" />
                <span className="i707-ws-flipcard__label">Unscramble This Word</span>
                <div className="i707-ws-flipcard__letters">
                  {scrambled.split("").map((letter, i) => (
                    <span key={i} className="i707-ws-flipcard__letter"
                      style={{ animationDelay: `${i * 0.08}s` }}>
                      {letter}
                    </span>
                  ))}
                </div>
                <span className="i707-ws-flipcard__pos">{current.partOfSpeech}</span>
                <div className="i707-ws-flipcard__hint">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" style={{ width: 10, height: 10 }}>
                    <path d="M8 1v8M4 5l4-4 4 4M3 13h10"/>
                  </svg>
                  Tap for translation
                </div>
              </div>

              {/* BACK — TRANSLATION */}
              <div className="i707-ws-flipcard__back">
                <div className="i707-ws-flipcard__topline" style={{ background: "linear-gradient(90deg, transparent, #FFD700, transparent)" }} />
                <span className="i707-ws-flipcard__label">Translation</span>
                <span className="i707-ws-flipcard__uzbek">{current.uzbek || "—"}</span>
                <span className="i707-ws-flipcard__def">{current.definition}</span>
                <div className="i707-ws-flipcard__hint">Tap to go back</div>
              </div>
            </div>
          </div>
        )}

        {/* HINT BUTTON */}
        {!answered && current && (
          <button className="i707-ws-hint-btn" onClick={() => setShowHint(s => !s)}>
            {showHint ? `Hint: starts with "${current.word[0].toUpperCase()}" — ${current.word.length} letters` : "💡 Need a hint?"}
          </button>
        )}

        {/* INPUT */}
        {!answered ? (
          <div className="i707-ws-input-wrap">
            <input
              className="i707-ws-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCheck()}
              placeholder="Type the word..."
              autoCapitalize="none"
              autoFocus
            />
            <button className="i707-ws-check-btn"
              onClick={handleCheck}
              disabled={!input.trim()}>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 8l3.5 3.5L13 4"/>
              </svg>
            </button>
          </div>
        ) : (
          <div className={`i707-ws-feedback ${correct ? "correct" : "wrong"}`}>
            <div className="i707-ws-feedback__topline" />
            <div className="i707-ws-feedback__icon">{correct ? "✓" : "✗"}</div>
            <div className="i707-ws-feedback__content">
              <span className="i707-ws-feedback__title">
                {correct ? `Correct! +${10 + (timeLeft > 30 ? 10 : timeLeft > 15 ? 5 : 0) + (streak >= 3 ? 5 : 0)} pts` : timeLeft <= 0 ? "Time's up!" : "Wrong answer"}
              </span>
              <span className="i707-ws-feedback__answer">
                {correct ? `"${current.word}"` : `Answer: ${current.word}`}
              </span>
              {correct && timeLeft > 30 && <span className="i707-ws-feedback__bonus">⚡ Speed bonus!</span>}
              {correct && streak >= 3 && <span className="i707-ws-feedback__bonus">🔥 Streak bonus!</span>}
            </div>
            <button className="i707-ws-next-btn" onClick={next}>
              {index + 1 >= words.length ? "Finish 🎯" : "Next →"}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}