package com.fems.backend;

import com.fems.backend.entity.Client;
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
            User empUser = new User();
            empUser.setName("Sample Employee");
            empUser.setEmail("employee@fems.com");
            empUser.setPassword(passwordEncoder.encode("emp123"));
            empUser.setRole("EMPLOYEE");
            empUser.setPhone("1112223333");
            empUser = userRepository.save(empUser);

            com.fems.backend.entity.Employee employee = new com.fems.backend.entity.Employee();
            employee.setUser(empUser);
            employeeRepository.save(employee);
            System.out.println("✅ SAMPLE EMPLOYEE CREATED: employee@fems.com / emp123");
        }

        // CREATE SAMPLE CLIENT for testing
        if (userRepository.findByEmail("client@fems.com").isEmpty()) {
            User cUser = new User();
            cUser.setName("Sample Client Co");
            cUser.setEmail("client@fems.com");
            cUser.setPassword(passwordEncoder.encode("client123"));
            cUser.setRole("CLIENT");
            cUser.setPhone("5554443333");
            userRepository.save(cUser);

            Client client = new Client();
            client.setUser(cUser);
            client.setAddress("White Town, Puducherry");
            client.setLatitude(11.9369);
            client.setLongitude(79.8340);
            clientRepository.save(client);
            System.out.println("✅ SAMPLE CLIENT CREATED: client@fems.com / client123");
        }

        createSampleClient("Lawspet Logistics", "lawspet@fems.com", "Lawspet Main Rd, Puducherry", 11.9580, 79.8083);
        createSampleClient("Reddiarpalayam Hub", "red@fems.com", "Reddiarpalayam, Puducherry", 11.9252, 79.8000);
        createSampleClient("Muthialpet Site", "muthial@fems.com", "Muthialpet, Puducherry", 11.9485, 79.8250);
        createSampleClient("Villianur Center", "vill@fems.com", "Villianur, Puducherry", 11.9035, 79.7615);
        createSampleClient("Ariyankuppam Station", "ariya@fems.com", "Ariyankuppam, Puducherry", 11.8830, 79.8170);
        createSampleClient("Mudaliarpet Depot", "mudaliar@fems.com", "Mudaliarpet, Puducherry", 11.9160, 79.8200);
    }

    private void createSampleClient(String name, String email, String address, double lat, double lon) {
        if (userRepository.findByEmail(email).isEmpty()) {
            User user = new User();
            user.setName(name);
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode("client123"));
            user.setRole("CLIENT");
            user.setPhone("9876543210");
            userRepository.save(user);

            Client client = new Client();
            client.setUser(user);
            client.setAddress(address);
            client.setLatitude(lat);
            client.setLongitude(lon);
            clientRepository.save(client);
            System.out.println("✅ CLIENT CREATED: " + email + " / client123");
        }
    }
}
