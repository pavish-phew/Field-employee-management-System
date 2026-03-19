package com.fems.backend.service;

import com.fems.backend.entity.User;
import com.fems.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public User registerUser(String name, String email, String password, String role, String phone) {
        if (userRepository.existsByEmail(email)) {
             throw new RuntimeException("Error: Email is already in use!");
        }

        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(role);
        user.setPhone(phone);
        
        return userRepository.save(user);
    }
}
