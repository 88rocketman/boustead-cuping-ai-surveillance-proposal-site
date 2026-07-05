const threatMeta = {
  boar: { label: "Wild Boar", severity: "medium", model: "edge-cnn-v2", recommendation: "dispatch ranger" },
  human: { label: "Human Intrusion", severity: "high", model: "edge-yolo-v4", recommendation: "verify and dispatch" },
  fire: { label: "Smoke / Fire", severity: "critical", model: "thermal-smoke-v3", recommendation: "immediate verification" },
  arson: { label: "Arson Risk", severity: "high", model: "sequence-risk-v1", recommendation: "investigate route" }
};

function createInitialState() {
  const zones = [
    {
      id: "north-ridge",
      name: "North Ridge",
      risk: 2.3,
      fireModifier: 1.05,
      alerts: 2,
      cameras: ["CAM-01", "CAM-02"],
      center: { lat: 6.5060, lng: 100.2488 },
      geometry: [[6.5116, 100.2398], [6.5116, 100.2548], [6.5004, 100.2548], [6.5004, 100.2398]],
      weather: { humidity: 33, wind: 14 }
    },
    {
      id: "central-corridor",
      name: "Central Corridor",
      risk: 1.9,
      fireModifier: 1,
      alerts: 1,
      cameras: ["CAM-03", "CAM-04"],
      center: { lat: 6.5060, lng: 100.2628 },
      geometry: [[6.5116, 100.2548], [6.5116, 100.2698], [6.5004, 100.2698], [6.5004, 100.2548]],
      weather: { humidity: 41, wind: 9 }
    },
    {
      id: "harvest-belt",
      name: "Harvest Belt",
      risk: 2.8,
      fireModifier: 1.2,
      alerts: 4,
      cameras: ["CAM-05", "CAM-06"],
      center: { lat: 6.4948, lng: 100.2488 },
      geometry: [[6.5004, 100.2398], [6.5004, 100.2548], [6.4892, 100.2548], [6.4892, 100.2398]],
      weather: { humidity: 24, wind: 18 }
    },
    {
      id: "south-gate",
      name: "South Access Gate",
      risk: 3.2,
      fireModifier: 1.15,
      alerts: 3,
      cameras: ["CAM-07", "CAM-08"],
      center: { lat: 6.4948, lng: 100.2628 },
      geometry: [[6.5004, 100.2548], [6.5004, 100.2698], [6.4892, 100.2698], [6.4892, 100.2548]],
      weather: { humidity: 27, wind: 22 }
    }
  ];

  const feeds = [
    { id: "CAM-01", zoneId: "north-ridge", threat: "boar", confidence: 0.87, fps: 30, latency: 1.2, status: "live", model: "edge-cnn-v2" },
    { id: "CAM-02", zoneId: "north-ridge", threat: "human", confidence: 0.81, fps: 28, latency: 1.3, status: "live", model: "edge-yolo-v4" },
    { id: "CAM-03", zoneId: "central-corridor", threat: "fire", confidence: 0.74, fps: 24, latency: 1.4, status: "live", model: "thermal-smoke-v3" },
    { id: "CAM-04", zoneId: "central-corridor", threat: "boar", confidence: 0.76, fps: 25, latency: 1.6, status: "live", model: "edge-cnn-v2" },
    { id: "CAM-05", zoneId: "harvest-belt", threat: "arson", confidence: 0.69, fps: 25, latency: 1.8, status: "flicker", model: "sequence-risk-v1" },
    { id: "CAM-06", zoneId: "harvest-belt", threat: "fire", confidence: 0.82, fps: 24, latency: 1.5, status: "live", model: "thermal-smoke-v3" },
    { id: "CAM-07", zoneId: "south-gate", threat: "boar", confidence: 0.73, fps: 26, latency: 1.7, status: "live", model: "edge-cnn-v2" },
    { id: "CAM-08", zoneId: "south-gate", threat: "human", confidence: 0.91, fps: 29, latency: 0.9, status: "live", model: "edge-yolo-v4" }
  ];

  const events = [
    { id: "EVT-1001", time: "09:42:18", threat: "human", zoneId: "south-gate", severity: "high", confidence: 0.91, source: "CAM-08", model: "edge-yolo-v4", recommendation: "verify and dispatch", clip: "clip-sg-1001" },
    { id: "EVT-1002", time: "09:28:04", threat: "boar", zoneId: "north-ridge", severity: "medium", confidence: 0.84, source: "CAM-01", model: "edge-cnn-v2", recommendation: "dispatch ranger", clip: "clip-nr-1002" },
    { id: "EVT-1003", time: "09:18:33", threat: "fire", zoneId: "harvest-belt", severity: "critical", confidence: 0.79, source: "CAM-05", model: "thermal-smoke-v3", recommendation: "immediate verification", clip: "clip-hb-1003" }
  ];

  const incidents = events.map((event, index) => ({
    id: `INC-${1021 + index}`,
    eventId: event.id,
    threat: event.threat,
    zoneId: event.zoneId,
    status: index === 0 ? "new" : "acknowledged",
    severity: event.severity,
    confidence: event.confidence,
    assignedTo: "Ops Lead",
    evidence: event.clip,
    createdAt: new Date(Date.now() - index * 900000).toISOString(),
    latencyMs: 12000 + index * 4000,
    feedback: null,
    notes: [{ at: new Date().toISOString(), by: "system", text: "Mapped from detection event." }],
    timeline: [{ status: "new", at: new Date().toISOString(), by: "system" }]
  }));

  return {
    farm: {
      areaAcres: 400,
      center: { lat: 6.5004, lng: 100.2548 },
      boundary: [[6.5122, 100.2390], [6.5122, 100.2706], [6.4886, 100.2706], [6.4886, 100.2390]],
      perimeterKm: 8.7,
      perimeterSectors: ["North fence", "East quarry edge", "South access road", "West village edge", "Canal line", "Service track"]
    },
    dryWeather: false,
    offline: false,
    queueDepth: 0,
    automation: {
      mode: "armed",
      zeroHourSupport: true,
      supportSla: "0-15 min",
      autoEvidence: true,
      autoDispatch: true,
      webhookRetry: "ready"
    },
    drone: {
      status: "ready",
      dock: "Dock A",
      battery: 91,
      mission: "perimeter standby",
      eta: "02:40",
      route: ["South Access Gate", "Harvest Belt", "North Ridge"]
    },
    zones,
    feeds,
    events,
    incidents,
    devices: [
      { id: "GW-NT-01", zoneId: "north-ridge", status: "healthy", firmware: "2.3.7", heartbeat: 18, storage: 74, temp: 44, rssi: -58, tamper: "clear" },
      { id: "GW-CT-01", zoneId: "central-corridor", status: "degraded", firmware: "2.3.4", heartbeat: 68, storage: 86, temp: 56, rssi: -71, tamper: "occlusion" },
      { id: "GW-HB-01", zoneId: "harvest-belt", status: "healthy", firmware: "2.3.5", heartbeat: 22, storage: 64, temp: 47, rssi: -62, tamper: "clear" },
      { id: "GW-SG-01", zoneId: "south-gate", status: "offline", firmware: "2.2.9", heartbeat: 0, storage: 43, temp: 0, rssi: -104, tamper: "clear" }
    ],
    rules: {
      boar: { active: true, confidence: 0.72, duration: 8, zones: ["north-ridge", "harvest-belt"], action: "ranger patrol", schedule: "18:00-06:00", escalation: "medium" },
      human: { active: true, confidence: 0.68, duration: 5, zones: ["south-gate", "central-corridor"], action: "security dispatch", schedule: "24h", escalation: "high" },
      fire: { active: true, confidence: 0.81, duration: 10, zones: ["all"], action: "zero-hour callout", schedule: "dry weather", escalation: "critical" },
      arson: { active: false, confidence: 0.76, duration: 12, zones: ["south-gate", "harvest-belt"], action: "supervisor review", schedule: "20:00-05:00", escalation: "high" }
    },
    moduleConfig: {
      camera: { retentionDays: 30, preRollSec: 12, postRollSec: 20, minFps: 15, evidenceWatermark: true },
      ai: { inferenceMode: "edge-first", modelUpdate: "staged", humanReview: true, feedbackLearning: true },
      incident: { autoCreate: true, mandatoryNote: true, closeRequiresFeedback: true, slaMinutes: 15 },
      drone: { autoLaunch: false, minBattery: 35, maxWindKmh: 28, nightMode: true },
      api: { webhookRetries: 5, retryBackoff: "exponential", signedPayload: true, offlineBufferHours: 24 }
    },
    audit: [{ id: "AUD-9001", at: new Date().toISOString(), actor: "system", action: "seed", detail: "Demo state initialized." }]
  };
}

window.threatMeta = threatMeta;
window.createInitialState = createInitialState;
