package com.peerreview.backend.repository;

import com.peerreview.backend.model.ProjectTeam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ProjectTeamRepository extends JpaRepository<ProjectTeam, Long> {
    Optional<ProjectTeam> findByProjectId(Integer projectId);
}
