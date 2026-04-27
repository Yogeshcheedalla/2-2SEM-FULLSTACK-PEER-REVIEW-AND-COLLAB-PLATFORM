package com.peerreview.backend.dto;

import lombok.Data;

@Data
public class UserDto {
    private Long id;
    private String name;
    private String email;
    private String role;
    
    // Role-specific fields
    private String department;
    private String institution;
    private String studentId;
    private String teacherId;
    private String program;
    private String primaryCourse;
}
