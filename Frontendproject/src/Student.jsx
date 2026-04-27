import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./student.css";
import { projects } from "./projects";
import apiFetch from "./utils/api";

const Student = () => {
  const navigate = useNavigate();

  const [assignments, setAssignments] = useState([]);
  const [userName, setUserName] = useState("");

  // Modal controls
  const [showModal, setShowModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [answerText, setAnswerText] = useState("");
  const [submissionFile, setSubmissionFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Project submission state
  const [projectLink, setProjectLink] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectSubmission, setProjectSubmission] = useState(null);
  const [submittingProject, setSubmittingProject] = useState(false);

  // Project Modal controls
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showCollaborateModal, setShowCollaborateModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [isTeamFull, setIsTeamFull] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [userId, setUserId] = useState("");

  // ===============================
  // Fetch team for a project
  // ===============================
  const fetchTeam = async (projectId) => {
    try {
      const res = await apiFetch(`/projects/${projectId}/team`);
      const data = await res.json();
      const members = data.members || [];
      setTeamMembers(members);
      const userId = localStorage.getItem("userId");
      setIsMember(members.some((m) => String(m.id) === String(userId)));
      setIsTeamFull(members.length >= 3);
    } catch (err) {
      console.error("Error fetching team:", err);
      if (err.message.includes("Failed to fetch")) {
        alert("Cannot connect to server. Please ensure the backend is running on port 2026.");
      }
    }
  };

  const fetchProjectSubmission = async (projectId) => {
    try {
      const res = await apiFetch(`/project-submissions/projects/${projectId}/mine`);
      if (res.ok) {
        const data = await res.json();
        setProjectSubmission(data);
        if (data?.projectLink) setProjectLink(data.projectLink);
      }
    } catch (err) {
      console.error("fetchProjectSubmission error:", err);
    }
  };

  const handleSubmitProjectLink = async () => {
    if (!projectLink) return alert("Please enter a project link");
    setSubmittingProject(true);
    try {
      const res = await apiFetch(`/project-submissions/projects/${selectedProject.id}/submit`, {
        method: "POST",
        body: JSON.stringify({ projectLink, description: projectDescription }),
      });
      if (res.ok) {
        alert("Project submitted successfully!");
        fetchProjectSubmission(selectedProject.id);
      } else {
        alert("Submission failed");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingProject(false);
    }
  };

  // ===============================
  // Join Team
  // ===============================
  const handleJoinTeam = async () => {
    try {
      console.log("Joining team for project:", selectedProject?.id);
      const token = localStorage.getItem("token");

      if (!token) {
        alert("You are not logged in. Please sign out and sign in again.");
        return;
      }

      const res = await apiFetch(`/projects/${selectedProject.id}/join`, {
        method: "POST"
      });
      const data = await res.json();
      console.log("Join response:", data);

      if (!res.ok) {
        alert(data.message || "Failed to join team");
        return;
      }

      alert("Joined team successfully!");
      fetchTeam(selectedProject.id); // Refresh team list
      setIsMember(true); // Optimistic update
    } catch (err) {
      console.error("Error joining team:", err);
      alert("Failed to join team. Please check if the backend server is running. Error: " + err.message);
    }
  };

  // ===============================
  // Fetch assignments for student
  // ===============================
  const fetchAssignments = async () => {
    try {
      const res = await apiFetch("/student/assignments");
      const data = await res.json();

      if (!res.ok) {
        console.error("Error loading assignments:", data);
        return;
      }

      setAssignments(
        data.map((a) => ({
          id: a.id,
          title: a.title,
          description: a.description,
          dueDate: new Date(a.deadline).toLocaleString(),
          maxScore: a.maxScore || 100,
          submitted: false,
          facultyName: a.createdBy?.name || "Unknown Faculty",
          attachmentUrl: a.attachmentUrl || null,
          attachmentName: a.attachmentName || null,
        }))
      );
    } catch (err) {
      console.error("Error fetching assignments:", err);
    }
  };

  // ===============================
  // Fetch student's submitted work
  // ===============================
  const fetchSubmissions = async () => {
    try {
      const res = await apiFetch("/student/submissions");

      const subs = await res.json();
      if (!res.ok) return;

      setAssignments((prev) =>
        prev.map((a) => {
          // Find ALL submissions for this assignment
          const assignmentSubmissions = subs.filter(
            (s) => s.assignment.id === a.id
          );

          // Sort by date desc to get latest
          assignmentSubmissions.sort(
            (x, y) => new Date(y.submittedAt) - new Date(x.submittedAt)
          );

          // Latest ACTIVE submission (not removed)
          const latestActiveSubmission = assignmentSubmissions.find(
            (s) => s.status !== "removed"
          );

          const submissionCount = assignmentSubmissions.length;

          return {
            ...a,
            submitted: !!latestActiveSubmission,
            submissionData: latestActiveSubmission || null,
            submissionCount, // Track count (includes removed)
          };
        })
      );
    } catch (err) {
      console.error("Error fetching submissions:", err);
    }
  };

  useEffect(() => {
    setUserName(localStorage.getItem("userName") || "Student");

    // Get user ID from localStorage
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserId(user.id || user._id);
      } catch (e) {
        console.error("Error parsing user data", e);
      }
    }

    fetchAssignments();
  }, []);

  useEffect(() => {
    if (assignments.length > 0) {
      fetchSubmissions();
    }
  }, [assignments.length]); // Only run when assignments are loaded

  const openSubmissionModal = (assignment) => {
    setSelectedAssignment(assignment);
    setAnswerText("");
    setSubmissionFile(null);
    setShowModal(true);
  };

  // ===============================
  // Submit assignment
  // ===============================
  const handleSubmitAssignment = async () => {
    try {
      const token = localStorage.getItem("token");
      let fileUrl = "";
      let submissionFileName = "";

      // Upload file first if provided
      if (submissionFile) {
        setUploadingFile(true);
        const formData = new FormData();
        formData.append("file", submissionFile);
        const fileRes = await apiFetch("/files/upload", {
          method: "POST",
          headers: { "Content-Type": undefined }, // Fetch handles FormData boundary
          body: formData,
        });
        const fileData = await fileRes.json();
        if (!fileRes.ok) {
          alert(fileData.message || "File upload failed");
          setUploadingFile(false);
          return;
        }
        fileUrl = fileData.fileUrl;
        submissionFileName = fileData.originalName;
        setUploadingFile(false);
      }

      const res = await apiFetch(
        `/submissions/assignments/${selectedAssignment.id}/submit`,
        {
          method: "POST",
          body: JSON.stringify({
            text: answerText,
            fileUrl,
            submissionFileName,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Error submitting assignment");
        return;
      }

      setAssignments((prev) =>
        prev.map((a) =>
          a.id === selectedAssignment.id
            ? {
              ...a,
              submitted: true,
              submissionCount: (a.submissionCount || 0) + 1,
            }
            : a
        )
      );

      setShowModal(false);
      setSubmissionFile(null);
      alert("Assignment submitted successfully!");
      fetchSubmissions();
    } catch (err) {
      console.error("Submit error:", err);
    }
  };

  const handleRemoveSubmission = async (assignment) => {
    if (assignment.submissionCount >= 3) {
      alert("Max limit reached. You cannot resubmit again.");
      return;
    }

    if (!window.confirm("Are you sure you want to remove this submission? It will still count as an attempt.")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await apiFetch(
        `/submissions/${assignment.submissionData.id}/remove`,
        {
          method: "PATCH"
        }
      );

      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "Error removing submission");
        return;
      }

      alert("Submission removed. You can now submit again.");
      fetchSubmissions(); // Refresh UI
    } catch (err) {
      console.error("Remove error:", err);
    }
  };

  const handlePeerReview = (assignmentId) => {
    navigate(`/peer-review/${assignmentId}`);
  };

  const handleSignOut = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <div className="student-dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <div className="dashboard-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </div>
          <div className="dashboard-title">
            <h1>Student Dashboard</h1>
            <p>Welcome, {userName}</p>
          </div>
        </div>

        <div className="header-right">
          <button className="peer-review-btn" onClick={() => navigate("/project-gallery")} style={{ backgroundColor: "#8b5cf6", marginRight: "10px" }}>
            Peer Review Hub 🎨
          </button>
          <button className="project-btn" onClick={() => setShowProjectModal(true)}>
            Projects
          </button>
          <button className="sign-out-btn" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        <section className="assignments-section">
          <h2>Available Assignments</h2>

          <div className="assignments-list">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="assignment-card">
                <div className="assignment-header">
                  <div>
                    <h3 className="assignment-title">{assignment.title}</h3>
                    <span style={{ fontSize: "0.85rem", color: "#6c757d" }}>
                      Faculty: {assignment.facultyName}
                    </span>
                  </div>

                  {assignment.submitted && (
                    <span className="submitted-badge">Submitted</span>
                  )}
                </div>

                <p className="assignment-description">{assignment.description}</p>

                <div className="assignment-meta">
                  <span className="due-date">Due: {assignment.dueDate}</span>
                  <span className="max-score">Max Score: {assignment.maxScore}</span>
                </div>

                {assignment.attachmentUrl && (
                  <a
                    href={`${import.meta.env.VITE_API_BASE_URL}${assignment.attachmentUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="attachment-link"
                  >
                    📎 {assignment.attachmentName || "View Assignment File"}
                  </a>
                )}

                {assignment.submitted && assignment.submissionData?.grade != null && (
                  <div className="grade-section">
                    <strong>Teacher Grade:</strong> {assignment.submissionData.grade}/{assignment.maxScore}
                    {assignment.submissionData.teacherFeedback && (
                      <div style={{ marginTop: "8px", padding: "8px", background: "#fefce8", borderRadius: "6px", borderLeft: "3px solid #eab308" }}>
                        <strong style={{ fontSize: "0.8rem", color: "#854d0e" }}>Teacher Feedback:</strong>
                        <p style={{ margin: "4px 0 0", fontSize: "0.875rem", color: "#713f12" }}>{assignment.submissionData.teacherFeedback}</p>
                      </div>
                    )}
                    {assignment.submissionData.fileUrl && (
                      <a
                        href={`${import.meta.env.VITE_API_BASE_URL}${assignment.submissionData.fileUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="attachment-link"
                        style={{ display: "block", marginTop: "6px" }}
                      >
                        📎 {assignment.submissionData.submissionFileName || "View My Submission File"}
                      </a>
                    )}
                  </div>
                )}

                {assignment.submitted && assignment.submissionData?.peerReviews?.length > 0 && (
                  <div className="peer-reviews-section">
                    <strong>Peer Reviews:</strong>
                    {assignment.submissionData.peerReviews.map((review, idx) => (
                      <div key={idx} className="peer-review-item">
                        <div className="review-header">
                          <span className="reviewer-name">{review.author?.name || "Anonymous"}</span>
                          <span className="review-score">Score: {review.score}/{assignment.maxScore}</span>
                        </div>
                        {review.comment && (
                          <p className="review-comment">{review.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="assignment-actions">
                  {!assignment.submitted ? (
                    assignment.submissionCount < 3 ? (
                      <button
                        className="submit-btn"
                        onClick={() => openSubmissionModal(assignment)}
                      >
                        Submit Assignment
                      </button>
                    ) : (
                      <span className="max-attempts-msg" style={{ color: "red" }}>
                        Max attempts reached
                      </span>
                    )
                  ) : (
                    <>
                      <div className="submission-status">
                        <button className="submitted-btn" disabled>
                          Submitted
                        </button>
                        <span className="attempts-info">
                          Attempts: {assignment.submissionCount || 0}/3
                        </span>
                      </div>

                      {assignment.submissionData?.grade == null ? (
                        <button
                          className="resubmit-btn"
                          style={{ marginLeft: "10px", backgroundColor: "#ff9800", color: "white", border: "none", padding: "8px 12px", borderRadius: "4px" }}
                          onClick={() => handleRemoveSubmission(assignment)}
                        >
                          Remove & Resubmit
                        </button>
                      ) : (
                        <span 
                          className="max-attempts-msg" 
                          style={{ 
                            marginLeft: "10px", 
                            color: "#475569", 
                            backgroundColor: "#f1f5f9", 
                            padding: "6px 14px", 
                            borderRadius: "20px", 
                            fontSize: "0.8rem", 
                            fontWeight: "600",
                            border: "1px solid #e2e8f0",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)"
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                          Graded - No Resubmission
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h3>{selectedAssignment.title}</h3>
              <span className="modal-close" onClick={() => setShowModal(false)} style={{ cursor: "pointer" }}>
                ✕
              </span>
            </div>

            <p className="modal-subtitle">Your Submission</p>

            {selectedAssignment?.attachmentUrl && (
              <a
                href={`${import.meta.env.VITE_API_BASE_URL}${selectedAssignment.attachmentUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="attachment-link"
                style={{ display: "inline-block", marginTop: "8px" }}
              >
                📎 View Assignment File
              </a>
            )}

            <textarea
              className="modal-textarea"
              placeholder="Write your answer here... (optional if uploading a file)"
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              style={{ width: "100%", height: "160px", marginTop: "10px", padding: "10px" }}
            />

            <div className="file-upload-area" style={{ marginTop: "12px" }} onClick={() => document.getElementById('student-file-input').click()}>
              <input
                id="student-file-input"
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg"
                style={{ display: "none" }}
                onChange={(e) => {
                  const f = e.target.files[0];
                  if (f && f.size > 5 * 1024 * 1024) {
                    alert("File too large! Max size is 5MB.");
                    e.target.value = "";
                    return;
                  }
                  setSubmissionFile(f || null);
                }}
              />
              {submissionFile ? (
                <span className="file-chosen">📎 {submissionFile.name}</span>
              ) : (
                <span className="file-placeholder">📁 Attach a file (optional, max 5MB)</span>
              )}
            </div>
            {submissionFile && (
              <button
                type="button"
                className="remove-file-btn"
                onClick={() => { setSubmissionFile(null); document.getElementById('student-file-input').value = ""; }}
              >
                ✕ Remove file
              </button>
            )}

            <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
              <button className="modal-cancel" onClick={() => { setShowModal(false); setSubmissionFile(null); }}>
                Cancel
              </button>
              <button className="modal-submit" onClick={handleSubmitAssignment} disabled={uploadingFile}>
                {uploadingFile ? "Uploading..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showProjectModal && (
        <div className="modal-overlay">
          <div className="modal-box project-modal-box">
            <div className="modal-header">
              <h3>Available Projects</h3>
              <span className="modal-close" onClick={() => setShowProjectModal(false)} style={{ cursor: "pointer" }}>
                ✕
              </span>
            </div>
            <div className="projects-list">
              {projects.map((project) => (
                <div key={project.id} className="project-item" style={{ padding: "10px", borderBottom: "1px solid #eee" }}>
                  <div className="project-info">
                    <h4>{project.title}</h4>
                    <p>{project.description}</p>
                  </div>
                  <button
                    className="collaborate-btn"
                    onClick={() => {
                      setSelectedProject(project);
                      setProjectSubmission(null);
                      setProjectLink("");
                      setProjectDescription("");
                      fetchTeam(project.id);
                      fetchProjectSubmission(project.id);
                      setShowProjectModal(false);
                      setShowCollaborateModal(true);
                    }}
                  >
                    Collaborate
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showCollaborateModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Team for {selectedProject?.title}</h3>
              <span
                className="modal-close"
                onClick={() => {
                  setShowCollaborateModal(false);
                }}
                style={{ cursor: "pointer" }}
              >
                ✕
              </span>
            </div>

            <div className="team-status-section" style={{ padding: "10px" }}>
              <h4>Current Team Members ({teamMembers.length}/3)</h4>
              {teamMembers.length > 0 ? (
                <ul className="team-members-list">
                  {teamMembers.map((member, idx) => (
                    <li key={idx}>{member.name} ({member.email})</li>
                  ))}
                </ul>
              ) : (
                <p>No members yet. Be the first to join!</p>
              )}
            </div>

            {/* ── Project Link Submission Section (members only) ── */}
            {isMember && (
              <div style={{ padding: "10px", borderTop: "1px solid #e2e8f0", marginTop: "10px" }}>
                <h4 style={{ marginBottom: "10px", color: "#374151" }}>🔗 Submit Project Link</h4>

                {/* Show existing submission status */}
                {projectSubmission && (
                  <div style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    marginBottom: "12px",
                    background: projectSubmission.status === "reviewed" ? "#f0fdf4" :
                                projectSubmission.status === "revision_requested" ? "#fef9c3" : "#eff6ff",
                    border: `1px solid ${projectSubmission.status === "reviewed" ? "#86efac" :
                                        projectSubmission.status === "revision_requested" ? "#fde047" : "#93c5fd"}`
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <strong style={{ fontSize: "0.85rem" }}>
                        {projectSubmission.status === "reviewed" ? "✅ Approved" :
                         projectSubmission.status === "revision_requested" ? "🔄 Revision Requested" : "⏳ Under Review"}
                      </strong>
                      <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>v{projectSubmission.version}</span>
                    </div>
                    <a href={projectSubmission.projectLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.8rem", color: "#2563eb" }}>
                      🔗 {projectSubmission.projectLink}
                    </a>
                    {projectSubmission.adminGrade != null && (
                      <p style={{ marginTop: "6px", fontWeight: "700", color: "#16a34a", fontSize: "0.875rem" }}>
                        Grade: {projectSubmission.adminGrade}/100
                      </p>
                    )}
                    {projectSubmission.adminRemarks && (
                      <div style={{ marginTop: "6px", padding: "6px 8px", background: "white", borderRadius: "4px", fontSize: "0.8rem" }}>
                        <strong>Admin Remarks:</strong> {projectSubmission.adminRemarks}
                      </div>
                    )}
                    {projectSubmission.improvements && (
                      <div style={{ marginTop: "6px", padding: "6px 8px", background: "#fefce8", borderRadius: "4px", fontSize: "0.8rem", borderLeft: "3px solid #eab308" }}>
                        <strong>Improvements:</strong> {projectSubmission.improvements}
                      </div>
                    )}

                    {/* 🆕 PEER REVIEWS SECTION */}
                    {projectSubmission.projectReviews && projectSubmission.projectReviews.length > 0 && (
                      <div style={{ marginTop: "12px", borderTop: "1px dashed #cbd5e1", paddingTop: "10px" }}>
                        <h5 style={{ fontSize: "0.85rem", color: "#64748b", margin: "0 0 8px 0" }}>Peer Feedback ({projectSubmission.projectReviews.length})</h5>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {projectSubmission.projectReviews.map((rev, idx) => (
                            <div key={idx} style={{ padding: "8px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                                <span style={{ fontWeight: "700", color: "#8b5cf6", fontSize: "0.75rem" }}>{rev.score} / 5 ⭐</span>
                                <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{new Date(rev.createdAt).toLocaleDateString()}</span>
                              </div>
                              <p style={{ margin: 0, fontSize: "0.8rem", color: "#475569" }}>"{rev.comment}"</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Submit / Resubmit form */}
                {(!projectSubmission || projectSubmission.status === "revision_requested") && (
                  <>
                    <input
                      type="url"
                      placeholder="https://github.com/your-team/project"
                      value={projectLink}
                      onChange={(e) => setProjectLink(e.target.value)}
                      style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: "6px", marginBottom: "8px", fontSize: "0.875rem" }}
                    />
                    <textarea
                      placeholder="Brief description of what you built (optional)"
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                      rows={2}
                      style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "0.875rem", resize: "vertical" }}
                    />
                    <button
                      className="modal-submit"
                      style={{ marginTop: "8px", width: "100%" }}
                      disabled={submittingProject || !projectLink}
                      onClick={async () => {
                        try {
                          setSubmittingProject(true);
                          const token = localStorage.getItem("token");
                          const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/project-submissions/projects/${selectedProject.id}/submit`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                            body: JSON.stringify({ projectLink, description: projectDescription }),
                          });
                          const data = await res.json();
                          if (res.ok) {
                            alert(projectSubmission ? "Project resubmitted!" : "Project submitted!");
                            fetchProjectSubmission(selectedProject.id);
                            setProjectDescription("");
                          } else {
                            alert(data.message || "Submission failed");
                          }
                        } catch (err) {
                          alert("Network error. Try again.");
                        } finally {
                          setSubmittingProject(false);
                        }
                      }}
                    >
                      {submittingProject ? "Submitting..." : projectSubmission ? "🔄 Resubmit Updated Link" : "🚀 Submit Project Link"}
                    </button>
                  </>
                )}
              </div>
            )}

            <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
              <button
                className="modal-cancel"
                onClick={() => {
                  setShowCollaborateModal(false);
                  setShowProjectModal(true);
                }}
              >
                Back
              </button>

              {!isMember && !isTeamFull && (
                <button
                  className="modal-submit"
                  onClick={handleJoinTeam}
                >
                  Join Team
                </button>
              )}

              {isMember && !projectSubmission && (
                <span className="status-msg success">You have joined this team.</span>
              )}

              {!isMember && isTeamFull && (
                <span className="status-msg error">Max limit reached. Cannot join.</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Student;
