package com.peerreview.backend.controller;

import com.peerreview.backend.model.Submission;
import com.peerreview.backend.model.Assignment;
import com.peerreview.backend.service.SubmissionService;
import com.peerreview.backend.service.AssignmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/submissions")
@CrossOrigin(origins = "*")
public class SubmissionController {

    @Autowired
    private SubmissionService submissionService;
    @Autowired
    private AssignmentService assignmentService;
    @Autowired
    private com.peerreview.backend.repository.UserRepository userRepository;

    @PostMapping("/assignments/{assignmentId}/submit")
    public ResponseEntity<?> submitAssignment(@PathVariable Long assignmentId, @RequestBody Submission submission, java.security.Principal principal) {
        try {
            Assignment assignment = assignmentService.getAssignment(assignmentId);
            if (assignment == null) return ResponseEntity.status(404).body(Map.of("message", "Assignment not found"));
            
            String email = principal.getName();
            com.peerreview.backend.model.User student = userRepository.findByEmail(email).orElse(null);
            if (student == null) return ResponseEntity.status(404).body(Map.of("message", "Student not found"));

            submission.setAssignment(assignment);
            submission.setStudent(student);
            
            Submission saved = submissionService.submitAssignment(submission);
            return ResponseEntity.ok(Map.of("message", "Submission Saved", "submission", saved));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Submission error", "error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/grade")
    public ResponseEntity<?> gradeSubmission(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            Submission submission = submissionService.getSubmission(id);
            if (submission == null) return ResponseEntity.status(404).body(Map.of("message", "Submission not found"));
            
            Integer grade = body.get("grade") != null ? ((Number) body.get("grade")).intValue() : null;
            String feedback = body.get("feedback") != null ? body.get("feedback").toString() : null;
            submissionService.gradeSubmission(submission, grade, feedback, null); 
            return ResponseEntity.ok(submission);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error grading submission", "error", e.getMessage()));
        }
    }

    @Transactional
    @GetMapping("/assignments/{assignmentId}")
    public ResponseEntity<List<Submission>> getSubmissionsByAssignment(@PathVariable Long assignmentId) {
        Assignment assignment = assignmentService.getAssignment(assignmentId);
        if (assignment == null) return ResponseEntity.status(404).body(null);
        List<Submission> submissions = submissionService.getSubmissionsByAssignment(assignment);
        // Force-load lazy fields within the transaction
        for (Submission s : submissions) {
            if (s.getStudent() != null) s.getStudent().getId();
            if (s.getAssignment() != null) s.getAssignment().getId();
            if (s.getPeerReviews() != null) s.getPeerReviews().size();
        }
        return ResponseEntity.ok(submissions);
    }
}
