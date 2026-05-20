import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "../../firebase/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import "./I707Register.css";

export default function I707Register() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateUsername = (uname) => {
    if (uname.length < 3 || uname.length > 20) return "Username must be 3-20 characters.";
    if (!/^[a-z0-9_]+$/.test(uname)) return "Username can only have lowercase letters, numbers, and underscore.";
    return null;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    const cleanUsername = username.trim().toLowerCase();
    
    // Validate username
    const usernameError = validateUsername(cleanUsername);
    if (usernameError) {
      setError(usernameError);
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      // Create auth user FIRST
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // NOW check username (we're authenticated)
      const usernameRef = doc(db, "usernames", cleanUsername);
      const usernameSnap = await getDoc(usernameRef);
      if (usernameSnap.exists()) {
      setError("This username is already taken. Choose another.");
      // Delete the auth user we just created
      await userCredential.user.delete();
      setLoading(false);
      return;
      }
      
      // Save user doc
      await setDoc(doc(db, "users", userCredential.user.uid), {
        fullName: fullName.trim(),
        username: cleanUsername,
        email: email.trim().toLowerCase(),
        level: "A1",
        coins: 0,
        streak: 0,
        wordsLearned: 0,
        learnedWords: [],
        daysWorked: 0,
        totalStudyTime: 0,
        weeklyStudy: {},
        createdAt: new Date().toISOString(),
        lastActiveDate: new Date().toISOString(),
      });

      // Reserve username (maps username → uid + email)
      await setDoc(doc(db, "usernames", cleanUsername), {
        uid: userCredential.user.uid,
        email: email.trim().toLowerCase(),
      });

      localStorage.setItem("i707_user", email);
      navigate("/i707/home");
    } catch (err) {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered.");
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="i707-auth-bg">
      <div className="i707-auth-orb i707-auth-orb--top" />
      <div className="i707-auth-orb i707-auth-orb--bottom" />

      <div className="i707-auth-card">
        <div className="i707-auth-card__topline" />
        <div className="i707-auth-card__shimmer" />

        <div className="i707-auth-medallion">
          <div className="i707-auth-medallion__glow" />
          <div className="i707-ring1" />
          <div className="i707-ring2" />
          <div className="i707-ring3" />
          <div className="i707-monogram">I<br />VII</div>
        </div>

        <span className="i707-auth-eyebrow">✦ Premier Institution</span>
        <h1 className="i707-auth-title">I707</h1>
        <p className="i707-auth-subtitle">Begin Your Journey</p>

        <div className="i707-auth-divider">
          <div className="i707-divider-line" />
          <div className="i707-divider-diamond" />
          <div className="i707-divider-line" />
        </div>

        <form onSubmit={handleRegister} className="i707-auth-form">
          <div className="i707-input-group">
            <label>Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              required
            />
          </div>

          <div className="i707-input-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
              placeholder="lowercase, no spaces"
              required
              maxLength={20}
            />
            <span className="i707-input-hint">3–20 chars · letters, numbers, _</span>
          </div>

          <div className="i707-input-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="i707-input-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="i707-input-group">
            <label>Confirm Password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="i707-auth-error">⚠ {error}</p>}

          <button type="submit" className="i707-auth-btn" disabled={loading}>
            {loading ? "Creating..." : "Join the Sanctum →"}
          </button>
        </form>

        <p className="i707-auth-switch">
          Already have an account?{" "}
          <span onClick={() => navigate("/i707/login")}>Login here</span>
        </p>

        <p className="i707-auth-back" onClick={() => navigate("/")}>← Back to Selection</p>
      </div>
    </div>
  );
}