package com.fems.backend.controller;

import com.fems.backend.dto.CreateTaskRequest;
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

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'CLIENT')")
    public ResponseEntity<Void> updateTaskStatus(@PathVariable(name = "id") Long id, @RequestParam(name = "status") VisitTaskStatus status) {
        visitTaskService.updateTaskStatus(id, status);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable(name = "id") Long id) {
        visitTaskService.deleteTask(id);
        return ResponseEntity.noContent().build();
    }
}
