import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { 
  collection, doc, updateDoc, arrayUnion, arrayRemove, 
  addDoc, serverTimestamp, onSnapshot, query, orderBy, 
  increment, getDoc, setDoc 
} from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { SHORTS_DATA } from "../../data/Shorts/shortsData";
import "./I707Shorts.css";

function timeAgo(timestamp) {
  if (!timestamp) return "now";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w`;
  return `${Math.floor(days / 30)}mo`;
}

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? parts[0][0].toUpperCase() + parts[1][0].toUpperCase()
    : parts[0][0].toUpperCase();
}

export default function I707Shorts() {
  const navigate = useNavigate();
  const { user, userData, loading } = useUser();
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showPauseIcon, setShowPauseIcon] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [activeShortId, setActiveShortId] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [shortStats, setShortStats] = useState({}); // { shortId: { likes: [], likeCount: 0, commentCount: 0 } }
  const [expandedDesc, setExpandedDesc] = useState({});
  const videoRefs = useRef({});
  const containerRef = useRef(null);

  useEffect(() => {
    if (!loading && !user) navigate("/i707/login");
  }, [user, loading]);

  // Subscribe to live stats for all shorts (likes + comment counts)
  useEffect(() => {
    if (!user) return;
    const unsubs = SHORTS_DATA.map(short => {
      const ref = doc(db, "shorts", short.id);
      return onSnapshot(ref, (snap) => {
        if (snap.exists()) {
          setShortStats(prev => ({
            ...prev,
            [short.id]: snap.data()
          }));
        } else {
          setShortStats(prev => ({
            ...prev,
            [short.id]: { likes: [], likeCount: 0, commentCount: 0 }
          }));
        }
      });
    });
    return () => unsubs.forEach(u => u());
  }, [user]);

  // Live subscribe to comments when sheet opens
  useEffect(() => {
    if (!activeShortId || !showComments) {
      setComments([]);
      return;
    }
    const q = query(
      collection(db, "shorts", activeShortId, "comments"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [activeShortId, showComments]);

  // Auto-play active video, pause others
  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([idx, video]) => {
      if (!video) return;
      if (parseInt(idx) === activeIndex && !paused && !showComments) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, [activeIndex, paused, showComments]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const height = window.innerHeight;
    const newIndex = Math.round(scrollTop / height);
    if (newIndex !== activeIndex && newIndex >= 0 && newIndex < SHORTS_DATA.length) {
      setActiveIndex(newIndex);
      setPaused(false);
    }
  };

  const togglePlayPause = () => {
    setPaused(p => !p);
    setShowPauseIcon(true);
    setTimeout(() => setShowPauseIcon(false), 600);
  };

  const handleLike = async (short) => {
    if (!user) return;
    const stats = shortStats[short.id] || { likes: [], likeCount: 0 };
    const isLiked = stats.likes?.includes(user.uid);
    try {
      const ref = doc(db, "shorts", short.id);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          likes: isLiked ? [] : [user.uid],
          likeCount: isLiked ? 0 : 1,
          commentCount: 0,
        });
      } else {
        await updateDoc(ref, {
          likes: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
          likeCount: increment(isLiked ? -1 : 1),
        });
      }
    } catch (e) { console.log(e); }
  };

  const handleShare = async (short) => {
    const url = `${window.location.origin}/i707/shorts`;
    try {
      if (navigator.share) {
        await navigator.share({ title: short.title || "I707 Short", url });
      } else {
        await navigator.clipboard.writeText(url);
        alert("Link copied!");
      }
    } catch (e) {}
  };

  const openComments = (shortId) => {
    setActiveShortId(shortId);
    setShowComments(true);
  };

  const closeComments = () => {
    setShowComments(false);
    setTimeout(() => setActiveShortId(null), 300);
  };

  const postComment = async () => {
    if (!newComment.trim() || !user || !userData || postingComment) return;
    setPostingComment(true);
    try {
      const ref = doc(db, "shorts", activeShortId);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          likes: [],
          likeCount: 0,
          commentCount: 1,
        });
      } else {
        await updateDoc(ref, {
          commentCount: increment(1),
        });
      }
      await addDoc(collection(db, "shorts", activeShortId, "comments"), {
        userId: user.uid,
        username: userData.username || "user",
        fullName: userData.fullName || "Scholar",
        text: newComment.trim(),
        likes: [],
        likeCount: 0,
        createdAt: serverTimestamp(),
      });
      setNewComment("");
    } catch (e) { console.log(e); }
    finally { setPostingComment(false); }
  };

  const likeComment = async (comment) => {
    if (!user || !userData) return;
    const isLiked = comment.likes?.includes(user.uid);
    try {
      const ref = doc(db, "shorts", activeShortId, "comments", comment.id);
      await updateDoc(ref, {
        likes: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
        likeCount: increment(isLiked ? -1 : 1),
      });

      // If liking (not unliking) AND not own comment → +1 coin to author
      if (!isLiked && comment.userId !== user.uid) {
        const authorRef = doc(db, "users", comment.userId);
        const authorSnap = await getDoc(authorRef);
        if (authorSnap.exists()) {
          await updateDoc(authorRef, {
            coins: increment(1),
          });
          // Log to coinHistory
          await addDoc(collection(db, "users", comment.userId, "coinHistory"), {
            amount: 1,
            reason: `Comment liked by @${userData.username || "user"}`,
            type: "comment_like",
            createdAt: serverTimestamp(),
          });
        }
      }
    } catch (e) { console.log(e); }
  };

  if (loading || !userData) return (
    <div style={{ background: "#000", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Lora, serif", color: "#F5F0E8", fontSize: "14px", letterSpacing: "3px" }}>
      Loading...
    </div>
  );

  return (
    <div className="i707-shorts-yt">
      {/* TOPBAR */}
      <div className="i707-shorts-yt__topbar">
        <button className="i707-shorts-yt__back" onClick={() => navigate("/i707/home")}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M10 4l-4 4 4 4"/>
          </svg>
        </button>
        <span className="i707-shorts-yt__topbar-title">Shorts</span>
        <div style={{ width: 36 }} />
      </div>

      {/* SCROLL CONTAINER */}
      <div className="i707-shorts-yt__container" ref={containerRef} onScroll={handleScroll}>
        {SHORTS_DATA.map((short, index) => {
          const stats = shortStats[short.id] || { likes: [], likeCount: 0, commentCount: 0 };
          const isLiked = stats.likes?.includes(user?.uid);
          const isExpanded = expandedDesc[short.id];

          return (
            <div className="i707-shorts-yt__slide" key={short.id}>
              {/* VIDEO */}
              <div className="i707-shorts-yt__video-wrap" onClick={togglePlayPause}>
                <video
                  ref={el => videoRefs.current[index] = el}
                  className="i707-shorts-yt__video"
                  src={short.videoUrl}
                  playsInline
                  loop
                  muted={false}
                  style={{ transform: `scale(${short.scale || 1})` }}
                />
                
                {/* Gradient overlays */}
                <div className="i707-shorts-yt__grad-top" />
                <div className="i707-shorts-yt__grad-bottom" />

                {/* Pause icon */}
                {(showPauseIcon && index === activeIndex) && (
                  <div className="i707-shorts-yt__pause-anim">
                    <svg viewBox="0 0 24 24" fill="white">
                      {paused ? (
                        <path d="M8 5v14l11-7z"/>
                      ) : (
                        <path d="M6 4h4v16H6zM14 4h4v16h-4z"/>
                      )}
                    </svg>
                  </div>
                )}
              </div>

              {/* RIGHT ACTIONS */}
              <div className="i707-shorts-yt__actions">
                {/* LIKE */}
                <button className="i707-shorts-yt__action" onClick={() => handleLike(short)}>
                  <div className={`i707-shorts-yt__action-icon ${isLiked ? "liked" : ""}`}>
                    <svg viewBox="0 0 24 24"
                      fill={isLiked ? "#FF3B5C" : "none"}
                      stroke={isLiked ? "#FF3B5C" : "white"}
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 21C12 21 3 14.5 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.91 3.81 13 5.08C14.09 3.81 15.76 3 17.5 3C20.58 3 23 5.42 23 8.5C23 14.5 12 21 12 21Z"/>
                    </svg>
                  </div>
                  <span className="i707-shorts-yt__action-label">{stats.likeCount || 0}</span>
                </button>

                {/* COMMENT */}
                <button className="i707-shorts-yt__action" onClick={() => openComments(short.id)}>
                  <div className="i707-shorts-yt__action-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
                    </svg>
                  </div>
                  <span className="i707-shorts-yt__action-label">{stats.commentCount || 0}</span>
                </button>

                {/* SHARE */}
                <button className="i707-shorts-yt__action" onClick={() => handleShare(short)}>
                  <div className="i707-shorts-yt__action-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/>
                      <polyline points="16 6 12 2 8 6"/>
                      <line x1="12" y1="2" x2="12" y2="15"/>
                    </svg>
                  </div>
                  <span className="i707-shorts-yt__action-label">Share</span>
                </button>
              </div>

              {/* BOTTOM INFO */}
              <div className="i707-shorts-yt__info">
                {short.title && <h2 className="i707-shorts-yt__title">{short.title}</h2>}
                {short.description && (
                  <p className={`i707-shorts-yt__desc ${isExpanded ? "expanded" : ""}`}
                    onClick={() => setExpandedDesc(prev => ({ ...prev, [short.id]: !prev[short.id] }))}>
                    {short.description}
                  </p>
                )}
                <div className="i707-shorts-yt__sound">
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
                    <path d="M9 18V5l12-2v13"/>
                    <circle cx="6" cy="18" r="3"/>
                    <circle cx="18" cy="16" r="3"/>
                  </svg>
                  <span>Original sound · I707</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* COMMENTS BOTTOM SHEET */}
      {showComments && (
        <div className="i707-shorts-yt__comments-overlay" onClick={closeComments}>
          <div className="i707-shorts-yt__comments-sheet" onClick={e => e.stopPropagation()}>
            <div className="i707-shorts-yt__comments-handle" />
            <div className="i707-shorts-yt__comments-header">
              <span className="i707-shorts-yt__comments-title">
                {comments.length} {comments.length === 1 ? "comment" : "comments"}
              </span>
              <button className="i707-shorts-yt__comments-close" onClick={closeComments}>✕</button>
            </div>

            <div className="i707-shorts-yt__comments-list">
              {comments.length === 0 ? (
                <div className="i707-shorts-yt__comments-empty">
                  <p className="i707-shorts-yt__comments-empty-title">No comments yet</p>
                  <p className="i707-shorts-yt__comments-empty-sub">Be the first to comment ✨</p>
                </div>
              ) : (
                comments.map(c => {
                  const cIsLiked = c.likes?.includes(user?.uid);
                  return (
                    <div key={c.id} className="i707-shorts-yt__comment">
                      <div className="i707-shorts-yt__comment-avatar">
                        {getInitials(c.fullName)}
                      </div>
                      <div className="i707-shorts-yt__comment-body">
                        <div className="i707-shorts-yt__comment-meta">
                          <span className="i707-shorts-yt__comment-username">@{c.username}</span>
                          <span className="i707-shorts-yt__comment-time">{timeAgo(c.createdAt)}</span>
                        </div>
                        <p className="i707-shorts-yt__comment-text">{c.text}</p>
                        {c.userId !== user?.uid && (
                          <button className="i707-shorts-yt__comment-like-btn" onClick={() => likeComment(c)}>
                            <svg viewBox="0 0 24 24" 
                              fill={cIsLiked ? "#FF3B5C" : "none"}
                              stroke={cIsLiked ? "#FF3B5C" : "rgba(255,255,255,0.7)"}
                              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                              style={{ width: 14, height: 14 }}>
                              <path d="M12 21C12 21 3 14.5 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.91 3.81 13 5.08C14.09 3.81 15.76 3 17.5 3C20.58 3 23 5.42 23 8.5C23 14.5 12 21 12 21Z"/>
                            </svg>
                            <span>{c.likeCount || 0}</span>
                          </button>
                        )}
                        {c.userId === user?.uid && c.likeCount > 0 && (
                          <span className="i707-shorts-yt__comment-coins">
                            +{c.likeCount} 🪙 earned
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* INPUT */}
            <div className="i707-shorts-yt__comment-input-wrap">
              <div className="i707-shorts-yt__comment-input-avatar">
                {getInitials(userData.fullName)}
              </div>
              <input
                className="i707-shorts-yt__comment-input"
                placeholder="Add a comment..."
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    postComment();
                  }
                }}
                disabled={postingComment}
              />
              <button className="i707-shorts-yt__comment-send"
                onClick={postComment}
                disabled={!newComment.trim() || postingComment}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}