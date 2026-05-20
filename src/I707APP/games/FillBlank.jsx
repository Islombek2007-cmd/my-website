import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";

import { BASIC_VOCABULARY } from '../../data/BasicLevel/index';


import { VOCABULARY_FOUNDATION } from "../../data/IeltsFoundation/index";
import { VOCABULARY_GRADUATION } from "../../data/IeltsGraduation/index";
import "./Games.css";

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

export default function FillBlank() {
  const navigate = useNavigate();
  const { user, userData, loading } = useUser();
  const [isDay] = useState(() => localStorage.getItem("i707_theme") === "light");
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [done, setDone] = useState(false);

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
    const learned = allWords.filter(w => learnedIds.includes(`${level}_${w.word}`) && w.example);
    if (learned.length < 4) {
      alert("Learn at least 4 words with examples first!");
      navigate("/i707/games");
      return;
    }
    const pool = shuffle(learned).slice(0, 10);
    const qs = pool.map(w => {
      const blanked = w.example.replace(new RegExp(w.word, "gi"), "_____");
      const wrongWords = shuffle(learned.filter(x => x.word !== w.word)).slice(0, 3).map(x => x.word);
      const options = shuffle([w.word, ...wrongWords]);
      return { word: w.word, sentence: blanked, options };
    });
    setQuestions(qs);
  }, [userData]);

  const handleSelect = async (option) => {
    if (answered) return;
    setSelected(option);
    setAnswered(true);
    setTotal(t => t + 1);
    if (option === questions[index].word) {
      setScore(s => s + 10);
      if (user && userData) {
        try {
          await updateDoc(doc(db, "users", user.uid), { coins: (userData.coins || 0) + 2 });
        } catch (e) {}
      }
    }
    setTimeout(() => {
      if (index + 1 >= questions.length) setDone(true);
      else { setIndex(i => i + 1); setSelected(null); setAnswered(false); }
    }, 1000);
  };

  if (loading || !userData) return (
    <div style={{ background: "#1A1A1A", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", color: "#F5F0E8", fontSize: "14px", letterSpacing: "3px" }}>Loading...</div>
  );

  const current = questions[index];
  const accuracy = total > 0 ? Math.round((score / (total * 10)) * 100) : 0;

  return (
    <div className={`i707-game ${isDay ? "light" : ""}`}>
      <div className="i707-game-orb i707-game-orb--a" />
      <div className="i707-game-orb i707-game-orb--b" />

      <header className="i707-game-topbar">
        <button className="i707-game-back" onClick={() => navigate("/i707/games")}>← Games</button>
        <span className="i707-game-title">Fill the Blank</span>
        <span className="i707-game-score">🪙 {score}</span>
      </header>

      <main className="i707-game-main">
        <div className="i707-game-hero">
          <div className="i707-game-hero__topline" style={{ background: "linear-gradient(90deg, transparent, #FF9800, #FFD700, transparent)" }} />
          <div className="i707-game-hero__shimmer" />
          <span className="i707-game-hero__eyebrow">{index + 1} of {questions.length} · {accuracy}% accuracy</span>
          <h1 className="i707-game-hero__title">Fill the<br /><em>Blank</em></h1>
          <div className="i707-game-hero__progress">
            <div className="i707-game-hero__progress-fill" style={{ width: `${((index) / (questions.length || 1)) * 100}%`, background: "linear-gradient(90deg, #FF9800, #FFD700)" }} />
          </div>
        </div>

        {!done && current ? (
          <>
            <div className="i707-fillblank-sentence">
              <div className="i707-fillblank-sentence__topline" />
              <span className="i707-fillblank-sentence__label">Complete the sentence</span>
              <p className="i707-fillblank-sentence__text">{current.sentence}</p>
            </div>

            <div className="i707-fillblank-options">
              {current.options.map(opt => {
                let state = "";
                if (answered) {
                  if (opt === current.word) state = "correct";
                  else if (opt === selected) state = "wrong";
                }
                return (
                  <button key={opt}
                    className={`i707-fillblank-option ${state}`}
                    onClick={() => handleSelect(opt)}
                    disabled={answered}>
                    {opt}
                  </button>
                );
              })}
            </div>
          </>
        ) : done ? (
          <div className="i707-game-result">
            <div className="i707-game-result__topline" />
            <div className="i707-game-result__icon">🔤</div>
            <h2 className="i707-game-result__title">Game Over!</h2>
            <p className="i707-game-result__sub">You completed {questions.length} questions.</p>
            <div className="i707-game-result__stats">
              <div className="i707-game-result__stat">
                <span style={{ color: "#4CAF50", fontSize: "28px", fontWeight: 700 }}>{score}</span>
                <span className="i707-game-result__stat-lbl">Score</span>
              </div>
              <div className="i707-game-result__stat-sep" />
              <div className="i707-game-result__stat">
                <span style={{ color: "#FFD700", fontSize: "28px", fontWeight: 700 }}>{accuracy}%</span>
                <span className="i707-game-result__stat-lbl">Accuracy</span>
              </div>
            </div>
            <button className="i707-game-result__btn" onClick={() => { setIndex(0); setSelected(null); setAnswered(false); setScore(0); setTotal(0); setDone(false); }}>Play Again</button>
            <button className="i707-game-result__btn-secondary" onClick={() => navigate("/i707/games")}>Back to Games</button>
          </div>
        ) : null}
      </main>
    </div>
  );
}