package com.fems.backend.controller;

import com.fems.backend.dto.ClockInRequest;
import com.fems.backend.entity.Attendance;
import com.fems.backend.entity.User;
import com.fems.backend.repository.UserRepository;
import com.fems.backend.service.EmployeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/attendance")
@CrossOrigin("*")
@RequiredArgsConstructor
public class AttendanceController {

    private final EmployeeService employeeService;
    private final UserRepository userRepository;

    private Long getCurrentUserId() {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        return user.getId();
    }

    @PostMapping("/clock-in")
    public ResponseEntity<String> clockIn(@RequestBody ClockInRequest request) {
        employeeService.clockIn(getCurrentUserId(), request.getLatitude(), request.getLongitude());
        return ResponseEntity.ok("Clocked in successfully");
    }

    @PostMapping("/clock-out")
    public ResponseEntity<String> clockOut() {
        employeeService.clockOut(getCurrentUserId());
        return ResponseEntity.ok("Clocked out successfully");
    }

    @GetMapping("/me")
    public ResponseEntity<List<Attendance>> getMyAttendance() {
        return ResponseEntity.ok(employeeService.getMyAttendance(getCurrentUserId()));
    }
}
