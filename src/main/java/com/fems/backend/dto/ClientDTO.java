package com.fems.backend.dto;

import lombok.Data;

@Data
public class ClientDTO {
    private Long id;
    private Long userId;
    private String name;
    private String email;
    private String contactPerson;
    private String address;
    private String phone;
}
