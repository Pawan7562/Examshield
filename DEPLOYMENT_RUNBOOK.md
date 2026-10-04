# ExamShield — Enterprise Production Deployment & Operations Runbook

This document is the authoritative operations manual for deploying, scaling, managing, and maintaining **ExamShield** in enterprise environments supporting up to **50,000 concurrent examination candidates**.

---

## 1. System Architecture Overview

```
                          [ Internet: 50,000 Candidates + 2,500 Proctors ]
                                                │
                                                ▼ HTTPS / WSS
                       ┌─────────────────────────────────────────────────┐
                       │       Edge Load Balancer & DDoS Shield          │
                       │     (AWS ALB / Cloudflare / Nginx Reverse)      │
                       │  - SSL/TLS Termination (HTTP/2, WSS)            │
                       │  - Rate Limiting (50 r/s API, 100 conns/IP)     │
                       │  - WebSocket Upgrade Headers & Sticky Sessions  │
                       └────────────────────────┬────────────────────────┘
                                                │
                     ┌──────────────────────────┴──────────────────────────┐
                     │                                                     │
                     ▼                                                     ▼
        ┌─────────────────────────┐                           ┌─────────────────────────┐
        │   ExamShield Node 1     │                           │   ExamShield Node N     │
        │   (Node.js / Express)   │ ◄─── (Horizontal Scale) ─►│   (Node.js / Express)   │
        │ - 4 Stream/Proctor Cap  │                           │ - 4 Stream/Proctor Cap  │
        │ - Batch JSONB Autosave  │                           │ - Batch JSONB Autosave  │
        │ - Local Memory Buffer   │                           │ - Local Memory Buffer   │
        └────────────┬────────────┘                           └────────────┬────────────┘
                     │                                                     │
                     ├──────────────────────────┬──────────────────────────┤
                     │                          │                          │
                     ▼                          ▼                          ▼
        ┌─────────────────────────┐┌─────────────────────────┐┌─────────────────────────┐
        │   Redis 7 Cluster / HA  ││   Neon Postgres (AWS)   ││   WebRTC SFU (Optional) │
        │ - Socket.IO Pub/Sub     ││ - PgBouncer Pooler      ││ - Mediasoup / LiveKit   │
        │ - Stream Subscriber Set ││ - Autoscaling 0.5-16 CU ││ - Low-latency UDP Video │
        │ - Candidate Roster Sync ││ - JSONB Answer Records  ││ - VP8 150-250 kbps      │
        └─────────────────────────┘└─────────────────────────┘└─────────────────────────┘
```

---

## 2. Infrastructure Requirements & Sizing

### 2.1 Scale Targets

| Metric | 5,000 Candidates | 10,000 Candidates | 50,000 Candidates |
| :--- | :--- | :--- | :--- |
| **Backend Replicas** | 4 instances (2 vCPU, 4GB RAM) | 8 instances (2 vCPU, 4GB RAM) | 32–40 instances (2 vCPU, 4GB RAM) |
| **Redis Instance** | 1 x 2GB RAM (Redis 7) | 1 x 4GB RAM (Redis 7) | 3-node HA Cluster (8GB RAM total) |
| **Neon Compute (CU)** | 1.0 – 4.0 CU (Autoscaling) | 2.0 – 8.0 CU (Autoscaling) | 8.0 – 16.0 CU (Autoscaling) |
| **Max DB Pool per Node** | 15 connections | 15 connections | 10 connections (via PgBouncer) |
| **On-Demand Video Bandwidth** | ~40 Mbps (max 200 streams) | ~80 Mbps (max 400 streams) | ~380–760 Mbps (max 2,000 streams) |
| **Background Snapshot Traffic** | ~3.2 Mbps (25s interval) | ~6.4 Mbps (25s interval) | ~32.0 Mbps (25s interval) |

---

## 3. Production Environment Configuration

All environment variables must be populated before initial startup. A verified production template is located at `.env.production`.

