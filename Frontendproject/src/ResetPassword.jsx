import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./ForgotPassword.css";

function ResetPassword() {
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const t = params.get("token");
    if (t) setToken(t);
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.message || "Reset failed. Please try again.");
      }
    } catch (err) {
      setError("Cannot connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fp-container">
      <div className="fp-card">
        <div className="fp-logo">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L1 7L12 12L23 7L12 2Z" />
            <path d="M1 12L12 17L23 12" />
            <path d="M1 17L12 22L23 17" />
          </svg>
          <span>PeerReview Platform</span>
        </div>

        {!success ? (
          <>
            <div className="fp-header">
              <div className="fp-icon">🔒</div>
              <h1>Set New Password</h1>
              <p>Enter your reset token and choose a new password.</p>
            </div>

            <form onSubmit={handleSubmit} className="fp-form">
              <div className="fp-input-group">
                <label>RESET TOKEN</label>
                <input
                  type="text"
                  placeholder="Paste the token from your email"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                />
              </div>

              <div className="fp-input-group">
                <label>NEW PASSWORD</label>
                <div className="fp-pass-wrap">
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="Minimum 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="fp-eye-btn"
                    onClick={() => setShowPass(!showPass)}
                  >
                    {showPass ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <div className="fp-input-group">
                <label>CONFIRM PASSWORD</label>
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              {/* Password strength bar */}
              {newPassword.length > 0 && (
                <div className="fp-strength">
                  <div
                    className={`fp-strength-bar ${
                      newPassword.length < 6 ? "weak" :
                      newPassword.length < 10 ? "medium" : "strong"
                    }`}
                    style={{ width: `${Math.min(newPassword.length * 8, 100)}%` }}
                  />
                  <span>
                    {newPassword.length < 6 ? "Too short" :
                     newPassword.length < 10 ? "Fair" : "Strong"}
                  </span>
                </div>
              )}

              {error && <p className="fp-error">{error}</p>}

              <button type="submit" className="fp-btn" disabled={loading}>
                {loading ? "Resetting..." : "Reset Password →"}
              </button>
            </form>

            <button className="fp-back" onClick={() => navigate("/login")}>
              ← Back to Login
            </button>
          </>
        ) : (
          <div className="fp-success">
            <div className="fp-success-icon">🎉</div>
            <h2>Password Reset!</h2>
            <p>Your password has been updated successfully. You can now log in with your new password.</p>
            <button className="fp-btn" onClick={() => navigate("/login")}>
              Go to Login →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;
