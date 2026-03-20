package com.fems.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeStatsResponse {
    private String employeeName;
    private long completedTasks;
    private long pendingTasks;
    private long totalTasks;
}
