package com.peerreview.backend.repository;

import com.peerreview.backend.model.ProjectReview;
import com.peerreview.backend.model.ProjectSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectReviewRepository extends JpaRepository<ProjectReview, Long> {
    List<ProjectReview> findByProjectSubmission(ProjectSubmission submission);
    List<ProjectReview> findByProjectSubmissionId(Long submissionId);
}
