package com.fems.backend.repository;

import com.fems.backend.entity.EmployeeLocationHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface EmployeeLocationHistoryRepository extends JpaRepository<EmployeeLocationHistory, Long> {

    @Query("SELECT h FROM EmployeeLocationHistory h WHERE h.employee.id = :employeeId ORDER BY h.timestamp DESC")
    List<EmployeeLocationHistory> findByEmployeeIdOrderByTimestampDesc(@Param("employeeId") Long employeeId);

    @Query("SELECT h FROM EmployeeLocationHistory h WHERE h.employee.user.id = :userId ORDER BY h.timestamp DESC")
    List<EmployeeLocationHistory> findByEmployeeUserIdOrderByTimestampDesc(@Param("userId") Long userId);
}
