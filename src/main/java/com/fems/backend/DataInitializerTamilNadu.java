package com.fems.backend;

import com.fems.backend.entity.Client;
import com.fems.backend.entity.User;
import com.fems.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Component
public class DataInitializerTamilNadu implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializerTamilNadu(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {

        String[] pondyPrefixes = {"Oceanic", "Auroville", "Heritage", "Bay", "Coral", "White Town", "Promenade",
                "Serenity", "Coromandel", "Marina", "French Quarter", "Lighthouse", "Botanical", "Ousteri", "Chitra"};
        String[] tnPrefixes = {"Southern", "Madras", "Kongu", "Chola", "Pandiya", "Deccan", "Eastern", "Apex",
                "Prime", "Global", "Sterling", "Pioneer", "Trinity", "Zenith", "Vertex"};
        String[] suffixes = {"Enterprises", "Tech Solutions", "Logistics Pvt Ltd", "Trading Co.", "Industries",
                "Group", "Services", "Exports", "Innovations", "Ventures", "Corporation", "Holdings",
                "Associates", "Dynamics", "Systems"};

        String[] pondyAreas = {
                "White Town, Puducherry", "Auroville, Puducherry", "Lawspet, Puducherry",
                "Reddiarpalayam, Puducherry", "Muthialpet, Puducherry", "Ariyankuppam, Puducherry",
                "Villianur, Puducherry", "Kalapet, Puducherry"
        };

        String[][] tnAreas = {
                {"Anna Salai, Chennai", "T Nagar, Chennai", "OMR IT Expressway, Chennai", "Adyar, Chennai", "Velachery, Chennai"},
                {"RS Puram, Coimbatore", "Avinashi Road, Coimbatore", "Peelamedu, Coimbatore", "Gandhipuram, Coimbatore", "Saravanampatti, Coimbatore"},
                {"Anna Nagar, Madurai", "KK Nagar, Madurai", "Simmakkal, Madurai", "Kalavasal, Madurai", "Tallakulam, Madurai"},
                {"Cantonment, Trichy", "Thillai Nagar, Trichy", "Srirangam, Trichy", "Woraiyur, Trichy", "TVS Tolgate, Trichy"},
                {"Fairlands, Salem", "Hasthampatti, Salem", "Alagapuram, Salem", "Four Roads, Salem", "Suramangalam, Salem"}
        };

        double[][] tnCities = {
                {13.0827, 80.2707}, // Chennai
                {11.0168, 76.9558}, // Coimbatore
                {9.9252, 78.1198},  // Madurai
                {10.7905, 78.7047}, // Trichy
                {11.6643, 78.1460}  // Salem
        };

        List<Object[]> allClientsData = new ArrayList<>();
        Random random = new Random(42); // Fixed seed for reproducibility

        // 35 Professional clients for Pondicherry
        // Lat: 11.89–11.97, Lon: 79.75–79.82 (land area only, avoids Bay of Bengal)
        for (int i = 0; i < 35; i++) {
            double lat = 11.89 + random.nextDouble() * 0.08;
            double lon = 79.75 + random.nextDouble() * 0.07;
            String name = pondyPrefixes[i % pondyPrefixes.length] + " " + suffixes[i % suffixes.length];
            String address = pondyAreas[i % pondyAreas.length];
            String email = "contact.pondy" + (i + 1) + "@fems.com";
            String phone = "98765432" + String.format("%02d", i % 100);
            allClientsData.add(new Object[]{name, email, lat, lon, address, phone});
        }

        // 25 Professional clients in Tamil Nadu (5 clusters of 5)
        int tnCounter = 0;
        for (int c = 0; c < tnCities.length; c++) {
            for (int i = 0; i < 5; i++) {
                double lat = tnCities[c][0] + (random.nextDouble() - 0.5) * 0.04;
                double lon = tnCities[c][1] + (random.nextDouble() - 0.5) * 0.04;
                String name = tnPrefixes[tnCounter % tnPrefixes.length] + " " + suffixes[(tnCounter + 5) % suffixes.length];
                String address = tnAreas[c][i];
                String email = "contact.tn" + (tnCounter + 1) + "@fems.com";
                String phone = "87654321" + String.format("%02d", tnCounter % 100);
                allClientsData.add(new Object[]{name, email, lat, lon, address, phone});
                tnCounter++;
            }
        }

        for (Object[] data : allClientsData) {
            String name    = (String) data[0];
            String email   = (String) data[1];
            double lat     = (Double) data[2];
            double lon     = (Double) data[3];
            String address = (String) data[4];
            String phone   = (String) data[5];

            if (!userRepository.existsByEmail(email)) {
                User user = new User();
                user.setName(name);
                user.setEmail(email);
                user.setPassword(passwordEncoder.encode("client123"));
                user.setRole("CLIENT");
                user.setPhone(phone);

                Client client = new Client();
                client.setUser(user);
                client.setLatitude(lat);
                client.setLongitude(lon);
                client.setAddress(address);

                user.setClient(client);

                userRepository.save(user);
            }
        }

        System.out.println("✅ Initialized 35 Pondicherry + 25 Tamil Nadu professional clients successfully.");
    }
}
