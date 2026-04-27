package com.peerreview.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Date;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "project_teams")
public class ProjectTeam {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private Integer projectId;
    
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "project_team_members",
        joinColumns = @JoinColumn(name = "team_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private List<User> members;
    
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt = new Date();
}
