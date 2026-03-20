package com.fems.backend.service;

import com.fems.backend.dto.CreateClientRequest;
import com.fems.backend.dto.CreateEmployeeRequest;
import com.fems.backend.entity.Client;
import com.fems.backend.entity.Employee;
import com.fems.backend.entity.User;
import com.fems.backend.repository.UserRepository;
import com.fems.backend.repository.EmployeeRepository;
import com.fems.backend.repository.ClientRepository;
import com.fems.backend.repository.VisitTaskRepository;
import com.fems.backend.dto.EmployeeStatsResponse;
import com.fems.backend.entity.VisitTaskStatus;
import com.fems.backend.entity.VisitTask;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final ClientRepository clientRepository;
    private final VisitTaskRepository visitTaskRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public void createEmployee(CreateEmployeeRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole() != null && !request.getRole().isEmpty() ? request.getRole().toUpperCase() : "EMPLOYEE");
        user.setPhone(request.getPhone());
        user = userRepository.save(user);

        Employee employee = new Employee();
        employee.setUser(user);
        employeeRepository.save(employee);
    }

    @Transactional
    public void createClient(CreateClientRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole("CLIENT");
        user = userRepository.save(user);

        Client client = new Client();
        client.setUser(user);
        client.setAddress(request.getAddress());
        client.setLatitude(request.getLatitude());
        client.setLongitude(request.getLongitude());
        clientRepository.save(client);
    }

    public List<Employee> getAllEmployees() {
        return employeeRepository.findAll();
    }

    public List<Client> getAllClients() {
        return clientRepository.findAll();
    }

    @Transactional
    public void deleteEmployee(Long id) {
        employeeRepository.deleteById(id);
    }

    @Transactional
    public void deleteClient(Long id) {
        clientRepository.deleteById(id);
    }

    @Transactional
    public void updateClient(Long id, CreateClientRequest request) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client not found"));
        
        User user = client.getUser();
        if (request.getName() != null) user.setName(request.getName());
        if (request.getEmail() != null && !user.getEmail().equals(request.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new RuntimeException("Email already exists");
            }
            user.setEmail(request.getEmail());
        }
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }
        userRepository.save(user);

        if (request.getAddress() != null) client.setAddress(request.getAddress());
        if (request.getLatitude() != null) client.setLatitude(request.getLatitude());
        if (request.getLongitude() != null) client.setLongitude(request.getLongitude());
        clientRepository.save(client);
    }

    public List<EmployeeStatsResponse> getEmployeeStats() {
        List<Employee> employees = employeeRepository.findAll();
        List<VisitTask> allTasks = visitTaskRepository.findAll();
        
        // Group tasks by employee ID
        Map<Long, List<VisitTask>> tasksByEmployee = allTasks.stream()
            .filter(t -> t.getEmployee() != null)
            .collect(Collectors.groupingBy(t -> t.getEmployee().getId()));
            
        return employees.stream().map(emp -> {
            List<VisitTask> empTasks = tasksByEmployee.getOrDefault(emp.getId(), new ArrayList<>());
            long completed = empTasks.stream().filter(t -> t.getStatus() == VisitTaskStatus.COMPLETED).count();
            long pending = empTasks.stream().filter(t -> t.getStatus() == VisitTaskStatus.PENDING || t.getStatus() == VisitTaskStatus.IN_PROGRESS).count();
            
            return EmployeeStatsResponse.builder()
                .employeeName(emp.getUser() != null ? emp.getUser().getName() : "Unknown")
                .completedTasks(completed)
                .pendingTasks(pending)
                .totalTasks(empTasks.size())
                .build();
        }).collect(Collectors.toList());
    }
}

