package com.fems.backend;

import com.fems.backend.entity.User;
import com.fems.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // Create default admin ONLY if the database is empty
        if (userRepository.count() == 0) {
            System.out.println("Initializing database with default administrator account...");
            User admin = new User();
            admin.setName("System Administrator");
            admin.setEmail("admin@fems.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRole("ADMIN");
            admin.setPhone("0000000000");
            userRepository.save(admin);
            System.out.println("✅ DEFAULT ADMIN CREATED: admin@fems.com / admin123");
        } else {
            System.out.println("Database already initialized. Skipping default data creation.");
        }
    }
}
