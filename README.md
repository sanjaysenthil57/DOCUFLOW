# DocuFlow AI — Academic Document Verification & Learning Platform

[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-green.svg)](https://nodejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-blue.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-cyan.svg)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-9.0-brightgreen.svg)](https://www.mongodb.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)

**DocuFlow AI** is an academic document verification and student learning platform engineered for colleges and universities.

It automates academic document submission, verification, subject expert peer review, and Head of Department (HOD) final approval while using local AI to audit document quality, structure, and formatting.

The platform provides MCA postgraduates with approved academic materials, AI-generated summaries, study notes, Tamil concept translations, a RAG academic chatbot, and a subject-based interactive coding sandbox across Python, C, C++, Java, and SQL.

---

## 1. Key Platform Features

- **Five Distinct Roles with RBAC Enforcement**:
  - `Admin`: Academic curriculum configuration, batch setup, user management, and audit logs. (Strictly prohibited from uploading or approving documents).
  - `Faculty`: Upload course materials for assigned subjects, view AI audit reports, inspect expert comments, and submit revised versions (v1, v2, v3...).
  - `Expert`: Peer review assigned subjects, inspect AI reports, add feedback, and approve/reject/request corrections.
  - `HOD`: Final approval authority. Changes yearly with historical sign-offs preserved. Only HOD-approved documents are published to students.
  - `Student`: Access published documents matching their batch and regulation, read AI summaries, study notes, Tamil explanations, use the RAG academic chatbot, and practice coding.
- **25 Logical MongoDB Collections**: Clean Mongoose models ensuring auditability, version history, and referential integrity.
- **Local AI Verification Service**:
  - Built with Python FastAPI, PyMuPDF, and local Ollama (`llama3:8b`) with automatic fallback heuristics.
  - Checks 12 key dimensions: grammar, spelling, clarity, academic writing quality, document structure, heading hierarchy, formatting consistency, missing sections, repetition, terminology, paragraph organization, and completeness.
- **Interactive Multi-Language Coding Sandbox**:
  - Supports Python 3, C, C++, Java, and SQL.
  - Run with custom inputs, submit against automated test cases, and receive AI hints for syntax and compiler errors.

---

## 2. System Roles & Initial Administrator Setup

DocuFlow AI strictly implements genuine persistent storage in MongoDB across 25 collections without dummy, fabricated, or placeholder records.

Only essential system configuration is initialized:
- **5 Predefined Roles**: `admin`, `faculty`, `expert`, `hod`, `student`
- **5 Supported Programming Languages**: `python`, `c`, `cpp`, `java`, `sql`
- **1 System Administrator Account**:
  - **Email**: `admin@docuflow.edu`
  - **Password**: `Admin@DocuFlow2026!`
  - **Permissions**: Full institutional configuration (Regulations, Batches, Subjects, User provisioning, Subject/HOD assignments).

All other operational records (Regulations, Batches, Subjects, Faculty/Expert/HOD/Student users, Course Materials, AI Reports, Reviews, Approvals, Code Submissions) are created dynamically during authentic user operations.

---

## 3. Quick Start & Execution Guide

### Prerequisites
- Node.js (v18+) & npm
- Python (3.10+) with pip
- MongoDB (running locally on port 27017 or via Docker)
- Optional: Ollama running locally with `ollama run llama3:8b`

### Step 1: Clone or Navigate to Directory
```powershell
cd "C:\Users\user\OneDrive\Documents\MINI P\DocuFlow-AI"
```

### Step 2: Seed the Essential System Configuration
```powershell
cd backend
npm run seed
```

### (Optional) Verify Full System Integration
To run an automated end-to-end integration test validating MongoDB models, AI auditing, document approval workflow, and coding sandbox:
```powershell
npm test
```

### Step 3: Start Services
You can run all services with one command using the provided script:
```powershell
.\scripts\start_all.ps1
```

Or start each service in separate terminals:

**Terminal 1 — Python AI Service (Port 8000):**
```powershell
cd ai-service
python app/main.py
```

**Terminal 2 — Node.js Express Backend (Port 5000):**
```powershell
cd backend
node src/server.js
```

**Terminal 3 — React Frontend (Port 3000):**
```powershell
cd frontend
npm run dev
```

Visit **`http://127.0.0.1:3000`** in your browser.

---

## 4. Docker Deployment
To launch the entire platform in Docker containers:
```powershell
cd docker
docker-compose up --build -d
```
Services will be accessible at:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000/api`
- AI Microservice: `http://localhost:8000`
- MongoDB: `localhost:27017`

---

## 5. Project Folder Structure

```
DocuFlow-AI/
├── frontend/                  # React 19 + Vite + Tailwind CSS v4 UI
│   ├── src/
│   │   ├── components/        # Navbar, Sidebar, StatusBadge, Modals
│   │   ├── context/           # AuthContext (JWT session management)
│   │   ├── pages/             # Dashboards for Admin, Faculty, Expert, HOD, Student
│   │   ├── services/          # Centralized Axios API client
│   │   ├── App.jsx            # Main App router
│   │   └── main.jsx           # App entrypoint
├── backend/                   # Node.js + Express REST API Server
│   ├── src/
│   │   ├── config/            # MongoDB connection
│   │   ├── controllers/       # Auth, Admin, Faculty, Expert, HOD, Student, Coding
│   │   ├── middleware/        # JWT auth, RBAC authorization, Multer uploads
│   │   ├── models/            # EXACTLY 25 Mongoose models & master index
│   │   ├── routes/            # REST API route handlers
│   │   ├── scripts/           # Full database seed script (25 collections)
│   │   ├── services/          # Code execution sandbox, AI client, notifications
│   │   └── server.js          # Express app entrypoint
├── ai-service/                # Python FastAPI Microservice
│   ├── app/
│   │   ├── main.py            # FastAPI endpoints (/verify, /summarize, /chat)
│   │   ├── extractor.py       # PyMuPDF and Word OpenXML parser
│   │   └── auditor.py         # 12-point academic verification & Ollama prompts
│   └── requirements.txt       # Python dependencies
├── storage/
│   ├── uploads/               # Uploaded academic documents (.pdf, .docx, .txt)
│   └── mongodb_data/          # Local MongoDB persistence data directory
├── docker/                    # Docker compose & container definitions
├── documentation/             # System Architecture & API Specifications
└── scripts/                   # Startup & database seeding automation scripts
```

---

## 6. Verification and Testing Checklist

- [x] **Phase 1**: Workspace inspected, `DocuFlow-AI` directory structure established.
- [x] **Phase 2**: Exactly 25 Mongoose collections created and successfully seeded in MongoDB.
- [x] **Phase 3**: Academic curriculum engine configured (regulations, years, batches, 4 semesters, subjects, assignments).
- [x] **Phase 4**: Secure multi-version document upload engine with non-destructive storage.
- [x] **Phase 5**: Python FastAPI service with 12-point academic auditing and Ollama fallback.
- [x] **Phase 6**: Strict approval workflow state machine (Faculty &rarr; AI &rarr; Expert &rarr; HOD &rarr; Student).
- [x] **Phase 7**: Student portal with approved library, AI study summaries, and RAG chatbot.
- [x] **Phase 8**: Interactive coding sandbox supporting Python, C, C++, Java, and SQL with automated test case evaluation.
- [x] **Phase 9**: Real-time notifications, audit logs, and dashboard analytics.
- [x] **Phase 10**: Vite frontend production build tested and verified with 0 errors.
#   D O C U F L O W  
 