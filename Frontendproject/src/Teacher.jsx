import React, { useState, useEffect } from "react";
import "./teacher.css";
import apiFetch from "./utils/api";

const Teacher = () => {
  const [assignments, setAssignments] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [userName, setUserName] = useState("Teacher");

  const [newAssignment, setNewAssignment] = useState({
    title: "",
    description: "",
    date: "",
    hour: "12",
    minute: "00",
    period: "AM",
    maxScore: 100,
  });
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [editAssignmentData, setEditAssignmentData] = useState({
    title: "",
    description: "",
    date: "",
    hour: "12",
    minute: "00",
    period: "AM",
    maxScore: 100,
  });
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  // token removed from here as it's now handled by apiFetch

  const loadAssignments = async () => {
    try {
      const res = await apiFetch("/assignments");

      const data = await res.json();

      if (!res.ok) {
        console.log("Assignments load error:", data);
        return;
      }

      setAssignments(data);
    } catch (err) {
      console.log("Load assignments error:", err);
    }
  };

  useEffect(() => {
    const storedName = localStorage.getItem("userName");
    if (storedName) setUserName(storedName);
    loadAssignments();
  }, []);

  const handleCreateAssignment = async () => {
    if (!newAssignment.title || !newAssignment.date) {
      alert("Title & Date are required!");
      return;
    }

    // Construct Date
    let hour = parseInt(newAssignment.hour);
    if (newAssignment.period === "PM" && hour !== 12) hour += 12;
    if (newAssignment.period === "AM" && hour === 12) hour = 0;

    const deadlineDate = new Date(newAssignment.date);
    deadlineDate.setHours(hour);
    deadlineDate.setMinutes(parseInt(newAssignment.minute));

    try {
      let attachmentUrl = null;
      let attachmentName = null;

      // Upload file first if one was selected
      if (attachmentFile) {
        setUploadingFile(true);
        const formData = new FormData();
        formData.append("file", attachmentFile);
        const fileRes = await apiFetch("/files/upload", {
          method: "POST",
          headers: { "Content-Type": undefined },
          body: formData,
        });
        const fileData = await fileRes.json();
        if (!fileRes.ok) {
          alert(fileData.message || "File upload failed");
          setUploadingFile(false);
          return;
        }
        attachmentUrl = fileData.fileUrl;
        attachmentName = fileData.originalName;
        setUploadingFile(false);
      }

      const res = await apiFetch("/assignments", {
        method: "POST",
        body: JSON.stringify({
          title: newAssignment.title,
          description: newAssignment.description,
          deadline: deadlineDate.toISOString(),
          maxScore: newAssignment.maxScore,
          attachmentUrl,
          attachmentName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert("Error creating assignment");
        return;
      }

      loadAssignments();
      setShowCreateForm(false);
      setAttachmentFile(null);

      setNewAssignment({
        title: "",
        description: "",
        date: "",
        hour: "12",
        minute: "00",
        period: "AM",
        maxScore: 100,
      });
    } catch (err) {
      console.log("Create error:", err);
    }
  };

  const handleEditClick = (assignment) => {
    const deadline = new Date(assignment.deadline);
    let h = deadline.getHours();
    const m = deadline.getMinutes();
    const isPM = h >= 12;
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    
    setEditAssignmentData({
      title: assignment.title || "",
      description: assignment.description || "",
      date: deadline.toISOString().split("T")[0],
      hour: h.toString(),
      minute: m.toString().padStart(2, "0"),
      period: isPM ? "PM" : "AM",
      maxScore: assignment.maxScore || 100,
    });
    setEditingAssignment(assignment);
  };

  const handleSaveEdit = async () => {
    if (!editAssignmentData.title || !editAssignmentData.date) {
      alert("Title and Due Date are required.");
      return;
    }

    let hour = parseInt(editAssignmentData.hour);
    if (editAssignmentData.period === "PM" && hour < 12) hour += 12;
    if (editAssignmentData.period === "AM" && hour === 12) hour = 0;

    const deadlineDate = new Date(editAssignmentData.date);
    deadlineDate.setHours(hour);
    deadlineDate.setMinutes(parseInt(editAssignmentData.minute));

    try {
      const res = await apiFetch(`/assignments/${editingAssignment.id}`, {
        method: "PUT",
        body: JSON.stringify({
          title: editAssignmentData.title,
          description: editAssignmentData.description,
          deadline: deadlineDate.toISOString(),
          maxScore: editAssignmentData.maxScore,
        }),
      });

      if (!res.ok) {
        alert("Error updating assignment");
        return;
      }

      loadAssignments();
      setEditingAssignment(null);
    } catch (err) {
      console.error("Update error:", err);
      alert("Error updating assignment");
    }
  };

  const loadSubmissions = async (assignmentId) => {
    try {
      const res = await apiFetch(
        `/submissions/assignments/${assignmentId}`
      );

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Submission load error:", res.status, errorText);
        alert(`Error loading submissions: ${res.status} - ${errorText}`);
        return;
      }

      const data = await res.json();

      // Update assignment with submissions
      setAssignments((prev) =>
        prev.map((a) =>
          a.id === assignmentId ? { ...a, submissions: data } : a
        )
      );
    } catch (err) {
      console.error("Load submission network error:", err);
      alert("Cannot connect to backend. Make sure Spring Boot is running on port 2026.");
    }
  };

  const [gradeInputs, setGradeInputs] = useState({});
  const [feedbackInputs, setFeedbackInputs] = useState({});

  const handleGradeSubmission = async (submissionId, assignmentId) => {
    const score = gradeInputs[submissionId];
    if (score === undefined || score === "") {
      alert("Please enter a score");
      return;
    }

    try {
      const feedback = feedbackInputs[submissionId] || "";
      await apiFetch(`/submissions/${submissionId}/grade`, {
        method: "PATCH",
        body: JSON.stringify({ grade: Number(score), feedback }),
      });

      alert("Grade & feedback saved!");
      loadSubmissions(assignmentId);
    } catch (err) {
      console.log("Grade error:", err);
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  return (
    <div className="teacher-dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <div className="logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
              <path d="M7 8h10M7 12h6" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
          <div className="header-title">
            <h1>Teacher Dashboard</h1>
            <p>Welcome, {userName}</p>
          </div>
        </div>
        <button
          className="sign-out-btn"
          onClick={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "/login";
          }}
        >
          Log Out
        </button>
      </header>

      <main className="dashboard-main">
        <div className="assignments-section">
          <div className="section-header">
            <h2>My Assignments</h2>
            <button className="create-assignment-btn" onClick={() => setShowCreateForm(true)}>
              + Create Assignment
            </button>
          </div>

          <div className="assignments-list">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="assignment-card">
                <div className="assignment-header">
                  <div className="assignment-info">
                    <h3>{assignment.title}</h3>
                    {assignment.description && <p className="assignment-description">{assignment.description}</p>}
                    <p className="due-date">Due: {formatDate(assignment.deadline)}</p>
                    {assignment.attachmentUrl && (
                      <a
                        href={`${import.meta.env.VITE_API_BASE_URL}${assignment.attachmentUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="attachment-link"
                      >
                        📎 {assignment.attachmentName || "Download Attachment"}
                      </a>
                    )}
                  </div>
                  <div className="assignment-meta" style={{ display: "flex", gap: "10px", alignItems: "baseline" }}>
                    <span className="max-score">Max Score: {assignment.maxScore}</span>
                    <button
                      className="submit-grade-btn"
                      style={{ padding: "6px 12px", background: "#f1f5f9", color: "#334155", fontWeight: "600", fontSize: "0.875rem" }}
                      onClick={() => handleEditClick(assignment)}
                    >
                      Edit
                    </button>
                    <button
                      className="grade-btn"
                      onClick={() => {
                        const isOpen = selectedAssignment === assignment.id;
                        setSelectedAssignment(isOpen ? null : assignment.id);
                        if (!isOpen) loadSubmissions(assignment.id);
                      }}
                    >
                      {selectedAssignment === assignment.id ? "Hide Submissions" : "View Submissions"}
                    </button>
                  </div>
                </div>

                {selectedAssignment === assignment.id && (
                  <div className="submissions-section">
                    <h4>Student Submissions</h4>
                    {!assignment.submissions || assignment.submissions.length === 0 ? (
                      <p className="no-submissions">No submissions yet</p>
                    ) : (
                      <div className="submissions-list">
                        {assignment.submissions.map((submission) => (
                          <div key={submission.id} className="submission-item">
                            <div className="student-info">
                              <span className="student-name">{submission.student?.name || "Unknown"}</span>
                              <span className="submission-status">Submitted</span>
                            </div>
                            {submission.text && (
                              <div className="submission-answer-box">
                                <strong>Answer:</strong>
                                <p>{submission.text}</p>
                              </div>
                            )}
                            {submission.fileUrl && (
                              <a
                                href={`${import.meta.env.VITE_API_BASE_URL}${submission.fileUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="attachment-link"
                              >
                                📎 {submission.submissionFileName || "View Submitted File"}
                              </a>
                            )}
                            {submission.peerReviews && submission.peerReviews.length > 0 && (
                              <div className="peer-reviews-section">
                                <strong>Peer Reviews:</strong>
                                {submission.peerReviews.map((review, idx) => (
                                  <div key={idx} className="peer-review-item" style={{ background: "#f8fafc", padding: "10px", margin: "10px 0", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                                    <div className="review-header" style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
                                      <span className="reviewer-name">{review.author?.name || "Peer"}</span>
                                      <span className="review-score">Suggested Score: {review.score}/{assignment.maxScore}</span>
                                    </div>
                                    {review.comment && (
                                      <p className="review-comment" style={{ marginTop: "5px", color: "#475569" }}>{review.comment}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="grading-section">
                              {submission.grade != null ? (
                                <div>
                                  <span className="current-score">
                                    Score: {submission.grade}/{assignment.maxScore}
                                  </span>
                                  {submission.teacherFeedback && (
                                    <div className="teacher-feedback-display">
                                      <strong>Teacher Feedback:</strong>
                                      <p>{submission.teacherFeedback}</p>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="ungraded">Ungraded</span>
                              )}
                              <div className="grade-input-group">
                                <input
                                  type="number"
                                  min="0"
                                  max={assignment.maxScore}
                                  placeholder="Score"
                                  className="score-input"
                                  value={gradeInputs[submission.id] || ""}
                                  onChange={(e) =>
                                    setGradeInputs({
                                      ...gradeInputs,
                                      [submission.id]: e.target.value,
                                    })
                                  }
                                />
                              </div>
                              <textarea
                                className="feedback-textarea"
                                placeholder="Add feedback comment for student (optional)..."
                                rows={3}
                                value={feedbackInputs[submission.id] || ""}
                                onChange={(e) =>
                                  setFeedbackInputs({
                                    ...feedbackInputs,
                                    [submission.id]: e.target.value,
                                  })
                                }
                                style={{
                                  width: "100%",
                                  marginTop: "10px",
                                  padding: "8px 10px",
                                  border: "1px solid #e2e8f0",
                                  borderRadius: "6px",
                                  fontSize: "0.875rem",
                                  resize: "vertical",
                                  fontFamily: "inherit",
                                }}
                              />
                              <button
                                className="submit-grade-btn"
                                style={{ marginTop: "10px" }}
                                onClick={() => handleGradeSubmission(submission.id, assignment.id)}
                              >
                                Submit Grade
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      {showCreateForm && (
        <div className="modal-overlay">
          <div className="create-assignment-modal">
            <div className="modal-header">
              <h3>Create New Assignment</h3>
              <button className="close-btn" onClick={() => setShowCreateForm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Assignment Title</label>
                <input
                  type="text"
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows="3"
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <div className="time-inputs">
                  <input
                    type="date"
                    value={newAssignment.date}
                    onChange={(e) => setNewAssignment({ ...newAssignment, date: e.target.value })}
                    style={{ flex: 2 }}
                  />
                  <input
                    type="number"
                    min="1"
                    max="12"
                    placeholder="HH"
                    value={newAssignment.hour}
                    onChange={(e) => setNewAssignment({ ...newAssignment, hour: e.target.value })}
                    style={{ flex: 1 }}
                  />
                  <span className="time-separator">:</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    placeholder="MM"
                    value={newAssignment.minute}
                    onChange={(e) => setNewAssignment({ ...newAssignment, minute: e.target.value })}
                    style={{ flex: 1 }}
                  />
                  <select
                    value={newAssignment.period}
                    onChange={(e) => setNewAssignment({ ...newAssignment, period: e.target.value })}
                    style={{ flex: 1 }}
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Max Score</label>
                <input
                  type="number"
                  min="1"
                  value={newAssignment.maxScore}
                  onChange={(e) => setNewAssignment({ ...newAssignment, maxScore: Number(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <label>Attach File <span style={{ fontWeight: 400, color: "#64748b", fontSize: "0.8rem" }}>(PDF, DOC, PPT, Image — max 5MB, optional)</span></label>
                <div className="file-upload-area" onClick={() => document.getElementById('teacher-file-input').click()}>
                  <input
                    id="teacher-file-input"
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
                      setAttachmentFile(f || null);
                    }}
                  />
                  {attachmentFile ? (
                    <span className="file-chosen">📎 {attachmentFile.name}</span>
                  ) : (
                    <span className="file-placeholder">📁 Click to choose a file</span>
                  )}
                </div>
                {attachmentFile && (
                  <button
                    type="button"
                    className="remove-file-btn"
                    onClick={() => { setAttachmentFile(null); document.getElementById('teacher-file-input').value = ""; }}
                  >
                    ✕ Remove file
                  </button>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => { setShowCreateForm(false); setAttachmentFile(null); }}>Cancel</button>
              <button className="create-btn" onClick={handleCreateAssignment} disabled={uploadingFile}>
                {uploadingFile ? "Uploading..." : "Create Assignment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingAssignment && (
        <div className="modal-overlay">
          <div className="create-assignment-modal">
            <div className="modal-header">
              <h3>Edit Assignment</h3>
              <button className="close-btn" onClick={() => setEditingAssignment(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Assignment Title</label>
                <input
                  type="text"
                  value={editAssignmentData.title}
                  onChange={(e) => setEditAssignmentData({ ...editAssignmentData, title: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows="3"
                  value={editAssignmentData.description}
                  onChange={(e) => setEditAssignmentData({ ...editAssignmentData, description: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <div className="time-inputs">
                  <input
                    type="date"
                    value={editAssignmentData.date}
                    onChange={(e) => setEditAssignmentData({ ...editAssignmentData, date: e.target.value })}
                    style={{ flex: 2 }}
                  />
                  <input
                    type="number"
                    min="1"
                    max="12"
                    placeholder="HH"
                    value={editAssignmentData.hour}
                    onChange={(e) => setEditAssignmentData({ ...editAssignmentData, hour: e.target.value })}
                    style={{ flex: 1 }}
                  />
                  <span className="time-separator">:</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    placeholder="MM"
                    value={editAssignmentData.minute}
                    onChange={(e) => setEditAssignmentData({ ...editAssignmentData, minute: e.target.value })}
                    style={{ flex: 1 }}
                  />
                  <select
                    value={editAssignmentData.period}
                    onChange={(e) => setEditAssignmentData({ ...editAssignmentData, period: e.target.value })}
                    style={{ flex: 1 }}
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Max Score</label>
                <input
                  type="number"
                  min="1"
                  value={editAssignmentData.maxScore}
                  onChange={(e) => setEditAssignmentData({ ...editAssignmentData, maxScore: e.target.value })}
                  style={{ width: "100px" }}
                />
              </div>
              <p style={{fontSize: "0.8rem", color: "#64748b", fontStyle: "italic", marginTop: "-10px"}}>Note: You cannot change the file attachment once created.</p>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setEditingAssignment(null)}>Cancel</button>
              <button 
                className="submit-btn" 
                onClick={handleSaveEdit}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teacher;
