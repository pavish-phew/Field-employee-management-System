package com.fems.backend.service;

import com.fems.backend.dto.LocationHistoryResponse;
import com.fems.backend.entity.Attendance;
import com.fems.backend.entity.Employee;
import com.fems.backend.entity.EmployeeLocationHistory;
import com.fems.backend.repository.AttendanceRepository;
import com.fems.backend.repository.EmployeeRepository;
import com.fems.backend.repository.EmployeeLocationHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmployeeService {

    private final AttendanceRepository attendanceRepository;
    private final EmployeeRepository employeeRepository;
    private final EmployeeLocationHistoryRepository locationHistoryRepository;

    @Transactional
    public void clockIn(Long userId, Double lat, Double lon) {
        Employee emp = employeeRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Employee not found for user id: " + userId));
        
        if (attendanceRepository.findFirstByEmployeeIdAndClockOutTimeIsNullOrderByClockInTimeDesc(emp.getId()).isPresent()) {
            throw new RuntimeException("Shift already in progress");
        }

        Attendance att = Attendance.builder()
                .employee(emp)
                .clockInTime(LocalDateTime.now())
                .latitude(lat)
                .longitude(lon)
                .lastLocationUpdatedAt(LocalDateTime.now())
                .build();
        attendanceRepository.save(att);

        // Save initial clock-in location to history
        saveLocationHistory(emp, lat, lon, null);
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

    public List<Attendance> getAllAttendance() {
        return attendanceRepository.findAll();
    }

    /**
     * Updates the current (live) location in the active Attendance record
     * AND appends a new immutable row to employee_location_history.
     */
    @Transactional
    public void updateLocation(Long userId, Double lat, Double lon, Long clientId) {
        Employee emp = employeeRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        
        // Update live location in attendance (for real-time tracking)
        Attendance att = attendanceRepository.findFirstByEmployeeIdAndClockOutTimeIsNullOrderByClockInTimeDesc(emp.getId())
                .orElseThrow(() -> new RuntimeException("No active shift found to update location"));
        
        att.setLatitude(lat);
        att.setLongitude(lon);
        att.setLastLocationUpdatedAt(LocalDateTime.now());
        attendanceRepository.save(att);

        // Persist history record — never overwritten
        saveLocationHistory(emp, lat, lon, clientId);
    }

    private void saveLocationHistory(Employee emp, Double lat, Double lon, Long clientId) {
        EmployeeLocationHistory.EmployeeLocationHistoryBuilder builder = EmployeeLocationHistory.builder()
                .employee(emp)
                .latitude(lat)
                .longitude(lon)
                .timestamp(LocalDateTime.now());
        
        if (clientId != null) {
            builder.client(com.fems.backend.entity.Client.builder().id(clientId).build());
        }
        
        locationHistoryRepository.save(builder.build());
    }

    public List<Attendance> getActiveLocations() {
        return attendanceRepository.findByClockOutTimeIsNull();
    }

    public Attendance getActiveLocationByEmployeeId(Long employeeId) {
        return attendanceRepository.findFirstByEmployeeIdAndClockOutTimeIsNullOrderByClockInTimeDesc(employeeId)
                .orElse(null);
    }

    /**
     * Returns location history for a given employee (by their Employee entity ID).
     */
    public List<LocationHistoryResponse> getLocationHistory(Long employeeId) {
        return locationHistoryRepository.findByEmployeeIdOrderByTimestampDesc(employeeId)
                .stream()
                .map(h -> LocationHistoryResponse.builder()
                        .id(h.getId())
                        .employeeId(h.getEmployee() != null ? h.getEmployee().getId() : null)
                        .employeeName(h.getEmployee() != null && h.getEmployee().getUser() != null 
                            ? h.getEmployee().getUser().getName() : null)
                        .latitude(h.getLatitude())
                        .longitude(h.getLongitude())
                        .clientId(h.getClient() != null ? h.getClient().getId() : null)
                        .clientName(h.getClient() != null && h.getClient().getUser() != null 
                            ? h.getClient().getUser().getName() : null)
                        .timestamp(h.getTimestamp())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Returns location history for a given employee by their User ID (for admin queries).
     */
    public List<LocationHistoryResponse> getLocationHistoryByUserId(Long userId) {
        Employee emp = employeeRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Employee not found for user id: " + userId));
        return getLocationHistory(emp.getId());
    }
}
