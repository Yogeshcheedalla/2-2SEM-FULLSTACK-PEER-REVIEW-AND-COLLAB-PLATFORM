import React from "react";
import { useNavigate } from "react-router-dom";
import "./landing.css";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      {/* Background Orbs */}
      <div className="landing-bg">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
      </div>

      {/* Navbar */}
      <nav className="navbar">
        <div className="logo-container">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L1 7L12 12L23 7L12 2Z" />
            <path d="M1 12L12 17L23 12" />
            <path d="M1 17L12 22L23 17" />
          </svg>
          <span>Peer Review Platform</span>
        </div>
        
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#solutions">Solutions</a>
          <a href="#about">About</a>
          <button className="login-btn-nav" onClick={() => navigate("/login")}>Login</button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero">
        <div className="badge">🌟 PROFESSIONAL COLLABORATION SYSTEM</div>
        <h1>
          Peer Review and <br />
          Collaboration <br />
          Platform.
        </h1>
        <p>
          Master your academic goals through deep collaborative feedback. 
          A secure, high-performance environment for structured peer evaluations and insights.
        </p>
        <div className="cta-group">
          <button className="primary-cta student-cta" onClick={() => navigate("/signup?role=student")}>Join as Student</button>
          <button className="primary-cta teacher-cta" onClick={() => navigate("/signup?role=teacher")}>Join as Educator</button>
        </div>
      </header>

      {/* Features Grid */}
      <section id="features" className="features">
        <div className="feature-card">
          <div className="feature-icon">📝</div>
          <h3>Scaled Grading</h3>
          <p>Create complex assignments and let our automated peer-matching system handle the distribution at scale.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🤝</div>
          <h3>Collaborative Learning</h3>
          <p>Foster engagement as students provide structured feedback based on your custom-built rubrics.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">📈</div>
          <h3>Powerful Analytics</h3>
          <p>Track student progress with real-time performance meters and identify gaps in understanding instantly.</p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-value">50k+</div>
            <div className="stat-label">Peer Reviews Completed</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">10k+</div>
            <div className="stat-label">Active Educators</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">98%</div>
            <div className="stat-label">Approval Rating</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="footer-top">
          <div className="footer-brand">
            <h2>MagicPath AI</h2>
            <p>The future of institutional peer grading and collaborative feedback systems.</p>
          </div>
          
          <div className="footer-links">
            <div className="link-group">
              <h4>Platform</h4>
              <ul>
                <li><a href="#">Assignments</a></li>
                <li><a href="#">Peer Review</a></li>
                <li><a href="#">Integrations</a></li>
              </ul>
            </div>
            
            <div className="link-group">
              <h4>Company</h4>
              <ul>
                <li><a href="#">About Us</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2026 MagicPath AI Platform. All rights reserved.</p>
          <div className="social-links">
            <a href="#">Twitter</a> &nbsp;&bull;&nbsp;
            <a href="#">GitHub</a> &nbsp;&bull;&nbsp;
            <a href="#">LinkedIn</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
