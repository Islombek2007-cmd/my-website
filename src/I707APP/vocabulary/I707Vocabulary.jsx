import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { auth, db } from "../../firebase/firebase";
import { collection, getDocs, doc, updateDoc, arrayUnion, setDoc, deleteDoc } from "firebase/firestore";
import { BASIC_VOCABULARY } from '../../data/BasicLevel/index';
import { VOCABULARY_FOUNDATION } from "../../data/IeltsFoundation/index";
import { VOCABULARY_GRADUATION } from "../../data/IeltsGraduation/index";


import { IFLesson1 } from "../../data/IeltsFoundation/Lesson1/Vocabulary/IFLesson1";
import { IFLesson2 } from "../../data/IeltsFoundation/Lesson2/Vocabulary/IFLesson2";
import { IFLesson3 } from "../../data/IeltsFoundation/Lesson3/Vocabulary/IFLesson3";





import "./I707Vocabulary.css";


function getLevelColor(level) {
  const colors = {
    A1: "#4CAF50", A2: "#8BC34A", B1: "#2196F3",
    B2: "#9C27B0", C1: "#FF9800", C2: "#C0392B",
    IELTS_FOUNDATION: "#00BCD4", IELTS_GRADUATION: "#FFD700"
  };
  return colors[level] || "#4CAF50";
}

function getLevelShort(level) {
  if (level === "IELTS_FOUNDATION") return "IF";
  if (level === "IELTS_GRADUATION") return "IG";
  return level;
}

