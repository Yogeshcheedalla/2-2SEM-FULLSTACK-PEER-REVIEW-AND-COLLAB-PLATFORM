package com.peerreview.backend.repository;

import com.peerreview.backend.model.Assignment;
import com.peerreview.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AssignmentRepository extends JpaRepository<Assignment, Long> {
    List<Assignment> findByCreatedBy(User user);
    List<Assignment> findAllByOrderByCreatedAtDesc();
}
