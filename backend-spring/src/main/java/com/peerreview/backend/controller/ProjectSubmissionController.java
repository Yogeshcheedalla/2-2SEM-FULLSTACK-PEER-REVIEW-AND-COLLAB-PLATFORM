package com.peerreview.backend.controller;

import com.peerreview.backend.model.ProjectSubmission;
import com.peerreview.backend.model.User;
import com.peerreview.backend.repository.ProjectSubmissionRepository;
import com.peerreview.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/project-submissions")
@CrossOrigin(origins = "*")
@Tag(name = "Project Submissions", description = "Endpoints for students to submit project links and for admins/peers to review them")
public class ProjectSubmissionController {

    @Autowired
    private ProjectSubmissionRepository projectSubmissionRepository;

    @Autowired
    private UserRepository userRepository;

    // ── STUDENT: Submit or resubmit a project link ──────────────────

    @PostMapping("/projects/{projectId}/submit")
    @Transactional
    @Operation(summary = "Submit/Resubmit project link", description = "Allows students to submit or update their project link (e.g., GitHub URL) for a specific assignment project.")
    public ResponseEntity<?> submitProjectLink(
            @PathVariable Integer projectId,
            @RequestBody Map<String, String> body,
            Principal principal) {
        try {
            User student = userRepository.findByEmail(principal.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            String link = body.get("projectLink");
            String description = body.get("description");

            if (link == null || link.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Project link is required"));
            }

            // Check if student already has a submission → resubmit (new version)
            Optional<ProjectSubmission> existing = projectSubmissionRepository
                    .findTopByProjectIdAndSubmittedByIdOrderByVersionDesc(projectId, student.getId());

            ProjectSubmission submission;
            if (existing.isPresent()) {
                ProjectSubmission prev = existing.get();
                submission = ProjectSubmission.builder()
                        .projectId(projectId)
                        .submittedBy(student)
                        .projectLink(link)
                        .description(description)
                        .status("submitted")
                        .version(prev.getVersion() + 1)
                        .build();
            } else {
                submission = ProjectSubmission.builder()
                        .projectId(projectId)
                        .submittedBy(student)
                        .projectLink(link)
                        .description(description)
                        .build();
            }

            projectSubmissionRepository.save(submission);
            return ResponseEntity.ok(Map.of("message", "Project submitted successfully", "submission", submission));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", e.getMessage()));
        }
    }

    // ── STUDENT: Get their own latest submission for a project ──────

    @GetMapping("/projects/{projectId}/mine")
    @Transactional
    public ResponseEntity<?> getMySubmission(@PathVariable Integer projectId, Principal principal) {
        try {
            User student = userRepository.findByEmail(principal.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Optional<ProjectSubmission> sub = projectSubmissionRepository
                    .findTopByProjectIdAndSubmittedByIdOrderByVersionDesc(projectId, student.getId());

            return ResponseEntity.ok(sub.orElse(null));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", e.getMessage()));
        }
    }

    // ── ADMIN: Get ALL project submissions ──────────────────────────

    @GetMapping("/admin/all")
    @Transactional
    public ResponseEntity<List<ProjectSubmission>> getAllSubmissions() {
        return ResponseEntity.ok(projectSubmissionRepository.findAllByOrderBySubmittedAtDesc());
    }

    // ── ADMIN: Get submissions for a specific project ───────────────

    @GetMapping("/admin/projects/{projectId}")
    @Transactional
    public ResponseEntity<List<ProjectSubmission>> getSubmissionsForProject(@PathVariable Integer projectId) {
        return ResponseEntity.ok(projectSubmissionRepository.findByProjectIdOrderByVersionDesc(projectId));
    }

    // ── ADMIN: Grade + add remarks + improvements ───────────────────

    @PatchMapping("/admin/{submissionId}/review")
    @Transactional
    public ResponseEntity<?> reviewSubmission(
            @PathVariable Long submissionId,
            @RequestBody Map<String, Object> body) {
        try {
            ProjectSubmission sub = projectSubmissionRepository.findById(submissionId)
                    .orElseThrow(() -> new RuntimeException("Submission not found"));

            if (body.containsKey("adminGrade") && body.get("adminGrade") != null) {
                sub.setAdminGrade(((Number) body.get("adminGrade")).intValue());
            }
            if (body.containsKey("adminRemarks")) {
                sub.setAdminRemarks(body.get("adminRemarks") != null ? body.get("adminRemarks").toString() : null);
            }
            if (body.containsKey("improvements")) {
                sub.setImprovements(body.get("improvements") != null ? body.get("improvements").toString() : null);
            }
            // Status: "reviewed" (approved) or "revision_requested"
            if (body.containsKey("status")) {
                sub.setStatus(body.get("status").toString());
            } else {
                sub.setStatus("reviewed");
            }

            projectSubmissionRepository.save(sub);
            return ResponseEntity.ok(Map.of("message", "Review saved successfully", "submission", sub));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", e.getMessage()));
        }
    }

    // ── GALLERY: Students see ALL project links except their own ─────

    @GetMapping("/gallery")
    @Transactional
    @Operation(summary = "Get latest project submissions for gallery", description = "Retrieves a list of the most recent project links submitted by other students for peer review. Excludes the current student's own submissions.")
    public ResponseEntity<?> getGallerySubmissions(Principal principal) {
        try {
            User currentStudent = userRepository.findByEmail(principal.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Get all submissions, ordered by date descending
            List<ProjectSubmission> all = projectSubmissionRepository.findAllByOrderBySubmittedAtDesc();

            // We only want the *latest* version for each projectId / student combo
            // And we exclude the current student's own submissions
            java.util.Map<String, ProjectSubmission> latestSubmissions = new java.util.LinkedHashMap<>();
            
            for (ProjectSubmission sub : all) {
                if (sub.getSubmittedBy().getId().equals(currentStudent.getId())) continue;
                
                String key = sub.getProjectId() + "_" + sub.getSubmittedBy().getId();
                if (!latestSubmissions.containsKey(key)) {
                    latestSubmissions.put(key, sub);
                }
            }

            return ResponseEntity.ok(new java.util.ArrayList<>(latestSubmissions.values()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", e.getMessage()));
        }
    }
}