```ini
# Core Configuration
NODE_ENV=production
PORT=5000
APP_URL=https://exam.nexifyforge.in
CORS_ORIGIN=https://exam.nexifyforge.in

# Database Connectivity (Neon PostgreSQL with PgBouncer)
DATABASE_URL=postgresql://user:password@ep-cold-star-a1b2c3d4-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
PG_POOL_MAX=15
PG_IDLE_TIMEOUT_MS=30000
PG_CONNECTION_TIMEOUT_MS=15000

# Redis Cluster & Socket.IO State
REDIS_URL=redis://examshield-redis-cluster.internal:6379
REDIS_KEY_PREFIX=examshield:

# Security & Tokens
JWT_SECRET=super_secret_64_character_hex_string_do_not_use_defaults
JWT_EXPIRES_IN=8h

# Video Proctoring & Streaming Governance
MAX_PROCTOR_STREAMS=4
STREAM_INACTIVITY_TIMEOUT_SEC=120
BACKGROUND_SNAPSHOT_INTERVAL_SEC=25
MAX_STREAM_FPS=8
STREAM_JPEG_QUALITY=0.45
```

---

## 4. Production Deployment Procedure

### 4.1 Prerequisites
1. Docker Engine v24.0+ and Docker Compose v2.20+ (or Kubernetes v1.26+ cluster).
2. Domain DNS pointing to edge load balancer with valid TLS certificates.
3. Neon PostgreSQL database initialized and reachable via pooling endpoint.
4. Redis 7 instance or AWS ElastiCache cluster initialized.

### 4.2 Standard Deployment (Docker Compose)
From the repository root:

```bash
# 1. Pull latest verified production branch
git fetch origin main
git checkout main

# 2. Validate environment file integrity
test -f backend/.env || cp .env.production backend/.env

# 3. Build container images with clean cache
docker compose -f docker-compose.prod.yml build --no-cache

# 4. Launch containers in detached mode
docker compose -f docker-compose.prod.yml up -d

# 5. Verify service health
curl -s http://localhost:5000/api/health | jq .
```

### 4.3 Zero-Downtime Rolling Update (Blue-Green / Rolling Restart)
To update the backend instances without dropping active student exam connections:

```bash
# Scale up new replicas first
docker compose -f docker-compose.prod.yml up -d --no-deps --scale backend=6 --no-recreate backend

# Wait 30 seconds for health checks to pass on new containers
sleep 30

# Verify cluster health
docker compose -f docker-compose.prod.yml ps

# Gracefully decommission old containers
docker compose -f docker-compose.prod.yml up -d --no-deps --scale backend=3 backend
```

---

## 5. Live Examination Operations Runbook

### 5.1 Pre-Flight Verification Checklist (T minus 45 Minutes)
Execute these automated steps prior to admitting candidates:

1. **Verify Database Connectivity & Pool Sizing**:
   ```bash
   curl -s http://localhost:5000/api/health | jq '.database'
   # Expected output: { "status": "connected", "waiting": 0 }
   ```
2. **Verify Redis Cluster Health**:
   ```bash
   curl -s http://localhost:5000/api/health | jq '.redis'
   # Expected output: { "clusterActive": true, "status": "ready" }
   ```
3. **Execute End-to-End Synthetic Exam Verification**:
   ```bash
   cd backend && node tests/verify_all_exam_types.js
   # Must return 100% PASS on MCQ, Subjective, and Coding exam types
   ```
4. **Inspect Cloud Database Autoscaling**:
   Verify Neon autoscaling ceiling is set to at least 8 CU for 10k candidates, or 16 CU for 50k candidates.

### 5.2 Candidate Arrival Management (Staggered Window)
- **Do not open exam simultaneously for 50,000 candidates at a single millisecond.**
- Configure candidate registration and admission in a **5 to 10-minute staggered window** (e.g. 5,000 students admitted every 60 seconds).
- The client-side autosave scheduler dynamically applies **random jitter (28s to 42s)** across students to ensure submission requests never synchronize into harmonic traffic spikes.

