package com.peerreview.backend.repository;

import com.peerreview.backend.model.Submission;
import com.peerreview.backend.model.User;
import com.peerreview.backend.model.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    List<Submission> findByStudent(User student);
    List<Submission> findByAssignment(Assignment assignment);
    long countByAssignmentAndStudent(Assignment assignment, User student);
}
