package com.peerreview.backend.service;

import com.peerreview.backend.model.PasswordResetToken;
import com.peerreview.backend.model.User;
import com.peerreview.backend.repository.PasswordResetTokenRepository;
import com.peerreview.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class PasswordResetService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordResetTokenRepository tokenRepository;

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:not-configured}")
    private String fromEmail;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    /**
     * Generates a reset token and tries to send an email.
     * Returns the token also in the response so dev/testing works even without real email.
     */
    @Transactional
    public String initiatePasswordReset(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("No account found with that email address."));

        // Delete any existing tokens for this user
        tokenRepository.deleteByUserId(user.getId());

        // Create a new 6-digit OTP valid for 30 minutes
        String token = String.format("%06d", new java.util.Random().nextInt(999999));
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(token)
                .user(user)
                .expiresAt(LocalDateTime.now().plusMinutes(30))
                .build();
        tokenRepository.save(resetToken);

        // Try to send email — log to console if mail not configured
        try {
            if (mailSender != null && !fromEmail.equals("not-configured") && !fromEmail.equals("your-email@gmail.com")) {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(email);
                message.setSubject("PeerReview Platform — Password Reset OTP");
                message.setText(
                    "Hello " + user.getName() + ",\n\n" +
                    "You requested a password reset for your PeerReview Platform account.\n\n" +
                    "Your One-Time Password (OTP) for verification is: " + token + "\n\n" +
                    "(This OTP is valid for 30 minutes)\n\n" +
                    "If you did not request this, please ignore this email.\n\n" +
                    "— PeerReview Platform Team"
                );
                mailSender.send(message);
                System.out.println("Password reset OTP email sent to: " + email);
            } else {
                // Dev mode: print token to console
                System.out.println("==============================================");
                System.out.println(" PASSWORD RESET OTP (email not configured)");
                System.out.println(" Email: " + email);
                System.out.println(" OTP:   " + token);
                System.out.println("==============================================");
            }
        } catch (Exception e) {
            System.err.println("Email send failed: " + e.getMessage());
            System.out.println("Reset OTP for " + email + ": " + token);
        }

        return token; // Return token so frontend can show it in dev mode
    }

    /**
     * Validates the token and updates the user's password.
     */
    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid or expired reset link."));

        if (resetToken.isUsed()) {
            throw new RuntimeException("This reset link has already been used.");
        }
        if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("This reset link has expired. Please request a new one.");
        }
        if (newPassword.length() < 6) {
            throw new RuntimeException("Password must be at least 6 characters.");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        resetToken.setUsed(true);
        tokenRepository.save(resetToken);
    }

    /**
     * Directly resets a password for a given email.
     * Use ONLY for development/local testing.
     */
    @Transactional
    public void directResetPassword(String email, String newPassword) {
        User user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new RuntimeException("No account found with that email address."));

        if (newPassword.length() < 6) {
            throw new RuntimeException("Password must be at least 6 characters.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}
