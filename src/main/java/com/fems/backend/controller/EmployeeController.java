package com.fems.backend.controller;

import com.fems.backend.dto.TaskResponse;
import com.fems.backend.entity.User;
import com.fems.backend.entity.VisitTaskStatus;
import com.fems.backend.repository.UserRepository;
import com.fems.backend.service.VisitTaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/employee")
@CrossOrigin("*")
@RequiredArgsConstructor
public class EmployeeController {

    private final VisitTaskService visitTaskService;
    private final com.fems.backend.service.EmployeeService employeeService;
    private final UserRepository userRepository;

    @PostMapping("/location/update")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<Void> updateLocation(@RequestParam Double lat, @RequestParam Double lon) {
        employeeService.updateLocation(getCurrentUserId(), lat, lon);
        return ResponseEntity.ok().build();
    }

    private Long getCurrentUserId() {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        return user.getId();
    }

    @GetMapping("/tasks")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<List<TaskResponse>> getMyTasks() {
        return ResponseEntity.ok(visitTaskService.getTasksByEmployeeUserId(getCurrentUserId()));
    }

    @PostMapping("/start-task/{taskId}")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<Void> startTask(@PathVariable(name = "taskId") Long taskId) {
        visitTaskService.updateTaskStatus(taskId, VisitTaskStatus.IN_PROGRESS, null, null);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/complete-task/{taskId}")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<Void> completeTask(@PathVariable(name = "taskId") Long taskId) {
        visitTaskService.updateTaskStatus(taskId, VisitTaskStatus.COMPLETED, null, null);
        return ResponseEntity.ok().build();
    }
}

