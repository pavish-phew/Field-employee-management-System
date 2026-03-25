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
