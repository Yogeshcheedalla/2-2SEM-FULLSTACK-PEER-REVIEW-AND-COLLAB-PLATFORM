package com.peerreview.backend.config;

import com.peerreview.backend.model.User;
import com.peerreview.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Override
    public void run(String... args) throws Exception {
        // Initial Admin Account
        if (userRepository.findByEmail("admin@platform.com").isEmpty()) {
            User admin = new User();
            admin.setName("Master Administrator");
            admin.setEmail("admin@platform.com");
            admin.setPassword(passwordEncoder.encode("admin123")); // Default password
            admin.setRole("admin");
            userRepository.save(admin);
            System.out.println(">>> Created default Admin account: admin@platform.com / admin123");
        }
    }
}
