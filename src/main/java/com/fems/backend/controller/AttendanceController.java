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
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin("*")
@RequiredArgsConstructor
public class AttendanceController {

    private final EmployeeService employeeService;
    private final UserRepository userRepository;

    private Long getCurrentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String email = (principal instanceof UserDetails) ? ((UserDetails) principal).getUsername() : (String) principal;
        User user = userRepository.findByEmail(email).orElseThrow();
        return user.getId();
    }

    @PostMapping("/attendance/clock-in")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<String> clockIn(@RequestBody ClockInRequest request) {
        employeeService.clockIn(getCurrentUserId(), request.getLatitude(), request.getLongitude());
        return ResponseEntity.ok("Clocked in successfully");
    }

    @PostMapping("/attendance/clock-out")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<String> clockOut() {
        employeeService.clockOut(getCurrentUserId());
        return ResponseEntity.ok("Clocked out successfully");
    }

    @GetMapping("/attendance/me")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
    public ResponseEntity<List<Attendance>> getMyAttendance() {
        return ResponseEntity.ok(employeeService.getMyAttendance(getCurrentUserId()));
    }

    @GetMapping("/attendance/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Attendance>> getAllAttendance() {
        return ResponseEntity.ok(employeeService.getAllAttendance());
    }

    @GetMapping("/api/location/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Attendance>> getActiveLocations() {
        return ResponseEntity.ok(employeeService.getActiveLocations());
    }

    @GetMapping("/attendance/location/{employeeId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Attendance> getEmployeeLocation(@PathVariable(name = "employeeId") Long employeeId) {
        return ResponseEntity.ok(employeeService.getActiveLocationByEmployeeId(employeeId));
    }
}