export default function I707Vocabulary() {
  const navigate = useNavigate();
  const { user, userData, loading } = useUser();
  const [filter, setFilter] = useState("all");
  const [selectedWord, setSelectedWord] = useState(null);
  const [selectedWordIndex, setSelectedWordIndex] = useState(0);
  const [fullScreen, setFullScreen] = useState(false);
  const [myWords, setMyWords] = useState([]);
  const [learnedWords, setLearnedWords] = useState([]);
  const [favourites, setFavourites] = useState([]);
  const [activeNav, setActiveNav] = useState("vocab");
  const [isDay, setIsDay] = useState(() => localStorage.getItem("i707_theme") === "light");
  const [search, setSearch] = useState("");
  const featuredScrollRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsDay(localStorage.getItem("i707_theme") === "light");
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!loading && !user) navigate("/i707/login");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const mySnap = await getDocs(collection(db, "users", user.uid, "myWords"));
        setMyWords(mySnap.docs.map(d => ({ id: d.id, ...d.data() })));
        const favSnap = await getDocs(collection(db, "users", user.uid, "favourites"));
        setFavourites(favSnap.docs.map(d => d.id));
      } catch (e) { console.log("Error:", e); }
    };
    fetchData();
    if (userData?.learnedWords) setLearnedWords(userData.learnedWords);
  }, [user, userData]);

  // AUTO SCROLL featured words right to left
  useEffect(() => {
    const el = featuredScrollRef.current;
    if (!el) return;
    let frame;
    let pos = 0;
    const speed = 0.5;
    const scroll = () => {
      pos += speed;
      if (pos >= el.scrollWidth / 2) pos = 0;
      el.scrollLeft = pos;
      frame = requestAnimationFrame(scroll);
    };
    frame = requestAnimationFrame(scroll);
    el.addEventListener("mouseenter", () => cancelAnimationFrame(frame));
    el.addEventListener("mouseleave", () => { frame = requestAnimationFrame(scroll); });
    return () => cancelAnimationFrame(frame);
  }, []);

  if (loading || !userData) return (
    <div style={{ background: "#1A1A1A", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", color: "#F5F0E8", fontSize: "14px", letterSpacing: "3px" }}>
      Loading...
    </div>
  );

  const searchParams = new URLSearchParams(window.location.search);
  const lessonParam = searchParams.get("lesson");
  const lessonIndex = lessonParam !== null ? parseInt(lessonParam) : (userData?.currentLesson ?? null);

  const level = userData.level || "A1";
  const levelColor = getLevelColor(level);
  const levelShort = getLevelShort(level);

  const getIFLessonWords = (idx) => {
    if (idx === 0) return IFLesson1;
    if (idx === 1) return IFLesson2;
    if (idx === 2) return IFLesson3;
    return IFLesson1;
  };

  const allLevelWords =
    level === "IELTS_FOUNDATION" ? (VOCABULARY_FOUNDATION.IELTS_FOUNDATION || []) :
    level === "IELTS_GRADUATION" ? (VOCABULARY_GRADUATION.IELTS_GRADUATION || []) :
    BASIC_VOCABULARY[level] || [];

  const levelWords = level === "IELTS_FOUNDATION" && lessonIndex !== null
    ? getIFLessonWords(lessonIndex)
    : lessonIndex !== null
    ? allLevelWords.slice(lessonIndex * 10, lessonIndex * 10 + 10)
    : allLevelWords;

  const learnedCount = learnedWords.filter(w => w.startsWith(level)).length;
  const progress = levelWords.length > 0 ? Math.round((learnedCount / levelWords.length) * 100) : 0;

  const handleMarkLearned = async (word) => {
    if (!user) return;
    const wordId = `${level}_${word.word}`;
    if (learnedWords.includes(wordId)) return;
  
    const { markAsLearned } = await import("../../services/learnedContent");
    const success = await markAsLearned(user, userData, "vocabulary", wordId, 2);
  
    if (success) {
    setLearnedWords(prev => [...prev, wordId]);
    }
  };

  const handleToggleFavourite = async (e, word) => {
    e.stopPropagation();
    if (!user) return;
    const wordId = `${level}_${word.word}`;
    try {
      if (favourites.includes(wordId)) {
        await deleteDoc(doc(db, "users", user.uid, "favourites", wordId));
        setFavourites(prev => prev.filter(f => f !== wordId));
      } else {
        await setDoc(doc(db, "users", user.uid, "favourites", wordId), {
          word: word.word, level, savedAt: new Date().toISOString()
        });
        setFavourites(prev => [...prev, wordId]);
      }
    } catch (e) { console.log("Error:", e); }
  };

  const filteredWords = () => {
    let words = [];
    if (filter === "all") words = levelWords;
    else if (filter === "learned") words = levelWords.filter(w => learnedWords.includes(`${level}_${w.word}`));
    else if (filter === "favourites") words = levelWords.filter(w => favourites.includes(`${level}_${w.word}`));
    else if (filter === "mywords") words = myWords;
    if (search.trim()) words = words.filter(w => w.word?.toLowerCase().includes(search.toLowerCase()));
    return words;
  };

  const words = filteredWords();
  // Duplicate featured for infinite scroll
  const featuredWords = [...levelWords.slice(0, 8), ...levelWords.slice(0, 8)];

  const openWord = (word, index) => {
    setSelectedWord(word);
    setSelectedWordIndex(index);
  };

  const goNextWord = () => {
    const nextIdx = (selectedWordIndex + 1) % words.length;
    setSelectedWord(words[nextIdx]);
    setSelectedWordIndex(nextIdx);
  };

  const goPrevWord = () => {
    const prevIdx = (selectedWordIndex - 1 + words.length) % words.length;
    setSelectedWord(words[prevIdx]);
    setSelectedWordIndex(prevIdx);
  };

  return (
    <div className={`lex-root ${isDay ? "light" : ""}`}>
      <div className="lex-orb lex-orb--a" />
      <div className="lex-orb lex-orb--b" />

      {/* TOPBAR */}
      <header className="lex-topbar">
        <button className="lex-back" onClick={() => navigate("/i707/home")}>← Home</button>
        <div className="lex-topbar__center">
          <span className="lex-topbar__title">The Lexicon</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* VIEW TOGGLE BUTTON */}
          <button className="lex-view-toggle" onClick={() => setFullScreen(f => !f)}
            title={fullScreen ? "Card View" : "Full View"}>
            {fullScreen ? (
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                <rect x="2" y="2" width="12" height="12" rx="1.5"/>
                <path d="M5 6h6M5 9h4"/>
              </svg>
            ) : (
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                <rect x="1" y="1" width="14" height="14" rx="2"/>
                <path d="M1 6h14M6 1v14"/>
              </svg>
            )}
          </button>
          <div className="lex-level-pill" style={{ background: `${levelColor}18`, color: levelColor, borderColor: `${levelColor}35` }}>
            {lessonIndex !== null ? `${levelShort} · L${lessonIndex + 1}` : levelShort}
          </div>
        </div>
      </header>

      <main className="lex-main">

        {/* HERO */}
        <div className="lex-hero">
          <div className="lex-hero__glow" style={{ background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${levelColor}18 0%, transparent 70%)` }} />
          <div className="lex-hero__dots" />
          <div className="lex-hero__shimmer" />
          <div className="lex-hero__topline" style={{ background: `linear-gradient(90deg, transparent, ${levelColor}, #FFD700, ${levelColor}, transparent)` }} />
          <div className="lex-hero__content">
            <p className="lex-hero__issue">Volume I · {level} Collection</p>
            <h1 className="lex-hero__headline">Word<br /><em>Mastery</em></h1>
            <p className="lex-hero__tagline">Curated vocabulary for the distinguished scholar.</p>
          </div>
          <div className="lex-hero__stats">
            <div className="lex-stat">
              <span className="lex-stat__num" style={{ color: levelColor }}>{levelWords.length}</span>
              <span className="lex-stat__lbl">Words</span>
            </div>
            <div className="lex-stat__sep" />
            <div className="lex-stat">
              <span className="lex-stat__num" style={{ color: "#4CAF50" }}>{learnedCount}</span>
              <span className="lex-stat__lbl">Learned</span>
            </div>
            <div className="lex-stat__sep" />
            <div className="lex-stat">
              <span className="lex-stat__num" style={{ color: "#FFD700" }}>{favourites.length}</span>
              <span className="lex-stat__lbl">Saved</span>
            </div>
            <div className="lex-stat__sep" />
            <div className="lex-stat">
              <span className="lex-stat__num" style={{ color: "#9E9E9E" }}>{myWords.length}</span>
              <span className="lex-stat__lbl">Mine</span>
            </div>
          </div>
          <div className="lex-hero__progress-wrap">
            <div className="lex-hero__progress-track">
              <div className="lex-hero__progress-fill" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${levelColor}, #FFD700)` }} />
            </div>
            <span className="lex-hero__progress-pct">{progress}%</span>
          </div>
        </div>

        {/* FEATURED — AUTO SCROLLING RIGHT TO LEFT */}
        <div className="lex-featured-wrap">
          <p className="lex-section-eyebrow">Featured Words</p>
          <div className="lex-featured-scroll" ref={featuredScrollRef}>
            {featuredWords.map((w, i) => {
              const wordId = `${level}_${w.word}`;
              const isLearned = learnedWords.includes(wordId);
              return (
                <div key={i} className="lex-featured-card"
                  onClick={() => setSelectedWord(w)}
                  style={{ borderColor: isLearned ? "rgba(76,175,80,0.3)" : `${levelColor}25` }}>
                  <div className="lex-featured-card__topline" style={{ background: `linear-gradient(90deg, transparent, ${levelColor}, transparent)` }} />
                  <div className="lex-featured-card__glow" style={{ background: `radial-gradient(ellipse at top, ${levelColor}15, transparent 70%)` }} />
                  <span className="lex-featured-card__pos">{w.partOfSpeech}</span>
                  <span className="lex-featured-card__word">{w.word}</span>
                  <span className="lex-featured-card__uzbek">{w.uzbek}</span>
                  {isLearned && <div className="lex-featured-card__check">✓</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* SEARCH */}
        <div className="lex-search-wrap">
          <svg className="lex-search-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
            <circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5l3 3"/>
          </svg>
          <input className="lex-search" placeholder="Search the lexicon..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* FILTER TABS */}
        <div className="lex-tabs">
          {[
            { id: "all", label: "All" },
            { id: "learned", label: "Learned" },
            { id: "favourites", label: "Saved" },
            { id: "mywords", label: "Mine" },
          ].map(tab => (
            <button key={tab.id}
              className={`lex-tab ${filter === tab.id ? "active" : ""}`}
              onClick={() => setFilter(tab.id)}
              style={filter === tab.id ? { borderColor: levelColor, color: levelColor, background: `${levelColor}10` } : {}}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* WORDS LIST */}
        <div className={`lex-list ${fullScreen ? "lex-list--full" : ""}`}>
          {words.length === 0 ? (
            <div className="lex-empty">
              <div className="lex-empty__orb" />
              <p className="lex-empty__title">
                {filter === "learned" ? "No learned words yet" :
                 filter === "favourites" ? "No saved words yet" :
                 filter === "mywords" ? "No personal words yet" : "No words found"}
              </p>
              <p className="lex-empty__sub">
                {filter === "learned" ? "Open a word and mark it as learned." :
                 filter === "favourites" ? "Tap the bookmark on any word to save it." :
                 filter === "mywords" ? "Add your first word using the button below." : "Try a different search term."}
              </p>
            </div>
          ) : fullScreen ? (
            /* FULL SCREEN GRID */
            words.map((word, i) => {
              const wordId = `${level}_${word.word}`;
              const isLearned = learnedWords.includes(wordId);
              const isFav = favourites.includes(wordId);
              return (
                <div key={i} className={`lex-full-card ${isLearned ? "learned" : ""}`}
                  onClick={() => openWord(word, i)}>
                  <div className="lex-full-card__topline" style={{ background: isLearned ? "#4CAF50" : levelColor }} />
                  <div className="lex-full-card__header">
                    <div>
                      <span className="lex-full-card__pos">{word.partOfSpeech}</span>
                      <span className="lex-full-card__word">{word.word}</span>
                    </div>
                    {isLearned && (
                      <div className="lex-full-card__check">
                        <svg viewBox="0 0 16 16" fill="none" stroke="#4CAF50" strokeWidth="2.2" strokeLinecap="round">
                          <path d="M3 8l3.5 3.5L13 4"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  <p className="lex-full-card__def">{word.definition}</p>
                  {word.uzbek && <span className="lex-full-card__uzbek">{word.uzbek}</span>}
                </div>
              );
            })
          ) : (
            /* CARD LIST */
            words.map((word, i) => {
              const wordId = `${level}_${word.word}`;
              const isLearned = learnedWords.includes(wordId);
              const isFav = favourites.includes(wordId);
              const isMyWord = !!word.id;
              return (
                <div key={i} className={`lex-card ${isLearned ? "learned" : ""}`}
                  onClick={() => openWord(word, i)}>
                  <div className="lex-card__accent" style={{ background: isLearned ? "#4CAF50" : isMyWord ? "#FFD700" : levelColor }} />
                  <div className="lex-card__body">
                    <div className="lex-card__top">
                      <span className="lex-card__word">{word.word}</span>
                      <div className="lex-card__actions">
                        {!isMyWord && (
                          <button className={`lex-card__fav ${isFav ? "active" : ""}`}
                            onClick={(e) => handleToggleFavourite(e, word)}
                            style={isFav ? { color: "#FFD700", borderColor: "rgba(255,215,0,0.4)", background: "rgba(255,215,0,0.08)" } : {}}>
                            <svg viewBox="0 0 16 16" fill={isFav ? "#FFD700" : "none"} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                              <path d="M8 2l1.8 3.6 4 .6-2.9 2.8.7 4L8 11l-3.6 1.9.7-4L2.2 6.2l4-.6z"/>
                            </svg>
                          </button>
                        )}
                        {isLearned && (
                          <div className="lex-card__learned-dot">
                            <svg viewBox="0 0 16 16" fill="none" stroke="#4CAF50" strokeWidth="2.2" strokeLinecap="round">
                              <path d="M3 8l3.5 3.5L13 4"/>
                            </svg>
                          </div>
                        )}
                        {isMyWord && <span className="lex-card__mine-badge">Mine</span>}
                      </div>
                    </div>
                    <span className="lex-card__pos">{word.partOfSpeech}</span>
                    <p className="lex-card__def">{word.definition}</p>
                    {word.uzbek && <span className="lex-card__uzbek">{word.uzbek}</span>}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div style={{ height: 24 }} />
      </main>

      {/* FAB */}
      <button className="lex-fab" onClick={() => navigate("/i707/mywords")}
        style={{ background: `linear-gradient(135deg, ${levelColor}, #FFD700)` }}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M8 3v10M3 8h10"/>
        </svg>
      </button>

      {/* WORD MODAL — small bottom sheet */}
      {selectedWord && !fullScreen && (
  <div className="lex-modal-overlay" onClick={() => setSelectedWord(null)}>
    <div className="lex-modal" onClick={e => e.stopPropagation()}>
      <div className="lex-modal__handle" />
      <div className="lex-modal__glow" style={{ background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${levelColor}20, transparent 70%)` }} />
      <div className="lex-modal__topline" style={{ background: `linear-gradient(90deg, transparent, var(--red), #FFD700, var(--red), transparent)` }} />

      <div className="lex-modal__header">
        <span className="lex-modal__pos">{selectedWord.partOfSpeech}</span>
        <h2 className="lex-modal__word">{selectedWord.word}</h2>
        {selectedWord.uzbek && <p className="lex-modal__uzbek">{selectedWord.uzbek}</p>}
      </div>

      <div className="lex-modal__rule">
        <div className="lex-modal__rule-line" />
        <div className="lex-modal__rule-diamond" style={{ background: "#C0392B" }} />
        <div className="lex-modal__rule-line" />
      </div>

      <div className="lex-modal__section">
        <span className="lex-modal__label">Definition</span>
        <p className="lex-modal__text">{selectedWord.definition}</p>
      </div>

      {selectedWord.example && (
        <div className="lex-modal__section">
          <span className="lex-modal__label">Example</span>
          <p className="lex-modal__example">"{selectedWord.example}"</p>
        </div>
      )}

      <div className="lex-modal__actions">
        {!learnedWords.includes(`${level}_${selectedWord.word}`) && !selectedWord.id && (
          <button className="lex-modal__learn-btn" style={{ background: "#C0392B" }}
            onClick={() => { handleMarkLearned(selectedWord); setSelectedWord(null); }}>
            Mark as Learned · +2 Coins
          </button>
        )}
        {learnedWords.includes(`${level}_${selectedWord.word}`) && (
          <div className="lex-modal__learned-badge">
            <svg viewBox="0 0 16 16" fill="none" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round">
              <path d="M3 8l3.5 3.5L13 4"/>
            </svg>
            Word Mastered
          </div>
        )}
      </div>

      {/* NAV AT BOTTOM */}
      <div className="lex-modal__nav">
        <button className="lex-modal__nav-btn" onClick={(e) => { e.stopPropagation(); goPrevWord(); }}>
          ← Prev
        </button>
        <span className="lex-modal__nav-count">{selectedWordIndex + 1} / {words.length}</span>
        <button className="lex-modal__nav-btn" onClick={(e) => { e.stopPropagation(); goNextWord(); }}>
          Next →
        </button>
      </div>

      <button className="lex-modal__close" onClick={() => setSelectedWord(null)}>
        Close
      </button>

    </div>
  </div>
)}

      {/* FULL SCREEN WORD DETAIL */}
      {selectedWord && fullScreen && (
        <div className="lex-fullscreen-overlay">
          <div className="lex-fullscreen" style={{ '--lc': levelColor }}>
            <div className="lex-fullscreen__topline" style={{ background: `linear-gradient(90deg, transparent, ${levelColor}, #FFD700, transparent)` }} />
            <div className="lex-fullscreen__glow" style={{ background: `radial-gradient(ellipse 100% 50% at 50% 0%, ${levelColor}20, transparent 70%)` }} />

         

          {/* WORD COUNTER TOP CENTER */}
          <div style={{
            position: "absolute", top: 58, left: 0, right: 0,
            display: "flex", justifyContent: "center", zIndex: 10
          }}>
            <span style={{
              fontFamily: "Lora, Georgia, serif",
              fontSize: "10px",
              letterSpacing: "3px",
              color: "rgba(245,240,232,0.2)",
              fontStyle: "italic"
            }}>{selectedWordIndex + 1} / {words.length}</span>
          </div>

          <div className="lex-fullscreen__content">
              <span className="lex-fullscreen__eyebrow">{selectedWord.partOfSpeech}</span>
              <h1 className="lex-fullscreen__word">{selectedWord.word}</h1>
              {selectedWord.uzbek && <p className="lex-fullscreen__uzbek">{selectedWord.uzbek}</p>}

              <div className="lex-fullscreen__rule">
                <div className="lex-fullscreen__rule-line" />
                <div className="lex-fullscreen__rule-gem" style={{ background: levelColor }} />
                <div className="lex-fullscreen__rule-line" />
              </div>

              <div className="lex-fullscreen__section">
                <span className="lex-fullscreen__label">Definition</span>
                <p className="lex-fullscreen__text">{selectedWord.definition}</p>
              </div>

              {selectedWord.example && (
                <div className="lex-fullscreen__section">
                  <span className="lex-fullscreen__label">Example</span>
                  <p className="lex-fullscreen__example">"{selectedWord.example}"</p>
                </div>
              )}

              {!learnedWords.includes(`${level}_${selectedWord.word}`) && !selectedWord.id && (
                <button className="lex-fullscreen__learn-btn" style={{ background: levelColor }}
                  onClick={() => handleMarkLearned(selectedWord)}>
                  Mark as Learned · +2 Coins
                </button>
              )}
              {learnedWords.includes(`${level}_${selectedWord.word}`) && (
                <div className="lex-fullscreen__learned">
                  <svg viewBox="0 0 16 16" fill="none" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round">
                    <path d="M3 8l3.5 3.5L13 4"/>
                  </svg>
                  Word Mastered
                </div>
              )}
            </div>

            {/* PREV / NEXT */}
            <div className="lex-fullscreen__nav">
  <button className="lex-fullscreen__nav-btn" onClick={() => setSelectedWord(null)}>
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M3 8h10M3 8l4-4M3 8l4 4"/>
    </svg>
    <span>Back</span>
  </button>
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
    <span className="lex-fullscreen__counter">{selectedWordIndex + 1} / {words.length}</span>
  </div>
  <div style={{ display: "flex", gap: 8 }}>
    <button className="lex-fullscreen__nav-btn" onClick={goPrevWord}>
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M10 4l-4 4 4 4"/>
      </svg>
    </button>
    <button className="lex-fullscreen__nav-btn" onClick={goNextWord}>
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M6 4l4 4-4 4"/>
      </svg>
    </button>
  </div>
</div>
          </div>
        </div>
      )}

      {/* BOTTOM NAV */}
      <nav className="lex-nav">
        {[
          { id: "home", label: "Home", icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M1 7.5L8 1l7 6.5V15h-4.5v-4h-5V15H1z"/></svg> },
          { id: "vocab", label: "Vocab", icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><rect x="2" y="2" width="12" height="12" rx="1.5"/><path d="M5 6h6M5 9h4"/></svg> },
          { id: "games", label: "Games", icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M3 13l2.5-2.5L8 13l5-9"/><circle cx="8" cy="4" r="1.5" fill="currentColor"/></svg> },
          { id: "profile", label: "Profile", icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><circle cx="8" cy="5.5" r="3"/><path d="M2 15c0-3 2.7-5 6-5s6 2 6 5"/></svg> },
        ].map(nav => (
          <div key={nav.id} className={`lex-nav__item ${activeNav === nav.id ? "active" : ""}`}
            onClick={() => {
              setActiveNav(nav.id);
              if (nav.id === "home") navigate("/i707/home");
              if (nav.id === "games") navigate("/i707/games");
              if (nav.id === "profile") navigate("/i707/profile");
            }}>
            <div className="lex-nav__icon">{nav.icon}</div>
            <span className="lex-nav__label">{nav.label}</span>
          </div>
        ))}
      </nav>
    </div>
  );
}