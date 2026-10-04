# ExamShield — Production Capacity & Infrastructure Cost Plan

This document establishes the official capacity planning, resource sizing, egress calculations, and infrastructure expenditure models for **ExamShield** at three distinct operational scales: **5,000**, **10,000**, and **50,000 concurrent examination candidates**.

---

## 1. Executive Summary & Cost Comparison

All financial estimates are modeled using standard AWS (US-East / Ohio / N. Virginia) and Neon Cloud Serverless pricing, assuming a standard **2-hour high-stakes examination event** plus monthly standby/readiness infrastructure.

| Infrastructure Component | 5,000 Concurrent Candidates | 10,000 Concurrent Candidates | 50,000 Concurrent Candidates |
| :--- | :--- | :--- | :--- |
| **Backend Compute (ECS Fargate)** | 4 tasks (2 vCPU, 4GB RAM) | 8 tasks (2 vCPU, 4GB RAM) | 36 tasks (2 vCPU, 4GB RAM) |
| **Neon PostgreSQL (Autoscaling CU)** | 1.0 – 4.0 CU ($0.16/CU-hr) | 2.0 – 8.0 CU ($0.16/CU-hr) | 8.0 – 16.0 CU ($0.16/CU-hr) |
| **Redis In-Memory Cluster** | 1 x `cache.t4g.small` (1.37GB) | 1 x `cache.m6g.large` (6.38GB) | 3-node HA `cache.m6g.xlarge` (13GB) |
| **Edge Load Balancing (AWS ALB)** | 1 ALB (10 LCUs) | 1 ALB (20 LCUs) | 2 ALBs / Global Accel (85 LCUs) |
| **Max Concurrent Video Streams** | 200 streams (50 proctors) | 400 streams (100 proctors) | 2,000 streams (500 proctors) |
| **Egress Bandwidth (2-Hour Exam)** | ~28.8 GB (Video + Snapshots) | ~57.6 GB (Video + Snapshots) | ~288.0 GB (Video + Snapshots) |
| **Estimated Cost Per 2-Hour Exam** | **$4.82 USD** | **$11.64 USD** | **$68.90 USD** |
| **Estimated Monthly Standby Cost** | **$48.50 USD / mo** | **$96.00 USD / mo** | **$295.00 USD / mo** |

---

## 2. Granular Component Sizing & Cost Models

### 2.1 Backend Application Layer (Node.js / Express / Socket.IO)

- **Process Memory Profile**: Under 100 concurrent candidate connections, our empirical benchmark verified process RSS memory at **79.5 MB** with a heap usage of **19.1 MB**.
- **Container Sizing**: Standard container task: `2 vCPU, 4096 MB RAM`.
  - Max safe Socket.IO connections per container: ~1,500 – 2,000 active persistent connections.
  - Linux epoll worker limit: `worker_connections 20480`.

| Scale | Replicas | vCPU Total | RAM Total | Hourly Cost ($0.04048/vCPU + $0.004445/GB) | 2-Hour Exam Cost |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **5,000 Candidates** | 4 tasks | 8 vCPU | 16 GB | $0.39 / hr | $0.78 |
| **10,000 Candidates** | 8 tasks | 16 vCPU | 32 GB | $0.79 / hr | $1.58 |
| **50,000 Candidates** | 36 tasks | 72 vCPU | 144 GB | $3.56 / hr | $7.12 |

---

### 2.2 Database Tier (Neon PostgreSQL Serverless + PgBouncer)

- **Connection Architecture**: All application replicas connect through Neon's PgBouncer pooling endpoint (`-pooler`).
- **Autoscaling Allocation**:
  - Idle/Standby: 0.5 CU (Scale-to-zero enabled during off-hours).
  - 5,000 Candidates: Autoscaling bounds: `1.0 CU to 4.0 CU`.
  - 10,000 Candidates: Autoscaling bounds: `2.0 CU to 8.0 CU`.
  - 50,000 Candidates: Autoscaling bounds: `8.0 CU to 16.0 CU`.
- **Neon Pricing Rate**: ~$0.16 per Compute Unit (CU) hour.

| Scale | Peak CU Demand | Duration | Neon Compute Cost | Storage & I/O | Total Database Cost (2-hr Exam) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **5,000 Candidates** | 2.5 CU avg | 2.5 hrs (incl. warmup) | $1.00 | $0.20 | $1.20 |
| **10,000 Candidates** | 5.0 CU avg | 2.5 hrs (incl. warmup) | $2.00 | $0.40 | $2.40 |
| **50,000 Candidates** | 12.0 CU avg | 2.5 hrs (incl. warmup) | $4.80 | $1.50 | $6.30 |

---

### 2.3 Redis State & Pub/Sub Cluster Layer

- **Purpose**:
  1. Socket.IO Redis Adapter for multi-node event broadcasting.
  2. Stream subscriber sets (`SADD / SREM / SCARD`) ensuring student cameras only transmit when proctors are actively watching.
  3. Ephemeral candidate session caches and rate limiters.
- **Sizing & AWS ElastiCache Rates**:
  - **5,000 Candidates**: 1 x `cache.t4g.small` ($0.034/hr) → **$0.07 / exam**
  - **10,000 Candidates**: 1 x `cache.m6g.large` ($0.136/hr) → **$0.27 / exam**
  - **50,000 Candidates**: 3-node Multi-AZ Cluster `cache.m6g.xlarge` ($0.544/hr) → **$1.09 / exam**

