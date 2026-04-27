package com.peerreview.backend.controller;

import com.peerreview.backend.dto.UserDto;
import com.peerreview.backend.dto.UserRegistrationDto;
import org.modelmapper.ModelMapper;
import com.peerreview.backend.model.RefreshToken;
import com.peerreview.backend.model.User;
import com.peerreview.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/")
@CrossOrigin(origins = "*") // In production, restrict this
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private com.peerreview.backend.repository.UserRepository userRepository;

    @Autowired
    private com.peerreview.backend.security.HttpCookieOAuth2AuthorizationRequestRepository httpCookieOAuth2AuthorizationRequestRepository;

    @Autowired
    private ModelMapper modelMapper;

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody UserRegistrationDto userDto) {
        try {
            // Prevent 500 crashes by checking duplicates early
            if (userService.login(userDto.getEmail(), "any").isPresent() || userRepository.findByEmail(userDto.getEmail()).isPresent()) {
                return ResponseEntity.status(400).body(Map.of("message", "A user with this email already exists!"));
            }

            User userToSave = modelMapper.map(userDto, User.class);
            // Default role if not provided
            if (userToSave.getRole() == null || userToSave.getRole().isEmpty()) {
                userToSave.setRole("student");
            }
            User savedUser = userService.registerUser(userToSave);
            String token = userService.generateToken(savedUser);
            RefreshToken refreshToken = userService.createRefreshToken(savedUser);

            UserDto savedUserDto = modelMapper.map(savedUser, UserDto.class);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Signup successful");
            response.put("token", token);
            response.put("refreshToken", refreshToken.getToken());
            response.put("user", savedUserDto);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            String errorMsg = e.getMessage() != null ? e.getMessage() : e.toString();
            return ResponseEntity.status(500).body(Map.of("message", "Signup error details: " + errorMsg));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String password = credentials.get("password");

        Optional<User> userOpt = userService.login(email, password);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            String token = userService.generateToken(user);
            RefreshToken refreshToken = userService.createRefreshToken(user);
            
            UserDto userDto = modelMapper.map(user, UserDto.class);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Login successful");
            response.put("token", token);
            response.put("refreshToken", refreshToken.getToken());
            response.put("user", userDto);
            
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(400).body(Map.of("message", "Invalid credentials"));
        }
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<?> refreshToken(@RequestBody Map<String, String> request) {
        String requestRefreshToken = request.get("refreshToken");

        return userService.findByToken(requestRefreshToken)
                .map(userService::verifyExpiration)
                .map(RefreshToken::getUser)
                .map(user -> {
                    String token = userService.generateToken(user);
                    return ResponseEntity.ok(Map.of(
                        "token", token,
                        "refreshToken", requestRefreshToken,
                        "message", "Token refreshed successfully"
                    ));
                })
                .orElseThrow(() -> new RuntimeException("Refresh token is not in database!"));
    }

    @GetMapping("/oauth2-success")
    public void oauth2Success(jakarta.servlet.http.HttpServletRequest request, 
                             jakarta.servlet.http.HttpServletResponse response,
                             org.springframework.security.core.Authentication authentication) throws java.io.IOException {
        org.springframework.security.oauth2.core.user.OAuth2User oAuth2User = (org.springframework.security.oauth2.core.user.OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");

        // Get role from cookie
        String role = com.peerreview.backend.util.CookieUtils.getCookie(request, com.peerreview.backend.security.HttpCookieOAuth2AuthorizationRequestRepository.ROLE_PARAM_COOKIE_NAME)
                .map(jakarta.servlet.http.Cookie::getValue)
                .orElse("student");

        User user = userService.processOAuthPostLogin(email, name, role);
        String token = userService.generateToken(user);
        com.peerreview.backend.model.RefreshToken refreshToken = userService.createRefreshToken(user);

        // Clear auth cookies
        httpCookieOAuth2AuthorizationRequestRepository.removeAuthorizationRequestCookies(request, response);

        String redirectUrl = String.format("http://localhost:5173/login?token=%s&refreshToken=%s&userId=%d&role=%s&userName=%s",
            token, refreshToken.getToken(), user.getId(), user.getRole(), java.net.URLEncoder.encode(user.getName(), "UTF-8"));
        
        response.sendRedirect(redirectUrl);
    }
}
