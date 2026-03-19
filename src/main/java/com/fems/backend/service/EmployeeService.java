package com.fems.backend.service;

import com.fems.backend.entity.Attendance;
import com.fems.backend.entity.Employee;
import com.fems.backend.repository.AttendanceRepository;
import com.fems.backend.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EmployeeService {

    private final AttendanceRepository attendanceRepository;
    private final EmployeeRepository employeeRepository;

    @Transactional
    public void clockIn(Long userId, Double lat, Double lon) {
        Employee emp = employeeRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Employee not found for user id: " + userId));
        
        Attendance att = Attendance.builder()
                .employee(emp)
                .clockInTime(LocalDateTime.now())
                .latitude(lat)
                .longitude(lon)
                .build();
        attendanceRepository.save(att);
    }

    @Transactional
    public void clockOut(Long userId) {
        Employee emp = employeeRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        
        Attendance att = attendanceRepository.findFirstByEmployeeIdAndClockOutTimeIsNullOrderByClockInTimeDesc(emp.getId())
                .orElseThrow(() -> new RuntimeException("No active clock-in found"));
        
        att.setClockOutTime(LocalDateTime.now());
        attendanceRepository.save(att);
    }

    public List<Attendance> getMyAttendance(Long userId) {
        Employee emp = employeeRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        return attendanceRepository.findByEmployeeId(emp.getId());
    }
}

