# Boustead Plantation Surveillance - Line-Item BOM (Planning Draft)
**Version:** Draft for planning only  
**Scope basis:** 400 acres  
**Area reference:** 100% coverage assumptions applied by deployment tier  
**Currency:** USD (convert locally as needed)  

## Assumptions Used
- Rural mixed terrain with partial power availability.
- LTE/cellular available in most sectors; fiber only partially available.
- Land survey and detailed pole audit are not complete in this planning draft.
- Existing camera feed can be reused where compatible and stable.
- Software platform, cloud services, and operations team are included in OPEX.

---

## Tier 1 - Minimum Viable (Pilot/First 90-140 acres equivalent critical perimeter coverage)

### CAPEX (one-time)
- Site survey, design, and deployment planning: **USD 8,000 - 12,000**
- Edge AI cameras (existing mix + supplemental) and supports  
  - 24 units x (camera + weatherproof pole package): **USD 80,000 - 140,000**
- Thermal units for critical nodes  
  - 6 units + mount/enclosures: **USD 18,000 - 36,000**
- PIR/barrier sensor kits  
  - 24 nodes + gateway adapters: **USD 6,000 - 12,000**
- Acoustic/fire/smoke/ambient gateway sensor pack  
  - 12 nodes + control hardware: **USD 5,000 - 10,000**
- Edge compute/gateway appliances (local buffering + inference acceleration)  
  - 5 units: **USD 12,000 - 24,000**
- Network connectivity equipment (LTE backup, routers, cabling, SIM/routers, PoE for nodes): **USD 14,000 - 28,000**
- Power and backup (solar kits, batteries for remote nodes): **USD 12,000 - 26,000**
- Installation labor + civil works + cabling labor: **USD 20,000 - 42,000**
- System integration and software parameter setup: **USD 18,000 - 32,000**
- QA/proofing and handover materials: **USD 6,000 - 10,000**
- **Total CAPEX range:** **USD 189,000 - 360,000**

### OPEX (annual recurring)
- Connectivity and SIM/data: **USD 8,000 - 16,000**
- Cloud/analytics + storage licenses: **USD 9,000 - 20,000**
- Support/maintenance contract (SLA, hotline, replacement parts): **USD 18,000 - 32,000**
- Operations staff and field response stipend: **USD 10,000 - 18,000**
- Preventive maintenance, firmware ops, retraining support: **USD 7,000 - 14,000**
- **Total annual OPEX range:** **USD 52,000 - 100,000**

---

## Tier 2 - Production Rollout (90% critical coverage + full operations baseline)

### CAPEX (one-time)
- Full deployment planning, risk modelling, and zone engineering: **USD 12,000 - 25,000**
- AI visual nodes (full perimeter + entry points)
  - 70-90 cameras + poles/enclosures/optics: **USD 300,000 - 540,000**
- Thermal and low-light coverage upgrades  
  - 18-26 units: **USD 54,000 - 116,000**
- PIR/radar/beam or acoustic add-ons: **USD 28,000 - 70,000**
- Edge AI gateway layer (high-availability zones): **USD 45,000 - 85,000**
- Network/backhaul enhancements (mesh, LTE aggregation, priority routing): **USD 60,000 - 130,000**
- Power and battery backup for remote nodes: **USD 45,000 - 95,000**
- Environmental enclosures, fence sensors, vibration/motion tamper components: **USD 24,000 - 55,000**
- Full integration + command-and-control application work: **USD 70,000 - 140,000**
- Staff onboarding, SOP setup, and operator consoles: **USD 12,000 - 24,000**
- Handover testing + contingency: **USD 20,000 - 40,000**
- **Total CAPEX range:** **USD 670,000 - 1,260,000**

### OPEX (annual recurring)
- Managed connectivity and WAN data: **USD 18,000 - 42,000**
- Cloud platform + model hosting + analytics + incident warehouse: **USD 22,000 - 65,000**
- Maintenance contract (preventive + emergency): **USD 55,000 - 120,000**
- Security operations and alert handling team: **USD 30,000 - 68,000**
- Ongoing training + seasonal tuning cycles: **USD 12,000 - 28,000**
- Insurance and contingency: **USD 8,000 - 20,000**
- **Total annual OPEX range:** **USD 145,000 - 343,000**

---

## Tier 3 - Resilient / Enterprise (redundant and auditable deployment)

### CAPEX (one-time)
- Detailed design audit + redundancy planning + compliance design: **USD 25,000 - 55,000**
- Redundant dual-path perimeter topology (double coverage high-risk sectors):
  - Additional 35-55 nodes + redundancy nodes: **USD 160,000 - 420,000**
- Advanced edge compute cluster + local model cache:
  - 8-12 hardened gateways: **USD 75,000 - 170,000**
- Redundant power and communication backbone upgrades:
  - UPS, solar-diesel fallback nodes, backup links: **USD 55,000 - 130,000**
- Evidence-grade storage expansion + cold archive integration: **USD 35,000 - 90,000**
- Advanced cybersecurity tooling and SIEM integration: **USD 18,000 - 50,000**
- DR readiness, runbooks, chaos testing services: **USD 10,000 - 28,000**
- 24/7 SOC handover and escalation integration:
  - Initial setup: **USD 30,000 - 68,000**
- Premium deployment labor + commissioning: **USD 40,000 - 110,000**
- **Total CAPEX range:** **USD 448,000 - 1,111,000**

### OPEX (annual recurring)
- High-availability connectivity and managed links: **USD 35,000 - 85,000**
- Cloud + edge orchestration + archival storage: **USD 30,000 - 95,000**
- Full support contract (SLA, field replacement, spares): **USD 95,000 - 220,000**
- Dedicated operations and analytics team allocation: **USD 90,000 - 210,000**
- Continuous tuning, cyber audits, compliance reporting: **USD 22,000 - 55,000**
- Software license expansion and vendor subscription: **USD 18,000 - 40,000**
- **Total annual OPEX range:** **USD 290,000 - 705,000**

---

## Notes
- Ranges assume mature RF and power conditions; high terrain complexity can increase total CAPEX 15-35%.
- Camera counts and sensor mix should be replaced by finalized zone engineering outputs before issue.
- Fire and arson controls are sensitive to response process quality; operational training cost is embedded in opex categories above.
- A phased procurement strategy can cap exposure:
  1. Lock pilot-grade Tier 1 infra and software.
  2. Add security hardening and redundancy at Tier 2.
  3. Add enterprise resilience only where business-critical.

---

## Recommendation (Procurement-ready)
- Issue RFI with fixed quantity ranges and technical scorecard weighting first.
- Ask each vendor to provide:
  - two price bands (pilot and rollout),
  - replacement SLA terms,
  - per-event pricing model if applicable,
  - and explicit data-handling and model retraining clauses.


