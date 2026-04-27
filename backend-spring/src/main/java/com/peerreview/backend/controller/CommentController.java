package com.peerreview.backend.controller;

import com.peerreview.backend.model.Comment;
import com.peerreview.backend.model.Submission;
import com.peerreview.backend.model.User;
import com.peerreview.backend.repository.CommentRepository;
import com.peerreview.backend.repository.SubmissionRepository;
import com.peerreview.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/submissions")
@CrossOrigin(origins = "*")
public class CommentController {

    @Autowired
    private CommentRepository commentRepository;
    @Autowired
    private SubmissionRepository submissionRepository;
    @Autowired
    private UserRepository userRepository;

    @PostMapping("/{id}/comments")
    public ResponseEntity<?> addComment(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String text = body.get("text");
        String userIdStr = body.get("userId");
        Long userId = Long.parseLong(userIdStr);
        
        Submission submission = submissionRepository.findById(id).orElse(null);
        User user = userRepository.findById(userId).orElse(null);
        
        if (submission == null || user == null) return ResponseEntity.status(404).body(Map.of("message", "Not found"));

        Comment comment = Comment.builder()
                .submission(submission)
                .author(user)
                .text(text)
                .build();
        commentRepository.save(comment);
        
        if (submission.getComments() == null) {
            submission.setComments(new java.util.ArrayList<>());
        }
        submission.getComments().add(comment);
        submissionRepository.save(submission);

        return ResponseEntity.ok(Map.of("message", "Comment Added", "comment", comment));
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<List<Comment>> getComments(@PathVariable Long id) {
        Submission submission = submissionRepository.findById(id).orElse(null);
        if (submission == null) return ResponseEntity.status(404).body(null);
        return ResponseEntity.ok(commentRepository.findBySubmission(submission));
    }
}
