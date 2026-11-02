# Link Test — Architectural Decisions & Business Assumptions (ADRs)

## Status: Working Draft / Phase 0

This document tracks all core architectural, operational, and business decisions for **Link Test**, following the Master Product Specification (`docs/PRODUCT_SPEC.md`).

---

### Decision 1: Application Architecture & Framework
* **Decision**: Adopt Next.js 15+ (App Router) with React, TypeScript, and Tailwind CSS in a Modular Monolith architecture.
* **Rationale**: Eliminates synchronization overhead between detached frontend and backend repos while providing full-stack SSR, API Route Handlers, Server Actions, and easy deployment on Vercel or Node environments.
* **Status**: Accepted.

---

### Decision 2: Multi-Tenancy Strategy
* **Decision**: Implement Multi-Tenant data isolation using `tenant_id` (organizations) on all core entities, with Postgres Row Level Security (RLS) policies and server-side query filtering.
* **Rationale**: Enables institutes to operate securely in an isolated sandbox while allowing Super Admins platform-wide operational oversight.
* **Status**: Accepted.

---

### Decision 3: Identity & Authentication Provider
* **Decision**: Supabase Auth (or JWT-compatible auth handler with Postgres profiles) enforcing 3 core roles:
  1. `super_admin`
  2. `trainer`
  3. `student`
* **Rationale**: Managed security, password hashing, invitation magic tokens, and session handling with Postgres integration.
* **Status**: Accepted.

---

### Decision 4: Examination Engine Authoritative State Machine & Timers
* **Decision**: The backend server is the absolute single source of truth for:
  - Attempt start time and deadline (`deadline_at = started_at + duration_seconds`).
  - Answer submissions and evaluation scoring.
  - Test attempt state machine (`draft` -> `scheduled` -> `awaiting_approval` -> `ready` -> `in_progress` -> `submitted` / `auto_submitted` / `expired`).
  - Student local clocks are never trusted. Autosave uses debounce with idempotent upsert queries.
* **Status**: Accepted.

---

### Decision 5: Proctoring Strategy & 5-Flag Auto-Submission Policy
* **Decision**:
  - Webcams are processed client-side (face count / presence) without streaming continuous video to backend servers (preserving bandwidth, privacy, and cost).
  - Flags recorded: Multi-face, No-face, Tab switch/blur, Fullscreen exit, Camera lost.
  - Deduplicated & debounced timestamped events are sent to `/api/attempts/:id/events`.
  - Configurable violation threshold (default: 5 serious flags) triggers server-side automatic submission (`auto_submitted_proctoring_threshold`).
* **Status**: Accepted.

---

### Decision 6: Target Scalability & Load Testing Strategy (500 Concurrent Students)
* **Decision**:
  - The 500-concurrent-student metric is treated as a target to be scientifically validated using k6 load testing scripts simulating:
    1. Simultaneous batch login burst.
    2. Test start requests & trainer bulk approvals.
    3. Autosave polling (every 15–30s across 500 active sessions).
    4. Proctoring event ingestion under network noise.
    5. Final submission burst at deadline.
* **Status**: Accepted.
