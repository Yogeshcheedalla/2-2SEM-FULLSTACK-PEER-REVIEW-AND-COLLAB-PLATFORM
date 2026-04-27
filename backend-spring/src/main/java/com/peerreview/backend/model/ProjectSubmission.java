package com.peerreview.backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "project_submissions")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ProjectSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Which project (matches projectId in ProjectTeam)
    private Integer projectId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "submitted_by_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private User submittedBy;

    @Column(nullable = false, length = 2048)
    private String projectLink;

    @Column(columnDefinition = "TEXT")
    private String description; // Optional note from student

    // Admin review fields
    private Integer adminGrade;

    @Column(columnDefinition = "TEXT")
    private String adminRemarks;

    @Column(columnDefinition = "TEXT")
    private String improvements; // Specific improvement suggestions

    // Status: "submitted" | "reviewed" | "revision_requested"
    @Builder.Default
    private String status = "submitted";

    // Version number (increments on each resubmission)
    @Builder.Default
    private Integer version = 1;

    @CreationTimestamp
    private LocalDateTime submittedAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "projectSubmission", fetch = FetchType.EAGER, cascade = CascadeType.ALL, orphanRemoval = true)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"projectSubmission"})
    private java.util.List<ProjectReview> projectReviews;
}
