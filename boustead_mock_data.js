(function () {
  const STORAGE_KEY = "bs:mock:state:v2";

  const seed = {
    meta: {
      activeZone: "all",
      dryWeatherMode: false,
      offlineMode: false,
      pinnedFeeds: [],
      lastOperator: "Ops-Lead",
      farmCenter: { lat: 4.5890, lng: 101.0958 },
      farmAreaAcres: 400,
      mapPrecision: "Representative Cuping farmland coordinates; replace with parcel KML/GeoJSON before procurement.",
      farmBoundary: [
        [4.5916, 101.0941],
        [4.5916, 101.0967],
        [4.5855, 101.0967],
        [4.5855, 101.0941]
      ]
    },
    zones: [
      {
        id: "north-ridge",
        name: "North Ridge",
        risk: 2.3,
        center: { lat: 4.5899, lng: 101.0985 },
        cameras: ["cam-01", "cam-02"],
        alerts: 3,
        geometry: [
          [4.5912, 101.0968],
          [4.5912, 101.1002],
          [4.5886, 101.1002],
          [4.5886, 101.0968]
        ],
        weather: { humidity: 33, wind: 14, temperature: 35, riskModifier: 0.95 }
      },
      {
        id: "central-corridor",
        name: "Central Corridor",
        risk: 1.9,
        center: { lat: 4.5890, lng: 101.0937 },
        cameras: ["cam-03", "cam-04"],
        alerts: 2,
        geometry: [
          [4.5902, 101.0920],
          [4.5902, 101.0955],
          [4.5880, 101.0955],
          [4.5880, 101.0920]
        ],
        weather: { humidity: 41, wind: 9, temperature: 31, riskModifier: 1.0 }
      },
      {
        id: "harvest-belt",
        name: "Harvest Belt",
        risk: 2.8,
        center: { lat: 4.5860, lng: 101.0930 },
        cameras: ["cam-05", "cam-06"],
        alerts: 6,
        geometry: [
          [4.5874, 101.0916],
          [4.5874, 101.0944],
          [4.5846, 101.0944],
          [4.5846, 101.0916]
        ],
        weather: { humidity: 24, wind: 18, temperature: 37, riskModifier: 1.2 }
      },
      {
        id: "south-gate",
        name: "South Access Gate",
        risk: 3.2,
        center: { lat: 4.5844, lng: 101.0980 },
        cameras: ["cam-07", "cam-08"],
        alerts: 1,
        geometry: [
          [4.5855, 101.0967],
          [4.5855, 101.0994],
          [4.5833, 101.0994],
          [4.5833, 101.0967]
        ],
        weather: { humidity: 27, wind: 22, temperature: 36, riskModifier: 1.15 }
      }
    ],
    feeds: [
      {
        feed_id: "cam-01",
        device_id: "GW-NT-01",
        zone_id: "north-ridge",
        center: { lat: 4.5910, lng: 101.0988 },
        threat_class: "Wild Boar",
        confidence: 0.87,
        fps: 30,
        latency_s: 1.3,
        state: "live",
        model: "edge-cnn",
        model_version: "2.1.2",
        signal: "strong",
        lens: "clear"
      },
      {
        feed_id: "cam-03",
        device_id: "GW-CT-01",
        zone_id: "central-corridor",
        center: { lat: 4.5891, lng: 101.0941 },
        threat_class: "Smoke Drift",
        confidence: 0.73,
        fps: 24,
        latency_s: 1.1,
        state: "live",
        model: "edge-thermal",
        model_version: "1.9.8",
        signal: "moderate",
        lens: "smudged"
      },
      {
        feed_id: "cam-07",
        device_id: "GW-SR-01",
        zone_id: "harvest-belt",
        center: { lat: 4.5858, lng: 101.0929 },
        threat_class: "Arson Risk",
        confidence: 0.61,
        fps: 25,
        latency_s: 1.6,
        state: "flicker",
        model: "edge-rnn",
        model_version: "3.0.5",
        signal: "weak",
        lens: "dust",
        offline: true
      },
      {
        feed_id: "cam-08",
        device_id: "GW-SG-01",
        zone_id: "south-gate",
        center: { lat: 4.5841, lng: 101.0981 },
        threat_class: "Human Intrusion",
        confidence: 0.91,
        fps: 29,
        latency_s: 0.9,
        state: "live",
        model: "edge-yolo",
        model_version: "2.4.1",
        signal: "strong",
        lens: "clear"
      }
    ],
    incidents: [
      {
        incident_id: "I-1021",
        threat_type: "Human Intrusion",
        zone_id: "north-ridge",
        severity: "high",
        confidence: 0.91,
        status: "new",
        source_types: ["camera", "thermal"],
        model: "edge-yolo",
        model_version: "2.4.1",
        clip_reference: "clip-n-01-1021",
        recommendation_level: "critical",
        source_device: "cam-01",
        assigned_operator: "Ops-Lead",
        evidence_link: "evidence/I-1021/video.mp4",
        feedback_tag: null,
        created_at: new Date().toISOString(),
        latency_ms: 18000,
        notes: [
          {
            time: new Date().toISOString(),
            actor: "system",
            action: "incident_created",
            text: "Simulated detection"
          }
        ],
        status_timeline: [
          {
            status: "new",
            at: new Date().toISOString(),
            by: "system"
          }
        ]
      }
    ],
    events: [
      {
        id: "EVT-1001",
        time: "09:42:18",
        threat_type: "Human Intrusion",
        zone_id: "north-ridge",
        severity: "high",
        confidence: 0.91,
        source_types: ["camera", "pir"],
        model: "edge-yolo",
        model_version: "2.4.1",
        clip_reference: "clip-n-01-1001",
        recommendation_level: "critical",
        source_device: "cam-01",
        synced: true,
        event_type: "new"
      },
      {
        id: "EVT-1002",
        time: "09:28:04",
        threat_type: "Wild Boar",
        zone_id: "central-corridor",
        severity: "med",
        confidence: 0.84,
        source_types: ["camera"],
        model: "edge-cnn",
        model_version: "2.1.2",
        clip_reference: "clip-c-01-1002",
        recommendation_level: "high",
        source_device: "cam-03",
        synced: true,
        event_type: "new"
      }
    ],
    devices: [
      {
        device_id: "GW-NT-01",
        zone_id: "north-ridge",
        firmware_version: "2.3.7",
        model_version: "v2.4.1",
        status: "healthy",
        heartbeat_s: 18,
        storage_pct: 74,
        temp_c: 44,
        network_rssi: -58,
        tamper_state: "clear",
        lens_status: "clear"
      },
      {
        device_id: "GW-CT-01",
        zone_id: "central-corridor",
        firmware_version: "2.3.4",
        model_version: "v2.1.0",
        status: "degraded",
        heartbeat_s: 68,
        storage_pct: 86,
        temp_c: 56,
        network_rssi: -71,
        tamper_state: "occlusion",
        lens_status: "smudged"
      },
      {
        device_id: "GW-SR-01",
        zone_id: "harvest-belt",
        firmware_version: "2.3.5",
        model_version: "v2.3.2",
        status: "healthy",
        heartbeat_s: 22,
        storage_pct: 64,
        temp_c: 47,
        network_rssi: -62,
        tamper_state: "clear",
        lens_status: "dust"
      },
      {
        device_id: "GW-SG-01",
        zone_id: "south-gate",
        firmware_version: "2.2.9",
        model_version: "v1.9.4",
        status: "offline",
        heartbeat_s: 0,
        storage_pct: 43,
        temp_c: 0,
        network_rssi: -104,
        tamper_state: "clear",
        lens_status: "clear"
      }
    ],
    rules: {
      boar: {
        threat: "Wild Boar",
        active: true,
        confidence: 0.72,
        durationSeconds: 8,
        timeWindow: "00:00-05:30,18:00-24:00",
        weather: { minHumidity: 20, maxWind: 30 },
        priority: "high"
      },
      human: {
        threat: "Human Intrusion",
        active: true,
        confidence: 0.68,
        durationSeconds: 5,
        timeWindow: "18:00-06:00",
        weather: { minHumidity: 15, maxWind: 36 },
        priority: "high"
      },
      fire: {
        threat: "Smoke Drift",
        active: true,
        confidence: 0.81,
        durationSeconds: 10,
        timeWindow: "24/7",
        weather: { minHumidity: 10, maxWind: 28 },
        priority: "critical"
      },
      arson: {
        threat: "Arson Risk",
        active: false,
        confidence: 0.76,
        durationSeconds: 12,
        timeWindow: "00:00-24:00",
        weather: { minHumidity: 15, maxWind: 32 },
        priority: "critical"
      }
    },
    apiIntegrations: {
      events: { path: "/api/events", enabled: true },
      incidents: { path: "/api/incidents", enabled: true },
      deviceHealth: { path: "/api/device-health", enabled: true },
      syncStatus: { path: "/api/sync/status", enabled: true },
      webhookRetries: 0,
      webhookStatus: "ready"
    },
    auditLog: [
      {
        id: "AUD-9001",
        time: new Date().toISOString(),
        actor: "system",
        action: "seed",
        details: "Initialized Boustead mock environment"
      }
    ],
    eventQueue: []
  };

  const merge = (base, seedCandidate) => {
    if (!base || typeof base !== "object") {
      return JSON.parse(JSON.stringify(seedCandidate));
    }

    const out = JSON.parse(JSON.stringify(seedCandidate));
    const walk = (target, defaults) => {
      if (Array.isArray(defaults)) {
        return Array.isArray(target) ? target : defaults;
      }
      if (!target || typeof target !== "object") {
        return defaults;
      }
      const node = { ...target };
      Object.keys(defaults).forEach((k) => {
        if (node[k] === undefined) node[k] = defaults[k];
        else if (typeof node[k] === "object" && !Array.isArray(node[k])) {
          node[k] = walk(node[k], defaults[k]);
        }
      });
      return node;
    };
    return walk(base, out);
  };

  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  const state = merge(saved, seed);
  state.auditLog = Array.isArray(state.auditLog) ? state.auditLog : [];

  const now = () => new Date().toISOString();
  const nowTimeOnly = () => {
    const n = new Date();
    return `${n.toTimeString().slice(0, 8)}`;
  };
  const randChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const persist = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

  const p95 = (vals) => {
    if (!vals.length) return 0;
    const sorted = [...vals].sort((a, b) => a - b);
    const idx = Math.max(0, Math.floor(0.95 * (sorted.length - 1)));
    return sorted[idx] || 0;
  };

  const severityClass = (sev) => ({ high: "high", critical: "high", med: "med", medium: "med", low: "low" }[sev] || "low");
  const modelForThreat = {
    "Wild Boar": "edge-cnn",
    "Human Intrusion": "edge-yolo",
    "Smoke Drift": "edge-thermal",
    "Arson Risk": "edge-seq"
  };

  state.logAudit = (action, actor = state.meta.lastOperator, details = "") => {
    state.auditLog.unshift({
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 9000)}`,
      time: now(),
      actor,
      action,
      details
    });
    state.auditLog = state.auditLog.slice(0, 200);
    persist();
  };

  state.zoneById = (id) => state.zones.find((z) => z.id === id);
  state.feedById = (id) => state.feeds.find((f) => f.feed_id === id);
  state.deviceById = (id) => state.devices.find((d) => d.device_id === id);
  state.zoneIncidents = (zoneId) => state.incidents.filter((i) => i.zone_id === zoneId);

  state.setActiveZone = (id) => {
    state.meta.activeZone = id;
    persist();
  };

  state.syncQueue = (event) => {
    state.eventQueue.unshift({ queue_id: `Q-${Date.now()}-${Math.floor(Math.random() * 999)}`, event, queuedAt: now(), synced: !state.meta.offlineMode });
    if (state.eventQueue.length > 40) {
      state.eventQueue = state.eventQueue.slice(0, 40);
    }
    if (!state.meta.offlineMode) {
      state.eventQueue = state.eventQueue.map((i) => ({ ...i, synced: true }));
      state.apiIntegrations.webhookRetries = 0;
      state.apiIntegrations.webhookStatus = "synced";
    }
    persist();
    return state.eventQueue;
  };

  state.kpi = () => {
    const critical = state.incidents.filter((i) => i.severity === "high" || i.severity === "critical").length;
    const open = state.incidents.filter((i) => !["closed", "dismissed"].includes(i.status)).length;
    const healthy = state.devices.filter((d) => d.status === "healthy").length;
    const avgRisk = (
      state.zones.reduce(
        (acc, z) => acc + (state.meta.dryWeatherMode ? z.risk * z.weather.riskModifier : z.risk),
        0
      ) / state.zones.length
    ).toFixed(1);
    return {
      critical,
      open,
      p95LatencyMs: Math.round(p95(state.incidents.map((i) => i.latency_ms || 0))),
      p95Latency: Math.round(p95(state.incidents.map((i) => i.latency_ms || 0)) / 1000),
      avgRisk,
      healthy,
      totalDevices: state.devices.length,
      queueDepth: state.eventQueue.length
    };
  };

  const buildEvent = (threat_type, zone_id, overrides = {}) => {
    const conf = Number((0.56 + Math.random() * 0.4).toFixed(2));
    const sev = overrides.severity || (conf > 0.86 ? "high" : conf > 0.72 ? "med" : "low");
    const recommendation = sev === "high" ? "critical" : sev === "med" ? "high" : "normal";
    const zone = state.zoneById(zone_id);
    const source = zone?.cameras?.[0] || "cam-00";
    const model = modelForThreat[threat_type] || "edge-cnn";

    return {
      id: `EVT-${Date.now()}-${Math.floor(Math.random() * 9000)}`,
      time: nowTimeOnly(),
      threat_type,
      zone_id,
      severity: severityClass(sev),
      confidence: conf,
      source_types: ["camera", "thermal"],
      model,
      model_version: "2.x",
      clip_reference: `clip-${threat_type.toLowerCase().replace(/\s+/g, "-")}-${Date.now().toString().slice(-6)}`,
      recommendation_level: recommendation,
      source_device: source,
      synced: !state.meta.offlineMode,
      event_type: "new",
      ...overrides
    };
  };

  const buildIncident = (event) => ({
    incident_id: `I-${1000 + Math.floor(Math.random() * 9000)}`,
    event_id: event.id,
    threat_type: event.threat_type,
    zone_id: event.zone_id,
    severity: severityClass(event.severity),
    confidence: event.confidence,
    status: "new",
    source_types: event.source_types,
    model: event.model,
    model_version: event.model_version,
    clip_reference: event.clip_reference,
    recommendation_level: event.recommendation_level,
    source_device: event.source_device,
    assigned_operator: null,
    evidence_link: null,
    feedback_tag: null,
    created_at: now(),
    latency_ms: Math.max(7000, Math.round(8000 + Math.random() * 26000)),
    notes: [{ time: now(), actor: "system", action: "incident_created", text: "Mapped from active threat event" }],
    status_timeline: [{ status: "new", at: now(), by: "system", note: "Auto generated" }]
  });

  const normalizeSeededState = () => {
    state.incidents.forEach((i) => {
      if (!i.incident_id && i.id) i.incident_id = i.id;
      if (i.zone && !i.zone_id) {
        i.zone_id = i.zone;
        delete i.zone;
      }
      if (i.type && !i.threat_type) {
        i.threat_type = i.type;
        delete i.type;
      }
      if (i.sev && !i.severity) {
        i.severity = i.sev;
        delete i.sev;
      }
      if (!Array.isArray(i.notes)) i.notes = [];
      if (!Array.isArray(i.status_timeline)) i.status_timeline = [];
      if (!i.status_timeline.length) i.status_timeline.push({ status: i.status || "new", at: now(), by: "system", note: "migrated" });
      if (!i.event_id && i.id) i.event_id = i.id;
      i.latency_ms = Number(i.latency_ms || 12000);
    });

    state.events.forEach((e) => {
      if (!e.id) e.id = `EVT-${Date.now()}-${Math.floor(Math.random() * 9000)}`;
      if (e.zone && !e.zone_id) {
        e.zone_id = e.zone;
        delete e.zone;
      }
      if (e.type && !e.threat_type) {
        e.threat_type = e.type;
        delete e.type;
      }
      if (e.sev && !e.severity) {
        e.severity = e.sev;
        delete e.sev;
      }
      e.confidence = Number(e.confidence || e.conf || 0.6);
      e.event_type = e.event_type || "new";
      if (e.id && !e.event_id) e.event_id = e.id;
    });

    state.feeds.forEach((f) => {
      if (f.id && !f.feed_id) f.feed_id = f.id;
      if (f.zone && !f.zone_id) {
        f.zone_id = f.zone;
        delete f.zone;
      }
      if (f.class && !f.threat_class) {
        f.threat_class = f.class.replace("AI:", "").trim();
        delete f.class;
      }
      if (f.conf && !f.confidence) f.confidence = f.conf;
      if (f.latency && !f.latency_s) f.latency_s = f.latency;
      f.state = f.state || "live";
    });

    state.devices.forEach((d) => {
      if (d.id && !d.device_id) d.device_id = d.id;
      if (d.firmware && !d.firmware_version) d.firmware_version = d.firmware;
      if (d.model && !d.model_version) d.model_version = d.model;
      if (d.heartbeat && !d.heartbeat_s) d.heartbeat_s = d.heartbeat;
      if (d.storage_pct === undefined && typeof d.storage === "string") d.storage_pct = Number(d.storage.replace("%", ""));
      if (d.tamper && !d.tamper_state) d.tamper_state = d.tamper;
    });
  };

  state.simulateEvent = (threat_type = "Wild Boar", zone_id = "north-ridge") => {
    const zone = state.zoneById(zone_id);
    if (!zone) return null;
    const event = buildEvent(threat_type, zone_id);
    const incident = buildIncident(event);
    zone.alerts += 1;

    state.events.unshift(event);
    state.events = state.events.slice(0, 50);
    state.incidents.unshift(incident);
    state.incidents = state.incidents.slice(0, 120);
    state.syncQueue(event);
    state.logAudit("event_simulated", state.meta.lastOperator, `${threat_type} in ${zone.name}`);
    persist();
    if (window.renderAll) window.renderAll();
    return { event, incident };
  };

  state.ensureIncidentFromFeed = (feed_id, actor = "Ops-Lead", note = "Manual operator capture") => {
    const feed = state.feedById(feed_id);
    if (!feed) return null;
    const zone = state.zoneById(feed.zone_id);
    const event = buildEvent(feed.threat_class, feed.zone_id, {
      model: feed.model,
      model_version: feed.model_version,
      confidence: feed.confidence,
      source_device: feed.feed_id,
      source_types: ["camera", "thermal", "lens"]
    });
    const incident = buildIncident(event);
    incident.assigned_operator = actor;
    incident.notes.unshift({ time: now(), actor, action: "manual_create", text: note });
    if (zone) zone.alerts += 1;
    state.events.unshift(event);
    state.incidents.unshift(incident);
    state.syncQueue(event);
    state.logAudit("manual_incident", actor, `Feed ${feed.feed_id}`);
    persist();
    return incident;
  };

  state.advanceIncident = (incident_id, action, actor = state.meta.lastOperator, note = "") => {
    const chain = { new: "acknowledged", acknowledged: "verified", verified: "dispatched", dispatched: "closed" };
    const incident = state.incidents.find((x) => x.incident_id === incident_id);
    if (!incident) return null;
    const next = action || chain[incident.status];
    if (!next) return incident;
    if (!String(note).trim()) return null;
    incident.status = next;
    incident.assigned_operator = actor;
    const msg = note || `status->${next}`;
    incident.notes.unshift({ time: now(), actor, action: `status_${next}`, text: msg });
    incident.status_timeline.push({ status: next, at: now(), by: actor, note: msg });
    state.logAudit("incident_status", actor, `${incident_id} -> ${next}`);
    persist();
    return incident;
  };

  state.labelIncident = (incident_id, label, actor = state.meta.lastOperator, reason = "") => {
    const incident = state.incidents.find((x) => x.incident_id === incident_id);
    if (!incident) return null;
    incident.feedback_tag = label;
    incident.notes.unshift({ time: now(), actor, action: `feedback_${label.toLowerCase()}`, text: reason });
    state.logAudit("incident_feedback", actor, `${incident_id} -> ${label}`);
    persist();
    return incident;
  };

  state.logEvidence = (incident, bucket = "manual") => {
    if (!incident) return null;
    const suffix = `${Date.now().toString().slice(-8)}`;
    incident.evidence_link = `evidence/${incident.incident_id}/${bucket}-${suffix}.mp4`;
    incident.notes.unshift({ time: now(), actor: state.meta.lastOperator, action: "evidence_captured", text: `Captured ${bucket} evidence` });
    incident.status_timeline.push({ status: incident.status, at: now(), by: state.meta.lastOperator, note: `Evidence captured (${bucket})` });
    state.logAudit("evidence_capture", state.meta.lastOperator, incident.incident_id);
    persist();
    return incident.evidence_link;
  };

  state.setRule = (type, patch = {}) => {
    if (!state.rules[type]) {
      state.rules[type] = {
        threat: type,
        active: false,
        confidence: 0.7,
        durationSeconds: 7,
        timeWindow: "24/7",
        weather: { minHumidity: 0, maxWind: 40 },
        priority: "medium"
      };
    }
    state.rules[type] = { ...state.rules[type], ...patch };
    state.logAudit("rule_update", state.meta.lastOperator, `updated ${type}`);
    persist();
    return state.rules[type];
  };

  state.pushFirmware = (device_id, targetVersion) => {
    const d = state.deviceById(device_id);
    if (!d) return null;
    d.previousFirmware = d.firmware_version;
    d.firmware_status = "staged";
    d.status = "rebooting";

    if (!targetVersion) {
      const parts = d.firmware_version.split(".").map((n) => Number(n));
      parts[2] = (parts[2] || 0) + 1;
      targetVersion = `${parts[0]}.${parts[1]}.${parts[2]}`;
    }

    d.pendingFirmware = targetVersion;
    state.logAudit("firmware_push", state.meta.lastOperator, `${d.device_id} -> ${targetVersion}`);
    persist();
    setTimeout(() => {
      d.firmware_version = d.pendingFirmware;
      d.firmware_status = "applied";
      d.status = "healthy";
      d.heartbeat_s = 14;
      d.pendingFirmware = null;
      persist();
      if (window.renderDevices) window.renderDevices();
      if (window.renderAll) window.renderAll();
      state.logAudit("firmware_applied", "system", `${d.device_id} -> ${d.firmware_version}`);
    }, 900);
    return d;
  };

  state.rollbackFirmware = (device_id) => {
    const d = state.deviceById(device_id);
    if (!d || !d.previousFirmware) return null;
    d.pendingFirmware = d.previousFirmware;
    d.status = "rebooting";
    persist();
    setTimeout(() => {
      d.firmware_version = d.pendingFirmware;
      d.pendingFirmware = null;
      d.status = "degraded";
      d.firmware_status = "rolled_back";
      persist();
      if (window.renderDevices) window.renderDevices();
      if (window.renderAll) window.renderAll();
      state.logAudit("firmware_rollback", "system", `${d.device_id} -> ${d.firmware_version}`);
    }, 700);
    state.logAudit("firmware_rollback_started", state.meta.lastOperator, `${d.device_id}`);
    return d;
  };

  state.reprovisionDevice = (device_id, status = null, extra = {}) => {
    const d = state.deviceById(device_id);
    if (!d) return null;
    if (status) d.status = status;
    Object.assign(d, extra);
    state.logAudit("device_reprovision", state.meta.lastOperator, d.device_id);
    persist();
    return d;
  };

  state.runHealthSweep = () => {
    state.devices.forEach((d) => {
      if (d.status !== "offline") {
        d.heartbeat_s = Math.max(8, Math.min(120, d.heartbeat_s + (Math.random() > 0.5 ? 4 : -4)));
        d.storage_pct = Math.min(98, Math.max(12, d.storage_pct + Math.floor(Math.random() * 5) - 2));
        d.temp_c = Math.min(64, Math.max(33, d.temp_c + (Math.random() > 0.5 ? 2 : -2)));
        d.network_rssi = Math.min(-48, Math.max(-106, d.network_rssi + (Math.random() > 0.5 ? 1 : -1)));
      }
      d.tamper_state = Math.random() > 0.95 ? "clear" : d.tamper_state;
      d.lens_status = Math.random() > 0.93 ? "clear" : d.lens_status;
    });
    state.feeds.forEach((f) => {
      f.state = f.state === "offline" ? "offline" : (Math.random() > 0.9 ? "flicker" : "live");
      f.confidence = Number((0.56 + Math.random() * 0.42).toFixed(2));
      f.signal = f.state === "live" ? "strong" : (f.state === "flicker" ? "weak" : "weak");
    });
    state.logAudit("health_sweep", state.meta.lastOperator, "Fleet health sweep");
    persist();
  };

  state.pinFeed = (feed_id, on = true) => {
    const next = new Set(state.meta.pinnedFeeds);
    if (on) next.add(feed_id);
    else next.delete(feed_id);
    state.meta.pinnedFeeds = [...next];
    persist();
  };

  state.exportBundle = () => ({
    time: now(),
    incidents: state.incidents.slice(0, 20),
    events: state.events.slice(0, 30),
    devices: state.devices,
    rules: state.rules,
    audit: state.auditLog.slice(0, 40),
    queueDepth: state.eventQueue.length
  });

  state.resetDemo = () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  };

  state.emitWebhook = (type, payload = {}) => {
    if (!state.apiIntegrations[type]?.enabled) {
      return { status: "disabled", type };
    }
    if (state.meta.offlineMode) {
      state.apiIntegrations.webhookRetries += 1;
      state.apiIntegrations.webhookStatus = "queued";
      state.logAudit("webhook_queued", state.meta.lastOperator, `${type}`);
      return { status: "queued", type, attempts: state.apiIntegrations.webhookRetries };
    }
    state.apiIntegrations.webhookRetries = 0;
    state.apiIntegrations.webhookStatus = "sent";
    state.logAudit("webhook_sent", state.meta.lastOperator, `${type}`);
    return { status: "sent", type, endpoint: state.apiIntegrations[type].path, sample: payload };
  };

  state.toggleOffline = (offline = !state.meta.offlineMode) => {
    state.meta.offlineMode = offline;
    state.logAudit("network_mode", state.meta.lastOperator, offline ? "offline" : "online");
    if (!offline) {
      state.eventQueue = state.eventQueue.map((i) => ({ ...i, synced: true }));
      state.apiIntegrations.webhookStatus = "synced";
    } else {
      state.apiIntegrations.webhookStatus = "offline";
    }
    persist();
    return state.meta.offlineMode;
  };

  state.setDryWeather = (on) => {
    state.meta.dryWeatherMode = !!on;
    state.logAudit("dry_weather", state.meta.lastOperator, on ? "enabled" : "disabled");
    persist();
  };

  state.getFilteredIncidents = (zoneId = state.meta.activeZone) =>
    zoneId === "all" ? state.incidents : state.incidents.filter((i) => i.zone_id === zoneId);

  state.getFilteredEvents = (zoneId = state.meta.activeZone) =>
    zoneId === "all" ? state.events : state.events.filter((i) => i.zone_id === zoneId);

  normalizeSeededState();
  state.persist = persist;
  state.toggleOfflineMode = state.toggleOffline;
  window.BSData = state;
  persist();
})();


