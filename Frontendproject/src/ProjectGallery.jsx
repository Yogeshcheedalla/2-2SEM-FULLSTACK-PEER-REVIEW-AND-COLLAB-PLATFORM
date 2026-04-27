import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./PeerReview.css"; // Reusing some base styles or creation of new ones below
import apiFetch from "./utils/api";

const ProjectGallery = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [reviewScore, setReviewScore] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  // token removed from here as it's now handled by apiFetch

  const fetchGallery = async () => {
    try {
      const res = await apiFetch("/project-submissions/gallery");
      const data = await res.json();
      if (res.ok) {
        setProjects(data);
      }
    } catch (err) {
      console.error("Gallery fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) navigate("/login");
    fetchGallery();
  }, [token]);

  const handleSubmitReview = async () => {
    if (!reviewComment.trim()) return alert("Please add a comment");
    setSubmitting(true);
    try {
      const res = await apiFetch(`/project-reviews/${selectedProject.id}`, {
        method: "POST",
        body: JSON.stringify({
          score: reviewScore,
          comment: reviewComment,
        }),
      });

      if (res.ok) {
        alert("Review submitted!");
        setSelectedProject(null);
        setReviewComment("");
        fetchGallery(); // Refresh to see new reviews if displayed
      } else {
        alert("Failed to submit review");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="peer-review-container" style={{ padding: "40px", backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      <header style={{ marginBottom: "40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "2.5rem", fontWeight: "800", color: "#1e293b", margin: "0" }}>Project Feedback Hub 🚀</h1>
          <p style={{ color: "#64748b", marginTop: "8px", fontSize: "1.1rem" }}>Explore and review projects from your peers.</p>
        </div>
        <button 
          onClick={() => navigate("/student")}
          style={{ padding: "12px 24px", borderRadius: "12px", border: "none", background: "white", color: "#64748b", fontWeight: "600", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)", cursor: "pointer" }}
        >
          Back to Dashboard
        </button>
      </header>

      {loading ? (
        <div style={{ textAlign: "center", marginTop: "100px" }}>Loading gallery...</div>
      ) : projects.length === 0 ? (
        <div style={{ textAlign: "center", padding: "100px", background: "white", borderRadius: "24px", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}>
          <h2 style={{ color: "#94a3b8" }}>No project submissions found yet.</h2>
          <p>Be the first to submit yours!</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" }}>
          {projects.map((proj) => (
            <div 
              key={proj.id} 
              style={{ background: "white", borderRadius: "24px", padding: "24px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)", transition: "transform 0.2s", cursor: "default" }}
              onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-5px)"}
              onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div style={{ background: "#f1f5f9", padding: "8px 12px", borderRadius: "10px", color: "#475569", fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase" }}>
                  Project #{proj.projectId}
                </div>
                <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>v{proj.version}</span>
              </div>
              
              <h3 style={{ margin: "0 0 8px 0", fontSize: "1.25rem", color: "#1e293b" }}>{proj.submittedBy?.name || "Anonymous Student"}</h3>
              {proj.description && <p style={{ color: "#64748b", fontSize: "0.9rem", lineHeight: "1.5", marginBottom: "20px" }}>{proj.description}</p>}
              
              <div style={{ display: "flex", gap: "12px", marginTop: "auto" }}>
                <a 
                  href={proj.projectLink} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ flex: 1, textAlign: "center", padding: "12px", borderRadius: "12px", background: "#f1f5f9", color: "#1e293b", textDecoration: "none", fontWeight: "600", fontSize: "0.9rem" }}
                >
                  View Link 🔗
                </a>
                <button 
                  onClick={() => setSelectedProject(proj)}
                  style={{ flex: 1, padding: "12px", borderRadius: "12px", background: "#8b5cf6", color: "white", border: "none", fontWeight: "600", cursor: "pointer", fontSize: "0.9rem" }}
                >
                  Review ✍️
                </button>
              </div>

              {proj.projectReviews && proj.projectReviews.length > 0 && (
                <div style={{ marginTop: "20px", paddingTop: "15px", borderTop: "1px solid #f1f5f9" }}>
                  <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Recent Feedback ({proj.projectReviews.length})</span>
                  <div style={{ marginTop: "10px", maxHeight: "100px", overflowY: "auto" }}>
                    {proj.projectReviews.slice(-2).map((rev, idx) => (
                      <div key={idx} style={{ padding: "8px", background: "#f8fafc", borderRadius: "8px", marginBottom: "6px", fontSize: "0.8rem" }}>
                        <strong>{rev.score}⭐</strong> {rev.comment}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedProject && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.8)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "white", width: "90%", maxWidth: "500px", borderRadius: "32px", padding: "32px", boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.5)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ margin: 0 }}>Submit Peer Review</h2>
              <button onClick={() => setSelectedProject(null)} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#94a3b8" }}>✕</button>
            </div>

            <p style={{ color: "#64748b", marginBottom: "20px" }}>Reviewing: <strong>{selectedProject.submittedBy?.name}</strong></p>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", marginBottom: "12px", fontWeight: "600", color: "#475569" }}>Impact Score (1-5)</label>
              <div style={{ display: "flex", gap: "10px" }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewScore(star)}
                    style={{ 
                      flex: 1, padding: "12px", borderRadius: "12px", border: "2px solid", 
                      borderColor: reviewScore === star ? "#8b5cf6" : "#f1f5f9",
                      background: reviewScore === star ? "#f5f3ff" : "white",
                      color: reviewScore === star ? "#8b5cf6" : "#94a3b8",
                      fontWeight: "700", cursor: "pointer"
                    }}
                  >
                    {star}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: "32px" }}>
              <label style={{ display: "block", marginBottom: "12px", fontWeight: "600", color: "#475569" }}>Constructive Feedback</label>
              <textarea 
                placeholder="What did you like? What could be improved?"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                style={{ width: "100%", height: "120px", padding: "16px", borderRadius: "16px", border: "2px solid #f1f5f9", outline: "none", fontFamily: "inherit", resize: "none" }}
              />
            </div>

            <button 
              onClick={handleSubmitReview}
              disabled={submitting}
              style={{ width: "100%", padding: "16px", borderRadius: "16px", border: "none", background: "#8b5cf6", color: "white", fontWeight: "700", fontSize: "1.1rem", cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? "Submitting..." : "Submit Review ✨"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectGallery;
