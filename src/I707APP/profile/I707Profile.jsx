import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../firebase/firebase";
import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { updateProfile, signOut } from "firebase/auth";
import { useUser } from "../../context/UserContext";
import { VOCABULARY_FOUNDATION } from "../../data/IeltsFoundation/index";
import { VOCABULARY_GRADUATION } from "../../data/IeltsGraduation/index";
import "./I707Profile.css";

const LEVELS = [
  { id: "A1", label: "A1", sub: "Beginner", color: "#4CAF50" },
  { id: "A2", label: "A2", sub: "Elementary", color: "#8BC34A" },
  { id: "B1", label: "B1", sub: "Intermediate", color: "#2196F3" },
  { id: "B2", label: "B2", sub: "Upper Intermediate", color: "#9C27B0" },
  { id: "C1", label: "C1", sub: "Advanced", color: "#FF9800" },
  { id: "C2", label: "C2", sub: "Mastery", color: "#C0392B" },
  { id: "IELTS_FOUNDATION", label: "IELTS Foundation", sub: "A1 → B2 Pathway", color: "#00BCD4" },
  { id: "IELTS_GRADUATION", label: "IELTS Graduation", sub: "C1 → C2 Pathway", color: "#FFD700" },
];

function getLessons(levelId) {
  const words = levelId === "IELTS_FOUNDATION"
    ? (VOCABULARY_FOUNDATION.IELTS_FOUNDATION || [])
    : (VOCABULARY_GRADUATION.IELTS_GRADUATION || []);
  const lessons = [];
  for (let i = 0; i < words.length; i += 10) {
    lessons.push({
      index: Math.floor(i / 10),
      from: i + 1,
      to: Math.min(i + 10, words.length),
      preview: words.slice(i, i + 3).map(w => w.word),
    });
  }
  return lessons;
}

