package com.fems.backend.controller;

import com.fems.backend.dto.CreateClientRequest;
import com.fems.backend.dto.CreateEmployeeRequest;
import com.fems.backend.entity.Client;
import com.fems.backend.entity.Employee;
import com.fems.backend.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

@RestController
@CrossOrigin("*")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    @PostMapping("/api/employees")
    public ResponseEntity<String> createEmployee(@RequestBody CreateEmployeeRequest request) {
        adminService.createEmployee(request);
        return ResponseEntity.ok("Employee created successfully");
    }

    @PostMapping("/api/clients")
    public ResponseEntity<String> createClient(@RequestBody CreateClientRequest request) {
        adminService.createClient(request);
        return ResponseEntity.ok("Client created successfully");
    }

    @GetMapping("/admin/employees")
    public ResponseEntity<List<Employee>> getAllEmployees() {
        return ResponseEntity.ok(adminService.getAllEmployees());
    }

    @GetMapping("/admin/clients")
    public ResponseEntity<List<Client>> getAllClients() {
        return ResponseEntity.ok(adminService.getAllClients());
    }

    @DeleteMapping("/admin/employees/{id}")
    public ResponseEntity<Void> deleteEmployee(@PathVariable(name = "id") Long id) {
        adminService.deleteEmployee(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/admin/clients/{id}")
    public ResponseEntity<Void> deleteClient(@PathVariable(name = "id") Long id) {
        adminService.deleteClient(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/admin/clients/{id}")
    public ResponseEntity<String> updateClient(@PathVariable(name = "id") Long id, @RequestBody CreateClientRequest request) {
        adminService.updateClient(id, request);
        return ResponseEntity.ok("Client updated successfully");
    }

    @GetMapping("/api/admin/employee-stats")
    public ResponseEntity<List<com.fems.backend.dto.EmployeeStatsResponse>> getEmployeeStats() {
        return ResponseEntity.ok(adminService.getEmployeeStats());
    }

    @GetMapping("/admin/clients/export/excel")
    public ResponseEntity<byte[]> exportClientsToExcel() throws IOException {
        List<Client> clients = adminService.getAllClients();

        try (XSSFWorkbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Clients");

            // Header row style
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setFontHeightInPoints((short) 11);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.INDIGO.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setBorderBottom(BorderStyle.THIN);

            // Create header row
            Row headerRow = sheet.createRow(0);
            String[] columns = {"#", "Client Name", "Email", "Address", "Latitude", "Longitude", "Phone"};
            for (int i = 0; i < columns.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerStyle);
            }

            // Data rows
            int rowNum = 1;
            for (Client client : clients) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(rowNum - 1);
                row.createCell(1).setCellValue(client.getUser() != null ? client.getUser().getName() : "");
                row.createCell(2).setCellValue(client.getUser() != null ? client.getUser().getEmail() : "");
                row.createCell(3).setCellValue(client.getAddress() != null ? client.getAddress() : "");
                row.createCell(4).setCellValue(client.getLatitude() != null ? client.getLatitude() : 0);
                row.createCell(5).setCellValue(client.getLongitude() != null ? client.getLongitude() : 0);
                row.createCell(6).setCellValue(client.getUser() != null && client.getUser().getPhone() != null ? client.getUser().getPhone() : "");
            }

            // Auto-size columns
            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            byte[] bytes = out.toByteArray();

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=fems_clients.xlsx")
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(bytes);
        }
    }
}
