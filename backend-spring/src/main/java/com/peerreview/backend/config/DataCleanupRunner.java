package com.peerreview.backend.config;

import com.peerreview.backend.model.ProjectSubmission;
import com.peerreview.backend.repository.ProjectSubmissionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataCleanupRunner implements CommandLineRunner {

    @Autowired
    private ProjectSubmissionRepository repository;

    @Override
    public void run(String... args) throws Exception {
        System.out.println("Checking for project to delete...");
        List<ProjectSubmission> submissions = repository.findAll();
        for (ProjectSubmission sub : submissions) {
            if (sub.getProjectId() != null && sub.getProjectId() == 3 && 
                sub.getSubmittedBy() != null && "Yogesh Cheedalla".equals(sub.getSubmittedBy().getName())) {
                System.out.println("Deleting project submission ID: " + sub.getId());
                repository.delete(sub);
            }
        }
    }
}
