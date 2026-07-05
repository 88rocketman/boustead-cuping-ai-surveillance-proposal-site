# Boustead Plantation - Integrated Corn/Maize Farm Surveillance Research
## Project: Technical Feasibility Study (AI-Enabled Perimeter & Field Monitoring)
**Location:** Cuping, Perak  
**Area:** 400 acres  
**Date:** 2026-06-22  

---

## Executive Summary
This research identifies and evaluates an AI-native surveillance architecture for a 400-acre maize farm with four threat categories: wild boars, intrusion, arson, and dry-weather fire. The preferred approach is a **hybrid architecture**: edge AI on smart cameras/gate devices for local inference and immediate alarms, with cloud for long-window analytics, model management, forensics, and fleet observability.

For immediate feasibility, the target baseline is:
- **Detection-first deployment** with verified alert paths for risk events.
- **Multi-sensor fusion** (visual + thermal + PIR/acoustic + weather) to reduce false positives.
- **Firmware-defined reliability** including watchdogs, offline buffering, and remote update channels.
- **Human-in-the-loop escalation** for arson/fire and critical intrusions.

The recommended rollout is staged: pilot in two high-risk zones for 6-8 weeks, then phased scale with KPI gates.

---

## 1. Scope and Assumptions
### 1.1 Study Scope
- Integrated perimeter and interior surveillance for:
  1. Wild boar intrusion
  2. Human intrusion
  3. Arson behavior
  4. Fire/smoke during dry conditions
- Full stack includes:
  - Cameras and recording architecture
  - AI inference and event analytics
  - Device firmware behavior and updates
  - Monitoring dashboard and alert workflows
  - Vendor preselection criteria

### 1.2 Confirmed Assumptions
- Base area: **400 acres**.
- AI is mandatory in detection pipeline and alert generation.
- AI outputs are advisory; enforcement action still requires human validation.
- Initial budget output should remain high-level (bands only), not line-item BOM.
- Existing camera feed is available and should be integrated rather than replaced unless gap analysis proves unusable.

### 1.3 Clarifications to Validate in Gate 0
1. Exact farm boundary: polygon coordinates and legal perimeter documents for the 400-acre site.
2. Number of existing poles, poles height constraints, power availability, and available network points.
3. Terrain map, road network, and security staffing patterns.
4. Definition of critical zones (seedling stage, tasseling stage, ripening stage windows).
5. Alarm handling policy and escalation hierarchy (farm supervisor, estate office, local authorities).
6. Regulatory constraints on recording retention and evidence handling.

---

## 2. Threat & Site Research
### 2.1 Threat Prioritization by Risk
- **Primary:** intrusions (human), arson, wild boars.
- **Secondary:** fire events (highest business impact but less frequent).
- **Cross-cutting:** missed alerts at fence perimeter and perimeter approach corridors.

### 2.2 Site and Terrain Risk Model
- **High-risk edges:** access points, natural gullies, hedgerow breaks, irrigation entry points.
- **Wild boar corridors:** dense boundary vegetation and low-visibility tracks.
- **Human intrusion patterns:** repeated tracks, recurring weak-post positions, blind corners.
- **Dry-weather ignition risk:** isolated machinery zones, leaf litter accumulation, hot sun-exposed slopes, exposed electrical points.

### 2.3 Stage-Dependent Crop Risk
- **Early growth:** crop theft and trampling less likely than intrusion; boar activity may be lower visibility but high movement.
- **Vegetative to pre-harvest:** highest mixed-risk period for boar intrusion and fire spread.
- **Harvest period:** human activity rises, so false positives from authorized movement must be reduced through role/shift-aware policies.

---

## 3. Detection Stack Research
### 3.1 Object and Event Detection by Threat
- **Wild boar detection**
  - Camera + motion model with nocturnal behavior adaptation.
  - Thermal and visual fusion improves low-light and dust performance.
  - Key false-alarm vectors: dogs, cattle, shadow movement, fast-moving wind-blown debris.
- **Human intrusion**
  - Human pose + movement path models with persistence scoring (single-frame detection is insufficient).
  - Behavior heuristics (loitering, repeated boundary probing, fence tampering posture) add intent signal.
  - Geo-fencing rules to suppress authorized staff/vehicle patterns.
- **Arson**
  - Event sequence learning: unusual after-hours lingering + open-torch behavior + vehicle activity near risk zones.
  - Heat source + smoke anomaly detection near storage/shed access.
  - Hard-to-automate indicators should remain candidate-only and escalate with confidence score threshold.
- **Fire / dry-weather fire**
  - Smoke plume detection + frame-wise thermal hotspot tracking + temporal pixel flicker score.
  - Weather/relative humidity context to improve prioritization (low humidity amplifies alarm severity).

