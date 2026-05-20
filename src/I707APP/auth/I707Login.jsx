import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import "./I707Login.css";

export default function I707Login() {
  const navigate = useNavigate();
  const [loginMode, setLoginMode] = useState("email"); // "email" or "username"
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      let emailToUse = identifier.trim();

      if (loginMode === "username") {
        const cleanUsername = identifier.trim().toLowerCase();
        const usernameRef = doc(db, "usernames", cleanUsername);
        const usernameSnap = await getDoc(usernameRef);
        if (!usernameSnap.exists()) {
          setError("Username not found.");
          setLoading(false);
          return;
        }
        emailToUse = usernameSnap.data().email;
      }

      await signInWithEmailAndPassword(auth, emailToUse, password);
      localStorage.setItem("i707_user", emailToUse);
      navigate("/i707/home");
    } catch (err) {
      console.error(err);
      setError(loginMode === "username" ? "Invalid username or password." : "Invalid email or password.");
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
        <p className="i707-auth-subtitle">Sanctum of Knowledge</p>

        <div className="i707-auth-divider">
          <div className="i707-divider-line" />
          <div className="i707-divider-diamond" />
          <div className="i707-divider-line" />
        </div>

        {/* MODE TOGGLE */}
        <div className="i707-auth-toggle">
          <button
            type="button"
            className={`i707-auth-toggle__btn ${loginMode === "email" ? "active" : ""}`}
            onClick={() => { setLoginMode("email"); setIdentifier(""); setError(""); }}
          >
            Email
          </button>
          <button
            type="button"
            className={`i707-auth-toggle__btn ${loginMode === "username" ? "active" : ""}`}
            onClick={() => { setLoginMode("username"); setIdentifier(""); setError(""); }}
          >
            Username
          </button>
        </div>

        <form onSubmit={handleLogin} className="i707-auth-form">
          <div className="i707-input-group">
            <label>{loginMode === "email" ? "Email" : "Username"}</label>
            <input
              type={loginMode === "email" ? "email" : "text"}
              value={identifier}
              onChange={(e) => setIdentifier(loginMode === "username" ? e.target.value.toLowerCase().replace(/\s/g, "") : e.target.value)}
              placeholder={loginMode === "email" ? "your@email.com" : "your_username"}
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

          {error && <p className="i707-auth-error">⚠ {error}</p>}

          <button type="submit" className="i707-auth-btn" disabled={loading}>
            {loading ? "Entering..." : "Enter the Sanctum →"}
          </button>
        </form>

        <p className="i707-auth-switch">
          No account?{" "}
          <span onClick={() => navigate("/i707/register")}>Register here</span>
        </p>

        <p className="i707-auth-back" onClick={() => navigate("/")}>← Back to Selection</p>
      </div>
    </div>
  );
}