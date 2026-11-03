# Nexify Examina (ExamShield) — k6 Safe Load Testing Runbook

This directory contains standalone Grafana k6 scripts to benchmark system performance and concurrency thresholds without affecting production code.

## Discovered API Contracts Under Test
1. **Health Check:** `GET /api/health`
2. **Student Authentication:** `POST /api/auth/student/login`
3. **Question & Exam Loading:** `GET /api/student/exams/:id`
4. **Session Initialization:** `POST /api/student/exams/:id/start`
5. **Debounced Answer Save:** `POST /api/student/exams/:id/save-answer`
6. **Bulk Answer Flush:** `POST /api/student/exams/:id/save-answers-bulk`
7. **Final Submission & Grading:** `POST /api/student/exams/:id/submit`

---

## Prerequisites & Setup (Windows)

1. **Verify k6 is installed:**
   ```powershell
   k6 version
   ```

2. **Prepare Staging Test Accounts:**
   Copy `test_students.example.json` to `test_students.json` inside `load-tests/` and enter your staging student test credentials:
   ```powershell
   copy load-tests\test_students.example.json load-tests\test_students.json
   ```

3. **Set Environment Variables (PowerShell):**
   ```powershell
   $env:BASE_URL="http://localhost:5000"
   $env:EXAM_ID="<your-staging-exam-uuid>"
   $env:EXAM_KEY="<your-staging-exam-key>"
   $env:QUESTION_ID_1="<staging-question-1-uuid>"
   $env:QUESTION_ID_2="<staging-question-2-uuid>"
   ```

---

## Progressive Test Execution Plan

### Stage 1: Baseline Health Check (10 VUs Max)
Verifies HTTP network routing and connection handling without database pressure:
```powershell
k6 run --env BASE_URL="http://localhost:5000" load-tests\01_health_check.js
```

### Stage 2: Authentication & Token Issuance (10 VUs Default, 25 only upon approval)
Measures bcrypt verification throughput and JWT generation:
```powershell
k6 run --env BASE_URL="http://localhost:5000" --env TARGET_VUS=10 load-tests\02_student_login.js
```

### Stage 3: Full Exam Lifecycle Test (10 VUs Default)
Executes login, exam loading, session start, single answer save, bulk save, and submission:
```powershell
k6 run --env BASE_URL="http://localhost:5000" --env TARGET_VUS=10 --env EXAM_ID="$env:EXAM_ID" --env EXAM_KEY="$env:EXAM_KEY" --env QUESTION_ID_1="$env:QUESTION_ID_1" --env QUESTION_ID_2="$env:QUESTION_ID_2" load-tests\03_exam_lifecycle_flow.js
```

---

## Safety Guidelines & Guardrails
- **Never test against production databases without isolated test tenants.**
- **Automatic Test Abort Criteria:**
  - HTTP error rate > 2%
  - p95 latency > 2000ms (sustained)
  - Database pool exhaustion or backend instability
