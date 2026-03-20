package com.fems.backend;

import com.fems.backend.entity.Client;
import com.fems.backend.entity.User;
import com.fems.backend.repository.ClientRepository;
import com.fems.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ClientRepository clientRepository;
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

            // SEED CLIENTS
            seedClients();
        } else {
            System.out.println("Database already initialized. Skipping default data creation.");
        }
    }

    private void seedClients() {
        if (clientRepository.count() > 0) return;

        Object[][] clientsData = {
            // Chennai
            {"T Nagar Hub", "tnagar@fems.com", "T Nagar, Chennai", 13.0418, 80.2341},
            {"Anna Nagar Center", "annanagar@fems.com", "Anna Nagar, Chennai", 13.0850, 80.2101},
            {"Velachery Point", "velachery@fems.com", "Velachery, Chennai", 12.9796, 80.2185},
            {"Tambaram Logistics", "tambaram@fems.com", "Tambaram, Chennai", 12.9229, 80.1275},
            {"Guindy Industrial Park", "guindy@fems.com", "Guindy, Chennai", 13.0067, 80.2206},
            {"OMR Tech Park", "omr@fems.com", "Navalur, OMR, Chennai", 12.8465, 80.2259},
            {"Porur Warehouse", "porur@fems.com", "Porur, Chennai", 13.0382, 80.1565},
            {"Ambattur Estate", "ambattur@fems.com", "Ambattur, Chennai", 13.1143, 80.1548},
            // Pondicherry
            {"Villianur Hub", "villianur@fems.com", "Villianur, Pondicherry", 11.9113, 79.7613},
            {"Bahour Site", "bahour@fems.com", "Bahour, Pondicherry", 11.8021, 79.7397},
            {"Ariyankuppam Zone", "ariyankuppam@fems.com", "Ariyankuppam, Pondicherry", 11.9015, 79.8118},
            {"Lawspet Extension", "lawspet@fems.com", "Lawspet, Pondicherry", 11.9669, 79.8152}
        };

        for (Object[] data : clientsData) {
            String name = (String) data[0];
            String email = (String) data[1];
            String address = (String) data[2];
            Double lat = (Double) data[3];
            Double lon = (Double) data[4];

            User user = new User();
            user.setName(name);
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode("client123"));
            user.setRole("CLIENT");
            user = userRepository.save(user);

            Client client = new Client();
            client.setUser(user);
            client.setAddress(address);
            client.setLatitude(lat);
            client.setLongitude(lon);
            clientRepository.save(client);
        }
        System.out.println("✅ CLIENT DATA SEEDED: 12 Clients added.");
    }
}
