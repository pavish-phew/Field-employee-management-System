package com.fems.backend.controller;

import com.fems.backend.dto.CreateClientRequest;
import com.fems.backend.dto.CreateEmployeeRequest;
import com.fems.backend.entity.Client;
import com.fems.backend.entity.Employee;
import com.fems.backend.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin("*")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    @PostMapping("/api/employees")
    public ResponseEntity<String> createEmployee(@RequestBody CreateEmployeeRequest request) {
        adminService.createEmployee(request);
        return ResponseEntity.ok("Employee created successfully");
    }

    @PostMapping("/api/clients")
    public ResponseEntity<String> createClient(@RequestBody CreateClientRequest request) {
        adminService.createClient(request);
        return ResponseEntity.ok("Client created successfully");
    }

    @GetMapping("/admin/employees")
    public ResponseEntity<List<Employee>> getAllEmployees() {
        return ResponseEntity.ok(adminService.getAllEmployees());
    }

    @GetMapping("/admin/clients")
    public ResponseEntity<List<Client>> getAllClients() {
        return ResponseEntity.ok(adminService.getAllClients());
    }

    @DeleteMapping("/admin/employees/{id}")
    public ResponseEntity<Void> deleteEmployee(@PathVariable(name = "id") Long id) {
        adminService.deleteEmployee(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/admin/clients/{id}")
    public ResponseEntity<Void> deleteClient(@PathVariable(name = "id") Long id) {
        adminService.deleteClient(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/admin/clients/{id}")
    public ResponseEntity<String> updateClient(@PathVariable(name = "id") Long id, @RequestBody CreateClientRequest request) {
        adminService.updateClient(id, request);
        return ResponseEntity.ok("Client updated successfully");
    }
}