### 5.3 Live Proctor Monitoring Operating Rules
1. **The 4-Stream Limit is Absolute**: Proctors can simultaneously view a maximum of 4 live video tiles. Attempts to subscribe to a 5th candidate will be rejected by the server with code `429 MAX_STREAMS_REACHED`.
2. **Proctor Delegation**: For an examination of 10,000 candidates:
   - Assign 1 proctor per 50 to 100 candidates for roster review (thumbnails).
   - At any moment, only ~100 to 200 candidates will have active live video streams (when flagged by AI or spot-checked).
3. **Camera Halting Verification**: When a proctor switches or closes a tile, verify the candidate camera halts uploading frames (indicated by status change to idle in server telemetry).

---

## 6. Incident Response & Troubleshooting

| Symptom | Root Cause | Immediate Action |
| :--- | :--- | :--- |
| **`503 Service Unavailable` on API calls** | Backend container crash or memory ceiling reached | Check `docker compose logs backend --tail 200`. Inspect memory with `docker stats`. Restart crashed replica. |
| **`504 Gateway Timeout` on answer autosaves** | Database connection pool exhausted or high Neon latency | Check Neon console compute metrics. Ensure PgBouncer pooler endpoint is in use (not direct unpooled port 5432). Increase `PG_POOL_MAX` if idle connections are low. |
| **Candidate sees "Camera Feed Blocked"** | Proctor exceeded 4-tile limit or cross-college access attempt | Proctor must click "Stop Stream" on an existing tile before opening a new stream. Verify proctor belongs to the exam's college. |
| **Candidate browser crashes or lags** | High CPU consumption from local AI face detection | Client automatically falls back to lightweight timer snapshots. Candidate can refresh page; state will instantly recover from IndexedDB and server sync. |
| **Socket disconnections during network blips** | Transient WiFi disruption on student machine | ExamShield holds candidate exam state locally in `IndexedDB`. Answers are safely preserved. Once network recovers, offline answers auto-flush via atomic batch update. |

---

## 7. Emergency Rollback Procedure

If a deployed release exhibits unexpected fatal errors during active examinations:

### 7.1 Rollback Trigger Criteria
- Error rate exceeds **1.0%** over a 2-minute window.
- Latency p95 exceeds **3,500ms** on `/api/student/exams/:id/autosave`.
- Server RSS memory grows monotonically above 1.8 GB per instance (leak indicator).

### 7.2 Rollback Execution Steps
```bash
# 1. Identify previous stable Docker image / git commit tag
PREV_STABLE_TAG="v2.4.1"

# 2. Switch repository to stable release
git checkout $PREV_STABLE_TAG

# 3. Perform rolling container replacement
docker compose -f docker-compose.prod.yml up -d --build --force-recreate

# 4. Verify system health
curl -f http://localhost:5000/api/health || echo "HEALTH CHECK FAILED"
```

> **Data Safety Guarantee:** Answers already stored in Neon PostgreSQL use backward-compatible columns. Rolling back backend binaries does not drop or corrupt candidate answers or submissions.

---

## 8. Post-Exam Archival & Maintenance

1. **Mark Completed Sessions**:
   Run automated submission sweep for expired sessions:
   ```sql
   UPDATE exam_sessions 
   SET status = 'submitted', updated_at = NOW() 
   WHERE status = 'active' AND expires_at < NOW();
   ```
2. **Purge Ephemeral Redis Keys**:
   Clear temporary stream subscriber sets and roster caches:
   ```bash
   redis-cli -u $REDIS_URL --scan --pattern "examshield:stream:*" | xargs -r redis-cli -u $REDIS_URL del
   ```
3. **Generate Final Proctoring Report**:
   Export audit logs, incident snapshots, and biometric telemetry for institutional compliance.
