package com.peerreview.backend.controller;

import com.peerreview.backend.model.Assignment;
import com.peerreview.backend.model.User;
import com.peerreview.backend.repository.AssignmentRepository;
import com.peerreview.backend.repository.UserRepository;
import com.peerreview.backend.service.AssignmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/assignments")
@CrossOrigin(origins = "*")
public class AssignmentController {

    @Autowired
    private AssignmentService assignmentService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AssignmentRepository assignmentRepository;

    @PostMapping
    public ResponseEntity<?> createAssignment(@RequestBody Assignment assignment, Authentication auth) {
        try {
            if (auth != null && auth.getName() != null) {
                Optional<User> userOpt = userRepository.findByEmail(auth.getName());
                userOpt.ifPresent(assignment::setCreatedBy);
            }
            Assignment saved = assignmentService.createAssignment(assignment);
            return ResponseEntity.ok(Map.of("message", "Assignment Created", "assignment", saved));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error creating assignment", "error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<Assignment>> getTeacherAssignments(Authentication auth) {
        if (auth != null && auth.getName() != null) {
            Optional<User> userOpt = userRepository.findByEmail(auth.getName());
            if (userOpt.isPresent()) {
                // Return ONLY the assignments created by this teacher
                return ResponseEntity.ok(assignmentRepository.findByCreatedBy(userOpt.get()));
            }
        }
        return ResponseEntity.ok(assignmentService.getAllAssignments());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Assignment> getAssignment(@PathVariable Long id) {
        Assignment assignment = assignmentService.getAssignment(id);
        if (assignment == null) return ResponseEntity.status(404).body(null);
        return ResponseEntity.ok(assignment);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateAssignment(@PathVariable Long id, @RequestBody Assignment updatedAssignment, Authentication auth) {
        try {
            Assignment existing = assignmentService.getAssignment(id);
            if (existing == null) {
                return ResponseEntity.status(404).body(Map.of("message", "Assignment not found"));
            }

            // Verify the teacher owns this assignment before allowing an update
            if (auth != null && auth.getName() != null) {
                Optional<User> userOpt = userRepository.findByEmail(auth.getName());
                if (userOpt.isPresent() && existing.getCreatedBy() != null) {
                    if (!existing.getCreatedBy().getId().equals(userOpt.get().getId())) {
                        return ResponseEntity.status(403).body(Map.of("message", "You are not authorized to edit this assignment"));
                    }
                }
            }

            Assignment saved = assignmentService.updateAssignment(id, updatedAssignment);
            return ResponseEntity.ok(Map.of("message", "Assignment Updated Successfully", "assignment", saved));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error updating assignment", "error", e.getMessage()));
        }
    }

    @GetMapping("/all")
    public ResponseEntity<List<Assignment>> getAllAssignments() {
        return ResponseEntity.ok(assignmentService.getAllAssignments());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAssignment(@PathVariable Long id, Authentication auth) {
        try {
            Assignment existing = assignmentService.getAssignment(id);
            if (existing == null) {
                return ResponseEntity.status(404).body(Map.of("message", "Assignment not found"));
            }

            // Verify the teacher owns this assignment before allowing deletion
            if (auth != null && auth.getName() != null) {
                Optional<User> userOpt = userRepository.findByEmail(auth.getName());
                if (userOpt.isPresent() && existing.getCreatedBy() != null) {
                    if (!existing.getCreatedBy().getId().equals(userOpt.get().getId())) {
                        return ResponseEntity.status(403).body(Map.of("message", "You are not authorized to delete this assignment"));
                    }
                }
            }

            assignmentRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Assignment deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error deleting assignment", "error", e.getMessage()));
        }
    }
}
