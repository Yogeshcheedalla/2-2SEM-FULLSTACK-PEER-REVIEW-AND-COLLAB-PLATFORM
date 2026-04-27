package com.peerreview.backend.service;

import com.peerreview.backend.model.Assignment;
import com.peerreview.backend.repository.AssignmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class AssignmentService {
    @Autowired
    private AssignmentRepository assignmentRepository;

    public Assignment createAssignment(Assignment assignment) {
        return assignmentRepository.save(assignment);
    }

    public List<Assignment> getAllAssignments() {
        return assignmentRepository.findAllByOrderByCreatedAtDesc();
    }

    public Assignment getAssignment(Long id) {
        return assignmentRepository.findById(id).orElse(null);
    }

    public Assignment updateAssignment(Long id, Assignment updatedAssignment) {
        return assignmentRepository.findById(id).map(existing -> {
            if (updatedAssignment.getTitle() != null) existing.setTitle(updatedAssignment.getTitle());
            if (updatedAssignment.getDescription() != null) existing.setDescription(updatedAssignment.getDescription());
            if (updatedAssignment.getDeadline() != null) existing.setDeadline(updatedAssignment.getDeadline());
            if (updatedAssignment.getMaxScore() != null) existing.setMaxScore(updatedAssignment.getMaxScore());
            if (updatedAssignment.getAttachmentUrl() != null) existing.setAttachmentUrl(updatedAssignment.getAttachmentUrl());
            if (updatedAssignment.getAttachmentName() != null) existing.setAttachmentName(updatedAssignment.getAttachmentName());
            return assignmentRepository.save(existing);
        }).orElseThrow(() -> new RuntimeException("Assignment not found"));
    }
}