function getLevelColor(level) {
  return LEVELS.find(l => l.id === level)?.color || "#4CAF50";
}
function getLevelSub(level) {
  return LEVELS.find(l => l.id === level)?.sub || "Beginner";
}
function getInitials(name) {
  if (!name) return "S";
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? parts[0][0].toUpperCase() + parts[1][0].toUpperCase()
    : parts[0][0].toUpperCase();
}
function formatStudyTime(mins) {
  if (!mins) return "0m";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function I707Profile() {
  const navigate = useNavigate();
  const { user, userData, loading } = useUser();
  const [editing, setEditing] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingUsername, setSavingUsername] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [isDay, setIsDay] = useState(() => localStorage.getItem("i707_theme") === "light");
  const [activeNav, setActiveNav] = useState("profile");
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [savingLevel, setSavingLevel] = useState(false);
  const [pendingLevel, setPendingLevel] = useState(null);

  useEffect(() => {
    if (!loading && !user) navigate("/i707/login");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (userData?.fullName) setNewName(userData.fullName);
    if (userData?.username) setNewUsername(userData.username);
  }, [userData]);

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

  const levelColor = getLevelColor(userData?.level);

  const handleSaveName = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await updateProfile(user, { displayName: newName.trim() });
      await setDoc(doc(db, "users", user.uid), { ...userData, fullName: newName.trim(), lastActiveDate: new Date().toISOString() });
      setEditing(false);
      setSaveMsg("✓ Name updated");
      setTimeout(() => setSaveMsg(""), 2500);
    } catch (e) {
      setSaveMsg("Failed to update");
      setTimeout(() => setSaveMsg(""), 2500);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveUsername = async () => {
    setUsernameError("");
    const cleanUsername = newUsername.trim().toLowerCase();
    
    if (cleanUsername === userData.username) {
      setEditingUsername(false);
      return;
    }
    
    if (cleanUsername.length < 3 || cleanUsername.length > 20) {
      setUsernameError("3-20 characters required");
      return;
    }
    if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
      setUsernameError("Only lowercase letters, numbers, _");
      return;
    }
    
    setSavingUsername(true);
    try {
      // Check availability
      const usernameRef = doc(db, "usernames", cleanUsername);
      const snap = await getDoc(usernameRef);
      if (snap.exists()) {
        setUsernameError("Username already taken");
        setSavingUsername(false);
        return;
      }
      
      // Delete old username
      if (userData.username) {
        try {
          await deleteDoc(doc(db, "usernames", userData.username));
        } catch (e) {}
      }
      
      // Save new username
      await setDoc(doc(db, "usernames", cleanUsername), {
        uid: user.uid,
        email: userData.email,
      });
      
      // Update user doc
      await setDoc(doc(db, "users", user.uid), {
        ...userData,
        username: cleanUsername,
        lastActiveDate: new Date().toISOString(),
      });
      
      setEditingUsername(false);
      setSaveMsg("✓ Username updated");
      setTimeout(() => setSaveMsg(""), 2500);
    } catch (e) {
      console.error(e);
      setUsernameError("Failed to update");
    } finally {
      setSavingUsername(false);
    }
  };

  const handleLevelChange = async (levelId) => {
    const isIELTS = levelId === "IELTS_FOUNDATION" || levelId === "IELTS_GRADUATION";
    if (isIELTS) {
      setPendingLevel(levelId);
      return;
    }
    setSavingLevel(true);
    try {
      const oldLevel = userData.level;
      await setDoc(doc(db, "users", user.uid), {
        ...userData,
        level: levelId,
        currentLesson: null,
        lastActiveDate: new Date().toISOString(),
      });
      setShowLevelModal(false);
      navigate("/i707/home", { state: { levelChanged: true, oldLevel, newLevel: levelId } });
    } catch (e) { console.log(e); }
    finally { setSavingLevel(false); }
  };

  const handleLessonPick = async (lessonIndex) => {
    if (!pendingLevel) return;
    setSavingLevel(true);
    try {
      await setDoc(doc(db, "users", user.uid), {
        ...userData,
        level: pendingLevel,
        currentLesson: lessonIndex,
        lastActiveDate: new Date().toISOString(),
      });
      setShowLevelModal(false);
      setPendingLevel(null);
      navigate("/i707/home", { state: { levelChanged: true, newLevel: pendingLevel, lessonIndex } });
    } catch (e) { console.log(e); }
    finally { setSavingLevel(false); }
  };

  const toggleTheme = () => {
    const next = !isDay;
    setIsDay(next);
    localStorage.setItem("i707_theme", next ? "light" : "dark");
  };

  const handleSignOut = async () => {
    await signOut(auth);
    localStorage.removeItem("i707_user");
    navigate("/");
  };

  const pendingLevelData = LEVELS.find(l => l.id === pendingLevel);
  const lessons = pendingLevel ? getLessons(pendingLevel) : [];

  return (
    <div className={`i707-profile ${isDay ? "light" : ""}`}>
      <div className="i707-profile-orb i707-profile-orb--top" />
      <div className="i707-profile-orb i707-profile-orb--bottom" />

      <main className="i707-profile-main">

        {/* HERO — CINEMATIC */}
        <div className="i707-profile-hero">
          <div className="i707-profile-hero__topbar" />
          <div className="i707-profile-hero__shimmer" />
          <div className="i707-profile-hero__dots" />
          <div className="i707-profile-hero__glow" style={{ background: `radial-gradient(ellipse 70% 40% at 50% 0%, ${levelColor}25, transparent 70%)` }} />

          <button className="i707-profile-back" onClick={() => navigate("/i707/home")}>← Home</button>

          <div className="i707-profile-medallion">
            <div className="i707-profile-medallion__ring1" style={{ borderColor: `${levelColor}30` }} />
            <div className="i707-profile-medallion__ring2" style={{ borderColor: `${levelColor}20` }} />
            <div className="i707-profile-medallion__ring3" style={{ borderColor: `${levelColor}12` }} />
            <div className="i707-profile-avatar" style={{ boxShadow: `0 0 0 2.5px ${levelColor}60, 0 0 30px ${levelColor}30` }}>
              <span className="i707-profile-avatar__initials">{getInitials(userData.fullName)}</span>
            </div>
            <div className="i707-profile-avatar__level" style={{ background: levelColor }}>
              {userData.level === "IELTS_FOUNDATION" ? "IF" : userData.level === "IELTS_GRADUATION" ? "IG" : userData.level || "A1"}
            </div>
          </div>

          {/* NAME */}
          {!editing ? (
            <div className="i707-profile-name-row">
              <h1 className="i707-profile-name">{userData.fullName || "Scholar"}</h1>
              <button className="i707-profile-edit-btn" onClick={() => setEditing(true)}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M11 2l3 3-8 8H3v-3l8-8z"/></svg>
              </button>
            </div>
          ) : (
            <div className="i707-profile-edit-row">
              <input className="i707-profile-name-input" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Your full name" autoFocus />
              <div className="i707-profile-edit-actions">
                <button className="i707-profile-save-btn" onClick={handleSaveName} disabled={saving}>{saving ? "..." : "✓"}</button>
                <button className="i707-profile-cancel-btn" onClick={() => setEditing(false)}>✕</button>
              </div>
            </div>
          )}

          {/* USERNAME */}
          {!editingUsername ? (
            <div className="i707-profile-username-row">
              <span className="i707-profile-username">@{userData.username || "no_username"}</span>
              <button className="i707-profile-username-edit" onClick={() => { setEditingUsername(true); setNewUsername(userData.username || ""); setUsernameError(""); }}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M11 2l3 3-8 8H3v-3l8-8z"/></svg>
              </button>
            </div>
          ) : (
            <div className="i707-profile-username-edit-row">
              <div className="i707-profile-username-input-wrap">
                <span className="i707-profile-username-at">@</span>
                <input
                  className="i707-profile-username-input"
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
                  placeholder="username"
                  maxLength={20}
                  autoFocus
                />
              </div>
              <div className="i707-profile-edit-actions">
                <button className="i707-profile-save-btn" onClick={handleSaveUsername} disabled={savingUsername}>{savingUsername ? "..." : "✓"}</button>
                <button className="i707-profile-cancel-btn" onClick={() => { setEditingUsername(false); setUsernameError(""); }}>✕</button>
              </div>
            </div>
          )}
          {usernameError && <p className="i707-profile-username-error">⚠ {usernameError}</p>}
          {saveMsg && <p className="i707-profile-save-msg">{saveMsg}</p>}

          <p className="i707-profile-email">{userData.email}</p>

          <div className="i707-profile-hero-badges">
            <div className="i707-profile-hero-badge">
              <span className="i707-profile-hero-badge__val" style={{ color: "#FFD700" }}>{userData.coins || 0}</span>
              <span className="i707-profile-hero-badge__label">Coins</span>
            </div>
            <div className="i707-profile-hero-badge__divider" />
            <div className="i707-profile-hero-badge">
              <span className="i707-profile-hero-badge__val" style={{ color: levelColor }}>
                {userData.level === "IELTS_FOUNDATION" ? "IF" : userData.level === "IELTS_GRADUATION" ? "IG" : userData.level || "A1"}
              </span>
              <span className="i707-profile-hero-badge__label">Level</span>
            </div>
            <div className="i707-profile-hero-badge__divider" />
            <div className="i707-profile-hero-badge">
              <span className="i707-profile-hero-badge__val" style={{ color: "#C0392B" }}>{userData.streak || 0}</span>
              <span className="i707-profile-hero-badge__label">Streak</span>
            </div>
          </div>

          <div className="i707-profile-seal">
            <div className="i707-profile-seal__line" />
            <span className="i707-profile-seal__text">I707 · {getLevelSub(userData.level)}</span>
            <div className="i707-profile-seal__line" />
          </div>
        </div>

        {/* STATS */}
        <div className="i707-profile-section-label">
          <span className="i707-profile-section-line" />
          <span className="i707-profile-section-text">Your Progress</span>
          <span className="i707-profile-section-line" />
        </div>
        <div className="i707-profile-stats-grid">
          {[
            { label: "Words Learned", val: userData.wordsLearned || 0, accent: "#4CAF50", icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><rect x="2" y="3" width="12" height="10" rx="1.5"/><path d="M5 7h6M5 10h4"/></svg> },
            { label: "Day Streak", val: `${userData.streak || 0}`, unit: "days", accent: "#FFD700", icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M8 2c0 3-3 4-3 7a3 3 0 006 0c0-3-3-4-3-7z"/></svg> },
            { label: "Days Active", val: userData.daysWorked || 0, unit: "days", accent: "#2196F3", icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><rect x="2" y="3" width="12" height="11" rx="1.5"/><path d="M5 2v2M11 2v2M2 7h12"/></svg> },
            { label: "Study Time", val: formatStudyTime(userData.totalStudyTime), accent: "#C0392B", icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg> },
          ].map((s, i) => (
            <div className="i707-profile-stat-card" key={i}>
              <div className="i707-profile-stat-card__accent" style={{ background: s.accent }} />
              <div className="i707-profile-stat-card__icon" style={{ color: s.accent }}>{s.icon}</div>
              <span className="i707-profile-stat-card__val">{s.val}{s.unit && <small> {s.unit}</small>}</span>
              <span className="i707-profile-stat-card__label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* SETTINGS */}
        <div className="i707-profile-section-label">
          <span className="i707-profile-section-line" />
          <span className="i707-profile-section-text">Settings</span>
          <span className="i707-profile-section-line" />
        </div>
        <div className="i707-profile-settings">
          <div className="i707-profile-setting-row" onClick={toggleTheme}>
            <div className="i707-profile-setting-left">
              <div className="i707-profile-setting-icon" style={{ background: "rgba(255,215,0,0.08)", borderColor: "rgba(255,215,0,0.18)" }}>
                <svg viewBox="0 0 20 20" fill="none" stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round">
                  {isDay ? <><circle cx="10" cy="10" r="4"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.93 4.93l1.41 1.41M13.66 13.66l1.41 1.41M4.93 15.07l1.41-1.41M13.66 6.34l1.41-1.41"/></> : <path d="M17 12a7 7 0 11-9-9 5.5 5.5 0 009 9z"/>}
                </svg>
              </div>
              <div>
                <p className="i707-profile-setting-title">{isDay ? "Light Mode" : "Dark Mode"}</p>
                <p className="i707-profile-setting-sub">Tap to switch theme</p>
              </div>
            </div>
            <div className={`i707-profile-toggle ${isDay ? "on" : ""}`}>
              <div className="i707-profile-toggle__thumb" />
            </div>
          </div>
          <div className="i707-profile-setting-row" onClick={() => setShowLevelModal(true)}>
            <div className="i707-profile-setting-left">
              <div className="i707-profile-setting-icon" style={{ background: `${levelColor}12`, borderColor: `${levelColor}25` }}>
                <svg viewBox="0 0 20 20" fill="none" stroke={levelColor} strokeWidth="1.5" strokeLinecap="round">
                  <path d="M10 2l2.4 4.8 5.3.8-3.85 3.75.91 5.3L10 14.27l-4.76 2.38.91-5.3L2.3 7.6l5.3-.8z"/>
                </svg>
              </div>
              <div>
                <p className="i707-profile-setting-title">Current Level</p>
                <p className="i707-profile-setting-sub">{getLevelSub(userData.level)}</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="i707-profile-level-badge" style={{ background: `${levelColor}12`, color: levelColor, borderColor: `${levelColor}25` }}>
                {userData.level === "IELTS_FOUNDATION" ? "Foundation" : userData.level === "IELTS_GRADUATION" ? "Graduation" : userData.level || "A1"}
              </span>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" style={{ width: 14, height: 14, color: "var(--muted)" }}>
                <path d="M6 4l4 4-4 4"/>
              </svg>
            </div>
          </div>
          <div className="i707-profile-setting-row">
            <div className="i707-profile-setting-left">
              <div className="i707-profile-setting-icon" style={{ background: "rgba(192,57,43,0.08)", borderColor: "rgba(192,57,43,0.18)" }}>
                <svg viewBox="0 0 20 20" fill="none" stroke="#C0392B" strokeWidth="1.5" strokeLinecap="round">
                  <rect x="2" y="5" width="16" height="12" rx="2"/>
                  <path d="M2 7l8 5 8-5"/>
                </svg>
              </div>
              <div>
                <p className="i707-profile-setting-title">Email Address</p>
                <p className="i707-profile-setting-sub">{userData.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* SIGN OUT */}
        <div className="i707-profile-signout-wrap">
          <div className="i707-profile-signout-divider">
            <div className="i707-profile-signout-line" />
            <div className="i707-profile-signout-diamond" />
            <div className="i707-profile-signout-line" />
          </div>
          <button className="i707-profile-signout-btn" onClick={handleSignOut}>Sign Out</button>
          <p className="i707-profile-signout-sub">I707 · Sanctum of Knowledge</p>
        </div>

      </main>

      {/* LEVEL MODAL — same as before */}
      {showLevelModal && (
        <div className="i707-profile-modal-overlay" onClick={() => { setShowLevelModal(false); setPendingLevel(null); }}>
          <div className="i707-profile-modal" onClick={e => e.stopPropagation()}>
            <div className="i707-profile-modal__topbar" />
            <div className="i707-profile-modal__shimmer" />
            <button className="i707-profile-modal__close" onClick={() => { setShowLevelModal(false); setPendingLevel(null); }}>✕</button>

            {pendingLevel ? (
              <>
                <button className="i707-profile-modal__back-btn" onClick={() => setPendingLevel(null)}>← Back</button>
                <span className="i707-profile-modal__eyebrow">{pendingLevelData?.label}</span>
                <h2 className="i707-profile-modal__title">Choose <em>Your Lesson</em></h2>
                <div className="i707-profile-modal__divider">
                  <div className="i707-profile-modal__divider-line" />
                  <div className="i707-profile-modal__divider-diamond" style={{ background: pendingLevelData?.color }} />
                  <div className="i707-profile-modal__divider-line" />
                </div>
                <div className="i707-profile-modal__lessons">
                  {lessons.map((lesson, i) => (
                    <div key={i} className="i707-profile-modal__lesson-item"
                      style={{
                        borderColor: userData.currentLesson === lesson.index && userData.level === pendingLevel ? `${pendingLevelData?.color}50` : undefined,
                        background: userData.currentLesson === lesson.index && userData.level === pendingLevel ? `${pendingLevelData?.color}10` : undefined
                      }}
                      onClick={() => handleLessonPick(lesson.index)}>
                      <div className="i707-profile-modal__lesson-num"
                        style={{ color: pendingLevelData?.color, borderColor: `${pendingLevelData?.color}35`, background: `${pendingLevelData?.color}10` }}>
                        {lesson.index + 1}
                      </div>
                      <div className="i707-profile-modal__lesson-info">
                        <p className="i707-profile-modal__lesson-name">Lesson {lesson.index + 1}</p>
                        <p className="i707-profile-modal__lesson-range">Words {lesson.from} — {lesson.to}</p>
                        <p className="i707-profile-modal__lesson-preview">{lesson.preview.join(" · ")}</p>
                      </div>
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" style={{ width: 14, height: 14, color: "var(--muted)", flexShrink: 0 }}>
                        <path d="M6 4l4 4-4 4"/>
                      </svg>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <span className="i707-profile-modal__eyebrow">Select Your Level</span>
                <h2 className="i707-profile-modal__title">Choose <em>Your Path</em></h2>
                <div className="i707-profile-modal__divider">
                  <div className="i707-profile-modal__divider-line" />
                  <div className="i707-profile-modal__divider-diamond" />
                  <div className="i707-profile-modal__divider-line" />
                </div>
                <div className="i707-profile-modal__section-label">Standard Levels</div>
                <div className="i707-profile-modal__levels">
                  {LEVELS.slice(0, 6).map(level => (
                    <div key={level.id}
                      className={`i707-profile-modal__level-item ${userData.level === level.id ? "active" : ""}`}
                      style={userData.level === level.id ? { borderColor: level.color, background: `${level.color}10` } : {}}
                      onClick={() => handleLevelChange(level.id)}>
                      <div className="i707-profile-modal__level-left">
                        <div className="i707-profile-modal__level-badge" style={{ background: `${level.color}18`, color: level.color, borderColor: `${level.color}30` }}>{level.label}</div>
                        <div>
                          <p className="i707-profile-modal__level-name">{level.label}</p>
                          <p className="i707-profile-modal__level-sub">{level.sub}</p>
                        </div>
                      </div>
                      {userData.level === level.id && (
                        <svg viewBox="0 0 16 16" fill="none" stroke={level.color} strokeWidth="2" strokeLinecap="round" style={{ width: 16, height: 16 }}><path d="M3 8l3.5 3.5L13 4"/></svg>
                      )}
                    </div>
                  ))}
                </div>
                <div className="i707-profile-modal__section-label" style={{ marginTop: 16 }}>IELTS Pathways</div>
                <div className="i707-profile-modal__levels">
                  {LEVELS.slice(6).map(level => (
                    <div key={level.id}
                      className={`i707-profile-modal__level-item i707-profile-modal__level-item--ielts ${userData.level === level.id ? "active" : ""}`}
                      style={userData.level === level.id ? { borderColor: level.color, background: `${level.color}10` } : {}}
                      onClick={() => handleLevelChange(level.id)}>
                      <div className="i707-profile-modal__level-left">
                        <div className="i707-profile-modal__level-badge" style={{ background: `${level.color}18`, color: level.color, borderColor: `${level.color}30` }}>
                          {level.id === "IELTS_FOUNDATION" ? "IF" : "IG"}
                        </div>
                        <div>
                          <p className="i707-profile-modal__level-name">{level.label}</p>
                          <p className="i707-profile-modal__level-sub">{level.sub} · Tap to select lesson →</p>
                        </div>
                      </div>
                      {userData.level === level.id && (
                        <svg viewBox="0 0 16 16" fill="none" stroke={level.color} strokeWidth="2" strokeLinecap="round" style={{ width: 16, height: 16 }}><path d="M3 8l3.5 3.5L13 4"/></svg>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* BOTTOM NAV */}
      <nav className="i707-profile-bottom-nav">
        {[
          { id: "home", label: "Home", icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M1 7.5L8 1l7 6.5V15h-4.5v-4h-5V15H1z"/></svg> },
          { id: "vocab", label: "Vocab", icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><rect x="2" y="2" width="12" height="12" rx="1.5"/><path d="M5 6h6M5 9h4"/></svg> },
          { id: "games", label: "Games", icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M3 13l2.5-2.5L8 13l5-9"/><circle cx="8" cy="4" r="1.5" fill="currentColor"/></svg> },
          { id: "profile", label: "Profile", icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><circle cx="8" cy="5.5" r="3"/><path d="M2 15c0-3 2.7-5 6-5s6 2 6 5"/></svg> },
        ].map(nav => (
          <div key={nav.id}
            className={`i707-profile-nav-item ${activeNav === nav.id ? "active" : ""}`}
            onClick={() => {
              setActiveNav(nav.id);
              if (nav.id === "home") navigate("/i707/home");
              if (nav.id === "vocab") {
                const level = userData?.level || "A1";
                if (level === "IELTS_FOUNDATION" || level === "IELTS_GRADUATION") {
                  const lesson = userData?.currentLesson ?? 0;
                  navigate(`/i707/vocabulary?lesson=${lesson}`);
                } else {
                  navigate("/i707/vocabulary");
                }
              }
              if (nav.id === "games") navigate("/i707/games");
            }}>
            <div className="i707-profile-nav-item__icon">{nav.icon}</div>
            <span className="i707-profile-nav-item__label">{nav.label}</span>
          </div>
        ))}
      </nav>
    </div>
  );
}