package com.fems.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LocationHistoryResponse {
    private Long id;
    private Long employeeId;
    private String employeeName;
    private Double latitude;
    private Double longitude;
    private Long clientId;
    private String clientName;
    private LocalDateTime timestamp;
}
