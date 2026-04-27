package com.peerreview.backend.repository;

import com.peerreview.backend.model.Review;
import com.peerreview.backend.model.Submission;
import com.peerreview.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findBySubmission(Submission submission);
    List<Review> findByAuthor(User author);
}
