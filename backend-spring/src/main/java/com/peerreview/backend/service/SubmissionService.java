package com.peerreview.backend.service;

import com.peerreview.backend.model.Submission;
import com.peerreview.backend.model.User;
import com.peerreview.backend.model.Assignment;
import com.peerreview.backend.repository.SubmissionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class SubmissionService {
    @Autowired
    private SubmissionRepository submissionRepository;

    public Submission submitAssignment(Submission submission) {
        return submissionRepository.save(submission);
    }

    public List<Submission> getSubmissionsByStudent(User student) {
        return submissionRepository.findByStudent(student);
    }

    public List<Submission> getSubmissionsByAssignment(Assignment assignment) {
        return submissionRepository.findByAssignment(assignment);
    }

    public long countSubmissions(Assignment assignment, User student) {
        return submissionRepository.countByAssignmentAndStudent(assignment, student);
    }

    public Submission getSubmission(Long id) {
        return submissionRepository.findById(id).orElse(null);
    }

    public Submission gradeSubmission(Submission submission, Integer grade, String feedback, User teacher) {
        submission.setGrade(grade);
        submission.setTeacherFeedback(feedback);
        submission.setGradedBy(teacher);
        return submissionRepository.save(submission);
    }
}
