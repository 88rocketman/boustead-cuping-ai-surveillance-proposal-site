# Mockup Functional Requirements Recheck - Boustead Cuping Perak

**Scope checked:** `boustead_ai_surveillance_mockup.html` against PRD + research assumptions (`boustead_ai_surveillance_prd.md`, `boustead_cuping_plantation_surveillance_research.md`)
**Date:** 2026-06-23  

## Quick Verdict
- **Core threat visualization is present** (perimeter map, zone filtering, live feeds, alert stream, baseline KPI/pipeline).
- **End-to-end operational control is not yet represented** (incident lifecycle, evidence, operator feedback, device lifecycle controls).
- **Research-driven capabilities are only partially represented** (no weather/quality gates, no tamper/health events, no rule configuration state, no policy/alert tuning controls).

## Requirement Mapping (Implementation Readiness)

| Requirement | Requirement source | Mockup status | Status | Recommended action |
|---|---|---|---|---|
| AI detection pipeline for boar/human/smoke/fire | PRD FR-1/FR-2, Section 5 | Visual mock only | **Partial** | Replace static cards with live inference cards bound to `confidence`, `model`, and `threat class`; show `unknown` fallback class. |
| Multi-threat confidence + severity | PRD FR-3, Research threat stack | Mock indicators only | **Partial** | Add event row fields: `confidence`, `severity`, `source_types` and trend line or sparkline. |
| Zone/time/weather alert rules | PRD FR-4, Research Section 3/4 | Not present | **Missing** | Add rule panel with zone selectors + thresholds + policy preview. |
| Edge-first queue + sync on outage | PRD FR-5, Research architecture | Mock visual only | **Partial** | Add explicit queue/health badges (`Edge queue size`, `last sync`, `backlog`). |
| Real-time alerts by priority/zone | FR-6, KPI requirement | Present in timeline | **Partial** | Add sorting/filter by priority + SLA badge + acknowledgement SLA. |
| Incident state flow (New/Ack/Verify/Dispatch/Close) | FR-7, Feature F10 | Missing | **Missing** | Add clickable incident state actions and timestamps (`ack_time`, `verify_by`, `closed_by`). |
| Device health & camera quality | FR-8, Feature F6 | Not bound | **Missing** | Add dedicated panel with per-device heartbeat, storage, lens health, network status and stale-stream detection. |
| Alert labeling feedback | FR-9, Feature F11 | Missing | **Missing** | Add operator controls: `False positive`, `True positive`, `Missed` with quick tag notes. |
| Firmware + model updates + rollback | F7/Research 6 | Not represented | **Missing** | Add firmware lane with `version`, `pending update`, `staged rollout`, `rollback` indicators. |
| Tamper/offline monitoring | FR-11 | Not represented | **Missing** | Add tamper states and offline warning state transitions with remediation CTA. |
| Security and audit traceability | NFR-3, F12, Research 6.4 | Not represented | **Missing** | Add audit/activity log table and role-based action lock indicators. |
| Reporting and trends | F13 | Minimal | **Partial** | Add weekly trend summary card(s): misses, false-positive, response time. |
| API/Webhook integration contract | F14, Data contract | Partial label | **Missing** | Add API status card with endpoint examples and export actions. |

## Mockup Coverage Snapshot by Functional Area
- **Implemented**
  - Perimeter map with area chips and selectable zones
  - Camera feed showcase for different zones
  - Timeline stream with mock events
  - Baseline risk/architecture indicators and KPI summary

- **Partially implemented**
  - Alert stream prioritization (visual only, no operator workflow)
  - Threat classes (visual labels, no model metadata)
  - Incident strip and evidence intent (no actual clip link fields)

- **Not implemented**
  - Incident lifecycle workflow
  - Device health + firmware management
  - Feedback labeling and retraining loop
  - Access control and audit logs
  - Rules engine controls (zone/time/weather)
  - Evidence retention/export/incident API actions

## Recommended Mockup Upgrades (to match entire requirement)
1. **Operator Console Enhancements**
   - Event selected state, state transition buttons, and operator notes.
   - False-positive / false-negative labeling per event.
2. **Device Ops Console**
   - Heartbeat, tamper, temperature, lens health, storage, and queue metrics.
   - Simulated `device offline`, `offline recovery`, `tamper clear` transitions.
3. **Rule & Threshold Panel**
   - Zone profile controls (time window + humidity + wind + confidence floor).
   - Dry-weather mode presets and emergency escalation override.
4. **Incident Evidence Pack**
   - Add evidence fields: `clip_reference`, `snapshot`, `recommendation_level`.
   - Export/review actions (`Download bundle`, `Escalate`, `Assign`).
5. **Governance & trace**
   - Audit feed for role changes, rule edits, firmware model pushes, rollback events.
6. **Delivery readiness**
   - Add acceptance status row using PRD acceptance criteria as mini scorecard.

## Priority Implementation Order (recommended)
1. **P0:** Incident lifecycle + alert verification + feedback tags  
2. **P1:** Device health/tamper and outage queue behaviour  
3. **P2:** Rule presets + API/evidence export actions  
4. **P3:** Audit/traceability + permissions display  

If you want, I can now apply these upgrades directly into `boustead_ai_surveillance_mockup.html` in the same premium style so the mockup matches the entire PRD scope. 


