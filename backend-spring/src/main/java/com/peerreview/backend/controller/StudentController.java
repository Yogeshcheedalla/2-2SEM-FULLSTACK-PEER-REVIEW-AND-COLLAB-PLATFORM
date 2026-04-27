package com.peerreview.backend.controller;

import com.peerreview.backend.model.Assignment;
import com.peerreview.backend.model.Submission;
import com.peerreview.backend.model.User;
import com.peerreview.backend.repository.UserRepository;
import com.peerreview.backend.service.AssignmentService;
import com.peerreview.backend.service.SubmissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/student")
@CrossOrigin(origins = "*")
public class StudentController {

    @Autowired
    private AssignmentService assignmentService;

    @Autowired
    private SubmissionService submissionService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/assignments")
    public ResponseEntity<List<Assignment>> getStudentAssignments() {
        return ResponseEntity.ok(assignmentService.getAllAssignments());
    }

    @GetMapping("/submissions")
    public ResponseEntity<?> getStudentSubmissions(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        Optional<User> userOpt = userRepository.findByEmail(principal.getName());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "User not found"));
        }
        
        List<Submission> submissions = submissionService.getSubmissionsByStudent(userOpt.get());
        return ResponseEntity.ok(submissions);
    }
}
