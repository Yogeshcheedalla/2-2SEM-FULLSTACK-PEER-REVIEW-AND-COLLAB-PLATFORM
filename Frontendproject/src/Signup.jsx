import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./signup.css";

function Signup() {
  const navigate = useNavigate();
  
  // Get initial role from URL
  const queryParams = new URLSearchParams(window.location.search);
  const initialRole = queryParams.get("role") || "student";
  const [role, setRole] = useState(initialRole);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    studentId: "",
    teacherId: "",
    department: "",
    institution: "",
    program: "",
    primaryCourse: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Sync state with URL when role changes
  const handleRoleToggle = (newRole) => {
    setRole(newRole);
    navigate(`/signup?role=${newRole}`, { replace: true });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          role
        })
      });

      const data = await res.json();

      if (res.ok) {
        navigate("/login");
      } else {
        setError(data.message || "Registration failed");
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError("Network error. Please try again.");
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
            {role === "teacher" ? (
              <>
                <h1>Empower Your Classroom.</h1>
                <p>Manage assignments, track peer reviews, and gain deep insights into student performance — all from one place.</p>
                <ul className="feature-list">
                  <li>✨ Create rubric-based assignments</li>
                  <li>📊 Monitor student progress in real-time</li>
                  <li>🔍 Compare peer vs. teacher scores</li>
                  <li>📥 Export analytics & reports</li>
                </ul>
              </>
            ) : (
              <>
                <h1>Learn Through Collaboration.</h1>
                <p>Submit work, review your peers using structured rubrics, and grow through meaningful feedback and teamwork.</p>
                <ul className="feature-list">
                  <li>🤝 Submit and review peer work</li>
                  <li>👥 Collaborate in team workspaces</li>
                  <li>📈 Track your review performance</li>
                  <li>⚡ Get structured feedback instantly</li>
                </ul>
              </>
            )}
          </div>

          <div className="stats-row">
            <div className="stat"><h3>12k+</h3><p>Students</p></div>
            <div className="stat"><h3>95%</h3><p>Satisfaction</p></div>
            <div className="stat"><h3>50k+</h3><p>Reviews</p></div>
          </div>
        </div>
      </div>

      <div className="signup-right">
        <div className="form-wrapper">
          <div className="role-switcher-top">
             <button type="button" onClick={() => navigate("/login")} className="link-btn">Sign In</button>
             <button type="button" className="link-btn active">Create Account</button>
          </div>

          <div className="role-toggle-pill">
            <button 
              className={role === "student" ? "active" : ""} 
              onClick={() => handleRoleToggle("student")}
            >Student</button>
            <button 
              className={role === "teacher" ? "active" : ""} 
              onClick={() => handleRoleToggle("teacher")}
            >Teacher</button>
          </div>

          <h2>Create {role === "teacher" ? "Teacher" : "Student"} Account</h2>
          <p className="subtitle">Fill in your details below to get started</p>

          <form onSubmit={handleSubmit} className="modern-form">
            <div className="form-row">
              <div className="input-group">
                <label>FULL NAME</label>
                <input name="name" type="text" placeholder="Alex Johnson" required onChange={handleChange} />
              </div>
            </div>

            <div className="form-row">
              <div className="input-group">
                <label>{role === "teacher" ? "INSTITUTIONAL EMAIL" : "UNIVERSITY EMAIL"}</label>
                <input name="email" type="email" placeholder="you@university.edu" required onChange={handleChange} />
              </div>
            </div>

            <div className="form-row split">
              <div className="input-group">
                <label>{role === "teacher" ? "TEACHER ID" : "STUDENT ID"}</label>
                <input name={role === "teacher" ? "teacherId" : "studentId"} type="text" placeholder="e.g. S12345678" required onChange={handleChange} />
              </div>
              <div className="input-group">
                <label>{role === "teacher" ? "DEPARTMENT" : "PROGRAM / COURSE"}</label>
                <input name={role === "teacher" ? "department" : "program"} type="text" placeholder="e.g. CS, BCA" required onChange={handleChange} />
              </div>
            </div>

            {role === "teacher" && (
              <div className="form-row split">
                <div className="input-group">
                  <label>INSTITUTION</label>
                  <input name="institution" type="text" placeholder="e.g. State University" required onChange={handleChange} />
                </div>
                <div className="input-group">
                  <label>PRIMARY COURSE</label>
                  <input name="primaryCourse" type="text" placeholder="e.g. CS401" required onChange={handleChange} />
                </div>
              </div>
            )}

            <div className="form-row split">
              <div className="input-group">
                <label>PASSWORD</label>
                <input name="password" type="password" placeholder="Min. 8 characters" required onChange={handleChange} />
              </div>
              <div className="input-group">
                <label>CONFIRM PASSWORD</label>
                <input name="confirmPassword" type="password" placeholder="Re-enter password" required onChange={handleChange} />
              </div>
            </div>

            <div className="checkbox-group">
              <input type="checkbox" id="terms" required />
              <label htmlFor="terms">I agree to the <span>Terms of Service</span> and <span>Privacy Policy</span></label>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Creating Account..." : `Create ${role === "teacher" ? "Teacher" : "Student"} Account →`}
            </button>

            <div className="social-divider">
               <span>or continue with</span>
            </div>

            <div className="social-login">
              <button type="button" className="google-btn-premium" onClick={() => window.location.href = `${import.meta.env.VITE_API_BASE_URL}/oauth2/authorization/google?role=${role}`}>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
                <span>Signup with Google</span>
              </button>
            </div>

            {error && <p className="error-text">{error}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}

export default Signup;
