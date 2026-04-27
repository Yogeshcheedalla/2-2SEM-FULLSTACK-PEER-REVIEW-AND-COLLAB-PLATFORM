package com.peerreview.backend.config;

import com.peerreview.backend.model.User;
import com.peerreview.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class AdminInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @org.springframework.beans.factory.annotation.Value("${admin.email:admin@gmail.com}")
    private String adminEmail;

    @org.springframework.beans.factory.annotation.Value("${admin.password:admin123}")
    private String adminPassword;

    @Override
    public void run(String... args) {
        Optional<User> adminOpt = userRepository.findByEmail(adminEmail);

        if (adminOpt.isEmpty()) {
            User admin = User.builder()
                    .name("Master Admin")
                    .email(adminEmail)
                    .password(passwordEncoder.encode(adminPassword))
                    .role("admin")
                    .build();
            userRepository.save(admin);
            System.out.println("✅ Master Admin account created: " + adminEmail);
        } else {
            User admin = adminOpt.get();
            admin.setRole("admin");
            admin.setPassword(passwordEncoder.encode("admin123"));
            userRepository.save(admin);
            System.out.println("✅ Master Admin account updated and secured.");
        }
    }
}
