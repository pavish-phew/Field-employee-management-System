package com.fems.backend.dto;

import lombok.Data;

@Data
public class EmployeeDTO {
    private Long id;
    private Long userId;
    private String name;
    private String email;
    private String phone;
    private String department;
    private String designation;
}
