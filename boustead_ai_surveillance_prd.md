# Boustead Cuping Perak AI Surveillance PRD (Simplified + HIL-Ready)

## 1) Project Overview
- **Farm:** Boustead Cuping, Perak
- **Area:** 400 acres (to be confirmed in survey)
- **Goal:** operationalize AI-led surveillance for physical threats with human accountability, focused initially on reliability, stability, and response quality.
- **Threat scope:** boar intrusion, human intrusion, fire/smoke risk, arson-risk movement, and restricted-zone breaches.
- **Initial model stack:** edge detection with YOLO/RT-DETR and multimodal verification under DGX Spark + policy/RAG control.
- **Thermal strategy:** thermal input is enabled for fire/smoke risk lanes to reduce night and haze false ambiguity.

## 2) Core Product Requirements
- Detect and score threats in real time (severity, confidence, zone, evidence references)
- Turn physical threat flags into operational work items with clear owner and resolution path
- Require Human-In-The-Loop for close-out of critical events
- Provide operator-visible timeline: AI flag, assignment, acknowledgement, action, resolution, audit
- Maintain stable event processing under edge/network variability
- Surface reliability indicators for cameras, network, and queue health
- Deliver audit-ready evidence and decisions for operational review

## 3) Business and Performance Outcomes
- Shorter median response time for critical incidents
- Higher resolution quality through operator acknowledgement and explicit outcomes
- Reduced unstable behavior from alert storms and duplicate processing
- Evidence completeness for all closed physical threats
- Stable queue and latency behavior across variable stream quality

## 3a) Audience and governance alignment
- Management evidence: measurable outcomes with measurable ownership, not only model performance.
- Operations evidence: one incident owner, one required acknowledgement, one auditable closure.
- Technical evidence: explicit edge-first flow, bounded queue behavior, and deterministic retry policy for unstable streams.
- Compliance evidence: immutable trail for critical threat lifecycle and evidence references.

## 4) Simplified Incident Lifecycle
Standard lifecycle for all critical physical threats:

`AI Flagged -> User Assigned -> Acknowledged -> Resolved / Escalated -> Audited`

Definitions:
- **AI Flagged:** model generated alert enters event queue with metadata and source clips.
- **User Assigned:** responsible operator automatically or manually assigned.
- **Acknowledged:** operator accepts responsibility and begins resolution.
- **Resolved / Escalated:** one of outcomes `False Positive`, `Resolved On Site`, `Escalated To Patrol`, `Drone Verification Required`.
- **Audited:** immutable entry includes actor, timestamp, action notes, and evidence state.

## 5) Required Incident Ownership and Status Rules
- Every critical event must have:
  - `assigned_operator_id` (non-null before operator-facing close)
  - `acknowledged_at` before closure
  - `resolution_outcome` for critical physical threats
  - at least one audit line entry
- State progression is monotonic; transitions that skip acknowledgement are blocked by default.
- Duplicate candidates may be grouped by threat+zone+time window to prevent churn.

## 6) Data Contracts (Minimal HIL Contract)
- **Event:** `event_id, device_id, zone_id, ts_utc, threat_type, severity, confidence, source_types, model_version, clip_ref, snapshot_ref, candidate_score, policy_flags`
- **Incident:** `incident_id, event_id, status, assigned_operator_id, acknowledgement_ts, outcome, resolution_note, resolved_ts, escalation_target, audit_entries, confidence, zone_id`
- **Audit Entry:** `actor_id, actor_role, action, state_from, state_to, notes, evidence_scope, ts_utc, retention_bucket`
- **Evidence Link:** `evidence_id, incident_id, type(optical|thermal|drone), storage_uri, integrity_hash, captured_ts`
- **Device:** `device_id, zone_id, model, firmware_version, heartbeat_s, network_rssi, storage_pct, temp_c, tamper_state`

## 7) KPI Framework
- % of critical AI flags acknowledged within SLA
- % incidents resolved with evidence
- Median human validation time
- Open unresolved physical threats by zone
- Repeat unresolved threat locations
- Duplicate alert rate
- P95 queue-to-operator latency
- Critical missed-event rate in controlled tests

## 8) MVP Scope (Phase 1)
- Edge-first metadata flow for detection and queueing
- Human-in-the-loop resolution for all high/critical physical threats
- Thermal lane for smoke/fire candidates in pilot zones
- Incident ownership model, status transitions, audit trail
- Operator dashboard for ack/resolution/notes
- Camera/device health and retry-state visibility

## 9) Non-Goals for Phase 1
- Full court legal chain-of-custody productization
- Fully automated dispatch with no human closure
- Full replacement of third-party perimeter hardware or SOP ecosystem
- Multi-region architecture beyond intended production topology

## 10) Performance Targets
- Boar/intrusion P95 alert-to-queue: `< 20s`
- Smoke/fire P95 alert-to-queue: `< 40s`
- Critical false-positive rate after tuning: `< 8%`
- Missed-event rate in replay/pilot tests: `<= 2%`
- Median operator validation time: `< 90s`
- Camera/device uptime: `>= 98.5%`

## 11) Test Strategy
- **Deterministic replay:** same clips, fixed labels, fixed windows.
  - Compare duplicate rate, false positives, latency distribution, acknowledgment time.
- **Controlled pilot:** 1 to 2 zones, 2 to 3 weeks, blind operator rotation for bias reduction.
- **Comparison design:** baseline vs simplified pipeline, same threat taxonomy and evidence definitions.
- **Acceptance rule:** simplification must reduce latency variance and queue instability while holding or improving critical detection and human closure quality.

## 12) Architecture (Recommended)
- **Edge-first detection:** RTSP/ONVIF ingest, adaptive sampling, quality filtering, YOLO/RT-DETR, ByteTrack/DeepSORT.
- **Verification:** candidate engine + SmallVLM for ambiguous cases.
- **Reasoning:** DGX Spark + LLM + RAG + policy matrix.
- **Incident layer:** assignment, acknowledgement, audit trail, and escalation action output.
- **Storage:** PostgreSQL + object storage for evidence clips/snapshots.

## 13) Pilot and Rollout
- **Weeks 1-9:** foundations (data contracts, lifecycle, operator roles, queue policy, health view)
- **Weeks 10-18:** detection tuning, thermal integration, incident evidence model, policy rules
- **Weeks 19-24:** controlled pilot and statistical review in priority zones
- **Weeks 25+:** farm-wide rollout with hardening and governance updates

## 14) Open Decisions
- Confirm final land boundary input and geofence format before final deployment claims
- Confirm camera count, lens coverage, bandwidth profile, and thermal hardware count
- Confirm operator roles, escalation privileges, and notification channels
- Confirm incident retention window and audit retention standards
- Confirm external integration channels for patrol/escalation and emergency coordination
