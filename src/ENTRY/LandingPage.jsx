import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import "./LandingPage.css";

export default function LandingPage() {
  const navigate = useNavigate();
  const universeRef = useRef(null);

  const handleI707Click = () => {
    const user = localStorage.getItem("i707_user");
    if (user) navigate("/i707/home");
    else navigate("/i707/login");
  };

  const handleKenzoClick = () => {
    const user = localStorage.getItem("kenzo_user");
    if (user) navigate("/m24kenzo/home");
    else navigate("/m24kenzo/login");
  };

  // Mouse parallax effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!universeRef.current) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      universeRef.current.style.setProperty("--mx", `${x}px`);
      universeRef.current.style.setProperty("--my", `${y}px`);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="landing-universe" ref={universeRef}>
      {/* AMBIENT LAYERS */}
      <div className="landing-bg-grad" />
      <div className="landing-stars">
        {[...Array(60)].map((_, i) => (
          <div key={i} className="landing-star" style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 8}s`,
            animationDuration: `${3 + Math.random() * 5}s`,
            opacity: Math.random() * 0.8 + 0.2,
          }} />
        ))}
      </div>
      <div className="landing-orb landing-orb--gold" />
      <div className="landing-orb landing-orb--emerald" />
      <div className="landing-orb landing-orb--violet" />

      {/* HEADER */}
      <header className="landing-header">
        <div className="landing-header__line" />
        <span className="landing-header__eyebrow">✦ Sanctum Of Excellence ✦</span>
        <h1 className="landing-header__title">Choose <em>Your Realm</em></h1>
        <p className="landing-header__sub">Two paths await — one of scholarship, one of legend.</p>
        <div className="landing-header__line" />
      </header>

      {/* CARDS */}
      <div className="landing-cards-row">

        {/* I707 CARD */}
        <div className="card c1" onClick={handleI707Click}>
          <div className="card-glow card-glow--gold" />
          <div className="card-inner">
            <div className="c1-bg" />
            <div className="c1-rays" />
            <div className="c1-vlines">
              <div className="c1-stripe" style={{ left: "20%" }} />
              <div className="c1-stripe" style={{ left: "40%" }} />
              <div className="c1-stripe" style={{ left: "60%" }} />
              <div className="c1-stripe" style={{ left: "80%" }} />
            </div>
            <div className="c1-shimmer" />
            <div className="c1-hband" />

            {/* CORNER ACCENTS */}
            <div className="cb tl c1-cb" /><div className="cb tr c1-cb" />
            <div className="cb bl c1-cb" /><div className="cb br c1-cb" />

            {/* TOP ANIMATED LINE */}
            <div className="c1-topline" />

            {/* MEDALLION */}
            <div className="c1-medallion">
              <div className="c1-medallion__halo" />
              <div className="c1-ring1" />
              <div className="c1-ring2" />
              <div className="c1-ring3" />
              <div className="c1-monogram">I<br />VII</div>
            </div>

            <div className="c1-rule">
              <div className="c1-rl" />
              <div className="c1-diamond" />
              <div className="c1-rr" />
            </div>

            <div className="c1-title-area">
              <span className="c1-eyebrow">Premier Institution</span>
              <span className="c1-name">I707</span>
              <span className="c1-tagline">Sanctum of Knowledge</span>
            </div>

            <div className="c1-sep" />
            <div className="c1-sep-dot">
              <div className="c1-dot" /><div className="c1-dot" /><div className="c1-dot" />
            </div>

            <div className="c1-content">
              <span className="c1-subject">Academy of Excellence</span>
              <p className="c1-desc">A sanctuary devoted to the art of scholarship — where distinguished minds are shaped, wisdom is cultivated, and legacies of intellectual mastery are forged.</p>
            </div>

            <div className="c1-pillars">
              <div className="c1-pillar"><span className="c1-pv">ARTS</span><span className="c1-pl">Faculty</span></div>
              <div className="c1-pillar"><span className="c1-pv">SCIENCE</span><span className="c1-pl">Faculty</span></div>
              <div className="c1-pillar"><span className="c1-pv">LAW</span><span className="c1-pl">Faculty</span></div>
            </div>

            <div className="c1-seal">
              <span>Education · Wisdom · Legacy</span>
            </div>

            <div className="c1-enter">
              <span className="c1-enter__text">Enter the Sanctum</span>
              <span className="c1-enter__arrow">→</span>
            </div>
          </div>
        </div>

        {/* M24KENZO CARD */}
        <div className="card c2" onClick={handleKenzoClick}>
          <div className="card-glow card-glow--emerald" />
          <div className="card-inner">
            <div className="c2-grid" />
            <div className="c2-aurora" />
            <div className="c2-scan" />
            <div className="c2-pulse" />
            <div className="c2-shimmer" />

            <div className="cb tl c2-cb" /><div className="cb tr c2-cb" />
            <div className="cb bl c2-cb" /><div className="cb br c2-cb" />

            <div className="c2-topline" />

            <div className="c2-hud">
              <svg className="c2-hud-svg" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
                <circle cx="48" cy="48" r="44" fill="none" stroke="rgba(0,255,100,.15)" strokeWidth="1" className="c2-hud-spin"/>
                <circle cx="48" cy="48" r="35" fill="none" stroke="rgba(200,160,40,.12)" strokeWidth="1"/>
                <circle cx="48" cy="48" r="24" fill="none" stroke="rgba(0,255,100,.1)" strokeWidth=".8"/>
                <path d="M28 48 L40 33 L48 41 L56 33 L68 48 L56 63 L48 55 L40 63 Z" fill="none" stroke="rgba(0,255,100,.7)" strokeWidth="1.2" strokeLinejoin="round"/>
                <circle cx="48" cy="48" r="4" fill="#00e870" opacity=".9"/>
                <line x1="48" y1="4" x2="48" y2="14" stroke="rgba(0,255,100,.3)" strokeWidth="1"/>
                <line x1="48" y1="82" x2="48" y2="92" stroke="rgba(0,255,100,.3)" strokeWidth="1"/>
                <line x1="4" y1="48" x2="14" y2="48" stroke="rgba(0,255,100,.3)" strokeWidth="1"/>
                <line x1="82" y1="48" x2="92" y2="48" stroke="rgba(0,255,100,.3)" strokeWidth="1"/>
                <circle cx="48" cy="4" r="2" fill="rgba(0,255,100,.4)"/>
                <circle cx="48" cy="92" r="2" fill="rgba(0,255,100,.4)"/>
                <circle cx="4" cy="48" r="2" fill="rgba(0,255,100,.4)"/>
                <circle cx="92" cy="48" r="2" fill="rgba(0,255,100,.4)"/>
                <path d="M18 18 L30 18 L18 30 Z" fill="rgba(200,160,40,.22)"/>
                <path d="M78 18 L66 18 L78 30 Z" fill="rgba(200,160,40,.22)"/>
              </svg>
            </div>

            <div className="c2-sysbar">
              <span className="c2-sb">M24</span><div className="c2-sb-sep" />
              <span className="c2-sb">KENZO</span><div className="c2-sb-sep" />
              <span className="c2-sb">SYS.ONLINE</span><div className="c2-sb-sep" />
              <span className="c2-sb">V4.0</span>
            </div>

            <div className="c2-title-area">
              <span className="c2-eyebrow">Gaming Universe</span>
              <span className="c2-name">M24KENZO</span>
              <span className="c2-tagline">Enter the Arena</span>
            </div>

            <div className="c2-sep" />

            <div className="c2-body">
              <span className="c2-subject">The Arena</span>
              <p className="c2-desc">Elite gaming sanctuary for champions who transcend ordinary play. Where skill, strategy, and digital legacy converge in the ultimate combat theatre.</p>
            </div>

            <div className="c2-stats">
              <div className="c2-stat"><span className="c2-sv">M24</span><span className="c2-sl">Division</span></div>
              <div className="c2-stat"><span className="c2-sv">∞</span><span className="c2-sl">Levels</span></div>
              <div className="c2-stat"><span className="c2-sv">S+</span><span className="c2-sl">Rank</span></div>
            </div>

            <div className="c2-badge">
              <span>Enter the Arena</span>
            </div>
          </div>
        </div>

      </div>

      {/* FOOTER */}
      <div className="footer-wm">
        <div className="footer-wm__line" />
        <span>I707 · M24KENZO · Luxury Collection</span>
        <div className="footer-wm__line" />
      </div>
    </div>
  );
}