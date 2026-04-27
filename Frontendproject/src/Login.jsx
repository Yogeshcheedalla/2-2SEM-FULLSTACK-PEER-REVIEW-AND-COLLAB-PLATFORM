import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./signup.css"; // Reuse premium signup styling

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [role, setRole] = useState("student"); // Default for visual path
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    const userId = params.get("userId");
    const roleParam = params.get("role");
    const userName = params.get("userName");

    if (token && userId && roleParam) {
      localStorage.setItem("token", token);
      localStorage.setItem("refreshToken", params.get("refreshToken") || "");
      localStorage.setItem("userId", userId);
      localStorage.setItem("role", roleParam);
      localStorage.setItem("userName", userName || "");

      if (roleParam === "teacher") navigate("/teacher");
      else if (roleParam === "admin") navigate("/admin");
      else navigate("/student");
    }
  }, [location, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("refreshToken", data.refreshToken);
        localStorage.setItem("role", data.user.role);
        localStorage.setItem("userId", data.user.id);
        localStorage.setItem("userName", data.user.name);

        if (data.user.role === "teacher") navigate("/teacher");
        else if (data.user.role === "admin") navigate("/admin");
        else navigate("/student");
      } else {
        setError(data.message || `${data.error || "Server Error"}: ${data.trace || "No Trace"}`);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`signup-container ${role}-theme`}>
      <div className="signup-left">
        <div className="path-content">
          <div className="logo-small">
             <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L1 7L12 12L23 7L12 2Z" />
                <path d="M1 12L12 17L23 12" />
                <path d="M1 17L12 22L23 17" />
             </svg>
             <span>PeerReview Platform</span>
          </div>
          
          <div className="hero-text">
            <h1>Elevate Your Potential.</h1>
            <p>Access your dashboard to manage assignments, collaborate with peers, and track your academic journey.</p>
            <ul className="feature-list">
              <li>🔒 Secure institutional login</li>
              <li>⚡ Real-time collaboration</li>
              <li>📊 Advanced performance tracking</li>
            </ul>
          </div>

          <div className="stats-row">
            <div className="stat"><h3>12k+</h3><p>Students</p></div>
            <div className="stat"><h3>95%</h3><p>Satisfaction</p></div>
          </div>
        </div>
      </div>

      <div className="signup-right">
        <div className="form-wrapper">
          <div className="role-switcher-top">
             <button type="button" className="link-btn active">Sign In</button>
             <button type="button" onClick={() => navigate("/signup")} className="link-btn">Create Account</button>
          </div>

          <div className="role-toggle-pill">
            <button className={role === "student" ? "active" : ""} onClick={() => setRole("student")}>Student Path</button>
            <button className={role === "teacher" ? "active" : ""} onClick={() => setRole("teacher")}>Teacher Path</button>
          </div>

          <h2>Welcome Back</h2>
          <p className="subtitle">Enter your credentials to access your portal</p>

          <form onSubmit={handleSubmit} className="modern-form">
            <div className="form-row">
              <div className="input-group">
                <label>EMAIL ADDRESS</label>
                <input type="email" placeholder="name@institution.edu" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>

            <div className="form-row">
              <div className="input-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label>PASSWORD</label>
                  <button
                    type="button"
                    onClick={() => navigate("/forgot-password")}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#60a5fa",
                      fontSize: "0.78rem",
                      cursor: "pointer",
                      fontWeight: 600,
                      padding: 0,
                      marginBottom: "4px"
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
                <input type="password" placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Authenticating..." : "Sign In to Portal →"}
            </button>

            <div className="social-divider">
               <span>or continue with</span>
            </div>

            <div className="social-login">
              <button type="button" className="google-btn-premium" onClick={() => window.location.href = `${import.meta.env.VITE_API_BASE_URL}/oauth2/authorization/google?role=${role}`}>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
                <span>Login with Google</span>
              </button>
            </div>

            {error && <p className="error-text">{error}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
