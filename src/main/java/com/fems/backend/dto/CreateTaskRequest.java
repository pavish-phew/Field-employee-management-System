package com.fems.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class CreateTaskRequest {
    private Long employeeId;
    private Long clientId;           // kept for backward compat (single client)
    private List<Long> clientIds;    // new: multi-client support
    private String title;
    private String description;
    private com.fems.backend.entity.VisitTaskStatus status;
    private java.time.LocalDateTime startTime;
}
