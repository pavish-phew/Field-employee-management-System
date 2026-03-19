package com.fems.backend.service;

import com.fems.backend.dto.CreateTaskRequest;
import com.fems.backend.dto.TaskResponse;
import com.fems.backend.entity.Client;
import com.fems.backend.entity.Employee;
import com.fems.backend.entity.VisitTask;
import com.fems.backend.entity.VisitTaskStatus;
import com.fems.backend.repository.ClientRepository;
import com.fems.backend.repository.EmployeeRepository;
import com.fems.backend.repository.VisitTaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VisitTaskService {

    private final VisitTaskRepository visitTaskRepository;
    private final EmployeeRepository employeeRepository;
    private final ClientRepository clientRepository;

    @Transactional
    public TaskResponse createVisitTask(CreateTaskRequest request) {
        Employee emp = employeeRepository.findById(request.getEmployeeId()).orElseThrow();
        Client client = clientRepository.findById(request.getClientId()).orElseThrow();

        VisitTask task = VisitTask.builder()
                .employee(emp)
                .client(client)
                .title(request.getTitle())
                .description(request.getDescription())
                .status(VisitTaskStatus.PENDING)
                .build();
        
        task = visitTaskRepository.save(task);
        return mapToResponse(task);
    }

    public List<TaskResponse> getAllTasks() {
        return visitTaskRepository.findAll().stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public List<TaskResponse> getTasksByEmployee(Long employeeId) {
        return visitTaskRepository.findByEmployeeId(employeeId).stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public List<TaskResponse> getTasksByEmployeeUserId(Long userId) {
        Employee emp = employeeRepository.findByUserId(userId).orElseThrow();
        return getTasksByEmployee(emp.getId());
    }

    public List<TaskResponse> getTasksByClientUserId(Long userId) {
        Client client = clientRepository.findByUserId(userId).orElseThrow();
        return getTasksByClient(client.getId());
    }

    public List<TaskResponse> getTasksByClient(Long clientId) {
        return visitTaskRepository.findByClientId(clientId).stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional
    public void updateTaskStatus(Long taskId, VisitTaskStatus status, Double empLat, Double empLon) {
        VisitTask task = visitTaskRepository.findById(taskId).orElseThrow();
        
        if (status == VisitTaskStatus.IN_PROGRESS && empLat != null && empLon != null) {
            Client client = task.getClient();
            if (client.getLatitude() != null && client.getLongitude() != null) {
                double distance = calculateDistance(empLat, empLon, client.getLatitude(), client.getLongitude());
                if (distance > 50.0) { // 50 km
                    throw new RuntimeException("You are too far from client location (" + String.format("%.2f", distance) + " km). Range: 50km.");
                }
            }
        }

        task.setStatus(status);
        if (status == VisitTaskStatus.IN_PROGRESS) task.setStartTime(LocalDateTime.now());
        if (status == VisitTaskStatus.COMPLETED) task.setEndTime(LocalDateTime.now());
        visitTaskRepository.save(task);
    }

    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Radius of the earth
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    @Transactional
    public void deleteTask(Long taskId) {
        visitTaskRepository.deleteById(taskId);
    }

    private TaskResponse mapToResponse(VisitTask task) {
        TaskResponse response = new TaskResponse();
        response.setId(task.getId());
        
        if (task.getEmployee() != null) {
            response.setEmployeeId(task.getEmployee().getId());
            if (task.getEmployee().getUser() != null) {
                response.setEmployeeName(task.getEmployee().getUser().getName());
            }
        }
        
        if (task.getClient() != null) {
            response.setClientId(task.getClient().getId());
            response.setClientLatitude(task.getClient().getLatitude());
            response.setClientLongitude(task.getClient().getLongitude());
            if (task.getClient().getUser() != null) {
                response.setClientName(task.getClient().getUser().getName());
            }
        }
        
        response.setTitle(task.getTitle());
        response.setDescription(task.getDescription());
        response.setStatus(task.getStatus());
        response.setStartTime(task.getStartTime());
        response.setEndTime(task.getEndTime());
        response.setCreatedAt(task.getCreatedAt());
        return response;
    }
}
