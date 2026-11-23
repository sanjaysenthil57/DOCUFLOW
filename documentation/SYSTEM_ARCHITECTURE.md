# DocuFlow AI — System Architecture & Design Specification

## 1. Executive Summary

**DocuFlow AI** is an open-source, enterprise-grade academic document verification and student learning platform engineered specifically for Master of Computer Applications (MCA) and university engineering curricula. 

The platform digitizes academic document submission, verification, peer expert review, and Head of Department (HOD) final approval while employing a multi-stage local AI auditing engine to verify document completeness, structural hierarchy, and writing quality. In addition, it provides students with approved academic study notes, AI-powered section summaries, a Retrieval-Augmented Generation (RAG) academic chatbot, and an interactive multi-language coding sandbox (Python, C, C++, Java, and SQL).

---

## 2. Multi-Tier Architectural Topology

```
+-------------------------------------------------------------------------+
|                              CLIENT LAYER                               |
|                  React 19 + Vite + Tailwind CSS v4                      |
|   (Admin Hub, Faculty Desk, Expert Console, HOD Suite, Student Portal)  |
+-------------------------------------------------------------------------+
                                    |
                            HTTP / REST APIs
                                    |
+-------------------------------------------------------------------------+
|                             BACKEND TIER                                |
|             Node.js 20+ / Express.js REST Microservices                 |
|   - JWT Role-Based Access Control (Admin, Faculty, Expert, HOD, Student)|
|   - Document Upload & Version Control Engine                            |
|   - Automated Audit Logger & Notification Pipeline                      |
|   - Subprocess & Docker Isolated Code Sandbox                           |
+-------------------------------------------------------------------------+
            |                                           |
     Mongoose ODM                              Internal HTTP Micro-calls
            |                                           |
+-----------------------+              +----------------------------------+
|     DATABASE TIER     |              |           AI SERVICE TIER        |
|      MongoDB 9.0      |              |   Python 3.10 + FastAPI Service  |
|  EXACTLY 25 Logical   |              | - PyMuPDF / Zip-XML Text Parser  |
|      Collections      |              | - 12-Point Academic Audit Engine |
|                       |              | - Ollama Local LLM / NLP Engine  |
+-----------------------+              +----------------------------------+
```

---

## 3. Database Architecture — Exactly 25 Logical Collections

The MongoDB database (`docuflow_ai`) enforces strong relational integrity via Mongoose schemas across exactly 25 collections:

| # | Collection Name | Purpose & Key Relations |
|---|---|---|
| 1 | `users` | User accounts with hashed passwords (bcrypt), roles, and active flags. |
| 2 | `roles` | RBAC role definitions (`admin`, `faculty`, `expert`, `hod`, `student`) and permission matrices. |
| 3 | `academic_regulations` | University curriculum regulations (e.g., `R2021`, `R2023`). |
| 4 | `academic_years` | Academic calendars (e.g., `2025-2026`) and designated HOD per academic year. |
| 5 | `batches` | Student cohorts (e.g., `MCA 2024-2026`) bound to an academic regulation. |
| 6 | `semesters` | Four formal semesters per regulation (`Semester I` to `Semester IV`). |
| 7 | `subjects` | Subjects with credits, syllabus summary, and primary programming languages. |
| 8 | `faculty_assignments` | Mappings binding faculty to subjects, batches, and academic years. |
| 9 | `expert_assignments` | Mappings binding subject experts to specific curriculum subjects. |
| 10 | `student_enrollments` | Student enrollment records with register numbers, batch, and regulation. |
| 11 | `documents` | Core academic document entities with approval states and version references. |
| 12 | `document_versions` | Immutable version records (`v1`, `v2`, `v3`...) with file paths and hashes. |
| 13 | `ai_verification_reports` | Structured 12-point AI audit results, quality scores, and recommendations. |
| 14 | `expert_reviews` | Subject expert evaluation records with comments, ratings, and decisions. |
| 15 | `hod_approvals` | Final HOD endorsement records authorizing student publication. |
| 16 | `study_materials` | Approved study notes, AI section summaries, and Tamil concept translations. |
| 17 | `notifications` | Role-targeted notifications for submission status, corrections, and alerts. |
| 18 | `audit_logs` | Immutable operational logs capturing all administrative and academic actions. |
| 19 | `chatbot_conversations` | Conversation history for student RAG academic questions and citations. |
| 20 | `programming_languages` | Configured sandbox runtimes (`python`, `c`, `cpp`, `java`, `sql`). |
| 21 | `coding_questions` | Subject-oriented coding problems with difficulty levels and hints. |
| 22 | `coding_submissions` | Student code submission records with pass/fail counts and status. |
| 23 | `coding_test_cases` | Public and hidden test cases with expected outputs for questions. |
| 24 | `coding_assignments` | Faculty assignments containing collections of coding questions. |
| 25 | `execution_results` | Low-level sandbox execution logs with stdout, stderr, and timings. |

