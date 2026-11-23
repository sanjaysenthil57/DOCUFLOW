# DocuFlow AI — REST API Specification

Base URL: `http://127.0.0.1:5000/api`

## Authentication & Authorization
All secured endpoints require an HTTP header:
`Authorization: Bearer <JWT_TOKEN>`

---

## 1. Authentication APIs (`/api/auth`)

### `POST /api/auth/login`
Authenticates a user and returns their JWT token, profile, and student metadata (if applicable).
- **Request Body**:
```json
{
  "email": "faculty.priya@docuflow.edu",
  "password": "Password@123"
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "6724...",
    "name": "Dr. Priya Sundaram",
    "email": "faculty.priya@docuflow.edu",
    "role": "faculty",
    "department": "Master of Computer Applications (MCA)"
  }
}
```

### `GET /api/auth/me`
Returns current session profile and student enrollment metadata.

---

## 2. Administrator APIs (`/api/admin`) — Protected (`admin`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/users` | Lists users with search, role filters, and pagination. |
| `POST` | `/users` | Creates a new user (admin, faculty, expert, hod, student). |
| `PATCH` | `/users/:id/toggle-status` | Activates or deactivates an account. |
| `GET` | `/regulations` | Returns all academic regulations (e.g. `R2023`). |
| `POST` | `/regulations` | Creates a new academic regulation. |
| `GET` | `/academic-years` | Returns academic years with assigned HODs. |
| `POST` | `/academic-years` | Configures an academic calendar year. |
| `POST` | `/academic-years/assign-hod`| Updates the designated HOD for a given academic year. |
| `GET` | `/batches` | Lists MCA cohorts and their regulation mappings. |
| `POST` | `/batches` | Registers a new student batch. |
| `GET` | `/subjects` | Lists subjects by regulation and semester. |
| `POST` | `/subjects` | Creates a subject with credits and syllabus description. |
| `GET` | `/faculty-assignments` | Lists active faculty subject assignments. |
| `POST` | `/faculty-assignments` | Binds a faculty member to a subject and batch. |
| `GET` | `/expert-assignments` | Lists active subject expert assignments. |
| `POST` | `/expert-assignments` | Assigns an expert to a subject. |
| `GET` | `/audit-logs` | Retrieves system-wide immutable action audit logs. |

---

## 3. Faculty APIs (`/api/faculty`) — Protected (`faculty`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/assigned-subjects` | Retrieves all subjects assigned to the logged-in faculty. |
| `POST` | `/upload` | Multipart upload for course materials (.pdf, .docx, .doc, .txt). Triggers AI verification. |
| `POST` | `/reupload/:documentId` | Uploads a revised version (e.g., v2.0) preserving earlier versions. |
| `GET` | `/my-documents` | Retrieves all submitted documents and current status. |
| `GET` | `/documents/:id` | Returns complete document details, version trail, and AI reports. |

---

## 4. Subject Expert APIs (`/api/expert`) — Protected (`expert`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/assigned-documents` | Lists documents awaiting review for the expert's assigned subjects. |
| `GET` | `/documents/:id` | Detailed document inspection view with AI audit report. |
| `POST` | `/review/:documentId` | Submits expert decision (`approved`, `rejected`, `correction_required`). |
| `GET` | `/review-history` | Archive of past expert reviews and ratings. |

---

## 5. Head of Department APIs (`/api/hod`) — Protected (`hod`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/pending-approvals` | Lists expert-approved documents ready for final HOD sign-off. |
| `POST` | `/approve/:documentId` | Final decision (`approved`, `rejected`). Authorizes student publication. |
| `GET` | `/approval-history` | Immutable log of all documents approved by the HOD. |

---

## 6. Student APIs (`/api/student`) — Protected (`student`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/enrollment` | Retrieves student's enrolled batch, regulation, and semester. |
| `GET` | `/approved-documents` | **STRICTLY** retrieves published, HOD-approved documents for student's batch. |
| `GET` | `/study-materials` | Retrieves AI-generated summaries, section notes, and Tamil explanations. |
| `POST` | `/chatbot/ask` | Queries AI Academic Chatbot with verified document RAG context. |
| `GET` | `/chatbot/history` | Retrieves past chatbot conversation turns. |

---

## 7. Interactive Coding Sandbox APIs (`/api/coding`) — Authenticated

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/languages` | Lists available sandbox runtimes (`python`, `c`, `cpp`, `java`, `sql`). |
| `GET` | `/questions` | Returns course coding problems filtered by subject and difficulty. |
| `GET` | `/questions/:id` | Retrieves single question with public test cases and syntax template. |
| `POST` | `/run` | Executes arbitrary code with custom input in isolated sandbox. |
| `POST` | `/submit` | Evaluates submitted code against all public and hidden test cases. |
| `POST` | `/ai-help` | Generates diagnostic advice and logic hints without revealing solution. |
| `GET` | `/my-submissions` | Returns student's historical submission results and timings. |

---

## 8. Python AI Microservice APIs (`http://127.0.0.1:8000/api`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Returns microservice health and local LLM connectivity status. |
| `POST` | `/verify` | Parses PDF/DOCX/TXT and generates 12-point AI verification report. |
| `POST` | `/summarize` | Generates section-wise study summaries and Tamil translations. |
| `POST` | `/chat` | Context-aware Q&A inference. |
