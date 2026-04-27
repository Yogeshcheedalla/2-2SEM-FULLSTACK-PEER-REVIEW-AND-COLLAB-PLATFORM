package com.peerreview.backend.controller;

import com.peerreview.backend.model.Review;
import com.peerreview.backend.model.Submission;
import com.peerreview.backend.model.User;
import com.peerreview.backend.repository.ReviewRepository;
import com.peerreview.backend.repository.SubmissionRepository;
import com.peerreview.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/submissions")
@CrossOrigin(origins = "*")
public class ReviewController {

    @Autowired
    private ReviewRepository reviewRepository;
    @Autowired
    private SubmissionRepository submissionRepository;
    @Autowired
    private UserRepository userRepository;

    @PostMapping("/{id}/reviews")
    public ResponseEntity<?> submitReview(@PathVariable Long id, @RequestBody Map<String, Object> body, java.security.Principal principal) {
        Integer score = (Integer) body.get("score");
        String commentText = (String) body.get("comment");

        String email = principal.getName();
        User user = userRepository.findByEmail(email).orElse(null);
        Submission submission = submissionRepository.findById(id).orElse(null);
        
        if (submission == null || user == null) return ResponseEntity.status(404).body(Map.of("message", "Not found"));

        Review review = Review.builder()
                .submission(submission)
                .author(user)
                .score(score)
                .comment(commentText)
                .build();
        reviewRepository.save(review);

        return ResponseEntity.ok(Map.of("message", "Review Saved", "review", review));
    }
}
