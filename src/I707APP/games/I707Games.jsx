import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import "./I707Games.css";

export default function I707Games() {
  const navigate = useNavigate();
  const { user, userData, loading } = useUser();
  const [activeNav, setActiveNav] = useState("games");
  const [isDay, setIsDay] = useState(() => localStorage.getItem("i707_theme") === "light");

useEffect(() => {
  const handleStorage = () => {
    setIsDay(localStorage.getItem("i707_theme") === "light");
  };
  window.addEventListener("storage", handleStorage);
  
  // Also poll every 500ms since same-tab localStorage doesn't fire storage event
  const interval = setInterval(() => {
    setIsDay(localStorage.getItem("i707_theme") === "light");
  }, 500);

  return () => {
    window.removeEventListener("storage", handleStorage);
    clearInterval(interval);
  };
}, []);

  useEffect(() => {
    if (!loading && !user) navigate("/i707/login");
  }, [user, loading, navigate]);

  if (loading || !userData) return (
    <div style={{ background: "#F5F0E8", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", color: "#1A1A1A", fontSize: "14px", letterSpacing: "3px" }}>
      Loading...
    </div>
  );

  const level = userData.level || "A1";
  const learnedCount = (userData.learnedWords || []).filter(w => w.startsWith(level)).length;
  const coins = userData.coins || 0;

  const handleGame = (gameId) => {
    if (learnedCount < 4 && gameId !== "leaderboard") {
      alert("Learn at least 4 words in Vocabulary to unlock games!");
      return;
    }
    navigate(`/i707/games/${gameId}`);
  };

  const GAMES = [
    { id: "wordmatch", title: "Word Match", sub: "Match words to definitions.", icon: "🎯", color: "#C0392B", badge: "Memory", delay: "0.05s" },
    { id: "flashcards", title: "Flash Cards", sub: "Flip to reveal meaning.", icon: "🃏", color: "#2196F3", badge: "Review", delay: "0.1s" },
    { id: "fillblank", title: "Fill Blank", sub: "Complete the sentence.", icon: "🔤", color: "#FF9800", badge: "Practice", delay: "0.15s" },
    { id: "scramble", title: "Scramble", sub: "Unscramble the letters.", icon: "🔀", color: "#00BCD4", badge: "Challenge", delay: "0.2s" },
  ];

  return (
    <div className={`i707-games ${isDay ? "light" : ""}`}>
      <div className="i707-games-top-accent" />
      <div className="i707-games-orb i707-games-orb--a" />
      <div className="i707-games-orb i707-games-orb--b" />

      {/* TOPBAR */}
      <header className="i707-games-topbar">
        <button className="i707-games-back" onClick={() => navigate("/i707/home")}>← Home</button>
        <span className="i707-games-title">Games</span>
        <div className="i707-games-coin-pill">
          <div className="i707-games-coin-pill__dot" />
          <span className="i707-games-coin-pill__val">{coins}</span>
        </div>
      </header>

      <main className="i707-games-main">

        {/* HERO */}
        <div className="i707-games-hero">
          <div className="i707-games-hero__shimmer" />
          <div className="i707-games-hero__dots" />
          <div className="i707-games-hero__content">
            <span className="i707-games-hero__tag">Level {level} · {learnedCount} words learned</span>
            <h1 className="i707-games-hero__title">Play &<br /><em>Master</em></h1>
            <p className="i707-games-hero__sub">Games use your learned words. The more you learn, the richer the experience.</p>
            <div className="i707-games-hero__stats">
              <div className="i707-games-hero__stat">
                <span className="i707-games-hero__stat-num" style={{ color: "#C0392B" }}>5</span>
                <span className="i707-games-hero__stat-lbl">Games</span>
              </div>
              <div className="i707-games-hero__stat-sep" />
              <div className="i707-games-hero__stat">
                <span className="i707-games-hero__stat-num" style={{ color: "#4CAF50" }}>{learnedCount}</span>
                <span className="i707-games-hero__stat-lbl">Words</span>
              </div>
              <div className="i707-games-hero__stat-sep" />
              <div className="i707-games-hero__stat">
                <span className="i707-games-hero__stat-num" style={{ color: "#FFD700" }}>{coins}</span>
                <span className="i707-games-hero__stat-lbl">Coins</span>
              </div>
            </div>
          </div>
          {learnedCount < 4 && (
            <div className="i707-games-hero__warning">
              ⚠️ Learn at least 4 words in Vocabulary to unlock games.
            </div>
          )}
        </div>

        {/* FEATURED */}
        <div className="i707-games-section-label">
          <span className="i707-games-section-label__line" />
          <span className="i707-games-section-label__text">Featured</span>
          <span className="i707-games-section-label__line" />
        </div>

        <div className="i707-games-featured" onClick={() => handleGame("makesentence")}>
          <div className="i707-games-featured__top">
            <div className="i707-games-featured__top-line" />
            <div className="i707-games-featured__top-shimmer" />
            <div className="i707-games-featured__top-glow" />
            <span className="i707-games-featured__badge">✦ AI Powered</span>
            <span className="i707-games-featured__icon">✍️</span>
            <h2 className="i707-games-featured__title">Make a Sentence</h2>
            <p className="i707-games-featured__sub">Write a sentence using your learned word. DeepSeek AI grades it instantly with color-coded feedback.</p>
          </div>
          <div className="i707-games-featured__bottom">
            <span className="i707-games-featured__coins">+5 🪙 per sentence</span>
            <div className="i707-games-featured__arrow">→</div>
          </div>
        </div>

        {/* ALL GAMES */}
        <div className="i707-games-section-label">
          <span className="i707-games-section-label__line" />
          <span className="i707-games-section-label__text">All Games</span>
          <span className="i707-games-section-label__line" />
        </div>

        <div className="i707-games-grid">
          {GAMES.map((game) => (
            <div key={game.id}
              className="i707-games-card"
              onClick={() => handleGame(game.id)}
              style={{ animationDelay: game.delay }}>
              <div className="i707-games-card__top" style={{ background: game.color }}>
                <div className="i707-games-card__top-glow" />
                <div className="i707-games-card__top-shimmer" />
                <span className="i707-games-card__icon">{game.icon}</span>
              </div>
              <div className="i707-games-card__body">
                <span className="i707-games-card__title">{game.title}</span>
                <span className="i707-games-card__sub">{game.sub}</span>
                <span className="i707-games-card__badge"
                  style={{ color: game.color, borderColor: `${game.color}40`, background: `${game.color}12` }}>
                  {game.badge}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* LEADERBOARD */}
        <div className="i707-games-leaderboard" onClick={() => handleGame("leaderboard")}>
          <div className="i707-games-leaderboard__line" />
          <span className="i707-games-leaderboard__icon">🏆</span>
          <div className="i707-games-leaderboard__content">
            <span className="i707-games-leaderboard__title">Leaderboard</span>
            <span className="i707-games-leaderboard__sub">See the top players globally.</span>
          </div>
          <span className="i707-games-leaderboard__badge">Global</span>
        </div>

        <div style={{ height: 24 }} />
      </main>

      {/* BOTTOM NAV */}
      <nav className="i707-games-nav">
        {[
          { id: "home", label: "Home", icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M1 7.5L8 1l7 6.5V15h-4.5v-4h-5V15H1z"/></svg> },
          { id: "vocab", label: "Vocab", icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><rect x="2" y="2" width="12" height="12" rx="1.5"/><path d="M5 6h6M5 9h4"/></svg> },
          { id: "games", label: "Games", icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M3 13l2.5-2.5L8 13l5-9"/><circle cx="8" cy="4" r="1.5" fill="currentColor"/></svg> },
          { id: "profile", label: "Profile", icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><circle cx="8" cy="5.5" r="3"/><path d="M2 15c0-3 2.7-5 6-5s6 2 6 5"/></svg> },
        ].map(nav => (
          <div key={nav.id}
            className={`i707-games-nav__item ${activeNav === nav.id ? "active" : ""}`}
            onClick={() => {
              setActiveNav(nav.id);
              if (nav.id === "home") navigate("/i707/home");
              if (nav.id === "vocab") navigate("/i707/vocabulary");
              if (nav.id === "games") navigate("/i707/games");
              if (nav.id === "profile") navigate("/i707/profile");
            }}>
            <div className="i707-games-nav__icon">{nav.icon}</div>
            <span className="i707-games-nav__label">{nav.label}</span>
          </div>
        ))}
      </nav>
    </div>
  );
}