import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { BASIC_VOCABULARY } from '../../data/BasicLevel/index';
import { VOCABULARY_FOUNDATION } from "../../data/IeltsFoundation/index";
import { VOCABULARY_GRADUATION } from "../../data/IeltsGraduation/index";
import "./Games.css";

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

export default function WordMatch() {
  const navigate = useNavigate();
  const { user, userData, loading } = useUser();
  const [isDay, setIsDay] = useState(() => localStorage.getItem("i707_theme") === "light");
  const [words, setWords] = useState([]);
  const [definitions, setDefinitions] = useState([]);
  const [selectedWord, setSelectedWord] = useState(null);
  const [selectedDef, setSelectedDef] = useState(null);
  const [matched, setMatched] = useState([]);
  const [wrong, setWrong] = useState([]);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [round, setRound] = useState(1);
  const [timer, setTimer] = useState(60);
  const [timerActive, setTimerActive] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [timeTaken, setTimeTaken] = useState(0);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [timeUp, setTimeUp] = useState(false);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

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
    if (!userData) return;
    initRound();
  }, [userData]);

  useEffect(() => {
    if (!timerActive) return;
    timerRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setTimerActive(false);
          setTimeUp(true);
          setDone(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [timerActive]);

  useEffect(() => {
    if (!selectedWord || !selectedDef) return;
    setAttempts(a => a + 1);
    if (selectedWord.word === selectedDef.word) {
      const newMatched = [...matched, selectedWord.word];
      const newStreak = streak + 1;
      const newBest = Math.max(bestStreak, newStreak);
      setMatched(newMatched);
      setStreak(newStreak);
      setBestStreak(newBest);
      setCorrect(c => c + 1);
      const bonus = newStreak >= 3 ? 15 : 10;
      setScore(prev => prev + bonus);
      setCoinsEarned(prev => prev + bonus);
      setSelectedWord(null);
      setSelectedDef(null);
      if (newMatched.length === words.length) {
        clearInterval(timerRef.current);
        setTimerActive(false);
        setTimeTaken(60 - timer);
        setDone(true);
        saveCoins(newMatched.length * bonus);
      }
    } else {
      setStreak(0);
      setWrong([selectedWord.word, selectedDef.word]);
      setTimeout(() => {
        setWrong([]);
        setSelectedWord(null);
        setSelectedDef(null);
      }, 800);
    }
  }, [selectedWord, selectedDef]);

  const initRound = () => {
    if (!userData) return;
    const level = userData.level || "A1";
    const learnedIds = (userData.learnedWords || []).filter(w => w.startsWith(level));
    const allWords =
      level === "IELTS_FOUNDATION" ? (VOCABULARY_FOUNDATION.IELTS_FOUNDATION || []) :
      level === "IELTS_GRADUATION" ? (VOCABULARY_GRADUATION.IELTS_GRADUATION || []) :
      VOCABULARY[level] || VOCABULARY.A1;
    const learned = allWords.filter(w => learnedIds.includes(`${level}_${w.word}`));
    if (learned.length < 4) {
      alert("Learn at least 4 words first!");
      navigate("/i707/games");
      return;
    }
    const pool = shuffle(learned).slice(0, 6);
    setWords(shuffle(pool));
    setDefinitions(shuffle(pool));
    setSelectedWord(null);
    setSelectedDef(null);
    setMatched([]);
    setWrong([]);
    setDone(false);
    setTimeUp(false);
    setTimer(60);
    setStreak(0);
    setAttempts(0);
    setCorrect(0);
    setTimeTaken(0);
    setCoinsEarned(0);
    setTimerActive(true);
    startTimeRef.current = Date.now();
  };

  const saveCoins = async (earned) => {
    if (!user || !userData) return;
    try {
      await updateDoc(doc(db, "users", user.uid), {
        coins: (userData.coins || 0) + earned
      });
    } catch (e) { console.log(e); }
  };

  const nextRound = () => {
    setRound(prev => prev + 1);
    initRound();
  };

  const accuracy = attempts > 0 ? Math.round((correct / attempts) * 100) : 0;
  const timerPct = (timer / 60) * 100;
  const timerColor = timer > 30 ? "#4CAF50" : timer > 10 ? "#FFD700" : "#C0392B";

  if (loading || !userData) return (
    <div style={{ background: "#1A1A1A", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", color: "#F5F0E8", fontSize: "14px", letterSpacing: "3px" }}>
      Loading...
    </div>
  );

  return (
    <div className={`i707-game ${isDay ? "light" : ""}`}>
      <div className="i707-game-orb i707-game-orb--a" />
      <div className="i707-game-orb i707-game-orb--b" />

      <header className="i707-game-topbar">
        <button className="i707-game-back" onClick={() => navigate("/i707/games")}>← Games</button>
        <span className="i707-game-title">Word Match</span>
        <span className="i707-game-score">🪙 {score}</span>
      </header>

      <main className="i707-game-main">

        {/* HERO */}
        <div className="i707-game-hero">
          <div className="i707-game-hero__topline" style={{ background: "linear-gradient(90deg, transparent, #C0392B, #FFD700, transparent)" }} />
          <div className="i707-game-hero__shimmer" />
          <span className="i707-game-hero__eyebrow">Round {round} · Match the words</span>
          <h1 className="i707-game-hero__title">Word<br /><em>Match</em></h1>
          <p className="i707-game-hero__sub">Tap a word then tap its correct definition. Beat the clock!</p>

          {/* TIMER + STREAK ROW */}
          <div className="i707-wm-stats-row">
            <div className="i707-wm-timer" style={{ borderColor: `${timerColor}40` }}>
              <svg viewBox="0 0 36 36" style={{ width: 44, height: 44, flexShrink: 0 }}>
                <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(245,240,232,0.06)" strokeWidth="3" />
                <circle cx="18" cy="18" r="15" fill="none" stroke={timerColor} strokeWidth="3"
                  strokeDasharray={`${timerPct * 0.942} 94.2`}
                  strokeLinecap="round"
                  transform="rotate(-90 18 18)"
                  style={{ transition: "stroke-dasharray 1s linear, stroke 0.5s" }} />
                <text x="18" y="22" textAnchor="middle" fill={timerColor}
                  style={{ fontFamily: "Lora, Georgia, serif", fontSize: "9px", fontWeight: "700" }}>
                  {timer}s
                </text>
              </svg>
              <div className="i707-wm-timer__info">
                <span className="i707-wm-timer__label">Time Left</span>
                <span className="i707-wm-timer__val" style={{ color: timerColor }}>{timer}s</span>
              </div>
            </div>

            <div className="i707-wm-streak">
              <span className="i707-wm-streak__icon">🔥</span>
              <div>
                <span className="i707-wm-streak__val">{streak}</span>
                <span className="i707-wm-streak__label">Streak</span>
              </div>
            </div>

            <div className="i707-wm-progress-info">
              <span className="i707-wm-progress-info__val" style={{ color: "#C0392B" }}>{matched.length}/{words.length}</span>
              <span className="i707-wm-progress-info__label">Matched</span>
            </div>
          </div>

          {/* PROGRESS BAR */}
          <div className="i707-game-hero__progress">
            <div className="i707-game-hero__progress-fill"
              style={{ width: `${(matched.length / (words.length || 1)) * 100}%` }} />
          </div>

          {/* STREAK BONUS HINT */}
          {streak >= 3 && (
            <div className="i707-wm-bonus-hint">
              ✦ {streak}x Streak — +15 coins per match!
            </div>
          )}
        </div>

        {!done ? (
          <div className="i707-wordmatch-grid">
            <div className="i707-wordmatch-col">
              <span className="i707-wordmatch-col__label">Words</span>
              {words.map((w, i) => (
                <button key={w.word}
                  className={`i707-wordmatch-btn ${matched.includes(w.word) ? "matched" : ""} ${selectedWord?.word === w.word ? "selected" : ""} ${wrong.includes(w.word) ? "wrong" : ""}`}
                  onClick={() => !matched.includes(w.word) && setSelectedWord(w)}
                  disabled={matched.includes(w.word)}
                  style={{ animationDelay: `${i * 0.05}s` }}>
                  {matched.includes(w.word) && <span className="i707-wm-check">✓</span>}
                  {w.word}
                </button>
              ))}
            </div>
            <div className="i707-wordmatch-col">
              <span className="i707-wordmatch-col__label">Definitions</span>
              {definitions.map((w, i) => (
                <button key={w.word}
                  className={`i707-wordmatch-btn i707-wordmatch-btn--def ${matched.includes(w.word) ? "matched" : ""} ${selectedDef?.word === w.word ? "selected" : ""} ${wrong.includes(w.word) ? "wrong" : ""}`}
                  onClick={() => !matched.includes(w.word) && setSelectedDef(w)}
                  disabled={matched.includes(w.word)}
                  style={{ animationDelay: `${i * 0.05}s` }}>
                  {w.definition}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* RESULT */
          <div className="i707-wm-result">
            <div className="i707-wm-result__topline" style={{
              background: timeUp
                ? "linear-gradient(90deg, transparent, #C0392B, transparent)"
                : "linear-gradient(90deg, transparent, #4CAF50, #FFD700, transparent)"
            }} />

            <div className="i707-wm-result__icon">
              {timeUp ? "⏰" : accuracy >= 80 ? "🎯" : "📝"}
            </div>
            <h2 className="i707-wm-result__title">
              {timeUp ? "Time's Up!" : "Round Complete!"}
            </h2>
            <p className="i707-wm-result__sub">
              {timeUp
                ? `You matched ${matched.length} of ${words.length} words.`
                : `You matched all ${words.length} words correctly!`}
            </p>

            {/* STATS */}
            <div className="i707-wm-result__stats">
              <div className="i707-wm-result__stat">
                <span className="i707-wm-result__stat-val" style={{ color: "#4CAF50" }}>{accuracy}%</span>
                <span className="i707-wm-result__stat-lbl">Accuracy</span>
              </div>
              <div className="i707-wm-result__stat-sep" />
              <div className="i707-wm-result__stat">
                <span className="i707-wm-result__stat-val" style={{ color: "#FFD700" }}>{bestStreak}</span>
                <span className="i707-wm-result__stat-lbl">Best Streak</span>
              </div>
              <div className="i707-wm-result__stat-sep" />
              <div className="i707-wm-result__stat">
                <span className="i707-wm-result__stat-val" style={{ color: "#C0392B" }}>{timeTaken || 60 - timer}s</span>
                <span className="i707-wm-result__stat-lbl">Time Used</span>
              </div>
            </div>

            {/* COINS */}
            <div className="i707-wm-result__coins">
              <span className="i707-wm-result__coins-val">+{coinsEarned}</span>
              <span className="i707-wm-result__coins-lbl">🪙 Coins Earned</span>
            </div>

            <button className="i707-wm-result__btn" onClick={nextRound}>
              Next Round →
            </button>
            <button className="i707-wm-result__btn-secondary" onClick={() => navigate("/i707/games")}>
              Back to Games
            </button>
          </div>
        )}

      </main>
    </div>
  );
}