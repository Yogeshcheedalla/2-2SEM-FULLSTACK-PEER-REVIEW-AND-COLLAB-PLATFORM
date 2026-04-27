package com.peerreview.backend.controller;

import com.peerreview.backend.dto.UserDto;
import com.peerreview.backend.dto.UserRegistrationDto;
import com.peerreview.backend.model.*;
import com.peerreview.backend.repository.*;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.web.multipart.MultipartFile;
import java.io.InputStream;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AssignmentRepository assignmentRepository;

    @Autowired
    private SubmissionRepository submissionRepository;

    @Autowired
    private ProjectTeamRepository projectTeamRepository;
    
    @Autowired
    private ModelMapper modelMapper;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // ===============================
    // USER MANAGEMENT
    // ===============================

    @PostMapping("/users")
    public ResponseEntity<?> createUser(@RequestBody UserRegistrationDto userDto) {
        if (userRepository.findByEmail(userDto.getEmail()).isPresent()) {
            return ResponseEntity.status(400).body(Map.of("message", "User already exists"));
        }
        
        User user = modelMapper.map(userDto, User.class);
        user.setPassword(passwordEncoder.encode(userDto.getPassword() != null ? userDto.getPassword() : "password123"));
        userRepository.save(user);
        
        UserDto savedUserDto = modelMapper.map(user, UserDto.class);
        return ResponseEntity.ok(Map.of("message", "User created successfully", "user", savedUserDto));
    }

    @PostMapping(value = "/users/bulk-upload", consumes = {"multipart/form-data"})
    public ResponseEntity<?> bulkUploadUsers(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "File is empty"));
        }
        
        int added = 0;
        int skipped = 0;

        try (InputStream is = file.getInputStream(); Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            
            // Assume Row 0 is header: Name, Email, Role, Department, Institution, StudentID, TeacherID, Program, PrimaryCourse
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                
                String name = getCellStringValue(row.getCell(0));
                String email = getCellStringValue(row.getCell(1));
                String role = getCellStringValue(row.getCell(2)); // "student" or "teacher"
                
                if (name == null || name.isBlank() || email == null || email.isBlank()) {
                    continue; // Skip invalid rows
                }
                
                if (userRepository.findByEmail(email).isPresent()) {
                    skipped++;
                    continue;
                }
                
                String department = getCellStringValue(row.getCell(3));
                String institution = getCellStringValue(row.getCell(4));
                String studentId = getCellStringValue(row.getCell(5));
                String teacherId = getCellStringValue(row.getCell(6));
                String program = getCellStringValue(row.getCell(7));
                String primaryCourse = getCellStringValue(row.getCell(8));
                
                User user = User.builder()
                    .name(name)
                    .email(email)
                    .role(role != null && !role.isBlank() ? role.toLowerCase() : "student")
                    .password(passwordEncoder.encode("password123"))
                    .department(department)
                    .institution(institution)
                    .studentId(studentId)
                    .teacherId(teacherId)
                    .program(program)
                    .primaryCourse(primaryCourse)
                    .build();
                    
                userRepository.save(user);
                added++;
            }
            
            return ResponseEntity.ok(Map.of("message", "Bulk upload completed.", "added", added, "skipped", skipped));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error processing file: " + e.getMessage()));
        }
    }
    
    private String getCellStringValue(Cell cell) {
        if (cell == null) return null;
        DataFormatter formatter = new DataFormatter();
        return formatter.formatCellValue(cell).trim();
    }

    @GetMapping("/users/template")
    public ResponseEntity<byte[]> downloadTemplate() {
        try (Workbook workbook = new XSSFWorkbook(); java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Users");
            Row header = sheet.createRow(0);
            String[] columns = {"Name", "Email", "Role (student/teacher)", "Department", "Institution", "StudentID", "TeacherID", "Program", "PrimaryCourse"};
            
            for (int i = 0; i < columns.length; i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(columns[i]);
                CellStyle style = workbook.createCellStyle();
                Font font = workbook.createFont();
                font.setBold(true);
                style.setFont(font);
                cell.setCellStyle(style);
            }
            
            Row example = sheet.createRow(1);
            example.createCell(0).setCellValue("John Doe");
            example.createCell(1).setCellValue("john@student.edu");
            example.createCell(2).setCellValue("student");
            example.createCell(3).setCellValue("CS");
            example.createCell(4).setCellValue("State Uni");
            example.createCell(5).setCellValue("S12345");
            example.createCell(7).setCellValue("B.Tech");

            workbook.write(out);
            
            return ResponseEntity.ok()
                    .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=user_upload_template.xlsx")
                    .header(org.springframework.http.HttpHeaders.CONTENT_TYPE, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                    .body(out.toByteArray());
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        List<UserDto> users = userRepository.findAll().stream()
                .map(user -> modelMapper.map(user, UserDto.class))
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    // ===============================
    // ASSIGNMENT OVERSIGHT
    // ===============================

    @GetMapping("/assignments")
    public ResponseEntity<List<Assignment>> getAllAssignments() {
        return ResponseEntity.ok(assignmentRepository.findAll());
    }

    @DeleteMapping("/assignments/{id}")
    public ResponseEntity<?> deleteAssignment(@PathVariable Long id) {
        assignmentRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Assignment deleted successfully"));
    }

    // ===============================
    // PROJECT & TEAM MANAGEMENT
    // ===============================

    @GetMapping("/projects")
    public ResponseEntity<List<ProjectTeam>> getAllProjects() {
        return ResponseEntity.ok(projectTeamRepository.findAll());
    }

    @DeleteMapping("/projects/{id}")
    public ResponseEntity<?> deleteProject(@PathVariable Long id) {
        projectTeamRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Project and team deleted successfully"));
    }

    @DeleteMapping("/projects/{id}/members/{userId}")
    public ResponseEntity<?> removeMemberFromProject(@PathVariable Long id, @PathVariable Long userId) {
        Optional<ProjectTeam> teamOpt = projectTeamRepository.findById(id);
        if (teamOpt.isEmpty()) return ResponseEntity.status(404).body(Map.of("message", "Team not found"));

        ProjectTeam team = teamOpt.get();
        team.getMembers().removeIf(member -> member.getId().equals(userId));
        projectTeamRepository.save(team);
        return ResponseEntity.ok(Map.of("message", "Member removed from project successfully"));
    }

    // ===============================
    // SUBMISSION & REVIEW LOG
    // ===============================

    @GetMapping("/submissions")
    public ResponseEntity<List<Submission>> getAllSubmissions() {
        return ResponseEntity.ok(submissionRepository.findAll());
    }
}
