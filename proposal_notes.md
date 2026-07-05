# Boustead Cuping AI Surveillance Proposal (Full Draft)

## 1) What this proposal solves (in 30 seconds)

For Boustead Cuping’s 400-acre operation, the platform is designed to make two outcomes guaranteed:
- real threats are detected faster, especially at night and during high-risk weather,
- every threat becomes an accountable action item that a named person must acknowledge and close.

This removes the dangerous pattern of AI alerts that are seen but never resolved.

In short: **AI gives early warning, people own final action, and every action is auditable**.

## 2) The story we will tell your board, operations team, and technical team

### Scene 1: The risk is real
The farm is a large and open environment:
- wild boar can damage crops and infrastructure;
- intrusions can happen at night across multiple gates and access lines;
- smoke and heat events need faster recognition than camera quality alone can provide.

Current camera-heavy operations often fail for two reasons:
1) too much processing for every frame, causing delays and unstable behavior,
2) no hard closure rhythm, so alerts become noise and accountability breaks.

### Scene 2: The new flow
**AI flags first, humans close second.**

1. Edge cameras continuously ingest footage.
2. The system detects candidate threats at the edge using lightweight vision models.
3. Candidates pass policy filters (zone, confidence, time, and risk rules) before central reasoning.
4. Operators receive ranked, evidence-backed incidents.
5. A named operator acknowledges and resolves or escalates each physical threat.
6. Every transition is written to an immutable audit trail.

This keeps speed for detection and rigor for action.

### Scene 3: Why this is commercially safer
- Faster detection protects assets.
- Human accountability protects operations.
- Auditable closure protects leadership decisions and compliance reviews.

## 3) What each audience needs to understand

This section is intentionally simple enough for different audiences:
- Management: confidence in reliability, response time, and evidence quality.
- Operations supervisors: easier prioritization, clear ownership, less noise.
- Young field operators: fast interface actions with fewer duplicate alerts.
- Senior management and mixed-age stakeholders: clear, non-technical language and visible outcomes.
- Technical team: architecture trade-offs, model placement, queue and retry safeguards.

## 4) Business outcome goals (what Boustead can measure)

### Immediate outcomes
- Reduced time from event to first human acknowledgement.
- Reduction in unresolved physical threats by zone.
- Clear evidence attached to every resolved critical incident.

### Strategic outcomes
- Stable and repeatable alert behavior across weather and network variation.
- Safer escalation decisions for fire, boar, and intrusion events.
- Better handover between shift teams through timeline-based closure records.

## 5) Simplified architecture for this project phase

We keep the existing design direction but simplify the critical path for stability:

1. **Edge-first detection**
- Input: RTSP/ONVIF streams.
- Processing at edge: adaptive sampling, decode/preprocess quality checks, YOLO/RT-DETR detection, tracking and zone matching.
- Result: compact event candidates instead of raw frame flood.

2. **Candidate-first verification**
- Rules for confidence, zone validity, repetition suppression, and policy thresholds.
- Only meaningful candidates go into central queue.
- Result: lower latency variance and lower platform strain.

3. **Async event handling**
- Redis/Kafka/MQTT/RabbitMQ queue path (single canonical v1 route).
- Explicit retry policy and dead-letter handling.
- Result: stable behavior during short bursts and temporary network issues.

4. **Reasoning layers**
- SmallVLM for uncertainty checks where frame meaning is unclear.
- DGX Spark + policy/RAG for context-aware recommendations and consistent response policy.

5. **Operator closure layer**
- Acknowledge -> Resolve/Escalate -> Audit.
- Every state change logged for accountability.

## 6) Detection capabilities and model coverage

Supported events in phase 1:
- Fire
- Smoke
- Trespass
- Wild animal
- Vehicle intrusion
- Loitering
- Restricted-zone entry

Core model stack:
- YOLO / RT-DETR for detection,
- ByteTrack / DeepSORT for movement logic,
- SmallVLM options for ambiguous frames (fire/smoke, person/animal edge cases),
- DGX Spark with LLM + embeddings + RAG for recommendation consistency.

## 7) Thermal detection for fire risk