---

## 4. Five User Roles & Strict Access Separation

1. **System Administrator (`admin`)**:
   - Manages user accounts, active statuses, regulations, batches, semesters, subjects, and assignments.
   - Assigns HOD yearly and audits system logs.
   - **STRICT RESTRICTION**: Admin cannot upload documents or verify/approve documents.

2. **Faculty Member (`faculty`)**:
   - Authorized only for assigned subjects.
   - Uploads course syllabus, lecture notes, lab manuals, and assignments.
   - Submits documents to AI verification, reviews AI audit reports, and handles correction re-uploads (versioning).

3. **Subject Expert (`expert`)**:
   - Assigned subject-by-subject. Multiple experts can evaluate the same subject independently.
   - Previews uploaded files and reviews AI verification reports.
   - Can Approve, Reject, or Request Corrections with structured comments.
   - Expert approval moves the document to HOD final review.

4. **Head of Department (`hod`)**:
   - Final academic authority.
   - Supported with yearly assignment changes while preserving historical approval signatures.
   - Evaluates expert-approved documents and signs off on publication.
   - Only HOD-approved documents are published to the student body.

5. **Student (`student`)**:
   - Access is strictly bounded by the student's assigned Batch, Regulation, Semester, and Subject.
   - Can access only HOD-approved and published documents.
   - Reads AI summaries, study notes, and Tamil concept explanations.
   - Queries the AI Academic Chatbot with verified document citations.
   - Practices programming in the sandbox across Python, C, C++, Java, and SQL.

---

## 5. End-to-End Document Approval Workflow

```
[ Faculty Member ]
       |
       v
1. Upload Document (.pdf / .docx / .txt) ---> Stores v1.0 in storage/uploads
       |
       v
2. AI Verification Pipeline (FastAPI / PyMuPDF / Ollama)
       |--> Calculates Quality Score (0-100)
       |--> Checks Grammar, Structure, Missing Units, Citations
       |--> Generates AiVerificationReport
       |
       v
3. Subject Expert Review
       |-- Decision: "correction_required" ---> Notifies Faculty (Faculty re-uploads v2.0)
       |-- Decision: "rejected"           ---> Notifies Faculty (Workflow terminates)
       |-- Decision: "approved"           ---> Moves to Pending HOD Approval
       |
       v
4. HOD Final Approval Desk
       |-- Reviews Version History, AI Report, and Expert Comments
       |-- Decision: "rejected"           ---> Document remains unpublished
       |-- Decision: "approved"           ---> Document status set to "Published"
       |
       v
5. Student Publication & Study Materials
       |--> Auto-generates StudyMaterial record
       |--> Publishes to eligible student library (matched to Batch & Regulation)
       |--> Powers RAG Chatbot with verified document context
```

---

## 6. Code Sandbox Execution Security

Student code execution is isolated using a multi-barrier containment protocol:
- **Resource Constraints**: Maximum execution timeout of 6,000 milliseconds (prevents infinite while loops).
- **Process Isolation**: Spawns independent sub-processes with non-elevated user contexts.
- **Docker Environment**: Container configuration (`Dockerfile.sandbox`) with memory ceiling and restricted network bridge.
- **Standardized I/O Stream Normalization**: Line endings (`\r\n` vs `\n`) and trailing whitespace are automatically normalized before test evaluation.
