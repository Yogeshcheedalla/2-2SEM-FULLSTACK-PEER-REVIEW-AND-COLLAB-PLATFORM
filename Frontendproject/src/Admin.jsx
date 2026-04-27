import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { projects } from "./projects";
import "./student.css"; // Reusing student CSS for consistency
import apiFetch from "./utils/api";

const Admin = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("users"); // users, assignments, projects, project-submissions, submissions
    const [users, setUsers] = useState([]);
    const [allAssignments, setAllAssignments] = useState([]);
    const [allProjects, setAllProjects] = useState([]);
    const [allSubmissions, setAllSubmissions] = useState([]);
    const [projectSubmissions, setProjectSubmissions] = useState([]);
    const [loading, setLoading] = useState(false);

    // Review modal state
    const [reviewingSubmission, setReviewingSubmission] = useState(null);
    const [reviewGrade, setReviewGrade] = useState("");
    const [reviewRemarks, setReviewRemarks] = useState("");
    const [reviewImprovements, setReviewImprovements] = useState("");
    const [reviewStatus, setReviewStatus] = useState("reviewed");
    const [savingReview, setSavingReview] = useState(false);

    // Form state for creating a new user
    const [newUser, setNewUser] = useState({
        name: "",
        email: "",
        password: "password123",
        role: "student",
        department: "",
        institution: "State University",
        teacherId: "",
        studentId: "",
        program: "",
        primaryCourse: ""
    });

    const [uploadingBulk, setUploadingBulk] = useState(false);

    useEffect(() => {
        const role = localStorage.getItem("role");
        if (role !== "admin") {
            // alert("Access denied. Admins only.");
            navigate("/");
            return;
        }
        fetchAllData();
    }, [navigate]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [uRes, aRes, pRes, sRes, psRes] = await Promise.all([
                apiFetch("/admin/users"),
                apiFetch("/admin/assignments"),
                apiFetch("/admin/projects"),
                apiFetch("/admin/submissions"),
                apiFetch("/project-submissions/admin/all"),
            ]);

            if (uRes.ok) setUsers(await uRes.json());
            else console.warn("Failed to fetch users:", uRes.status);

            if (aRes.ok) setAllAssignments(await aRes.json());
            if (pRes.ok) setAllProjects(await pRes.json());
            if (sRes.ok) setAllSubmissions(await sRes.json());
            if (psRes.ok) setProjectSubmissions(await psRes.json());
            
            if (!uRes.ok && uRes.status === 401) {
                alert("Session expired or unauthorized. Please log out and back in.");
            }
        } catch (err) {
            console.error("Error fetching admin data:", err);
            alert("Connection error: Could not reach the backend server. Make sure it's running on port 2026.");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            const res = await apiFetch("/admin/users", {
                method: "POST",
                body: JSON.stringify(newUser),
            });

            if (res.ok) {
                alert("User created successfully!");
                setNewUser({ ...newUser, name: "", email: "", department: "", teacherId: "", studentId: "", program: "", primaryCourse: "" });
                fetchAllData();
            } else {
                const data = await res.json();
                alert(data.message || "Failed to create user");
            }
        } catch (err) {
            console.error("Error creating user:", err);
            alert("Network error: Failed to register user. Check your connection to port 2026.");
        }
    };

    const handleBulkUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        setUploadingBulk(true);
        try {
            const res = await apiFetch("/admin/users/bulk-upload", {
                method: "POST",
                headers: { "Content-Type": undefined },
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                alert(`Bulk upload complete!\nAdded: ${data.added}\nSkipped (duplicates or invalid): ${data.skipped}`);
                fetchAllData();
            } else {
                const data = await res.json();
                alert(data.message || "Failed to upload file");
            }
        } catch (err) {
            console.error(err);
            alert("Network error during bulk upload.");
        } finally {
            setUploadingBulk(false);
            e.target.value = null; // reset file input
        }
    };

    const handleDeleteAssignment = async (id) => {
        if (!window.confirm("Are you sure you want to delete this assignment? All related submissions will be affected.")) return;
        try {
            const res = await apiFetch(`/admin/assignments/${id}`, {
                method: "DELETE"
            });
            if (res.ok) {
                alert("Assignment deleted");
                fetchAllData();
            }
        } catch (err) { console.error(err); }
    };

    const handleRemoveMember = async (projectId, userId) => {
        if (!window.confirm("Remove this student from the project?")) return;
        try {
            const res = await apiFetch(`/admin/projects/${projectId}/members/${userId}`, {
                method: "DELETE"
            });
            if (res.ok) {
                alert("Member removed");
                fetchAllData();
            }
        } catch (err) { console.error(err); }
    };

    const handleDeleteProject = async (id) => {
        if (!window.confirm("Delete this project and its team?")) return;
        try {
            const res = await apiFetch(`/admin/projects/${id}`, {
                method: "DELETE"
            });
            if (res.ok) {
                alert("Project deleted");
                fetchAllData();
            }
        } catch (err) { console.error(err); }
    };

    const handleSignOut = () => {
        localStorage.clear();
        window.location.href = "/";
    };

    const getProjectTitle = (pId) => {
        const p = projects.find(proj => proj.id === pId);
        return p ? p.title : `Project ${pId}`;
    };

    const handleReviewProjectSubmission = async () => {
        if (!reviewingSubmission) return;
        setSavingReview(true);
        try {
            const res = await apiFetch(`/project-submissions/admin/${reviewingSubmission.id}/review`, {
                method: "PATCH",
                body: JSON.stringify({
                    adminGrade: reviewGrade !== "" ? Number(reviewGrade) : null,
                    adminRemarks: reviewRemarks,
                    improvements: reviewImprovements,
                    status: reviewStatus,
                }),
            });
            if (res.ok) {
                alert("Review saved!");
                setReviewingSubmission(null);
                fetchAllData();
            } else {
                const d = await res.json();
                alert(d.message || "Failed to save review");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSavingReview(false);
        }
    };

    return (
        <div className="student-dashboard">
            <header className="dashboard-header">
                <div className="header-left">
                    <div className="dashboard-title">
                        <h1>Admin Oversight Console</h1>
                    </div>
                </div>
                <div className="header-right">
                    <button className="sign-out-btn" onClick={handleSignOut}>Sign Out</button>
                </div>
            </header>

            <div className="admin-tabs" style={{ padding: "20px", display: "flex", gap: "10px", background: "#f8f9fa", borderBottom: "1px solid #ddd", flexWrap: "wrap" }}>
                {["users", "assignments", "projects", "project-submissions", "submissions"].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{ 
                            padding: "10px 20px", 
                            backgroundColor: activeTab === tab ? "#6a7dd6" : "transparent", 
                            color: activeTab === tab ? "white" : "#666", 
                            border: "none", 
                            borderRadius: "5px", 
                            cursor: "pointer",
                            fontWeight: "600",
                            textTransform: "capitalize"
                        }}
                    >
                        {tab === "project-submissions" ? "📋 Project Reviews" : tab}
                    </button>
                ))}
            </div>

            <main className="dashboard-content" style={{ padding: "20px" }}>
                {activeTab === "users" && (
                    <section>
                        <h2>Create New User</h2>
                        <form onSubmit={handleCreateUser} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", background: "white", padding: "20px", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", marginBottom: "30px" }}>
                            <input placeholder="Full Name" required value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ddd" }} />
                            <input placeholder="Email" type="email" required value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ddd" }} />
                            <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ddd" }}>
                                <option value="student">Student</option>
                                <option value="teacher">Teacher</option>
                            </select>
                            <input placeholder="Assign Password" required value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ddd" }} />
                            
                            {newUser.role === "teacher" && (
                                <>
                                    <input placeholder="Teacher ID / Employee ID" value={newUser.teacherId} onChange={e => setNewUser({...newUser, teacherId: e.target.value})} style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ddd" }} />
                                    <input placeholder="Department" value={newUser.department} onChange={e => setNewUser({...newUser, department: e.target.value})} style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ddd" }} />
                                    <input placeholder="Primary Course" value={newUser.primaryCourse} onChange={e => setNewUser({...newUser, primaryCourse: e.target.value})} style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ddd" }} />
                                    <input placeholder="Institution" value={newUser.institution} onChange={e => setNewUser({...newUser, institution: e.target.value})} style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ddd" }} />
                                </>
                            )}
                            
                            {newUser.role === "student" && (
                                <>
                                    <input placeholder="Student ID" value={newUser.studentId} onChange={e => setNewUser({...newUser, studentId: e.target.value})} style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ddd" }} />
                                    <input placeholder="Program / Major" value={newUser.program} onChange={e => setNewUser({...newUser, program: e.target.value})} style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ddd" }} />
                                </>
                            )}
                            
                            <button type="submit" style={{ gridColumn: "span 2", padding: "12px", background: "#00a854", color: "white", border: "none", borderRadius: "5px", fontWeight: "700", cursor: "pointer" }}>Register User Account</button>
                        </form>

                        <h2>Bulk Upload Users (Excel)</h2>
                        <div style={{ background: "white", padding: "20px", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", marginBottom: "30px", display: "flex", gap: "15px", alignItems: "center" }}>
                            <a 
                                href={`${import.meta.env.VITE_API_BASE_URL}/admin/users/template`} 
                                download 
                                style={{ padding: "10px 15px", background: "#f3f4f6", color: "#374151", textDecoration: "none", borderRadius: "5px", fontWeight: "600", border: "1px solid #d1d5db" }}
                            >
                                📥 Download Template
                            </a>
                            <div style={{ flex: 1, position: "relative" }}>
                                <input 
                                    type="file" 
                                    accept=".xlsx, .xls"
                                    onChange={handleBulkUpload}
                                    style={{ display: "none" }}
                                    id="bulk-upload-input"
                                />
                                <label 
                                    htmlFor="bulk-upload-input" 
                                    style={{ display: "block", textAlign: "center", padding: "10px 15px", background: "#3b82f6", color: "white", borderRadius: "5px", fontWeight: "600", cursor: "pointer" }}
                                >
                                    {uploadingBulk ? "⏳ Uploading..." : "📤 Upload Excel File"}
                                </label>
                            </div>
                        </div>

                        <h2>Registered Teachers</h2>
                        <div className="assignments-list" style={{ marginBottom: "30px" }}>
                            {users.filter(u => u.role === "teacher").map(u => (
                                <div key={u.id} className="assignment-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div>
                                        <h3 style={{ margin: 0, color: "#00a854" }}>{u.name}</h3>
                                        <p style={{ margin: "5px 0" }}><strong>Email:</strong> {u.email} | <strong>Teacher ID:</strong> {u.teacherId || "N/A"}</p>
                                        <p style={{ margin: "5px 0" }}><strong>Department:</strong> {u.department || "N/A"} | <strong>Course:</strong> {u.primaryCourse || "N/A"} | <strong>Institution:</strong> {u.institution || "N/A"}</p>
                                    </div>
                                </div>
                            ))}
                            {users.filter(u => u.role === "teacher").length === 0 && <p style={{ color: "#666" }}>No teachers registered yet.</p>}
                        </div>

                        <h2>Registered Students</h2>
                        <div className="assignments-list">
                            {users.filter(u => u.role === "student").map(u => (
                                <div key={u.id} className="assignment-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div>
                                        <h3 style={{ margin: 0, color: "#6a7dd6" }}>{u.name}</h3>
                                        <p style={{ margin: "5px 0" }}><strong>Email:</strong> {u.email} | <strong>Student ID:</strong> {u.studentId || "N/A"}</p>
                                        <p style={{ margin: "5px 0" }}><strong>Program / Major:</strong> {u.program || "N/A"}</p>
                                    </div>
                                </div>
                            ))}
                            {users.filter(u => u.role === "student").length === 0 && <p style={{ color: "#666" }}>No students registered yet.</p>}
                        </div>
                    </section>
                )}

                {activeTab === "assignments" && (
                    <section>
                        <h2>Global Assignment Oversight</h2>
                        <div className="assignments-list">
                            {allAssignments.map(a => (
                                <div key={a.id} className="assignment-card">
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <h3 className="assignment-title">{a.title}</h3>
                                        <button onClick={() => handleDeleteAssignment(a.id)} style={{ background: "#ef4444", color: "white", border: "none", padding: "5px 10px", borderRadius: "5px", cursor: "pointer" }}>Delete</button>
                                    </div>
                                    <p>Faculty: {a.createdBy?.name || "Unknown"}</p>
                                    <p>{a.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {activeTab === "projects" && (
                    <section>
                        <h2>Team & Project Management</h2>
                        <div className="assignments-list">
                            {allProjects.map(p => (
                                <div key={p.id} className="assignment-card">
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
                                        <h3 className="assignment-title">{getProjectTitle(p.projectId)}</h3>
                                        <button onClick={() => handleDeleteProject(p.id)} style={{ background: "#ef4444", color: "white", border: "none", padding: "5px 15px", borderRadius: "5px", cursor: "pointer" }}>Delete Project</button>
                                    </div>
                                    <ul style={{ listStyle: "none", padding: 0 }}>
                                        {p.members.map(m => (
                                            <li key={m.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
                                                <span>{m.name} ({m.email})</span>
                                                <button onClick={() => handleRemoveMember(p.id, m.id)} style={{ color: "#ef4444", border: "none", background: "none", cursor: "pointer", fontSize: "0.8rem" }}>Remove Student</button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {activeTab === "submissions" && (
                    <section>
                        <h2>Submission & Peer Review Oversight</h2>
                        <div className="assignments-list">
                            {allSubmissions.map(s => (
                                <div key={s.id} className="assignment-card">
                                    <h3 className="assignment-title">{s.assignment?.title}</h3>
                                    <p><strong>Student:</strong> {s.student?.name}</p>
                                    <p><strong>Grade:</strong> {s.grade !== null ? `${s.grade}` : "Not Graded"}</p>
                                    
                                    <div style={{ marginTop: "15px", borderTop: "1px solid #eee", paddingTop: "10px" }}>
                                        <strong>Peer Reviews Given to this Student:</strong>
                                        {s.peerReviews && s.peerReviews.length > 0 ? (
                                            s.peerReviews.map((r, i) => (
                                                <div key={i} style={{ padding: "10px", background: "#f8f9fa", borderRadius: "5px", marginTop: "10px" }}>
                                                    <p style={{ margin: 0 }}><strong>Reviewer:</strong> {r.author?.name}</p>
                                                    <p style={{ margin: 0 }}><strong>Score:</strong> {r.score}</p>
                                                    <p style={{ margin: "5px 0 0 0", fontStyle: "italic" }}>"{r.comment}"</p>
                                                </div>
                                            ))
                                        ) : <p>No peer reviews yet.</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ── PROJECT SUBMISSION REVIEW TAB ── */}
                {activeTab === "project-submissions" && (
                    <section>
                        <h2>📋 Project Link Submissions</h2>
                        <p style={{ color: "#6b7280", marginBottom: "16px" }}>Review, grade, and request revisions for student project submissions.</p>

                        {projectSubmissions.length === 0 && (
                            <p style={{ color: "#9ca3af", fontStyle: "italic" }}>No project submissions yet.</p>
                        )}

                        <div className="assignments-list">
                            {projectSubmissions.map(ps => (
                                <div key={ps.id} className="assignment-card" style={{ borderLeft: `4px solid ${
                                    ps.status === "reviewed" ? "#22c55e" :
                                    ps.status === "revision_requested" ? "#eab308" : "#3b82f6"
                                }` }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems:"flex-start", flexWrap: "wrap", gap: "8px" }}>
                                        <div>
                                            <h3 style={{ margin: 0, color: "#1e3a5f" }}>{getProjectTitle(ps.projectId)}</h3>
                                            <p style={{ margin: "4px 0", color: "#6b7280", fontSize: "0.875rem" }}>
                                                Submitted by <strong>{ps.submittedBy?.name}</strong> ({ps.submittedBy?.email})
                                                &nbsp;·&nbsp; v{ps.version}
                                                &nbsp;·&nbsp; {new Date(ps.submittedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <span style={{
                                            padding: "4px 12px",
                                            borderRadius: "999px",
                                            fontSize: "0.75rem",
                                            fontWeight: "700",
                                            background: ps.status === "reviewed" ? "#dcfce7" :
                                                        ps.status === "revision_requested" ? "#fef9c3" : "#dbeafe",
                                            color: ps.status === "reviewed" ? "#166534" :
                                                   ps.status === "revision_requested" ? "#854d0e" : "#1e40af"
                                        }}>
                                            {ps.status === "reviewed" ? "✅ Reviewed" :
                                             ps.status === "revision_requested" ? "🔄 Revision Requested" : "⏳ Pending"}
                                        </span>
                                    </div>

                                    <a href={ps.projectLink} target="_blank" rel="noopener noreferrer"
                                       style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#2563eb", fontWeight: 600, margin: "10px 0", textDecoration: "none", fontSize: "0.9rem" }}>
                                        🔗 {ps.projectLink}
                                    </a>

                                    {ps.description && (
                                        <p style={{ color: "#4b5563", fontSize: "0.875rem", margin: "4px 0" }}>
                                            <em>{ps.description}</em>
                                        </p>
                                    )}

                                    {/* Existing review */}
                                    {(ps.adminGrade != null || ps.adminRemarks || ps.improvements) && (
                                        <div style={{ marginTop: "10px", padding: "10px", background: "#f9fafb", borderRadius: "8px", fontSize: "0.875rem" }}>
                                            {ps.adminGrade != null && <p style={{ margin: 0 }}><strong>Grade:</strong> {ps.adminGrade}/100</p>}
                                            {ps.adminRemarks && <p style={{ margin: "4px 0" }}><strong>Remarks:</strong> {ps.adminRemarks}</p>}
                                            {ps.improvements && <p style={{ margin: "4px 0", color: "#92400e" }}><strong>Improvements:</strong> {ps.improvements}</p>}
                                        </div>
                                    )}

                                    <button
                                        onClick={() => {
                                            setReviewingSubmission(ps);
                                            setReviewGrade(ps.adminGrade ?? "");
                                            setReviewRemarks(ps.adminRemarks || "");
                                            setReviewImprovements(ps.improvements || "");
                                            setReviewStatus(ps.status === "submitted" ? "reviewed" : ps.status);
                                        }}
                                        style={{ marginTop: "12px", padding: "8px 20px", background: "#6a7dd6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}
                                    >
                                        ✏️ {ps.adminGrade != null ? "Edit Review" : "Review & Grade"}
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* ── Review Modal ── */}
                        {reviewingSubmission && (
                            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
                                <div style={{ background: "white", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "540px", boxShadow: "0 25px 60px rgba(0,0,0,0.2)" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                                        <h3 style={{ margin: 0 }}>Review: {getProjectTitle(reviewingSubmission.projectId)}</h3>
                                        <span style={{ cursor: "pointer", fontSize: "1.25rem" }} onClick={() => setReviewingSubmission(null)}>✕</span>
                                    </div>

                                    <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "16px" }}>
                                        Student: <strong>{reviewingSubmission.submittedBy?.name}</strong> · v{reviewingSubmission.version}
                                    </p>

                                    <a href={reviewingSubmission.projectLink} target="_blank" rel="noopener noreferrer"
                                       style={{ display: "block", marginBottom: "16px", color: "#2563eb", fontWeight: 600, fontSize: "0.875rem" }}>
                                        🔗 {reviewingSubmission.projectLink}
                                    </a>

                                    <div style={{ marginBottom: "14px" }}>
                                        <label style={{ display: "block", fontWeight: 700, fontSize: "0.8rem", color: "#374151", marginBottom: "6px" }}>GRADE (out of 100)</label>
                                        <input
                                            type="number" min="0" max="100"
                                            value={reviewGrade}
                                            onChange={e => setReviewGrade(e.target.value)}
                                            placeholder="e.g. 85"
                                            style={{ width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "1rem" }}
                                        />
                                    </div>

                                    <div style={{ marginBottom: "14px" }}>
                                        <label style={{ display: "block", fontWeight: 700, fontSize: "0.8rem", color: "#374151", marginBottom: "6px" }}>REMARKS</label>
                                        <textarea
                                            rows={3}
                                            value={reviewRemarks}
                                            onChange={e => setReviewRemarks(e.target.value)}
                                            placeholder="Write overall feedback about the project..."
                                            style={{ width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px", resize: "vertical", fontSize: "0.9rem" }}
                                        />
                                    </div>

                                    <div style={{ marginBottom: "14px" }}>
                                        <label style={{ display: "block", fontWeight: 700, fontSize: "0.8rem", color: "#374151", marginBottom: "6px" }}>IMPROVEMENTS NEEDED</label>
                                        <textarea
                                            rows={3}
                                            value={reviewImprovements}
                                            onChange={e => setReviewImprovements(e.target.value)}
                                            placeholder="Specific things the team should fix or improve..."
                                            style={{ width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px", resize: "vertical", fontSize: "0.9rem" }}
                                        />
                                    </div>

                                    <div style={{ marginBottom: "20px" }}>
                                        <label style={{ display: "block", fontWeight: 700, fontSize: "0.8rem", color: "#374151", marginBottom: "6px" }}>DECISION</label>
                                        <div style={{ display: "flex", gap: "10px" }}>
                                            <button
                                                onClick={() => setReviewStatus("reviewed")}
                                                style={{ flex: 1, padding: "10px", border: "2px solid", borderColor: reviewStatus === "reviewed" ? "#22c55e" : "#e5e7eb", borderRadius: "8px", cursor: "pointer", fontWeight: 700, color: reviewStatus === "reviewed" ? "#166534" : "#6b7280", background: reviewStatus === "reviewed" ? "#dcfce7" : "white" }}
                                            >✅ Approve</button>
                                            <button
                                                onClick={() => setReviewStatus("revision_requested")}
                                                style={{ flex: 1, padding: "10px", border: "2px solid", borderColor: reviewStatus === "revision_requested" ? "#eab308" : "#e5e7eb", borderRadius: "8px", cursor: "pointer", fontWeight: 700, color: reviewStatus === "revision_requested" ? "#854d0e" : "#6b7280", background: reviewStatus === "revision_requested" ? "#fef9c3" : "white" }}
                                            >🔄 Request Revision</button>
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", gap: "10px" }}>
                                        <button onClick={() => setReviewingSubmission(null)}
                                            style={{ flex: 1, padding: "12px", border: "1px solid #d1d5db", borderRadius: "8px", cursor: "pointer", background: "white", fontWeight: 600 }}>
                                            Cancel
                                        </button>
                                        <button onClick={handleReviewProjectSubmission} disabled={savingReview}
                                            style={{ flex: 2, padding: "12px", background: "#6a7dd6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 700 }}>
                                            {savingReview ? "Saving..." : "💾 Save Review"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                )}
            </main>
        </div>
    );
};

export default Admin;
