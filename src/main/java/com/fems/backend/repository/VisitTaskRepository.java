package com.fems.backend.repository;

import com.fems.backend.entity.VisitTask;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface VisitTaskRepository extends JpaRepository<VisitTask, Long> {
    List<VisitTask> findByEmployeeId(Long employeeId);
    List<VisitTask> findByClientId(Long clientId);
}
