package com.peerreview.backend.repository;

import com.peerreview.backend.model.Comment;
import com.peerreview.backend.model.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findBySubmission(Submission submission);
}
