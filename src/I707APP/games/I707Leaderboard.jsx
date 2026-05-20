import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import "./I707Leaderboard.css";

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
  return level || "A1";
}

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? parts[0][0].toUpperCase() + parts[1][0].toUpperCase()
    : parts[0][0].toUpperCase();
}

const RANK_ICONS = ["🥇", "🥈", "🥉"];

export default function I707Leaderboard() {
  const navigate = useNavigate();
  const { user, userData, loading } = useUser();
  const [isDay, setIsDay] = useState(() => localStorage.getItem("i707_theme") === "light");
  const [players, setPlayers] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [activeNav, setActiveNav] = useState("games");
  const [tab, setTab] = useState("coins"); // coins | words | streak

  useEffect(() => {
    const handler = () => setIsDay(localStorage.getItem("i707_theme") === "light");
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);
  
  useEffect(() => {
    if (!loading && !user) navigate("/i707/login");
  }, [user, loading]);

  useEffect(() => {
    fetchLeaderboard();
  }, [tab]);



  
  useEffect(() => {
  if (!loading && user) fetchLeaderboard();
  }, [tab, user, loading]);
  
  
  
  
  
  const fetchLeaderboard = async () => {
  setFetching(true);
    try {
      const field = tab === "coins" ? "coins" : tab === "words" ? "wordsLearned" : "streak";
      const q = query(
        collection(db, "users"),
        orderBy(field, "desc"),
        limit(20)
      );
      const snap = await getDocs(q);
      const sorted = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPlayers(sorted);
    } catch (e) {
    console.log("Firestore error:", e);
    } finally {
      setFetching(false);
    }
  };

  if (loading || !userData) return (
    <div style={{ background: "#1A1A1A", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", color: "#F5F0E8", fontSize: "14px", letterSpacing: "3px" }}>
      Loading...
    </div>
  );

  const myRank = players.findIndex(p => p.id === user?.uid) + 1;
  const myData = players.find(p => p.id === user?.uid);

  return (
    <div className={`i707-lb ${isDay ? "light" : ""}`}>
      <div className="i707-lb-accent" />
      <div className="i707-lb-orb i707-lb-orb--a" />
      <div className="i707-lb-orb i707-lb-orb--b" />


      {/* TOPBAR */}
      <header className="i707-lb-topbar">
        <button className="i707-lb-back" onClick={() => navigate("/i707/games")}>← Games</button>
        <span className="i707-lb-title">Leaderboard</span>
        <div className="i707-lb-trophy">🏆</div>
      </header>

      <main className="i707-lb-main">

        {/* HERO */}
        <div className="i707-lb-hero">
          <div className="i707-lb-hero__topline" />
          <div className="i707-lb-hero__shimmer" />
          <div className="i707-lb-hero__dots" />
          <div className="i707-lb-hero__content">
            <span className="i707-lb-hero__eyebrow">Global Rankings · I707</span>
            <h1 className="i707-lb-hero__title">Top<br /><em>Scholars</em></h1>
            <p className="i707-lb-hero__sub">Compete with learners worldwide. Rise through the ranks.</p>
          </div>

          {/* MY RANK */}
          {myRank > 0 && (
            <div className="i707-lb-myrank">
              <div className="i707-lb-myrank__left">
                <span className="i707-lb-myrank__pos">#{myRank}</span>
                <span className="i707-lb-myrank__label">Your Rank</span>
              </div>
              <div className="i707-lb-myrank__divider" />
              <div className="i707-lb-myrank__right">
                <span className="i707-lb-myrank__val">
                  {tab === "coins" ? userData.coins || 0 :
                   tab === "words" ? userData.wordsLearned || 0 :
                   userData.streak || 0}
                </span>
                <span className="i707-lb-myrank__label">
                  {tab === "coins" ? "Coins" : tab === "words" ? "Words" : "Day Streak"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* TABS */}
        <div className="i707-lb-tabs">
          {[
            { id: "coins", label: "🪙 Coins" },
            { id: "words", label: "📚 Words" },
            { id: "streak", label: "🔥 Streak" },
          ].map(t => (
            <button key={t.id}
              className={`i707-lb-tab ${tab === t.id ? "active" : ""}`}
              onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* TOP 3 PODIUM */}
        {!fetching && players.length >= 1 && (
          <div className="i707-lb-podium">
            {/* 2nd */}
            <div className="i707-lb-podium__item i707-lb-podium__item--2">
              <div className="i707-lb-podium__rank">🥈</div>
              <div className="i707-lb-podium__avatar"
                style={{ borderColor: "#C0C0C0", boxShadow: "0 0 16px rgba(192,192,192,0.2)" }}>
                <span>{getInitials(players[1]?.fullName)}</span>
              </div>
              <span className="i707-lb-podium__name">
                {players[1]?.username ? `@${players[1].username}` : players[1]?.fullName?.split(" ")[0] || "—"}
              </span>
              <span className="i707-lb-podium__level" style={{ color: getLevelColor(players[1]?.level) }}>
                {getLevelShort(players[1]?.level)}
              </span>
              <span className="i707-lb-podium__val">
                {tab === "coins" ? players[1]?.coins || 0 :
                 tab === "words" ? players[1]?.wordsLearned || 0 :
                 players[1]?.streak || 0}
              </span>
              <div className="i707-lb-podium__bar i707-lb-podium__bar--2" />
            </div>

            {/* 1st */}
            <div className="i707-lb-podium__item i707-lb-podium__item--1">
              <div className="i707-lb-podium__rank">🥇</div>
              <div className="i707-lb-podium__avatar i707-lb-podium__avatar--1"
                style={{ borderColor: "#FFD700", boxShadow: "0 0 24px rgba(255,215,0,0.35)" }}>
                <span>{getInitials(players[0]?.fullName)}</span>
              </div>
              <span className="i707-lb-podium__name">{players[0]?.fullName?.split(" ")[0] || "—"}</span>
              <span className="i707-lb-podium__level" style={{ color: getLevelColor(players[0]?.level) }}>
                {getLevelShort(players[0]?.level)}
              </span>
              <span className="i707-lb-podium__val i707-lb-podium__val--1">
                {tab === "coins" ? players[0]?.coins || 0 :
                 tab === "words" ? players[0]?.wordsLearned || 0 :
                 players[0]?.streak || 0}
              </span>
              <div className="i707-lb-podium__bar i707-lb-podium__bar--1" />
            </div>

            {/* 3rd */}
            <div className="i707-lb-podium__item i707-lb-podium__item--3">
              <div className="i707-lb-podium__rank">🥉</div>
              <div className="i707-lb-podium__avatar"
                style={{ borderColor: "#CD7F32", boxShadow: "0 0 14px rgba(205,127,50,0.2)" }}>
                <span>{getInitials(players[2]?.fullName)}</span>
              </div>
              <span className="i707-lb-podium__name">{players[2]?.fullName?.split(" ")[0] || "—"}</span>
              <span className="i707-lb-podium__level" style={{ color: getLevelColor(players[2]?.level) }}>
                {getLevelShort(players[2]?.level)}
              </span>
              <span className="i707-lb-podium__val">
                {tab === "coins" ? players[2]?.coins || 0 :
                 tab === "words" ? players[2]?.wordsLearned || 0 :
                 players[2]?.streak || 0}
              </span>
              <div className="i707-lb-podium__bar i707-lb-podium__bar--3" />
            </div>
          </div>
        )}





        {!fetching && players.length > 0 && (
          <div className="i707-lb-section-label">
            <span className="i707-lb-section-label__line" />
            <span className="i707-lb-section-label__text">Rankings</span>
            <span className="i707-lb-section-label__line" />
          </div>
        )}

        {/* LIST */}
        {fetching ? (
          <div className="i707-lb-loading">
            <div className="i707-lb-loading__dot" />
            <div className="i707-lb-loading__dot" style={{ animationDelay: "0.2s" }} />
            <div className="i707-lb-loading__dot" style={{ animationDelay: "0.4s" }} />
          </div>
        ) : (
          <div className="i707-lb-list">
            {players.slice(0).map((player, i) => {
              const rank = i + 1;
              const isMe = player.id === user?.uid;
              const levelColor = getLevelColor(player.level);
              return (
                <div key={player.id}
                  className={`i707-lb-row ${isMe ? "me" : ""}`}
                  style={isMe ? { borderColor: "rgba(192,57,43,0.3)", background: "rgba(192,57,43,0.05)" } : {}}>
                  <span className="i707-lb-row__rank" style={{ color: isMe ? "#C0392B" : "var(--muted)" }}>
                    #{rank}
                  </span>
                  <div className="i707-lb-row__avatar" style={{ borderColor: `${levelColor}40` }}>
                    <span style={{ color: levelColor }}>{getInitials(player.fullName)}</span>
                  </div>
                  <div className="i707-lb-row__info">
                    <span className="i707-lb-row__name">
                          {player.fullName?.split(" ")[0] || "Scholar"}
                          {player.username && <span style={{ color: "#FFD700", fontSize: "11px", fontStyle: "italic", marginLeft: 6, letterSpacing: "0.5px" }}>@{player.username}</span>}
                          {isMe && <span className="i707-lb-row__you"> · You</span>}
                      </span>
                    <span className="i707-lb-row__level" style={{ color: levelColor }}>
                      {getLevelShort(player.level)}
                    </span>
                  </div>
                  <span className="i707-lb-row__val">
                    {tab === "coins" ? `${player.coins || 0} 🪙` :
                     tab === "words" ? `${player.wordsLearned || 0} 📚` :
                     `${player.streak || 0} 🔥`}
                  </span>
                </div>
              );
            })}

            {players.length === 0 && (
              <div className="i707-lb-empty">
                <p className="i707-lb-empty__title">No players yet</p>
                <p className="i707-lb-empty__sub">Be the first to make the board.</p>
              </div>
            )}
          </div>
        )}

        <div style={{ height: 24 }} />
      </main>

      {/* BOTTOM NAV */}
      <nav className="i707-lb-nav">
        {[
          { id: "home", label: "Home", icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M1 7.5L8 1l7 6.5V15h-4.5v-4h-5V15H1z"/></svg> },
          { id: "vocab", label: "Vocab", icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><rect x="2" y="2" width="12" height="12" rx="1.5"/><path d="M5 6h6M5 9h4"/></svg> },
          { id: "games", label: "Games", icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M3 13l2.5-2.5L8 13l5-9"/><circle cx="8" cy="4" r="1.5" fill="currentColor"/></svg> },
          { id: "profile", label: "Profile", icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><circle cx="8" cy="5.5" r="3"/><path d="M2 15c0-3 2.7-5 6-5s6 2 6 5"/></svg> },
        ].map(nav => (
          <div key={nav.id}
            className={`i707-lb-nav__item ${activeNav === nav.id ? "active" : ""}`}
            onClick={() => {
              setActiveNav(nav.id);
              if (nav.id === "home") navigate("/i707/home");
              if (nav.id === "vocab") navigate("/i707/vocabulary");
              if (nav.id === "games") navigate("/i707/games");
              if (nav.id === "profile") navigate("/i707/profile");
            }}>
            <div className="i707-lb-nav__icon">{nav.icon}</div>
            <span className="i707-lb-nav__label">{nav.label}</span>
          </div>
        ))}
      </nav>
    </div>
  );
}