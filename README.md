# Field Employee Management System (FEMS)

A full-stack application built with Spring Boot, React, and MySQL for managing field employees, tracking tasks, and recording attendance with GPS localization.

## Tech Stack
- **Backend:** Spring Boot 3.4.3 (Java 21)
- **Frontend:** React.js (Vite, Axios, Framer Motion)
- **Database:** MySQL
- **Icons:** Lucide-React
- **Aesthetics:** Glassmorphism Dark Theme

## System Modules

### 1. Admin Module
- **Endpoints:** `/api/admin/employees`, `/api/admin/clients`, `/api/tasks`
- **Actions:** 
  - Manage (CRUD) Employees and Clients
  - Assign Tasks to employees for specific clients
  - Monitor all task statuses

### 2. Employee Module
- **Endpoints:** `/employee/tasks`, `/employee/start-task/{id}`, `/employee/complete-task/{id}`, `/employee/start-work`, `/employee/stop-work`, `/employee/location/update`
- **Actions:** 
  - Clock In / Clock Out (Attendance)
  - View personal assigned tasks
  - Update task status (PENDING → IN_PROGRESS → COMPLETED)
  - Automated GPS location tracking every 1 minute while clocked in

### 3. Client Module
- **Endpoints:** `/api/tasks/client/{id}`
- **Actions:** 
  - Track progress of tasks assigned to their location

## Database Schema (MySQL)

```sql
CREATE DATABASE fems_db;

USE fems_db;

CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255),
    role VARCHAR(50),
    username VARCHAR(255) UNIQUE,
    password VARCHAR(255)
);

CREATE TABLE employees (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    phone VARCHAR(20),
    department VARCHAR(100),
    designation VARCHAR(100),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE clients (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    contact_person VARCHAR(255),
    address TEXT,
    phone VARCHAR(20),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE visit_tasks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    employee_id BIGINT,
    client_id BIGINT,
    title VARCHAR(255),
    description TEXT,
    status VARCHAR(50),
    start_time DATETIME,
    end_time DATETIME,
    created_at DATETIME,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE TABLE attendance (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    employee_id BIGINT,
    start_time DATETIME,
    end_time DATETIME,
    latitude DOUBLE,
    longitude DOUBLE,
    clock_out_latitude DOUBLE,
    clock_out_longitude DOUBLE,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE location_tracking (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    employee_id BIGINT,
    latitude DOUBLE,
    longitude DOUBLE,
    timestamp DATETIME,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);
```

## Setup Instructions

### Backend
1. Ensure MySQL is running and `fems_db` exists (it will be created automatically if not).
2. Update `src/main/resources/application.properties` with your MySQL credentials.
3. Run with: `mvn spring-boot:run`
4. Default Admin: `admin` / `password: admin`

### Frontend
1. Navigate to `/frontend` directory.
2. Install dependencies: `npm install`
3. Run development server: `npm run dev`
4. Access at: `http://localhost:3000`
