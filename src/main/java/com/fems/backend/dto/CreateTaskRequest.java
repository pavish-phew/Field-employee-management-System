package com.fems.backend.dto;

import lombok.Data;

@Data
public class CreateTaskRequest {
    private Long employeeId;
    private Long clientId;
    private String title;
    private String description;
}
