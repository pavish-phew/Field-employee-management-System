package com.fems.backend.repository;

import com.fems.backend.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    Optional<Attendance> findFirstByEmployeeIdAndClockOutTimeIsNullOrderByClockInTimeDesc(Long employeeId);
    java.util.List<Attendance> findByEmployeeId(Long employeeId);
    java.util.List<Attendance> findByClockOutTimeIsNull();
}
