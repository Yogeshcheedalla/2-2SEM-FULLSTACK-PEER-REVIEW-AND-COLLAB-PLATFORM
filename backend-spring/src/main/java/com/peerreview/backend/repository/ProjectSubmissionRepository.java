package com.peerreview.backend.repository;

import com.peerreview.backend.model.ProjectSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectSubmissionRepository extends JpaRepository<ProjectSubmission, Long> {
    // Find all submissions for a specific project
    List<ProjectSubmission> findByProjectIdOrderByVersionDesc(Integer projectId);

    // Find the latest submission for a project by a specific student
    Optional<ProjectSubmission> findTopByProjectIdAndSubmittedByIdOrderByVersionDesc(Integer projectId, Long userId);

    // All submissions (for admin view)
    List<ProjectSubmission> findAllByOrderBySubmittedAtDesc();
}
