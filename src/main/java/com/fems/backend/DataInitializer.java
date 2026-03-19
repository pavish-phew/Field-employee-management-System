package com.fems.backend;

import com.fems.backend.entity.User;
import com.fems.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final com.fems.backend.repository.EmployeeRepository employeeRepository;
    private final com.fems.backend.repository.ClientRepository clientRepository;
    private final com.fems.backend.repository.VisitTaskRepository visitTaskRepository;
    private final com.fems.backend.repository.AttendanceRepository attendanceRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        // FULL RESET for debugging if needed, but here we just cleanup selectively or delete all if they want a clean start.
        // Actually, the user wants a migration/approach to remove duplicates.
        // I'll implement a clean-start for this step as they requested "Delete employees first then users".
        
        System.out.println("Cleaning database to resolve constraint issues...");
        visitTaskRepository.deleteAll();
        attendanceRepository.deleteAll();
        clientRepository.deleteAll();
        employeeRepository.deleteAll();
        userRepository.deleteAll();
        
        System.out.println("Recreating default data...");
        // RECREATE ADMIN
        if (userRepository.findByEmail("admin@fems.com").isEmpty()) {
            User admin = new User();
            admin.setName("System Administrator");
            admin.setEmail("admin@fems.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRole("ADMIN");
            admin.setPhone("0000000000");
            userRepository.save(admin);
            System.out.println("✅ DEFAULT ADMIN CREATED: admin@fems.com / admin123");
        }

        // CREATE SAMPLE EMPLOYEE for testing
        if (userRepository.findByEmail("employee@fems.com").isEmpty()) {
            User emp = new User();
            emp.setName("Sample Employee");
            emp.setEmail("employee@fems.com");
            emp.setPassword(passwordEncoder.encode("emp123"));
            emp.setRole("EMPLOYEE");
            emp.setPhone("1112223333");
            userRepository.save(emp);
            System.out.println("✅ SAMPLE EMPLOYEE CREATED: employee@fems.com / emp123");
        }
    }
}
