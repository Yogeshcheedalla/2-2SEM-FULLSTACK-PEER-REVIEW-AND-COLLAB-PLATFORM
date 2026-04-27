package com.peerreview.backend.service;

import com.peerreview.backend.model.RefreshToken;
import com.peerreview.backend.model.User;
import com.peerreview.backend.repository.RefreshTokenRepository;
import com.peerreview.backend.repository.UserRepository;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.Key;
import java.time.Instant;
import java.util.*;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private EmailService emailService;

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    @Value("${jwt.refreshExpiration}")
    private long refreshExpiration;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public User registerUser(User user) {
        if (user.getPassword() != null) {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        } else {
            // Give them a random secure password if none provided (e.g., OAuth edge cases)
            user.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
        }
        
        User savedUser = userRepository.save(user);
        
        // Don't crash signup if SMTP is down or email is fake
        try {
            emailService.sendWelcomeEmail(savedUser.getEmail(), savedUser.getName());
        } catch (Exception e) {
            System.err.println("Silently ignoring email failure for " + savedUser.getEmail() + ": " + e.getMessage());
        }
        
        return savedUser;
    }

    public Optional<User> login(String email, String password) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent() && passwordEncoder.matches(password, userOpt.get().getPassword())) {
            return userOpt;
        }
        return Optional.empty();
    }

    public String generateToken(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", user.getRole());
        claims.put("id", user.getId());

        Key key = Keys.hmacShaKeyFor(jwtSecret.getBytes());

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(user.getEmail())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    @Transactional
    public RefreshToken createRefreshToken(User user) {
        // Find existing token or create a new one to avoid Unique Constraint violations
        Optional<RefreshToken> existingTokenOpt = refreshTokenRepository.findByUser(user);
        RefreshToken refreshToken;
        
        if (existingTokenOpt.isPresent()) {
            refreshToken = existingTokenOpt.get();
        } else {
            refreshToken = new RefreshToken();
            refreshToken.setUser(user);
        }

        refreshToken.setToken(UUID.randomUUID().toString());
        refreshToken.setExpiryDate(Instant.now().plusMillis(refreshExpiration));

        return refreshTokenRepository.save(refreshToken);
    }

    public Optional<RefreshToken> findByToken(String token) {
        return refreshTokenRepository.findByToken(token);
    }

    public RefreshToken verifyExpiration(RefreshToken token) {
        if (token.getExpiryDate().isBefore(Instant.now())) {
            refreshTokenRepository.delete(token);
            throw new RuntimeException("Refresh token was expired. Please make a new signin request");
        }
        return token;
    }

    public User processOAuthPostLogin(String email, String name, String role) {
        Optional<User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isPresent()) {
            return userOpt.get();
        } else {
            User newUser = new User();
            newUser.setEmail(email);
            newUser.setName(name);
            newUser.setRole(role != null ? role : "student"); // Use provided role or default to student
            newUser.setPassword(passwordEncoder.encode(UUID.randomUUID().toString())); // Secure random password
            return userRepository.save(newUser);
        }
    }
}
