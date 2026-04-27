package com.peerreview.backend.controller;

import com.peerreview.backend.model.ProjectReview;
import com.peerreview.backend.model.ProjectSubmission;
import com.peerreview.backend.model.User;
import com.peerreview.backend.repository.ProjectReviewRepository;
import com.peerreview.backend.repository.ProjectSubmissionRepository;
import com.peerreview.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/project-reviews")
@CrossOrigin(origins = "*")
@Tag(name = "Project Reviews", description = "Endpoints for submitting and managing peer feedback on projects")
public class ProjectReviewController {

    @Autowired
    private ProjectReviewRepository projectReviewRepository;

    @Autowired
    private ProjectSubmissionRepository projectSubmissionRepository;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/{submissionId}")
    @Transactional
    @Operation(summary = "Submit a peer review", description = "Authenticated students can submit a score (1-5) and comment on a peer's project link submission.")
    public ResponseEntity<?> submitReview(
            @PathVariable Long submissionId,
            @RequestBody Map<String, Object> body,
            Principal principal) {
        try {
            User author = userRepository.findByEmail(principal.getName())
                    .orElseThrow(() -> new RuntimeException("Author not found"));

            ProjectSubmission sub = projectSubmissionRepository.findById(submissionId)
                    .orElseThrow(() -> new RuntimeException("Submission not found"));

            Integer score = (Integer) body.get("score");
            String comment = (String) body.get("comment");

            if (score == null || comment == null || comment.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Score and comment are required"));
            }

            ProjectReview review = ProjectReview.builder()
                    .projectSubmission(sub)
                    .author(author)
                    .score(score)
                    .comment(comment)
                    .build();

            projectReviewRepository.save(review);
            return ResponseEntity.ok(Map.of("message", "Review submitted successfully", "review", review));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", e.getMessage()));
        }
    }
}
