import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../firebase/firebase";
import { useUser } from "../../context/UserContext";
import "./I707Home.css";


import { useLocation } from "react-router-dom";








export default function I707Home() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const { user, userData, loading } = useUser();



  const location = useLocation();
  const [levelToast, setLevelToast] = useState(null);

  useEffect(() => {
    if (location.state?.levelChanged) {
      setLevelToast(location.state);
      setTimeout(() => setLevelToast(null), 4000);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);


  
  const [isDay, setIsDay] = useState(() => localStorage.getItem("i707_theme") === "light");
  const [time, setTime] = useState("");
  const [ampm, setAmpm] = useState("");
  const [date, setDate] = useState("");
  const [greeting, setGreeting] = useState("");
  const [timeOfDay, setTimeOfDay] = useState("");
  const [activeNav, setActiveNav] = useState("home");

  useEffect(() => {
    if (!loading && !user) navigate("/i707/login");
  }, [user, loading]);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes();
      const s = now.getSeconds();
      const isPM = h >= 12;
      const h12 = h % 12 || 12;
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const pad = n => String(n).padStart(2, "0");
      setTime(`${pad(h12)}:${pad(m)}:${pad(s)}`);
      setAmpm(isPM ? "PM" : "AM");
      setDate(`${days[now.getDay()]} · ${months[now.getMonth()]} ${now.getDate()}`);
      if (h >= 5 && h < 12) { setGreeting("Good morning"); setTimeOfDay("Morning"); }
      else if (h >= 12 && h < 17) { setGreeting("Good afternoon"); setTimeOfDay("Afternoon"); }
      else if (h >= 17 && h < 21) { setGreeting("Good evening"); setTimeOfDay("Evening"); }
      else { setGreeting("Good night"); setTimeOfDay("Night"); }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const DPR = window.devicePixelRatio || 1;
    canvas.width = 34 * DPR;
    canvas.height = 34 * DPR;
    canvas.style.width = "34px";
    canvas.style.height = "34px";
    ctx.scale(DPR, DPR);
    const SIZE = 34, cx = SIZE / 2, cy = SIZE / 2;
    const R = 11, ARMS = 5, TAU = Math.PI * 2;
    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, SIZE, SIZE);
      const rot = t * 0.35;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      ctx.translate(-cx, -cy);
      for (let i = 0; i < ARMS; i++) {
        const a = (TAU / ARMS) * i - Math.PI / 2;
        const tx = cx + Math.cos(a) * R;
        const ty = cy + Math.sin(a) * R;
        const cp1a = a - (TAU / ARMS) * 0.7;
        const cp1x = cx + Math.cos(cp1a) * R * 0.85;
        const cp1y = cy + Math.sin(cp1a) * R * 0.85;
        const cp2a = a - (TAU / ARMS) * 0.15;
        const cp2x = cx + Math.cos(cp2a) * R * 1.05;
        const cp2y = cy + Math.sin(cp2a) * R * 1.05;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, tx, ty);
        ctx.strokeStyle = isDay ? "rgba(26,26,26,0.85)" : "rgba(245,240,232,0.9)";
        ctx.lineWidth = 1.2;
        ctx.lineCap = "round";
        ctx.stroke();
        const sq = 4.5;
        const pulse = 0.65 + 0.35 * Math.sin(t * 2.5 + i * TAU / ARMS);
        ctx.save();
        ctx.translate(tx, ty);
        ctx.rotate(-rot);
        ctx.shadowColor = "#FFD700";
        ctx.shadowBlur = 6 * pulse;
        ctx.fillStyle = isDay ? "rgba(26,26,26,0.9)" : "#0d1a2e";
        ctx.fillRect(-sq / 2, -sq / 2, sq, sq);
        ctx.shadowBlur = 0;
        const sg = ctx.createLinearGradient(-sq / 2, -sq / 2, sq / 2, sq / 2);
        sg.addColorStop(0, `rgba(255,215,0,${0.55 * pulse})`);
        sg.addColorStop(1, "rgba(255,215,0,0)");
        ctx.fillStyle = sg;
        ctx.fillRect(-sq / 2, -sq / 2, sq, sq);
        ctx.strokeStyle = `rgba(255,210,0,${0.7 + 0.3 * pulse})`;
        ctx.lineWidth = 0.8;
        ctx.strokeRect(-sq / 2, -sq / 2, sq, sq);
        ctx.restore();
      }
      ctx.save();
      ctx.shadowColor = "#FFD700";
      ctx.shadowBlur = 6;
      ctx.fillStyle = "#FFD700";
      ctx.beginPath();
      ctx.arc(cx, cy, 2, 0, TAU);
      ctx.fill();
      ctx.restore();
      ctx.restore();
      t += 0.013;
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [isDay]);

  const toggleTheme = () => {
    const next = !isDay;
    setIsDay(next);
    localStorage.setItem("i707_theme", next ? "light" : "dark");
  };

 

  if (loading || !userData) return (
    <div style={{ background: "#1A1A1A", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", color: "#F5F0E8", fontSize: "14px", letterSpacing: "3px" }}>
      Loading...
    </div>
  );

  const formatStudyTime = (mins) => {
    if (!mins) return "0m";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const battleCards = [
  { color: "#C0392B", type: "1 vs 1", title: "Word Duel", desc: "Challenge a player live", badge: "Live", badgeColor: "#4CAF50", route: "/i707/games/wordmatch" },
  { color: "#FF9800", type: "Speed", title: "Flash Round", desc: "60 sec, most words wins", badge: "Fast", badgeColor: "#FF9800", route: "/i707/games/flashcards" },
  { color: "#2196F3", type: "Team", title: "Squad Quiz", desc: "4 players, one champion", badge: "Team", badgeColor: "#2196F3", route: "/i707/games/wordmatch" },
  { color: "#FFD700", type: "Daily", title: "Challenge", desc: "Today's ranked battle", badge: "Ranked", badgeColor: "#FFD700", route: "/i707/games/leaderboard" },
  { color: "#FF6432", type: "Survival", title: "Last Word", desc: "Wrong answer? You're out", badge: "Hard", badgeColor: "#FF6432", route: "/i707/games/scramble" },
  { color: "#C0392B", type: "1 vs 1", title: "Word Duel", desc: "Challenge a player live", badge: "Live", badgeColor: "#4CAF50", route: "/i707/games/wordmatch" },
  { color: "#FF9800", type: "Speed", title: "Flash Round", desc: "60 sec, most words wins", badge: "Fast", badgeColor: "#FF9800", route: "/i707/games/flashcards" },
  { color: "#2196F3", type: "Team", title: "Squad Quiz", desc: "4 players, one champion", badge: "Team", badgeColor: "#2196F3", route: "/i707/games/wordmatch" },
  { color: "#FFD700", type: "Daily", title: "Challenge", desc: "Today's ranked battle", badge: "Ranked", badgeColor: "#FFD700", route: "/i707/games/leaderboard" },
  { color: "#FF6432", type: "Survival", title: "Last Word", desc: "Wrong answer? You're out", badge: "Hard", badgeColor: "#FF6432", route: "/i707/games/scramble" },
  ];

  return (
    
    <div className={`i707-home ${isDay ? "light" : ""}`}>
      <div className="i707-orb i707-orb--top" />
      <div className="i707-orb i707-orb--bottom" />


    {levelToast && (
    <div className="i707-level-toast">
    <div className="i707-level-toast__inner">
      <div className="i707-level-toast__icon">🎓</div>
      <div className="i707-level-toast__content">
        <span className="i707-level-toast__title">Level Changed!</span>
        <span className="i707-level-toast__sub">
          {levelToast.newLevel === "IELTS_FOUNDATION"
            ? `IELTS Foundation · Lesson ${(levelToast.lessonIndex || 0) + 1}`
            : levelToast.newLevel === "IELTS_GRADUATION"
            ? `IELTS Graduation · Lesson ${(levelToast.lessonIndex || 0) + 1}`
            : `You are now on ${levelToast.newLevel}`}
        </span>
      </div>
      <button className="i707-level-toast__close" onClick={() => setLevelToast(null)}>✕</button>
    </div>
  </div>
      )}











      {/* TOPBAR */}
      <header className="i707-topbar">
        <div className="i707-topbar__left">
          <span className="i707-topbar__greet">{greeting}</span>
          <span className="i707-topbar__name">
            {userData.fullName?.split(" ")[0] || "Scholar"}
          </span>
        </div>
        <div className="i707-topbar__right">
          <div className="i707-coin-pill">
            <div className="i707-coin-pill__dot">C</div>
            <span className="i707-coin-pill__val">{userData.coins || 0}</span>
          </div>
          <button className={`i707-brand-orb ${isDay ? "light-mode" : ""}`} onClick={toggleTheme}>
            <canvas ref={canvasRef} />
          </button>
        </div>
      </header>

      {/* MAIN */}
      <main className="i707-main">

        <section className="i707-hero-card">
  <div className="i707-hero-card__topbar" />
  <div className="i707-hero-card__shimmer" />
  <div className="i707-hero-card__greet-row">
    <div className="i707-hero-card__greet-left">
      <p className="i707-hero-card__tod">{timeOfDay}</p>
      <h2 className="i707-hero-card__greeting">
        {greeting}, <em>{userData.fullName?.split(" ")[0] || "Scholar"}</em>
      </h2>
    </div>
    <div className="i707-hero-card__streak-badge">
      <span>🔥</span>
      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <span className="i707-hero-card__streak-num">{userData.streak || 0}</span>
        <span className="i707-hero-card__streak-lbl">Streak</span>
      </div>
    </div>
  </div>
  <div className="i707-clock">
    <span className="i707-clock__ampm">{ampm}</span>
    <span className="i707-clock__time">{time}</span>
    <span className="i707-clock__date">{date}</span>
  </div>
  <div className="i707-stats-row">
    <div className="i707-stat-box">
      <div className="i707-stat-box__accent" style={{ background: "#C0392B" }} />
      <span className="i707-stat-box__val">{formatStudyTime(userData.totalStudyTime)}</span>
      <span className="i707-stat-box__label">Time Spent</span>
    </div>
    <div className="i707-stat-box">
      <div className="i707-stat-box__accent" style={{ background: "#4CAF50" }} />
      <span className="i707-stat-box__val">{userData.wordsLearned || 0} <small>words</small></span>
      <span className="i707-stat-box__label">Words Learnt</span>
    </div>
    <div className="i707-stat-box">
      <div className="i707-stat-box__accent" style={{ background: "#FFD700" }} />
      <span className="i707-stat-box__val">{userData.coins || 0} <small>🪙</small></span>
      <span className="i707-stat-box__label">Coins</span>
    </div>
  </div>
</section>

        {/* CORE SECTIONS */}
        <div className="i707-section-label">
          <span className="i707-section-label__line" />
          <span className="i707-section-label__text">Core Sections</span>
          <span className="i707-section-label__line" />
        </div>

        <div className="i707-core-grid">
          <div className="i707-core-card" onClick={() => navigate("/i707/grammar")}>
            <div className="i707-core-card__accent" style={{ background: "#C0392B" }} />
            <div className="i707-core-card__icon" style={{ background: "rgba(192,57,43,0.1)", borderColor: "rgba(192,57,43,0.22)" }}>
              <svg viewBox="0 0 20 20" fill="none" stroke="#C0392B" strokeWidth="1.5" strokeLinecap="round">
                <path d="M3 5h14M3 10h9M3 15h12" />
              </svg>
            </div>
            <span className="i707-core-card__title">Grammar</span>
            <span className="i707-core-card__sub">Rules & structure</span>
          </div>

          <div className="i707-core-card" onClick={() => {
            const level = userData?.level || "A1";
            if (level === "IELTS_FOUNDATION" || level === "IELTS_GRADUATION") {
            const lesson = userData?.currentLesson ?? 0;
                navigate(`/i707/vocabulary?lesson=${lesson}`);
            } else {
              navigate("/i707/vocabulary");
            }
          }}>
            <div className="i707-core-card__accent" style={{ background: "#2196F3" }} />
            <div className="i707-core-card__icon" style={{ background: "rgba(33,150,243,0.1)", borderColor: "rgba(33,150,243,0.22)" }}>
              <svg viewBox="0 0 20 20" fill="none" stroke="#2196F3" strokeWidth="1.5" strokeLinecap="round">
                <rect x="3" y="4" width="14" height="13" rx="2" />
                <path d="M7 9h6M7 13h4" />
              </svg>
            </div>
            <span className="i707-core-card__title">Vocabulary</span>
            <span className="i707-core-card__sub">Words & meaning</span>
          </div>

          <div className="i707-core-card" onClick={() => navigate("/i707/writing")}>
            <div className="i707-core-card__accent" style={{ background: "#9C27B0" }} />
            <div className="i707-core-card__icon" style={{ background: "rgba(156,39,176,0.1)", borderColor: "rgba(156,39,176,0.22)" }}>
              <svg viewBox="0 0 20 20" fill="none" stroke="#9C27B0" strokeWidth="1.5" strokeLinecap="round">
                <path d="M4 16l3-3 9-9-3-3-9 9-3 3 3 3z" />
                <path d="M14 4l3 3" />
              </svg>
            </div>
            <span className="i707-core-card__title">Writing</span>
            <span className="i707-core-card__sub">Express yourself</span>
          </div>

          <div className="i707-core-card" onClick={() => navigate("/i707/games")}>
            <div className="i707-core-card__accent" style={{ background: "#FFD700" }} />
            <div className="i707-core-card__icon" style={{ background: "rgba(255,215,0,0.1)", borderColor: "rgba(255,215,0,0.22)" }}>
              <svg viewBox="0 0 20 20" fill="none" stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round">
                <rect x="2" y="6" width="16" height="10" rx="3"/>
                <path d="M6 11h4M8 9v4"/>
                <circle cx="13" cy="10" r="1" fill="#FFD700"/>
                <circle cx="15" cy="12" r="1" fill="#FFD700"/>
              </svg>
            </div>
            <span className="i707-core-card__title">Games</span>
            <span className="i707-core-card__sub">Play & learn</span>
          </div>
        </div>

        {/* BATTLE ARENA */}
        <div className="i707-section-label">
          <span className="i707-section-label__line" />
          <span className="i707-section-label__text">Battle Arena</span>
          <span className="i707-section-label__line" />
        </div>

        <div className="i707-battle-scroll">
          <div className="i707-battle-track">
            {battleCards.map((card, i) => (
              <div className="i707-battle-card" key={i} onClick={() => navigate(card.route)}>
                <div className="i707-battle-card__top" style={{ background: card.color }} />
                <span className="i707-battle-card__type">{card.type}</span>
                <span className="i707-battle-card__title">{card.title}</span>
                <span className="i707-battle-card__desc">{card.desc}</span>
                  <span className="i707-battle-card__badge" style={{
                    color: card.badgeColor,
                    borderColor: `${card.badgeColor}40`,
                    background: `${card.badgeColor}18`
                  }}>{card.badge}</span>
              </div>
            ))}
          </div>
        </div>

        

          {/* SHORTS SECTION */}
<div className="i707-section-label">
  <span className="i707-section-label__line" />
  <span className="i707-section-label__text">English Shorts</span>
  <span className="i707-section-label__line" />
</div>

<div className="i707-shorts-banner" onClick={() => navigate("/i707/shorts")}>
  <div className="i707-shorts-banner__topline" />
  <div className="i707-shorts-banner__shimmer" />
  <div className="i707-shorts-banner__left">
    <span className="i707-shorts-banner__eyebrow">✦ New · Free</span>
    <span className="i707-shorts-banner__title">English Shorts</span>
    <span className="i707-shorts-banner__sub">30-second lessons. Swipe. Learn. Earn coins.</span>
  </div>
  <div className="i707-shorts-banner__icon">▶</div>
</div>









      </main>

      {/* BOTTOM NAV */}
      <nav className="i707-bottom-nav">
        {[
          
          
          { id: "home", label: "Home", icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M1 7.5L8 1l7 6.5V15h-4.5v-4h-5V15H1z"/></svg> },
          { id: "vocab", label: "Vocab", icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><rect x="2" y="2" width="12" height="12" rx="1.5"/><path d="M5 6h6M5 9h4"/></svg> },
          { id: "games", label: "Games", icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M3 13l2.5-2.5L8 13l5-9"/><circle cx="8" cy="4" r="1.5" fill="currentColor"/></svg> },
          { id: "profile", label: "Profile", icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><circle cx="8" cy="5.5" r="3"/><path d="M2 15c0-3 2.7-5 6-5s6 2 6 5"/></svg> },
          ].map(nav => (
          <div key={nav.id} className={`i707-nav-item ${activeNav === nav.id ? "active" : ""}`} onClick={() => {
            setActiveNav(nav.id);
            if (nav.id === "home") navigate("/i707/home");
            if (nav.id === "profile") navigate("/i707/profile");
          
            if (nav.id === "games") navigate("/i707/games");
          
            if (nav.id === "vocab") {
                  const level = userData?.level || "A1";
                if (level === "IELTS_FOUNDATION" || level === "IELTS_GRADUATION") {
                  const lesson = userData?.currentLesson ?? 0;
                  navigate(`/i707/vocabulary?lesson=${lesson}`);
              } else {
                navigate("/i707/vocabulary");
              }
            }
          
          
          
          }}>
            <div className="i707-nav-item__icon">{nav.icon}</div>
            <span className="i707-nav-item__label">{nav.label}</span>
          </div>
        ))}












      </nav>
    </div>
  );






}