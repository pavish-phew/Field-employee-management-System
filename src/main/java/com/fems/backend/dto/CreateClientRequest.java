package com.fems.backend.dto;

import lombok.Data;

@Data
public class CreateClientRequest {
    private String name;
    private String email;
    private String password;
    private String address;
    private Double latitude;
    private Double longitude;
}
