package com.peerreview.backend.controller;

import com.peerreview.backend.model.ProjectTeam;
import com.peerreview.backend.model.User;
import com.peerreview.backend.repository.ProjectTeamRepository;
import com.peerreview.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/projects")
@CrossOrigin(origins = "*")
public class ProjectTeamController {

    @Autowired
    private ProjectTeamRepository projectTeamRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/{id}/team")
    public ResponseEntity<?> getTeam(@PathVariable Integer id) {
        Optional<ProjectTeam> teamOpt = projectTeamRepository.findByProjectId(id);
        if (teamOpt.isEmpty()) {
            return ResponseEntity.ok(Map.of("members", new ArrayList<>()));
        }
        return ResponseEntity.ok(teamOpt.get());
    }

    @PostMapping("/{id}/join")
    public ResponseEntity<?> joinTeam(@PathVariable Integer id, java.security.Principal principal) {
        String email = principal.getName();
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) return ResponseEntity.status(404).body(Map.of("message", "User not found"));
        
        User user = userOpt.get();
        Long userId = user.getId();

        ProjectTeam team = projectTeamRepository.findByProjectId(id)
                .orElse(ProjectTeam.builder()
                        .projectId(id)
                        .members(new ArrayList<>())
                        .createdAt(new java.util.Date())
                        .build());
        
        if (team.getMembers().stream().anyMatch(m -> m.getId().equals(userId))) {
            return ResponseEntity.status(400).body(Map.of("message", "You are already in this team"));
        }

        if (team.getMembers().size() >= 3) {
            return ResponseEntity.status(400).body(Map.of("message", "Max limit reached (3 members)"));
        }

        team.getMembers().add(user);
        projectTeamRepository.save(team);

        return ResponseEntity.ok(Map.of("message", "Joined team successfully", "team", team));
    }
}
