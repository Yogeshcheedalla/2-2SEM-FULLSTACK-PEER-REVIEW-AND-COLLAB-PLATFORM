package com.peerreview.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "submissions")
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Submission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", nullable = false)
    private Assignment assignment;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;
    
    private String fileUrl;
    private String submissionFileName; // Original filename for display
    
    @Column(columnDefinition = "TEXT")
    private String text;
    
    @Builder.Default
    @Temporal(TemporalType.TIMESTAMP)
    private Date submittedAt = new Date();
    
    @Builder.Default
    private Integer grade = null;
    
    @Builder.Default
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "graded_by_id")
    private User gradedBy = null;
    
    @OneToMany(mappedBy = "submission", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Comment> comments;

    @OneToMany(mappedBy = "submission", fetch = FetchType.EAGER, cascade = CascadeType.ALL, orphanRemoval = true)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"submission"})
    private List<Review> peerReviews;
    
    @Builder.Default
    private String status = "submitted"; // "submitted", "removed"

    @Column(columnDefinition = "TEXT")
    private String teacherFeedback;
}