### 3.2 Edge Cases and Resilience
- **Night / low-light:** thermal + IR backstop with fallback confidence floor.
- **Rain / drizzle:** conservative thresholding to reduce motion noise; use frame quality gate.
- **Fog / haze:** thermal emphasis and slower model confidence decay.
- **Dust storm / haze bursts:** motion ROI locking plus temporal persistence before alarm escalation.
- **Camera vandalism / occlusion:** periodic image quality checks; tamper event if blocked lens for >X minutes.

### 3.3 False Alarm Framework
- Multi-stage verification:
  1. Low-level detection
  2. Spatial-temporal correlation across nearest nodes
  3. Context gate (time, weather, nearby events)
  4. Human verification in command interface
- This reduces false positives while preserving response speed on high-confidence events.

---

## 4. Architecture Study
### 4.1 Candidate Architectures
- **Edge-first**
  - Pros: minimal bandwidth, fast local reaction, resilient during intermittent backhaul.
  - Cons: limited retraining flexibility, more complex remote management.
- **Cloud-first**
  - Pros: faster model experimentation, centralized analytics.
  - Cons: higher bandwidth dependency, less robust under network outages.
- **Hybrid (recommended)**
  - Pros: best operational balance for 400 acres.
  - Design: edge handles first-pass alerting, cloud handles enrichment, history, dashboards, retraining, and reporting.

### 4.2 Recommended Hybrid Blueprint
- **At each gateway/farm zone:**
  - 1-2 AI-capable cameras or NVR with edge inference
  - Local event queue + short-term storage
  - Sensor polling module for thermal/PIR/weather nodes
- **Central layer:**
  - Message bus for event stream
  - Alert correlation engine
  - Device management plane (health, OTA, compliance)
  - Dashboard and mobile/Web control panel
- **Data retention baseline**
  - Immediate alarm clips: 30-90 days configurable by policy
  - Summary analytics and incident logs retained as required by operations/audit policy

### 4.3 Network and Power Model
- Prefer low-power mesh/cellular fallback where fixed fiber is absent.
- Prioritize redundant uplinks for edge gateways handling perimeter critical sectors.
- Use PoE/solar-hybrid in remote zones with battery-backed buffering.

---

## 5. Sensor Stack Expansion
### 5.1 Recommended Core Stack
1. **PTZ or fixed AI cameras** at entry chokepoints and high-value zones.
2. **Thermal imaging** for nocturnal and low-visibility monitoring.
3. **PIR barrier sensors** for perimeter micro-sections with high false-trigger history.
4. **Acoustic sensors** in sensitive zones for distress or forced entry signatures.
5. **Weather station + humidity nodes** for fire-risk context.
6. **Smoke/heat nodal sensors** in sheds and machinery-adjacent zones.

### 5.2 Integration Sequence
- **Stage 1:** existing cameras + edge analytics + central alerting.
- **Stage 2:** add thermal and PIR to blind or high-alarm sectors.
- **Stage 3:** weather/smoke nodes and acoustic correlation into the same event model.
- **Stage 4:** optional radar/LiDAR where terrain causes repeated optical blind zones.

---

## 6. Firmware and Software Plan
### 6.1 On-Device AI and Inference
- Quantized models optimized for edge accelerator classes.
- Frame sampling policy configurable by zone:
  - perimeter gates: higher frame rate
  - wide fields: adaptive sampling
- Confidence calibration per class:
  - boar, human, smoke, fire

### 6.2 Firmware Strategy
- Secure boot and signed images.
- OTA update channel with staged rollout and rollback.
- Feature flags for threshold profiles by zone.
- Event cache with store-and-forward when backhaul drops.

### 6.3 Reliability Controls
- Watchdog service for camera process restarts.
- Heartbeat and health telemetry every 30-60 seconds.
- Lens cleanliness + illumination checks using self-diagnostic hooks.
- Tamper detection (device movement, enclosure opening, lens obstruction).

### 6.4 Cyber and Security Controls
- Mutual TLS for device/cloud communication.
- Key rotation and per-device identity.
- Role-based access (observer, operator, admin, compliance officer).
- Audit trails for rule changes and camera overrides.

---

## 7. Vendor Research Matrix (Evaluation Framework)
Each shortlisted vendor is scored 1-5 across:
- **Detection performance** (boar/human/fire, day/night robustness)
- **Edge runtime maturity** (local inference + offline buffering)
- **Cloud analytics quality** (correlation, dashboards, incident workflow)
- **Perimeter integration ease** (API/SDK/webhooks/MQTT/Modbus support)
- **Local support** (Malaysia response SLA, on-site service partner)
- **Security posture** (firmware signing, encryption, RBAC, audit logs)
- **Commercial maturity** (licensing transparency, upgrade roadmap, support T&C)

