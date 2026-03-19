package com.fems.backend.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class AttendanceResponse {
    private Long id;
    private Long employeeId;
    private LocalDateTime clockInTime;
    private LocalDateTime clockOutTime;
    private Double latitude;
    private Double longitude;
}
