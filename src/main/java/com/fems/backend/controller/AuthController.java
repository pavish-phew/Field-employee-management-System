package com.fems.backend.controller;

import com.fems.backend.dto.AuthResponse;
import com.fems.backend.dto.LoginRequest;
import com.fems.backend.entity.User;
import com.fems.backend.repository.UserRepository;
import com.fems.backend.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtUtils jwtUtils;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        System.out.println("Login attempt: " + loginRequest.getEmail());
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = jwtUtils.generateJwtToken(authentication);

            User user = userRepository.findByEmail(loginRequest.getEmail()).orElseThrow();
            
            System.out.println("Login success: " + user.getEmail());
            return ResponseEntity.ok(new AuthResponse(jwt, 
                    user.getEmail(), 
                    user.getRole(), 
                    user.getName()));
        } catch (Exception e) {
            System.out.println("Login failed: " + e.getMessage());
            throw e;
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logoutUser() {
        return ResponseEntity.ok("Logged out successfully");
    }
}
