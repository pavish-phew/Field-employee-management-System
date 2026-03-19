package com.fems.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "visit_tasks")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VisitTask {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "employee_id")
    private Employee employee;
    
    @ManyToOne
    @JoinColumn(name = "client_id")
    private Client client;
    
    private String title;
    private String description;
    
    @Enumerated(EnumType.STRING)
    private VisitTaskStatus status;
    
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) status = VisitTaskStatus.PENDING;
    }
}
