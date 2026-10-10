# Student Planner - MERN Stack Task Management System

A full-featured student task and academic term management system built with MongoDB, Express.js, React, and Node.js.

---

## 🔑 System Accounts (Admin & Student)

### 1. Super Admin Account (Full Privileges & User Inspection)
| Field | Value |
| :--- | :--- |
| **Email** | `kentfloyd02@gmail.com` |
| **Password** | `Kentpogi31.` |
| **Role** | Super Administrator (Permanently Protected) |

### 2. Standard Student Demo Account
| Field | Value |
| :--- | :--- |
| **Email** | `student.demo@university.edu` |
| **Password** | `password123` |
| **Role / Program** | 3rd Year BS Computer Science (Student) |

> **Note**: To load or reset both accounts along with sample subjects, projects, and broadcast notices in your database:
> ```bash
> cd backend
> npm run seed
> ```

---

## Key Features
- **Academic Term Taskbars**: Live progress bars tracking completed assignments and quizzes for **Prelim**, **Midterm**, and **Finals**.
- **Interactive Views**: Kanban Board with workflow status changes (`Backlog` → `To Do` → `In Progress` → `Review` → `Completed`), chronological Calendar view, and sortable List table.
- **Task Management**: Checklist / subtasks, file attachments (local upload via Multer), priority indicators, and estimated duration.
- **Academic Subjects & Projects**: Categorize tasks by course subjects (with customizable badge colors) and term projects.
- **Authentication & Password Recovery**: JWT-based session security and SMTP password reset with simulated email preview link.
- **Dark & Light Mode**: Seamless UI theme toggle with system memory.
- **Archive Vault**: Soft delete and restore for coursework.

---

## Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [MongoDB](https://www.mongodb.com/) running locally on port `27017` or a remote MongoDB Atlas URI.

---

## Getting Started

### 1. Backend Setup
1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Verify your `.env` configuration (default points to `mongodb://127.0.0.1:27017/student_planner` and port `5000`):
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/student_planner
   JWT_SECRET=super_secret_student_planner_jwt_key_2026_dev
   ```
3. *(Optional)* Populate the database with the demo account and mock coursework:
   ```bash
   npm run seed
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```
   The backend API will run on `http://localhost:5000`.

---

### 2. Frontend Setup
1. In a separate terminal, navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
3. Open your browser at **`http://localhost:5173`**.
4. Log in using the demo account credentials:
   * **Email:** `student.demo@university.edu`
   * **Password:** `password123`

---

## Default API Endpoints
- **Auth**: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`, `/api/auth/forgot-password`, `/api/auth/reset-password/:token`
- **Analytics**: `/api/analytics/dashboard-summary`
- **Tasks**: `/api/tasks`, `/api/tasks/:id/status`, `/api/tasks/:id/checklist`, `/api/tasks/:id/attachments`, `/api/tasks/:id/archive`
- **Subjects**: `/api/subjects`, `/api/subjects/:id/archive`
- **Projects**: `/api/projects`, `/api/projects/:id/archive`
