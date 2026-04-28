import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ForgotPassword.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [step, setStep] = useState(1); // 1: Request OTP, 2: Verify & Reset
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setStep(2);
      } else {
        setError(data.message || "Failed to send OTP.");
      }
    } catch (err) {
      setError("Cannot connect to server. Ensure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (!otp) {
      setError("Please enter the OTP sent to your email.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: otp, newPassword }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.message || "Failed to reset password. Check your OTP.");
      }
    } catch (err) {
      setError("Cannot connect to server.");
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
              <h1>Password Reset</h1>
              <p>
                {step === 1 
                  ? "Enter your email to receive a One-Time Password (OTP)." 
                  : `Enter the OTP sent to ${email} along with your new password.`}
              </p>
            </div>

            {step === 1 ? (
              <form onSubmit={handleRequestOtp} className="fp-form">
                <div className="fp-input-group">
                  <label>EMAIL ADDRESS</label>
                  <input
                    type="email"
                    placeholder="name@institution.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                {error && <p className="fp-error">{error}</p>}

                <button type="submit" className="fp-btn" disabled={loading}>
                  {loading ? "Sending OTP..." : "Send OTP →"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyAndReset} className="fp-form">
                <div className="fp-input-group">
                  <label>6-DIGIT OTP</label>
                  <input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    required
                  />
                </div>

                <div className="fp-input-group">
                  <label>NEW PASSWORD</label>
                  <input
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="fp-input-group">
                  <label>CONFIRM PASSWORD</label>
                  <input
                    type="password"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                {error && <p className="fp-error">{error}</p>}

                <button type="submit" className="fp-btn" disabled={loading}>
                  {loading ? "Updating..." : "Verify & Reset Password →"}
                </button>
                <button 
                  type="button" 
                  className="fp-back mt-2" 
                  onClick={() => { setStep(1); setError(""); }}
                  style={{ width: '100%' }}
                >
                  ← Use a different email
                </button>
              </form>
            )}

            {step === 1 && (
              <button className="fp-back" onClick={() => navigate("/login")}>
                ← Back to Login
              </button>
            )}
          </>
        ) : (
          <div className="fp-success">
            <div className="fp-success-icon">🎉</div>
            <h2>Password Updated!</h2>
            <p>Your password for <strong>{email}</strong> has been updated successfully.</p>
            <button className="fp-btn" onClick={() => navigate("/login")}>
              Go to Login →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;
