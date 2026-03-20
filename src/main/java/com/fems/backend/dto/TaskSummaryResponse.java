package com.fems.backend.dto;

import com.fems.backend.entity.VisitTaskStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskSummaryResponse {
    private String employeeName;
    private List<ClientSummary> clients;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ClientSummary {
        private String clientName;
        private List<TaskItem> tasks;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TaskItem {
        private String taskTitle;
        private VisitTaskStatus status;
        private LocalDateTime completedAt;
    }
}
