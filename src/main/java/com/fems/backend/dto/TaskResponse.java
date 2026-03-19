package com.fems.backend.dto;

import com.fems.backend.entity.VisitTaskStatus;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class TaskResponse {
    private Long id;
    private Long employeeId;
    private String employeeName;
    private Long clientId;
    private String clientName;
    private String title;
    private String description;
    private VisitTaskStatus status;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private LocalDateTime createdAt;
}
