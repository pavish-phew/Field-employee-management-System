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

    public List<TaskResponse> getTasksByClient(Long clientId) {
        return visitTaskRepository.findByClientId(clientId).stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional
    public void updateTaskStatus(Long taskId, VisitTaskStatus status) {
        VisitTask task = visitTaskRepository.findById(taskId).orElseThrow();
        task.setStatus(status);
        if (status == VisitTaskStatus.IN_PROGRESS) task.setStartTime(LocalDateTime.now());
        if (status == VisitTaskStatus.COMPLETED) task.setEndTime(LocalDateTime.now());
        visitTaskRepository.save(task);
    }

    @Transactional
    public void deleteTask(Long taskId) {
        visitTaskRepository.deleteById(taskId);
    }

    private TaskResponse mapToResponse(VisitTask task) {
        TaskResponse response = new TaskResponse();
        response.setId(task.getId());
        response.setEmployeeId(task.getEmployee().getId());
        response.setEmployeeName(task.getEmployee().getUser().getName());
        response.setClientId(task.getClient().getId());
        response.setClientName(task.getClient().getName());
        response.setTitle(task.getTitle());
        response.setDescription(task.getDescription());
        response.setStatus(task.getStatus());
        response.setStartTime(task.getStartTime());
        response.setEndTime(task.getEndTime());
        response.setCreatedAt(task.getCreatedAt());
        return response;
    }
}
