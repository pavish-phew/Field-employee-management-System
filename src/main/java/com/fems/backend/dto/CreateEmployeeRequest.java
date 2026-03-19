package com.fems.backend.dto;

import lombok.Data;

@Data
public class CreateEmployeeRequest {
    private String name;
    private String email;
    private String password;
    private String phone;
    private String role; // defaults to EMPLOYEE usually
}
