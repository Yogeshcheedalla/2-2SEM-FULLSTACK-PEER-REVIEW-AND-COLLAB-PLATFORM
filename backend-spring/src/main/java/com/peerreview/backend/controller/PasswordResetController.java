package com.peerreview.backend.controller;

import com.peerreview.backend.service.PasswordResetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "*")
public class PasswordResetController {

    @Autowired
    private PasswordResetService passwordResetService;

    /**
     * Step 1: User submits their email → generate token + send email
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is required."));
        }
        try {
            String token = passwordResetService.initiatePasswordReset(email.trim().toLowerCase());
            // In production: don't return token. For dev mode, we include it so you can test without email setup.
            return ResponseEntity.ok(Map.of(
                "message", "If an account exists for that email, a reset link has been sent.",
                "devToken", token  // Remove this line before going to production!
            ));
        } catch (Exception e) {
            // Always return 200 (security: don't reveal if email exists)
            return ResponseEntity.ok(Map.of(
                "message", "If an account exists for that email, a reset link has been sent."
            ));
        }
    }

    /**
     * Step 2: User submits token + new password → update password
     */
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        String newPassword = body.get("newPassword");

        if (token == null || token.isBlank() || newPassword == null || newPassword.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Token and new password are required."));
        }
        try {
            passwordResetService.resetPassword(token, newPassword);
            return ResponseEntity.ok(Map.of("message", "Password reset successfully! You can now log in."));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Step 3: Direct reset for development (No token required)
     */
    @PostMapping("/direct-reset")
    public ResponseEntity<?> directReset(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String newPassword = body.get("newPassword");

        if (email == null || email.isBlank() || newPassword == null || newPassword.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email and new password are required."));
        }
        try {
            passwordResetService.directResetPassword(email, newPassword);
            return ResponseEntity.ok(Map.of("message", "Password reset directly for " + email));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        }
    }
}
