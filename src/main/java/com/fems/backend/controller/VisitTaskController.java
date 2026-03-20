package com.fems.backend.controller;

import com.fems.backend.dto.CreateTaskRequest;
import com.fems.backend.dto.TaskResponse;
import com.fems.backend.dto.TaskSummaryResponse;
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
@RequestMapping("/api/tasks")
@CrossOrigin("*")
@RequiredArgsConstructor
public class VisitTaskController {

    private final VisitTaskService visitTaskService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<TaskResponse> createVisitTask(@RequestBody CreateTaskRequest request) {
        return ResponseEntity.ok(visitTaskService.createVisitTask(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TaskResponse> updateVisitTask(@PathVariable(name = "id") Long id, @RequestBody CreateTaskRequest request) {
        return ResponseEntity.ok(visitTaskService.updateVisitTask(id, request));
    }

    @GetMapping
    public ResponseEntity<List<TaskResponse>> getAllTasks() {
        return ResponseEntity.ok(visitTaskService.getAllTasks());
    }

    @GetMapping("/me")
    public ResponseEntity<List<TaskResponse>> getMyTasks() {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        
        if (user.getRole().equals("ADMIN")) {
            return ResponseEntity.ok(visitTaskService.getAllTasks());
        } else if (user.getRole().equals("CLIENT")) {
            return ResponseEntity.ok(visitTaskService.getTasksByClientUserId(user.getId()));
        } else {
            return ResponseEntity.ok(visitTaskService.getTasksByEmployeeUserId(user.getId()));
        }
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<TaskResponse>> getTasksByEmployee(@PathVariable(name = "employeeId") Long employeeId) {
        return ResponseEntity.ok(visitTaskService.getTasksByEmployee(employeeId));
    }

    @GetMapping("/client/{clientId}")
    public ResponseEntity<List<TaskResponse>> getTasksByClient(@PathVariable(name = "clientId") Long clientId) {
        return ResponseEntity.ok(visitTaskService.getTasksByClient(clientId));
    }

    @GetMapping("/client/me")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<List<TaskResponse>> getMyClientTasks() {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        return ResponseEntity.ok(visitTaskService.getTasksByClientUserId(user.getId()));
    }

    @GetMapping("/admin/task-summary")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TaskSummaryResponse>> getTaskSummary() {
        return ResponseEntity.ok(visitTaskService.getTaskSummary());
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN', 'CLIENT')") 
    public ResponseEntity<?> updateTaskStatus(
            @PathVariable(name = "id") Long id, 
            @RequestParam(name = "status") VisitTaskStatus status,
            @RequestParam(name = "lat", required = false) Double lat,
            @RequestParam(name = "lon", required = false) Double lon) {
        try {
            visitTaskService.updateTaskStatus(id, status, lat, lon);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            System.err.println("❌ Task status update failed: " + e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable(name = "id") Long id) {
        visitTaskService.deleteTask(id);
        return ResponseEntity.noContent().build();
    }
}