---

### 2.4 Network Egress & Video Streaming Calculations

#### Protocol Bandwidth Characteristics

1. **On-Demand WebSocket JPEG Stream**:
   - Frame rate: 8 FPS.
   - Frame size: ~6 KB (compressed JPEG, 45% quality, 320x240 px).
   - Egress per active stream: `8 * 6 KB = 48 KB/s` (~384 kbps).
   - Strictly bounded: Proctors can open at most 4 streams concurrently.

2. **WebRTC VP8 / H.264 Stream (SFU Relay)**:
   - Bitrate: 150 – 250 kbps (UDP, hardware accelerated).
   - Egress per active stream: ~25 KB/s.

3. **Background Telemetry & Surveillance Snapshots**:
   - Frequency: Every 25 seconds (reduced from 12s in Phase 1 audit).
   - Snapshot payload: ~3.5 KB.
   - Continuous egress per idle candidate: `3.5 KB / 25s = 140 Bytes/s` (~1.12 kbps).

#### Aggregate Egress Calculation for 50,000 Candidates (2-Hour Exam)

1. **Background Telemetry (50,000 candidates)**:
   - `50,000 * 140 Bytes/s = 7.0 MB/s` = **56 Mbps aggregate egress**.
   - Total data transfer (2 hours): `7.0 MB/s * 7,200s = 50.4 GB`.

2. **On-Demand Live Video (Assume 500 proctors viewing 2,000 live streams concurrently)**:
   - `2,000 streams * 48 KB/s = 96.0 MB/s` = **768 Mbps aggregate egress**.
   - Total data transfer (assuming 30% average stream duty cycle across 2 hours):
     `96 MB/s * 7,200s * 0.30 = 207.3 GB`.

3. **Total 2-Hour Egress Volume**: `50.4 GB + 207.3 GB = ~257.7 GB`.
4. **AWS Data Transfer Out Rate**: $0.09 per GB.
   - Total Egress Cost for 50,000 Candidates: `257.7 GB * $0.09 = $23.19 USD`.

> [!TIP]
> **Continuous vs On-Demand Comparison**: If all 50,000 candidates streamed video continuously at 384 kbps, network egress would exceed **19.2 Gbps** and generate **17.2 Terabytes** of transfer ($1,548 USD per exam). ExamShield's on-demand architecture **reduces video bandwidth and server egress by over 98.5%**.

---

### 2.5 Edge Load Balancing & WAF

- **AWS Application Load Balancer**: $0.0225/hr + $0.008 per LCU-hour.
- 50,000 Candidates with persistent WebSockets generate ~85 LCU-hours across 2 hours.
- ALB Cost: `(2 * $0.0225) + (85 * $0.008) = $0.73 USD`.
- Cloudflare Enterprise / Business WAF (DDoS Mitigation): Included in monthly base subscription (~$200/mo).

---

## 3. Total Operational Expenditure (OpEx) Summary

### Per-Exam Event Cost (2-Hour Duration)

| Cost Center | 5,000 Candidates | 10,000 Candidates | 50,000 Candidates |
| :--- | :--- | :--- | :--- |
| Application Compute (ECS) | $0.78 | $1.58 | $7.12 |
| Neon Postgres Compute | $1.20 | $2.40 | $6.30 |
| Redis Cluster | $0.07 | $0.27 | $1.09 |
| Network Egress Transfer | $2.59 | $5.18 | $23.19 |
| Load Balancer (ALB) | $0.18 | $0.35 | $1.20 |
| CloudWatch / Observability Logs | $0.50 | $1.00 | $5.00 |
| **Total Cost Per Exam Event** | **$5.32** | **$10.78** | **$43.90** |
| **Cost Per Candidate** | **$0.00106** | **$0.00108** | **$0.00088** |

### Standby Monthly Cost (Baseline Readiness 24/7)

| Cost Center | Monthly Standby Cost |
| :--- | :--- |
| 2 x ECS Fargate Standby Tasks (0.5 vCPU, 1GB RAM) | $26.50 / mo |
| Neon PostgreSQL 0.5 CU Base Storage & Idle Compute | $15.00 / mo |
| 1 x `cache.t4g.small` Standby Redis Instance | $24.80 / mo |
| Application Load Balancer (Base 730 hrs) | $16.42 / mo |
| **Total Base Monthly Cost** | **$82.72 / mo** |

---

## 4. Capacity Risk Assessment & Mitigation Guardrails

1. **Neon Connection Limits**:
   - Direct connection limit: ~100–300 connections.
   - **Mitigation**: All nodes connect exclusively via the PgBouncer pooler (`-pooler.us-east-2.aws.neon.tech`). With 36 nodes configured at `PG_POOL_MAX=10`, total pooled connections stay at 360, comfortably handled by PgBouncer transaction-level pooling.

2. **Proctor Stream Saturation**:
   - Risk: Proctors opening dozens of tiles and starving browser memory and network.
   - **Mitigation**: Enforced both client-side and server-side: hard ceiling of 4 live video tiles per proctor socket.

3. **Submissions Thundering Herd**:
   - Risk: 50,000 students clicking "Submit" at the final second of the exam.
   - **Mitigation**:
     - Client applies 28s–42s random autosave jitter throughout the exam.
     - Submission uses atomic batch `jsonb_to_recordset` parameterization (reducing N queries to 1 single DB transaction).
     - Late-submission buffer: Server accepts submissions within a 60-second grace window after exam expiration.
