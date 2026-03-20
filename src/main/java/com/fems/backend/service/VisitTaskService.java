package com.fems.backend.service;

import com.fems.backend.dto.CreateTaskRequest;
import com.fems.backend.dto.TaskResponse;
import com.fems.backend.dto.TaskSummaryResponse;
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

import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;

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
                .status(request.getStatus() != null ? request.getStatus() : VisitTaskStatus.PENDING)
                .startTime(request.getStartTime())
                .build();
        
        task = visitTaskRepository.save(task);
        return mapToResponse(task);
    }

    public List<TaskResponse> getAllTasks() {
        return visitTaskRepository.findAll().stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional
    public TaskResponse updateVisitTask(Long taskId, CreateTaskRequest request) {
        VisitTask task = visitTaskRepository.findById(taskId).orElseThrow();
        
        if (request.getEmployeeId() != null) {
            Employee emp = employeeRepository.findById(request.getEmployeeId()).orElseThrow();
            task.setEmployee(emp);
        }
        if (request.getClientId() != null) {
            Client client = clientRepository.findById(request.getClientId()).orElseThrow();
            task.setClient(client);
        }
        if (request.getTitle() != null) task.setTitle(request.getTitle());
        if (request.getDescription() != null) task.setDescription(request.getDescription());
        if (request.getStatus() != null) task.setStatus(request.getStatus());
        if (request.getStartTime() != null) task.setStartTime(request.getStartTime());
        
        task = visitTaskRepository.save(task);
        return mapToResponse(task);
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
        System.out.println("--- TASK UPDATE REQUEST ---");
        System.out.println("Task ID: " + taskId);
        System.out.println("Status: " + status);
        System.out.println("Emp Location: " + empLat + ", " + empLon);

        VisitTask task = visitTaskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found with ID: " + taskId));
        
        if (status == VisitTaskStatus.IN_PROGRESS) {
            if (task.getStatus() == VisitTaskStatus.IN_PROGRESS) {
                throw new RuntimeException("Task is already in progress");
            }
            if (empLat == null || empLon == null) {
                throw new RuntimeException("Live GPS location is required to start a task");
            }
            
            Client client = task.getClient();
            if (client != null && client.getLatitude() != null && client.getLongitude() != null) {
                double distance = calculateDistance(empLat, empLon, client.getLatitude(), client.getLongitude());
                System.out.println("Calculated distance to site: " + String.format("%.2f", distance) + " km");
                if (distance > 30.0) { // 30 km limit
                    throw new RuntimeException("Too far from site: " + String.format("%.2f", distance) + " km. (Must be < 30km)");
                }
            } else {
                System.out.println("⚠️ Site has no coordinates on record. Skipping proximity check.");
            }
        }

        task.setStatus(status);
        if (status == VisitTaskStatus.IN_PROGRESS) task.setStartTime(LocalDateTime.now());
        if (status == VisitTaskStatus.COMPLETED) task.setEndTime(LocalDateTime.now());
        visitTaskRepository.save(task);
        System.out.println("✅ TASK UPDATED SUCCESSFULLY");
        System.out.println("---------------------------");
    }

    public List<TaskSummaryResponse> getTaskSummary() {
        List<VisitTask> allTasks = visitTaskRepository.findAll();
        
        // Group by Employee Name -> then Client Name -> List of TaskItems
        Map<String, Map<String, List<TaskSummaryResponse.TaskItem>>> groupedData = new HashMap<>();

        for (VisitTask task : allTasks) {
            String empName = (task.getEmployee() != null && task.getEmployee().getUser() != null) 
                             ? task.getEmployee().getUser().getName() : "Unassigned";
            String cliName = (task.getClient() != null && task.getClient().getUser() != null) 
                             ? task.getClient().getUser().getName() : "General HQ";

            TaskSummaryResponse.TaskItem item = TaskSummaryResponse.TaskItem.builder()
                    .taskTitle(task.getTitle())
                    .status(task.getStatus())
                    .completedAt(task.getEndTime()) // End time is the completion date
                    .build();

            groupedData.computeIfAbsent(empName, k -> new HashMap<>())
                       .computeIfAbsent(cliName, k -> new ArrayList<>())
                       .add(item);
        }

        // Map the intermediate groupedData to List<TaskSummaryResponse>
        return groupedData.entrySet().stream().map(empEntry -> {
            List<TaskSummaryResponse.ClientSummary> clientSummaries = empEntry.getValue().entrySet().stream()
                .map(cliEntry -> TaskSummaryResponse.ClientSummary.builder()
                    .clientName(cliEntry.getKey())
                    .tasks(cliEntry.getValue())
                    .build())
                .collect(Collectors.toList());

            return TaskSummaryResponse.builder()
                .employeeName(empEntry.getKey())
                .clients(clientSummaries)
                .build();
        }).collect(Collectors.toList());
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
