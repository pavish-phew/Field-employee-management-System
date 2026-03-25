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
        List<Object[]> allClientsData = new ArrayList<>();
        Random random = new Random();

        // Generate 35 clients for nearby Pondicherry (Base Lat: 11.9416, Lon: 79.8083)
        for (int i = 1; i <= 35; i++) {
            double lat = 11.9416 + (random.nextDouble() - 0.5) * 0.1;
            double lon = 79.8083 + (random.nextDouble() - 0.5) * 0.1;
            allClientsData.add(new Object[]{
                "Pondy Client " + i,
                "pondy.client" + i + "@fems.com",
                lat,
                lon,
                "Pondicherry Region " + i,
                "98765432" + String.format("%02d", i % 100)
            });
        }

        // Generate 25 clients in Tamil Nadu (5 clusters of 5)
        double[][] tnCities = {
            {13.0827, 80.2707}, // Chennai
            {11.0168, 76.9558}, // Coimbatore
            {9.9252, 78.1198},  // Madurai
            {10.7905, 78.7047}, // Trichy
            {11.6643, 78.1460}  // Salem
        };
        String[] cityNames = {"Chennai", "Coimbatore", "Madurai", "Trichy", "Salem"};

        int tnCounter = 1;
        for (int c = 0; c < tnCities.length; c++) {
            for (int i = 1; i <= 5; i++) {
                double lat = tnCities[c][0] + (random.nextDouble() - 0.5) * 0.1;
                double lon = tnCities[c][1] + (random.nextDouble() - 0.5) * 0.1;
                allClientsData.add(new Object[]{
                    cityNames[c] + " Client " + i,
                    cityNames[c].toLowerCase() + ".client" + i + "@fems.com",
                    lat,
                    lon,
                    cityNames[c] + " Region " + i + ", Tamil Nadu",
                    "87654321" + String.format("%02d", tnCounter % 100)
                });
                tnCounter++;
            }
        }

        for (Object[] data : allClientsData) {
            String name = (String) data[0];
            String email = (String) data[1];
            double lat = (Double) data[2];
            double lon = (Double) data[3];
            String address = (String) data[4];
            String phone = (String) data[5];

            if (!userRepository.existsByEmail(email)) {
                User user = new User();
                user.setName(name);
                user.setEmail(email);
                user.setPassword(passwordEncoder.encode("password123"));
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
        System.out.println("Initialized 35 Pondicherry and 25 Tamil Nadu clients successfully.");
    }
}