**Scoring use case:**
- Must-pass gate: security, operational support, and evidence workflow.
- Weighted scorecard:  
  `Detection 35% | Reliability 20% | Integration 20% | Support 15% | Commercial 10% | Security 10%`.

### RFI Must-Ask Set
1. Provide benchmark confusion matrix for boar vs human vs livestock in low-light.
2. Provide smoke/fire model false alarm rates across humid and dry conditions.
3. What is mean time to detection under packet loss/backhaul outage?
4. Describe OTA pipeline, rollback, and model-update controls.
5. Confirm Malaysia-based support SLAs and incident escalation contacts.
6. Clarify data residency and retention options.
7. Provide API contract samples for incident export and map overlays.
8. Share reference installation count in similarly large plantations.

---

## 8. Pilot Blueprint (6-8 Weeks)
### 8.1 Pilot Layout
- Phase pilot in **2 high-risk zones** with:
  - mixed threat profile,
  - one high-risk perimeter segment,
  - one interior zone near sheds/transition routes.

### 8.2 KPIs
- **Detection latency (P95):** < 20 seconds for human/boar intrusion.
- **Critical fire alert latency (P95):** < 40 seconds.
- **False-positive rate:** < 12% after tuning by week 4, target < 8% by week 8.
- **Miss rate:** < 2% for staged test injections.
- **Alarm validation time:** < 90 seconds median for critical alerts.
- **System uptime:** 98.5% device online, 99.2% central pipeline availability.
- **Bandwidth resilience:** no data loss for 2-hour intermittent outage (store-and-forward proven).

### 8.3 Week-by-Week Execution
- **Weeks 1-2:** boundary mapping, camera placement audit, baseline calibration, rule templates.
- **Weeks 3-4:** initial model tuning, intrusion and boar tuning, false alarm suppression rules.
- **Weeks 5-6:** smoke/fire and arson-sequence simulation, escalation workflow rehearsal.
- **Weeks 7-8:** threshold finalization, report card, scale recommendation.

---

## 9. Budget Bands (High-Level)
### 9.1 Tier 1: Minimum Viable (Pilot + Core Coverage)
- CAPEX: **USD 250k-420k**
- OPEX/annual: **USD 45k-90k**
- Scope: 40-60% of critical perimeter and top-risk interior nodes.

### 9.2 Tier 2: Production Rollout
- CAPEX: **USD 700k-1.25M**
- OPEX/annual: **USD 130k-250k**
- Scope: full critical coverage and standard monitoring operations.

### 9.3 Tier 3: Resilient / Enterprise
- CAPEX: **USD 1.45M-2.65M**
- OPEX/annual: **USD 240k-520k**
- Scope: full deployment + redundancy, SOC-like operations, strict cyber and audit hardening.

*Note: ranges are planning band estimates; final budget requires BoQ, infrastructure survey, and carrier feasibility check.*

---

## 10. Go / No-Go Criteria
### 10.1 Go Criteria
- P95 critical detection latency and precision thresholds met in pilot.
- False alarms reduced to operationally acceptable level with approved guard rules.
- OTA and health telemetry demonstrably stable for 2+ weeks continuous operation.
- Security and access governance passed by enterprise risk review.

### 10.2 No-Go / Rework Criteria
- Repeated missed critical alerts under dry-night conditions.
- Persistent >20% false positives on active zones after week 6.
- Inability to operate with planned network constraints.
- Vendor unable to provide acceptable support and maintenance commitments.

---

## 11. Risks and Mitigations
- **Over-detection burden:** reduce through multi-sensor confirmation and escalation tiers.
- **Maintenance gaps in remote zones:** preventive maintenance calendar and remote health diagnostics.
- **Network outages:** mandatory local buffering and delayed burst upload.
- **Policy resistance:** train operators with simple confidence-based alarm views.
- **Model drift:** recurring seasonal retraining and quarterly revalidation.

---

## 12. Immediate Next Steps (Phase 1 Work Package)
1. Confirm 400-acre baseline and boundary coordinates.
2. Approve pilot zones and critical assets list.
3. Run short site walk-and-map with network and power audits.
4. Issue RFI to 3-5 vendors using matrix above.
5. Launch week 1-2 mapping and data-capture campaign for pilot design.

---

## 13. Decision Log (to keep in one place)
- Area baseline confirmed as 400 acres; keep boundary coordinates in the gate approval package.
- Edge-first vs hybrid vs cloud-first analysis completed; hybrid selected.
- Multi-sensor fusion required for confidence and false-positive control.
- Budget output intentionally held at band level for this phase.