Thermal is included as a **parallel verification lane**, not a replacement:

- Optical detection remains first-pass for broad monitoring.
- Fire/smoke candidates in risk zones are verified against thermal signals.
- Optical and thermal scores are merged before escalation.
- Ambiguous high-risk candidates are routed to patrol or drone verification.

This addresses the exact weakness of low-light and smoke/fog ambiguity.

## 8) Human-In-The-Loop, now as a commercial guarantee

The core commercial promise is simple:
**an AI alert is not "done" until a human operator has acknowledged and closed it with an auditable outcome**.

Lifecycle:
`AI Flagged -> User Assigned -> Acknowledged -> Resolved / Escalated -> Audited`

Required fields for every critical physical event:
- Threat type
- Zone
- Confidence
- Severity
- Evidence source
- Assigned user
- Resolution action
- Current status
- Audit timestamp(s)

Available resolution outcomes:
- False Positive
- Resolved On Site
- Escalated To Patrol
- Drone Verification Required

This design answers management questions before they are asked: who saw it, who acted, when, and how it ended.

## 9) Operational action areas

### A) Critical Detection
- Focus on high-risk classes and high-value zones.
- Goal: high recall on critical events with fewer duplicates.

### B) Human Verification and Escalation
- Every high/critical alert needs acknowledgement by assigned operator.
- Goal: clear ownership, not silent alerts.

### C) Evidence and Audit
- Evidence link integrity and state timeline.
- Goal: every closed incident has traceable proof.

### D) Stability and Reliability
- Queue health, retry behavior, reconnect handling.
- Goal: fewer dropped events, predictable performance.

### E) Response Readiness
- Patrol and escalation routes linked to zone risk and nearest response.
- Goal: no backlog of unresolved hotspots.

## 10) Acceptance metrics (contract)

The platform will be judged on:
1. % of critical AI flags acknowledged within SLA
2. % of incidents resolved with evidence
3. Median human validation time
4. Open unresolved physical threats by zone
5. Repeat unresolved threat locations
6. Duplicate alert rate
7. P95 event-to-queue latency
8. Critical missed-event rate

## 11) Test plan to prove improvement, not just add features

### Stage 1: Deterministic replay
- Use fixed clip sets and fixed windows.
- Compare baseline and simplified flow with same scenarios.
- Measure: duplicate rate, latency, false positives, misses, ack times.

### Stage 2: Controlled live pilot (2-3 weeks)
- 1-2 highest-risk zones.
- Blind operator rotation to reduce bias.
- Measure same KPIs in real operating conditions.

### Success gates
- Latency variance and queue stability improved.
- No regression in critical recall.
- Audit completeness maintained or improved.

## 12) Risk and doubt pre-emption (what management usually asks)

### "Can the AI create chaos with false alerts?"
No, because low-value candidates are filtered before they reach operators, and every critical case has explicit acknowledgement requirements.

### "Will this work at night?"
Yes, because thermal verification supports fire/smoke lanes and adaptive sampling can increase detail on suspicious windows.

### "What if network is unstable?"
Edge-first queueing plus retry and dead-letter paths ensures events remain traceable during congestion.

### "How do we avoid management not trusting the system?"
By forcing auditable closure, not alert-only behavior.

## 13) Delivery roadmap (no mockup changes in this phase)

- **Phase 1 - Proposal and alignment:** finalize governance, roles, and KPIs.
- **Phase 2 - System mockup:** operator-centric interface and audit timeline.
- **Phase 3 - Implementation:** contracts, permissions, integrations, thermal lane, and rollout.

## 14) Production readiness checks before full deployment

- Confirm boundary and geofence source data.
- Confirm camera map, backhaul, and thermal hardware count.
- Confirm operator roles, escalation permissions, and response channels.
- Confirm retention and evidence governance settings.
- Confirm security and API access model for operations + reporting.

## 15) Why this proposal is hard to question

Because it addresses the full chain:
- Detection is modern and fast,
- Resolution is human-led and accountable,
- Evidence is preserved for review,
- Outcomes are measured,
- Improvement is proven with repeated and repeatable tests.

This is not a concept deck.
This is a defendable operating blueprint.

