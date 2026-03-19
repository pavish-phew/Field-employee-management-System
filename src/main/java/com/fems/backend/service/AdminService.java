package com.fems.backend.service;

import com.fems.backend.dto.CreateClientRequest;
import com.fems.backend.dto.CreateEmployeeRequest;
import com.fems.backend.entity.Client;
import com.fems.backend.entity.Employee;
import com.fems.backend.entity.User;
import com.fems.backend.repository.ClientRepository;
import com.fems.backend.repository.EmployeeRepository;
import com.fems.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final ClientRepository clientRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public void createEmployee(CreateEmployeeRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole("EMPLOYEE");
        user.setPhone(request.getPhone());
        user = userRepository.save(user);

        Employee employee = new Employee();
        employee.setUser(user);
        employeeRepository.save(employee);
    }

    @Transactional
    public void createClient(CreateClientRequest request) {
        Client client = new Client();
        client.setName(request.getName());
        client.setEmail(request.getEmail());
        client.setAddress(request.getAddress());
        client.setLatitude(request.getLatitude());
        client.setLongitude(request.getLongitude());
        clientRepository.save(client);
    }

    public List<Employee> getAllEmployees() {
        return employeeRepository.findAll();
    }

    public List<Client> getAllClients() {
        return clientRepository.findAll();
    }

    @Transactional
    public void deleteEmployee(Long id) {
        employeeRepository.deleteById(id);
    }

    @Transactional
    public void deleteClient(Long id) {
        clientRepository.deleteById(id);
    }
}

