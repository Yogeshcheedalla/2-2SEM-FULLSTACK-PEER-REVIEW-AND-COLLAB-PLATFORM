package com.peerreview.backend.controller;

import com.peerreview.backend.service.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/files")
@CrossOrigin(origins = "*")
public class FileController {

    @Autowired
    private FileStorageService fileStorageService;

    /**
     * Upload a file and get back a URL to access it.
     */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "No file provided"));
            }

            // 5MB size guard (in bytes)
            if (file.getSize() > 5 * 1024 * 1024) {
                return ResponseEntity.badRequest().body(Map.of("message", "File too large. Max size is 5MB."));
            }

            String storedFilename = fileStorageService.storeFile(file);
            String fileUrl = "/files/" + storedFilename;

            return ResponseEntity.ok(Map.of(
                "message", "File uploaded successfully",
                "fileUrl", fileUrl,
                "originalName", file.getOriginalFilename(),
                "size", file.getSize()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Upload failed", "error", e.getMessage()));
        }
    }

    /**
     * Serve / download a file by its stored filename.
     */
    @GetMapping("/{filename:.+}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String filename) {
        try {
            Resource resource = fileStorageService.loadFileAsResource(filename);
            String contentType = "application/octet-stream";

            // Try to determine content type from filename
            String name = filename.toLowerCase();
            if (name.endsWith(".pdf")) contentType = "application/pdf";
            else if (name.endsWith(".png")) contentType = "image/png";
            else if (name.endsWith(".jpg") || name.endsWith(".jpeg")) contentType = "image/jpeg";
            else if (name.endsWith(".doc")) contentType = "application/msword";
            else if (name.endsWith(".docx")) contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            else if (name.endsWith(".ppt")) contentType = "application/vnd.ms-powerpoint";
            else if (name.endsWith(".pptx")) contentType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";

            return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
