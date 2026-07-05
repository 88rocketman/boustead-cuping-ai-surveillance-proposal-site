const STORAGE_KEY = "boustead-static-app-v2";
const makeInitialState = window.createInitialState;
const threatCatalog = window.threatMeta;
const root = document.getElementById("root");
const pages = [
  ["dashboard", "Dashboard", "graph"],
  ["map", "Zone Map", "map"],
  ["cameras", "Cameras", "camera"],
  ["incidents", "Incidents", "shield"],
  ["drone", "Drone Ops", "drone"],
  ["devices", "Devices", "cpu"],
  ["rules", "Rules & API", "settings"]
];

let state = normalizeState(loadState());
let page = "dashboard";
let selectedZone = "all";
let selectedIncident = state.incidents[0]?.id || null;
let dashboardFilters = {
  incidentThreat: "all",
  incidentSeverity: "all",
  incidentStatus: "all",
  eventThreat: "all",
  eventSeverity: "all",
  eventSort: "recency"
};
let leafletMap = null;

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || makeInitialState();
  } catch {
    return makeInitialState();
  }
}

function normalizeState(nextState) {
  const defaults = makeInitialState();
  return {
    ...defaults,
    ...nextState,
    farm: { ...defaults.farm, ...(nextState.farm || {}) },
    automation: { ...defaults.automation, ...(nextState.automation || {}) },
    drone: { ...defaults.drone, ...(nextState.drone || {}) },
    moduleConfig: {
      camera: { ...defaults.moduleConfig.camera, ...(nextState.moduleConfig?.camera || {}) },
      ai: { ...defaults.moduleConfig.ai, ...(nextState.moduleConfig?.ai || {}) },
      incident: { ...defaults.moduleConfig.incident, ...(nextState.moduleConfig?.incident || {}) },
      drone: { ...defaults.moduleConfig.drone, ...(nextState.moduleConfig?.drone || {}) },
      api: { ...defaults.moduleConfig.api, ...(nextState.moduleConfig?.api || {}) }
    }
  };
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function icon(name) {
  const paths = {
    graph: "M4 19V5m0 14h16M8 16v-5m4 5V8m4 8v-9",
    map: "M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3zM9 3v15M15 6v15",
    camera: "M4 8h3l2-3h6l2 3h3v11H4V8zm8 8a4 4 0 100-8 4 4 0 000 8z",
    shield: "M12 3l8 3v6c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6l8-3z",
    drone: "M12 7l2 5h-4l2-5zM5 5h4M3 5a2 2 0 104 0 2 2 0 00-4 0zm12 0h4m-2-2a2 2 0 100 4 2 2 0 000-4zM5 19h4m-6 0a2 2 0 104 0 2 2 0 00-4 0zm12 0h4m-2-2a2 2 0 100 4 2 2 0 000-4zM10 12H7m7 0h3m-5 0v4",
    cpu: "M8 8h8v8H8zM4 10h4M4 14h4M16 10h4M16 14h4M10 4v4M14 4v4M10 16v4M14 16v4",
    settings: "M12 8a4 4 0 100 8 4 4 0 000-8zM4 12h2m12 0h2M12 4v2m0 12v2"
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name] || paths.graph}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>`;
}

function render() {
  const kpis = buildKpis();
  root.innerHTML = `
    <div class="appShell">
      <aside class="sidebar">
        <div class="brandBlock"><div class="brandMark">GLC</div><div><strong>GLC</strong><span>Farm Intelligence Control</span></div></div>
        <nav class="sideNav">
          ${pages.map(([id, label, iconName]) => `<button class="${page === id ? "active" : ""}" data-page="${id}">${icon(iconName)} ${label}</button>`).join("")}
        </nav>
        <div class="scopeCard">
          <span>Site</span><strong>Cuping Farm Land</strong><span>400 acres maize farm</span>
          <em>Satellite layer is real. Boundary overlay is representative pending parcel KML/GeoJSON and state confirmation.</em>
        </div>
      </aside>
      <main class="workspace">
        <header class="topHeader">
          <div><h1>GLC Cuping Command Center</h1><p>AI-enabled perimeter, camera evidence, incident workflow, and fleet operations for the 400-acre farm land.</p></div>
          <div class="headerActions">
            <button data-action="health">Run Health Sweep</button>
            <button data-action="offline">${state.offline ? "Go Online" : "Offline Drill"}</button>
            <button data-sim="boar" data-zone="north-ridge">Boar</button>
            <button data-sim="human" data-zone="south-gate">Intrusion</button>
            <button data-sim="fire" data-zone="harvest-belt">Fire</button>
            <button data-action="dry">Dry ${state.dryWeather ? "On" : "Off"}</button>
            <button data-action="reset">Reset</button>
          </div>
        </header>
        ${page === "dashboard" ? dashboard(kpis) : ""}
        ${page === "map" ? mapPage() : ""}
        ${page === "cameras" ? camerasPage() : ""}
        ${page === "incidents" ? incidentsPage() : ""}
        ${page === "drone" ? droneOpsPage() : ""}
        ${page === "devices" ? devicesPage() : ""}
        ${page === "rules" ? rulesPage() : ""}
      </main>
    </div>`;

  if (page === "map") initMap();
}

function sideMessageText() {
  const latest = state.incidents[0];
  if (!latest) return "No active operator message.";
  if (latest.severity === "critical") return `Immediate verification required at ${zoneName(latest.zoneId)}. Dispatch supervisor after visual confirmation.`;
  if (latest.threat === "human") return `Security team to validate ${zoneName(latest.zoneId)} intrusion path and attach camera evidence.`;
  if (latest.threat === "boar") return `Ranger patrol recommended near ${zoneName(latest.zoneId)}. Monitor repeat movement for crop damage.`;
  return `Review latest ${threatCatalog[latest.threat].label} detection and confirm response priority.`;
}

function streamingDetectionPanel() {
  const streamEvents = getFilteredEvents().slice(0, 8);
  return `<aside class="panel streamPanel">
    <div class="panelHeader"><h2>Streaming Detection Feed</h2><span class="streamState">${state.offline ? "Queued" : "Live"}</span></div>
    <div class="streamFilters">
      <div class="filterChips">
        <button class="${dashboardFilters.eventThreat === "all" ? "active" : ""}" data-event-threat="all">All Threat</button>
        <button class="${dashboardFilters.eventThreat === "human" ? "active" : ""}" data-event-threat="human">Human</button>
        <button class="${dashboardFilters.eventThreat === "boar" ? "active" : ""}" data-event-threat="boar">Boar</button>
        <button class="${dashboardFilters.eventThreat === "fire" ? "active" : ""}" data-event-threat="fire">Fire</button>
        <button class="${dashboardFilters.eventThreat === "arson" ? "active" : ""}" data-event-threat="arson">Arson</button>
      </div>
      <div class="filterChips">
        <button class="${dashboardFilters.eventSeverity === "all" ? "active" : ""}" data-event-severity="all">All Severity</button>
        <button class="${dashboardFilters.eventSeverity === "critical" ? "active" : ""}" data-event-severity="critical">Critical</button>
        <button class="${dashboardFilters.eventSeverity === "high" ? "active" : ""}" data-event-severity="high">High</button>
        <button class="${dashboardFilters.eventSeverity === "medium" ? "active" : ""}" data-event-severity="medium">Medium</button>
      </div>
    </div>
    <div class="streamList">
      ${streamEvents.length ? streamEvents.map((event, index) => `
        <button class="streamItem" data-zone-select="${event.zoneId}">
          <i class="${event.severity}"></i>
          <span class="streamTime">${event.time}</span>
          <strong>${threatCatalog[event.threat].label}</strong>
          <span>${zoneName(event.zoneId)} | ${event.source}</span>
          <em>${Math.round(event.confidence * 100)}% confidence</em>
          <b>${index === 0 ? "Newest" : event.recommendation}</b>
        </button>
      `).join("") : "<p class=\"emptyState\">No matching stream events for this filter.</p>"}
    </div>
    <div class="streamMessage">
      <strong>Operator Message</strong>
      <p>${sideMessageText()}</p>
    </div>
  </aside>`;
}

function buildKpis() {
  const open = state.incidents.filter((incident) => incident.status !== "closed");
  const critical = open.filter((incident) => ["high", "critical"].includes(incident.severity));
  const latencies = state.incidents.map((incident) => incident.latencyMs).sort((a, b) => a - b);
  const p95 = latencies[Math.floor((latencies.length - 1) * 0.95)] || 0;
  return {
    critical: critical.length,
    open: open.length,
    p95: Math.round(p95 / 1000),
    risk: (state.zones.reduce((sum, zone) => sum + zone.risk * (state.dryWeather ? zone.fireModifier : 1), 0) / state.zones.length).toFixed(1),
    healthy: state.devices.filter((device) => device.status === "healthy").length,
    devices: state.devices.length,
    queue: state.queueDepth
  };
}

function getFilteredIncidents() {
  const base = state.incidents.filter((incident) => (selectedZone === "all" || incident.zoneId === selectedZone) && (dashboardFilters.incidentStatus === "all" || incident.status === dashboardFilters.incidentStatus) && (dashboardFilters.incidentThreat === "all" || incident.threat === dashboardFilters.incidentThreat) && (dashboardFilters.incidentSeverity === "all" || incident.severity === dashboardFilters.incidentSeverity));
  return base.sort((a, b) => {
    if (dashboardFilters.eventSort === "severity") {
      const rank = { low: 1, medium: 2, high: 3, critical: 4 };
      return (rank[b.severity] || 0) - (rank[a.severity] || 0);
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

function getFilteredEvents() {
  const base = selectedZone === "all" ? state.events : state.events.filter((event) => event.zoneId === selectedZone);
  return base.filter((event) => (dashboardFilters.eventThreat === "all" || event.threat === dashboardFilters.eventThreat) && (dashboardFilters.eventSeverity === "all" || event.severity === dashboardFilters.eventSeverity));
}

function dashboard(kpis) {
  const incidents = getFilteredIncidents().slice(0, 8);
  return `
    <div class="dashboardGrid">
      <section class="kpiStrip">
        ${metric("Critical", kpis.critical, "danger")}
        ${metric("Open Incidents", kpis.open)}
        ${metric("P95 Latency", `${kpis.p95}s`)}
        ${metric("Avg Risk", kpis.risk, "warn")}
        ${metric("Healthy Devices", `${kpis.healthy}/${kpis.devices}`, "ok")}
        ${metric("Queue Depth", kpis.queue)}
      </section>
      <section class="panel mapPreview"><div class="panelHeader"><h2>Operational Map - 400 Acre Coverage</h2><button data-page="map">Open full map</button></div>${miniMap()}</section>
      <section class="panel">
        <div class="panelHeader">
          <div class="panelMeta">
            <h2>Priority Incident Queue</h2>
            <span>${incidents.length} visible</span>
          </div>
          <div class="filterChips">
            <button class="${dashboardFilters.incidentStatus === "all" ? "active" : ""}" data-inc-filter-status="all">All</button>
            <button class="${dashboardFilters.incidentStatus === "new" ? "active" : ""}" data-inc-filter-status="new">New</button>
            <button class="${dashboardFilters.incidentStatus === "acknowledged" ? "active" : ""}" data-inc-filter-status="acknowledged">Ack</button>
            <button class="${dashboardFilters.incidentStatus === "verified" ? "active" : ""}" data-inc-filter-status="verified">Verified</button>
            <button class="${dashboardFilters.incidentStatus === "dispatched" ? "active" : ""}" data-inc-filter-status="dispatched">Dispatched</button>
            <button class="${dashboardFilters.incidentThreat === "all" ? "active" : ""}" data-inc-filter-threat="all">All Threat</button>
            <button class="${dashboardFilters.incidentThreat === "human" ? "active" : ""}" data-inc-filter-threat="human">Human</button>
            <button class="${dashboardFilters.incidentThreat === "boar" ? "active" : ""}" data-inc-filter-threat="boar">Boar</button>
            <button class="${dashboardFilters.incidentThreat === "fire" ? "active" : ""}" data-inc-filter-threat="fire">Fire</button>
            <button class="${dashboardFilters.incidentThreat === "arson" ? "active" : ""}" data-inc-filter-threat="arson">Arson</button>
            <button class="${dashboardFilters.incidentSeverity === "high" ? "active" : ""}" data-inc-filter-severity="high">High+</button>
            <button class="${dashboardFilters.incidentSeverity === "critical" ? "active" : ""}" data-inc-filter-severity="critical">Critical</button>
            <button class="${dashboardFilters.eventSort === "severity" ? "active" : ""}" data-inc-sort="severity">Risk First</button>
            <button class="${dashboardFilters.eventSort === "recency" ? "active" : ""}" data-inc-sort="recency">Recent</button>
          </div>
          <button data-page="incidents">Open workflow</button>
        </div>
        ${incidentRows(incidents)}
      </section>
      <section class="cameraEvidenceArea">
        <div class="panel cameraRail"><div class="panelHeader"><h2>Camera Evidence Wall</h2><button data-page="cameras">Open feeds</button></div><div class="cameraEvidenceGrid">${state.feeds.slice(0, 8).map(cameraCard).join("")}</div></div>
        ${streamingDetectionPanel()}
      </section>
      <section class="opsFeatureRow">
        ${automationPanel()}
        ${dronePanel()}
      </section>
      <section class="panel eventStream"><div class="panelHeader"><h2>Event Stream</h2></div>${eventTable()}</section>
    </div>`;
}

function metric(label, value, tone = "neutral") {
  return `<article class="metric ${tone}"><strong>${value}</strong><span>${label}</span></article>`;
}

function miniMap() {
  return `<div class="satelliteCanvas">
    ${state.zones.map((zone) => `<button class="zoneShape ${zone.id} ${selectedZone === zone.id ? "selected" : ""}" data-zone-select="${zone.id}"><strong>${zone.name}</strong><span>${zone.risk.toFixed(1)}</span></button>`).join("")}
    ${state.events.slice(0, 8).map((event, index) => `<i class="eventPin ${event.severity}" style="left:${18 + index * 8}%;top:${24 + (index % 3) * 20}%"></i>`).join("")}
  </div>`;
}

function incidentRows(incidents) {
  if (!incidents.length) {
    return `<div class="incidentList"><p class="emptyState">No incidents match this filter.</p></div>`;
  }
  return `<div class="incidentList large">${incidents.map((incident) => `
    <button class="incidentRow ${selectedIncident === incident.id ? "active" : ""}" data-incident="${incident.id}">
      <span class="severity ${incident.severity}">${incident.severity}</span>
      <strong>${threatCatalog[incident.threat].label}</strong>
      <span>${zoneName(incident.zoneId)}</span>
      <em>${incident.status}</em>
    </button>`).join("")}</div>`;
}

function eventTable() {
  return `<table><thead><tr><th>Time</th><th>Threat</th><th>Zone</th><th>Confidence</th><th>Model</th></tr></thead><tbody>
    ${state.events.slice(0, 8).map((event) => `<tr><td>${event.time}</td><td>${threatCatalog[event.threat].label}</td><td>${zoneName(event.zoneId)}</td><td>${Math.round(event.confidence * 100)}%</td><td>${event.model}</td></tr>`).join("")}
  </tbody></table>`;
}

function mapPage() {
  return `<div class="moduleStack">
    <section class="coverageGrid">
      ${coverageTile("400 acres", "Full representative farm boundary", `${state.farm.perimeterKm || 8.7} km perimeter`)}
      ${coverageTile("6 perimeter sectors", "Fence, road, canal and quarry edge", "Coverage-first view")}
      ${coverageTile("4 operating zones", "Large blocks inside full boundary", "One-click filtering")}
      ${coverageTile("24/7 zero-hour", "Automation + support escalation", state.automation.supportSla)}
    </section>
    <section class="panel mapMega"><div class="panelHeader"><h2>Satellite Zone Map - Expanded Coverage</h2><button data-drone-action="launch">Launch Drone Sweep</button></div><p class="mapNote">Real satellite tile layer. Larger representative 400-acre coverage is shown until actual parcel KML/GeoJSON is supplied.</p><div class="leafletHost" id="leafletHost"></div></section>
    <section class="zoneCards">${state.zones.map((zone) => `<button class="zoneSummary ${selectedZone === zone.id ? "selected" : ""}" data-zone-select="${zone.id}"><strong>${zone.name}</strong><span>Risk ${zone.risk} | Alerts ${zone.alerts}</span><em>${zone.weather.humidity}% humidity | ${zone.weather.wind} km/h wind</em></button>`).join("")}</section>
    ${zoneFocusPanel()}
    ${aiFeatureGrid()}
    <section class="opsFeatureRow">
      ${automationPanel()}
      ${dronePanel()}
    </section>
  </div>`;
}

function coverageTile(value, label, note) {
  return `<article class="coverageTile"><strong>${value}</strong><span>${label}</span><em>${note}</em></article>`;
}

function activeZone() {
  if (selectedZone === "all") return state.zones.find((zone) => zone.id === "south-gate") || state.zones[0];
  return state.zones.find((zone) => zone.id === selectedZone) || state.zones[0];
}

function zoneFocusPanel() {
  const zone = activeZone();
  const feeds = state.feeds.filter((feed) => feed.zoneId === zone.id);
  const events = state.events.filter((event) => event.zoneId === zone.id);
  return `<section class="panel zoneFocusPanel" data-focus-zone="${zone.id}">
    <div class="focusHeader">
      <div><span>${selectedZone === "all" ? "Default focus area" : "Selected zone focus"}</span><h2>${zone.name}</h2><p>Animated map zoom, local camera evidence, detections, and dispatch actions for this operating section.</p></div>
      <div class="focusActions"><button data-page="cameras">Open focused feeds</button><button data-sim="${feeds[0]?.threat || "human"}" data-zone="${zone.id}">Generate detection</button><button data-drone-action="launch">Drone verify</button></div>
    </div>
    <div class="focusBody">
      <div class="focusMediaWall">${feeds.map((feed) => cameraCard(feed, true)).join("")}</div>
      <aside class="focusIntelligence">
        <strong>AI zone intelligence</strong>
        <span>Risk score <b>${zone.risk.toFixed(1)}</b></span>
        <span>Active alerts <b>${zone.alerts}</b></span>
        <span>Camera count <b>${zone.cameras.length}</b></span>
        <span>Weather modifier <b>${zone.weather.humidity}% RH / ${zone.weather.wind} km/h</b></span>
        <div class="focusDetectionList">${events.length ? events.map((event) => `<button data-incident="${state.incidents.find((incident) => incident.eventId === event.id)?.id || ""}"><i class="${event.severity}"></i><span>${threatCatalog[event.threat].label}</span><em>${Math.round(event.confidence * 100)}% | ${event.time}</em></button>`).join("") : "<p>No current detections for this zone.</p>"}</div>
      </aside>
    </div>
  </section>`;
}

function aiFeatureGrid() {
  const features = [
    ["Boar movement AI", "Detects animal movement, repeat entry corridors, crop-damage clustering."],
    ["Human intrusion AI", "Classifies person/vehicle pathing, loitering, fence crossing and gate approach."],
    ["Smoke / thermal fusion", "Escalates smoke, hotspot and flame cues with wind and humidity modifiers."],
    ["Arson intent sequence", "Flags unusual stop-start movement, night activity and ignition-risk patterns."],
    ["Evidence auto-pack", "Creates incident clip, snapshot, model version and operator note bundle."],
    ["Device health AI", "Detects lens occlusion, tamper, bad heartbeat, storage pressure and weak network."]
  ];
  return `<section class="panel"><div class="panelHeader"><h2>AI Capability Layer</h2><button data-sim="human" data-zone="south-gate">Test AI Event</button></div><div class="aiFeatureGrid">${features.map(([title, body]) => `<article class="aiFeature"><strong>${title}</strong><p>${body}</p><span>active model pipeline</span></article>`).join("")}</div></section>`;
}

function automationPanel() {
  const automation = state.automation || {};
  return `<section class="panel automationPanel">
    <div class="panelHeader"><h2>Full Automation & Zero-Hour Support</h2><button data-automation-toggle="autoDispatch">${automation.autoDispatch ? "Pause Auto Dispatch" : "Enable Auto Dispatch"}</button></div>
    <div class="automationGrid">
      <span><strong>${automation.mode || "armed"}</strong>Platform mode</span>
      <span><strong>${automation.zeroHourSupport ? "online" : "standby"}</strong>Zero-hour support</span>
      <span><strong>${automation.supportSla || "0-15 min"}</strong>Response SLA</span>
      <span><strong>${automation.webhookRetry || "ready"}</strong>Webhook retry</span>
    </div>
    <ol class="automationFlow">
      <li>AI detects threat and confidence threshold.</li>
      <li>System creates event, clip reference and incident.</li>
      <li>Rules engine escalates by zone, weather and severity.</li>
      <li>Operator validates; drone or patrol is dispatched.</li>
    </ol>
  </section>`;
}

function dronePanel(expanded = false) {
  const drone = state.drone || {};
  return `<section class="panel dronePanel ${expanded ? "expanded" : ""}">
    <div class="panelHeader"><h2>Drone Response</h2><span class="streamState">${drone.status || "ready"}</span></div>
    <div class="droneHero">
      <div class="droneRadar"><i></i><b></b><span>UAV</span></div>
      <div class="droneStats">
        <span>Dock<strong>${drone.dock || "Dock A"}</strong></span>
        <span>Battery<strong>${drone.battery || 0}%</strong></span>
        <span>ETA<strong>${drone.eta || "--:--"}</strong></span>
        <span>Mission<strong>${drone.mission || "standby"}</strong></span>
      </div>
    </div>
    <div class="droneRoute">${(drone.route || []).map((stop) => `<span>${stop}</span>`).join("")}</div>
    <div class="cardActions"><button data-drone-action="launch">Fly Drone Off</button><button data-drone-action="return">Return To Dock</button><button data-sim="fire" data-zone="harvest-belt">Fire Sweep</button></div>
  </section>`;
}

function droneOpsPage() {
  return `<div class="moduleStack">
    <section class="coverageGrid">
      ${coverageTile(state.drone.status, "Drone status", "Autonomous response asset")}
      ${coverageTile(`${state.drone.battery}%`, "Battery available", "Safe return reserve enforced")}
      ${coverageTile(state.drone.eta, "Current mission ETA", "Updates after launch")}
      ${coverageTile("AI tasked", "Launch from event queue", "Manual operator override")}
    </section>
    ${dronePanel(true)}
    ${automationPanel()}
    <section class="panel"><div class="panelHeader"><h2>Drone Mission Queue</h2><button data-drone-action="launch">Launch Next Mission</button></div>${eventTable()}</section>
  </div>`;
}

function initMap() {
  leafletMap = null;
  const host = document.getElementById("leafletHost");
  if (!host || !window.L) return;
  leafletMap = L.map(host, { zoomControl: true }).setView([state.farm.center.lat, state.farm.center.lng], 15);
  L.tileLayer("https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { attribution: "Esri World Imagery", maxZoom: 19 }).addTo(leafletMap);
  if (state.farm.boundary?.length) {
    L.polygon(state.farm.boundary, {
      color: "#ffbe2d",
      fillColor: "#ffbe2d",
      fillOpacity: 0.09,
      weight: 4,
      dashArray: "10 8"
    }).addTo(leafletMap).bindPopup(`<b>Representative 400-acre boundary</b><br/>${state.farm.perimeterKm} km perimeter<br/>Pending actual parcel KML/GeoJSON.`);
    state.farm.perimeterSectors.forEach((sector, index) => {
      const point = state.farm.boundary[index % state.farm.boundary.length];
      L.marker(point, {
        title: sector
      }).addTo(leafletMap).bindTooltip(sector);
    });
  }
  state.zones.forEach((zone) => {
    const polygon = L.polygon(zone.geometry, {
      color: selectedZone === zone.id ? "#ffbe2d" : "#30a46c",
      fillColor: "#15834f",
      fillOpacity: selectedZone === "all" || selectedZone === zone.id ? 0.34 : 0.12,
      weight: selectedZone === zone.id ? 3 : 2
    }).addTo(leafletMap);
    polygon.bindPopup(`<b>${zone.name}</b><br/>Risk ${zone.risk}<br/>${zone.alerts} active alerts`);
    polygon.on("click", () => {
      selectedZone = selectedZone === zone.id ? "all" : zone.id;
      render();
    });
  });
  const focusedZone = selectedZone === "all" ? null : state.zones.find((zone) => zone.id === selectedZone);
  const allBounds = focusedZone?.geometry || (state.farm.boundary?.length ? state.farm.boundary : state.zones.flatMap((zone) => zone.geometry));
  if (allBounds.length) {
    const bounds = L.latLngBounds(allBounds);
    leafletMap.fitBounds(bounds, { padding: focusedZone ? [70, 70] : [8, 8], animate: true, duration: 0.9 });
    if (focusedZone) {
      setTimeout(() => leafletMap.flyToBounds(bounds, { padding: [70, 70], duration: 0.85 }), 120);
    }
  }
  state.events.slice(0, 14).forEach((event, index) => {
    const zone = state.zones.find((item) => item.id === event.zoneId);
    if (!zone) return;
    L.circleMarker([zone.center.lat + 0.00012 * (index + 1), zone.center.lng - 0.00009 * (index + 1)], {
      radius: 7,
      color: "#0f2f21",
      fillColor: event.severity === "high" || event.severity === "critical" ? "#e34a2c" : "#ffbe2d",
      fillOpacity: 1,
      weight: 2
    }).addTo(leafletMap).bindTooltip(`${threatCatalog[event.threat].label} ${Math.round(event.confidence * 100)}%`);
  });
}

function camerasPage() {
  const feeds = selectedZone === "all" ? state.feeds : state.feeds.filter((feed) => feed.zoneId === selectedZone);
  return `<div class="moduleStack"><section class="toolbarPanel"><button class="${selectedZone === "all" ? "active" : ""}" data-zone-select="all">All Zones</button>${state.zones.map((zone) => `<button class="${selectedZone === zone.id ? "active" : ""}" data-zone-select="${zone.id}">${zone.name}</button>`).join("")}</section><section class="cameraGrid expanded">${feeds.map((feed) => cameraCard(feed, true)).join("")}</section></div>`;
}

function cameraCard(feed, actions = false) {
  const meta = threatCatalog[feed.threat];
  return `<article class="cameraCard">
    <div class="videoMock ${feed.threat} ${feed.zoneId}">
      <span class="cameraId">${feed.id}</span>
      <span class="liveState ${feed.status}">${feed.status}</span>
      <span class="snapshotStamp">SNAPSHOT ${new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
      <span class="detectionBox ${feed.threat}"></span>
      <strong>${meta.label}</strong>
      <em>${Math.round(feed.confidence * 100)}% confidence</em>
    </div>
    <div class="cameraMeta"><strong>${zoneName(feed.zoneId)}</strong><span>${feed.model} | ${feed.fps} fps | ${feed.latency}s</span></div>
    ${actions ? `<div class="cardActions"><button data-sim="${feed.threat}" data-zone="${feed.zoneId}">Create Incident</button><button data-evidence="${feed.id}">Capture Evidence</button></div>` : ""}
  </article>`;
}

function incidentsPage() {
  const incident = state.incidents.find((item) => item.id === selectedIncident) || state.incidents[0];
  return `<div class="incidentLayout"><section class="panel"><div class="panelHeader"><h2>Incident Queue</h2></div>${incidentRows(state.incidents)}</section><section class="panel detailPanel"><div class="panelHeader"><h2>Incident Detail</h2></div>${incident ? incidentDetail(incident) : ""}</section></div>`;
}

function incidentDetail(incident) {
  return `<div class="detailGrid"><span>Threat<strong>${threatCatalog[incident.threat].label}</strong></span><span>Zone<strong>${zoneName(incident.zoneId)}</strong></span><span>Confidence<strong>${Math.round(incident.confidence * 100)}%</strong></span><span>Evidence<strong>${incident.evidence}</strong></span></div><div class="workflow">${["new", "acknowledged", "verified", "dispatched", "closed"].map((status) => `<span class="${incident.timeline.some((item) => item.status === status) ? "done" : ""}">${status}</span>`).join("")}</div><div class="cardActions"><button data-advance="${incident.id}">Advance State</button><button data-label="${incident.id}" data-feedback="true-positive">True Positive</button><button data-label="${incident.id}" data-feedback="false-positive">False Positive</button></div><div class="timelineList">${incident.notes.map((note) => `<p><strong>${note.by}</strong> ${note.text}<span>${new Date(note.at).toLocaleString()}</span></p>`).join("")}</div>`;
}

function devicesPage() {
  return `<div class="moduleStack"><section class="kpiStrip">${metric("Healthy", state.devices.filter((d) => d.status === "healthy").length, "ok")}${metric("Degraded", state.devices.filter((d) => d.status === "degraded").length, "warn")}${metric("Offline", state.devices.filter((d) => d.status === "offline").length, "danger")}${metric("Queue", state.queueDepth)}</section><section class="panel"><div class="panelHeader"><h2>Fleet Operations</h2><button data-action="health">Run Health Sweep</button></div><table><thead><tr><th>Device</th><th>Zone</th><th>Status</th><th>Firmware</th><th>Heartbeat</th><th>Storage</th><th>Network</th><th>Actions</th></tr></thead><tbody>${state.devices.map((device) => `<tr><td>${device.id}</td><td>${zoneName(device.zoneId)}</td><td><span class="severity ${device.status}">${device.status}</span></td><td>${device.firmware}</td><td>${device.heartbeat}s</td><td>${device.storage}%</td><td>${device.rssi} dBm</td><td class="tableActions"><button data-device="${device.id}" data-device-action="ota">OTA</button><button data-device="${device.id}" data-device-action="reboot">Reboot</button><button data-device="${device.id}" data-device-action="clear">Clear</button></td></tr>`).join("")}</tbody></table></section></div>`;
}

function rulesPage() {
  return `<div class="moduleStack">
    <section class="coverageGrid">
      ${coverageTile("Rule engine", "Zone + schedule + weather aware", `${Object.values(state.rules).filter((rule) => rule.active).length}/4 active`)}
      ${coverageTile(state.moduleConfig.ai.inferenceMode, "AI inference mode", state.moduleConfig.ai.modelUpdate)}
      ${coverageTile(`${state.moduleConfig.camera.retentionDays} days`, "Evidence retention", `${state.moduleConfig.camera.preRollSec}s pre-roll`)}
      ${coverageTile(`${state.moduleConfig.api.webhookRetries} retries`, "API delivery policy", state.moduleConfig.api.retryBackoff)}
    </section>
    <section class="rulesLayout">
      <section class="panel"><div class="panelHeader"><h2>AI Threat Rules</h2><button data-action="dry">Dry Weather Preset</button></div><div class="rulesGrid">${Object.entries(state.rules).map(([key, rule]) => ruleCard(key, rule)).join("")}</div></section>
      <section class="panel"><div class="panelHeader"><h2>Module Configuration</h2><button data-config-preset="enterprise">Enterprise Preset</button></div>${moduleConfigPanel()}</section>
    </section>
    <section class="rulesLayout">
      <section class="panel"><div class="panelHeader"><h2>Response Matrix</h2><button data-sim="fire" data-zone="harvest-belt">Test Fire Flow</button></div>${responseMatrix()}</section>
      <section class="panel"><div class="panelHeader"><h2>API & Audit</h2></div><div class="endpointGrid">${["/events", "/incidents", "/device-health", "/sync/status", "/drone/launch", "/rules/evaluate"].map((path) => `<span>${path}<strong>ready</strong></span>`).join("")}</div><div class="timelineList audit">${state.audit.slice(0, 10).map((item) => `<p><strong>${item.action}</strong> ${item.detail}<span>${new Date(item.at).toLocaleString()}</span></p>`).join("")}</div></section>
    </section>
  </div>`;
}

function ruleCard(key, rule) {
  return `<article class="ruleCard advancedRule">
    <div><strong>${threatCatalog[key].label}</strong><span>${rule.active ? "Active" : "Suppressed"}</span></div>
    <label>Confidence threshold <b>${Math.round(rule.confidence * 100)}%</b><input data-rule="${key}" data-rule-field="confidence" type="range" min="50" max="95" value="${rule.confidence * 100}"></label>
    <label>Detection duration <input data-rule="${key}" data-rule-field="duration" type="number" min="1" max="60" value="${rule.duration}"></label>
    <label>Schedule <input data-rule="${key}" data-rule-field="schedule" type="text" value="${rule.schedule || "24h"}"></label>
    <label>Action policy <select data-rule="${key}" data-rule-field="action">${["ranger patrol", "security dispatch", "zero-hour callout", "supervisor review", "drone validation"].map((action) => `<option ${rule.action === action ? "selected" : ""}>${action}</option>`).join("")}</select></label>
    <label>Escalation <select data-rule="${key}" data-rule-field="escalation">${["low", "medium", "high", "critical"].map((level) => `<option ${rule.escalation === level ? "selected" : ""}>${level}</option>`).join("")}</select></label>
    <p>Zones: ${(rule.zones || ["all"]).map((zone) => zone === "all" ? "All zones" : zoneName(zone)).join(", ")}</p>
    <button data-rule-toggle="${key}">${rule.active ? "Disable Rule" : "Enable Rule"}</button>
  </article>`;
}

function moduleConfigPanel() {
  const config = state.moduleConfig;
  return `<div class="moduleConfigGrid">
    ${configCard("Camera Evidence", "camera", [
      ["retentionDays", "Retention days", "number"],
      ["preRollSec", "Pre-roll seconds", "number"],
      ["postRollSec", "Post-roll seconds", "number"],
      ["minFps", "Minimum FPS", "number"]
    ])}
    ${configCard("AI Pipeline", "ai", [
      ["inferenceMode", "Inference mode", "select:edge-first,hybrid,cloud-review"],
      ["modelUpdate", "Model update", "select:staged,manual,auto-canary"]
    ])}
    ${configCard("Incident Workflow", "incident", [
      ["slaMinutes", "SLA minutes", "number"],
      ["autoCreate", "Auto-create incident", "boolean"],
      ["mandatoryNote", "Mandatory note", "boolean"]
    ])}
    ${configCard("Drone Response", "drone", [
      ["minBattery", "Minimum battery", "number"],
      ["maxWindKmh", "Max wind km/h", "number"],
      ["autoLaunch", "Auto launch", "boolean"]
    ])}
    ${configCard("API Delivery", "api", [
      ["webhookRetries", "Webhook retries", "number"],
      ["offlineBufferHours", "Offline buffer hours", "number"],
      ["signedPayload", "Signed payload", "boolean"]
    ])}
  </div>`;
}

function configCard(title, moduleKey, fields) {
  const config = state.moduleConfig[moduleKey];
  return `<article class="configCard"><strong>${title}</strong>${fields.map(([field, label, type]) => configInput(moduleKey, field, label, type, config[field])).join("")}</article>`;
}

function configInput(moduleKey, field, label, type, value) {
  if (type === "boolean") return `<label>${label}<button class="togglePill ${value ? "on" : ""}" data-config-toggle="${moduleKey}.${field}">${value ? "On" : "Off"}</button></label>`;
  if (type.startsWith("select:")) {
    const options = type.replace("select:", "").split(",");
    return `<label>${label}<select data-config="${moduleKey}.${field}">${options.map((option) => `<option ${value === option ? "selected" : ""}>${option}</option>`).join("")}</select></label>`;
  }
  return `<label>${label}<input data-config="${moduleKey}.${field}" type="${type}" value="${value}"></label>`;
}

function responseMatrix() {
  return `<table><thead><tr><th>Threat</th><th>Trigger</th><th>Module</th><th>Automation</th><th>Escalation</th></tr></thead><tbody>
    ${Object.entries(state.rules).map(([key, rule]) => `<tr><td>${threatCatalog[key].label}</td><td>${Math.round(rule.confidence * 100)}% / ${rule.duration}s</td><td>${(rule.zones || ["all"]).map((zone) => zone === "all" ? "All zones" : zoneName(zone)).join(", ")}</td><td>${rule.action}</td><td><span class="severity ${rule.escalation}">${rule.escalation}</span></td></tr>`).join("")}
  </tbody></table>`;
}

function simulateThreat(threat, zoneId) {
  const zone = state.zones.find((item) => item.id === zoneId) || state.zones[0];
  const meta = threatCatalog[threat];
  const event = { id: `EVT-${Date.now()}`, time: new Date().toLocaleTimeString("en-GB"), threat, zoneId: zone.id, severity: meta.severity, confidence: Number((0.72 + Math.random() * 0.22).toFixed(2)), source: zone.cameras[0], model: meta.model, recommendation: meta.recommendation, clip: `clip-${zone.id}-${Date.now().toString().slice(-5)}` };
  const incident = { id: `INC-${Math.floor(1000 + Math.random() * 9000)}`, eventId: event.id, threat, zoneId: zone.id, status: "new", severity: event.severity, confidence: event.confidence, assignedTo: "Ops Lead", evidence: event.clip, createdAt: new Date().toISOString(), latencyMs: Math.floor(9000 + Math.random() * 18000), feedback: null, notes: [{ at: new Date().toISOString(), by: "system", text: "Event converted to incident." }], timeline: [{ status: "new", at: new Date().toISOString(), by: "system" }] };
  zone.alerts += 1;
  state.events.unshift(event);
  state.incidents.unshift(incident);
  state.audit.unshift(audit("event.created", `Created ${meta.label} incident in ${zone.name}`));
  if (state.offline) state.queueDepth += 1;
  selectedIncident = incident.id;
  save();
  render();
}

function advanceIncident(id) {
  const order = ["new", "acknowledged", "verified", "dispatched", "closed"];
  const incident = state.incidents.find((item) => item.id === id);
  if (!incident) return;
  const next = order[order.indexOf(incident.status) + 1];
  if (!next) return;
  incident.status = next;
  incident.timeline.push({ status: next, at: new Date().toISOString(), by: "Ops Lead" });
  incident.notes.unshift({ at: new Date().toISOString(), by: "Ops Lead", text: `Operator advanced to ${next}.` });
  state.audit.unshift(audit("incident.status", `${incident.id} advanced to ${next}`));
  save();
  render();
}

function audit(action, detail) {
  return { id: `AUD-${Date.now()}`, at: new Date().toISOString(), actor: "Ops Lead", action, detail };
}

function zoneName(zoneId) {
  return state.zones.find((zone) => zone.id === zoneId)?.name || zoneId;
}

function setConfigValue(path, value) {
  const [moduleKey, field] = path.split(".");
  if (!state.moduleConfig[moduleKey]) return;
  state.moduleConfig[moduleKey][field] = value;
  state.audit.unshift(audit("config.update", `${moduleKey}.${field} set to ${value}`));
  save();
  render();
}

root.addEventListener("click", (event) => {
  const target = event.target.closest("button");
  if (!target) return;
  if (target.dataset.incFilterStatus) {
    dashboardFilters.incidentStatus = target.dataset.incFilterStatus;
    render();
  }
  if (target.dataset.incFilterThreat) {
    dashboardFilters.incidentThreat = target.dataset.incFilterThreat;
    render();
  }
  if (target.dataset.incFilterSeverity) {
    dashboardFilters.incidentSeverity = target.dataset.incFilterSeverity;
    render();
  }
  if (target.dataset.incSort) {
    dashboardFilters.eventSort = target.dataset.incSort;
    render();
  }
  if (target.dataset.eventThreat) {
    dashboardFilters.eventThreat = target.dataset.eventThreat;
    render();
  }
  if (target.dataset.eventSeverity) {
    dashboardFilters.eventSeverity = target.dataset.eventSeverity;
    render();
  }
  if (target.dataset.page) {
    page = target.dataset.page;
    render();
  }
  if (target.dataset.zoneSelect) {
    selectedZone = target.dataset.zoneSelect;
    render();
  }
  if (target.dataset.incident) {
    selectedIncident = target.dataset.incident;
    page = "incidents";
    render();
  }
  if (target.dataset.sim) simulateThreat(target.dataset.sim, target.dataset.zone);
  if (target.dataset.advance) advanceIncident(target.dataset.advance);
  if (target.dataset.label) {
    const incident = state.incidents.find((item) => item.id === target.dataset.label);
    incident.feedback = target.dataset.feedback;
    incident.notes.unshift({ at: new Date().toISOString(), by: "Ops Lead", text: `Feedback: ${target.dataset.feedback}.` });
    save();
    render();
  }
  if (target.dataset.action === "dry") {
    state.dryWeather = !state.dryWeather;
    save();
    render();
  }
  if (target.dataset.action === "offline") {
    state.offline = !state.offline;
    if (!state.offline) state.queueDepth = 0;
    save();
    render();
  }
  if (target.dataset.action === "reset") {
    localStorage.removeItem(STORAGE_KEY);
    state = normalizeState(makeInitialState());
    dashboardFilters = {
      incidentThreat: "all",
      incidentSeverity: "all",
      incidentStatus: "all",
      eventThreat: "all",
      eventSeverity: "all",
      eventSort: "recency"
    };
    selectedIncident = state.incidents[0]?.id || null;
    selectedZone = "all";
    render();
  }
  if (target.dataset.automationToggle) {
    state.automation[target.dataset.automationToggle] = !state.automation[target.dataset.automationToggle];
    state.audit.unshift(audit("automation.toggle", `${target.dataset.automationToggle} changed to ${state.automation[target.dataset.automationToggle]}`));
    save();
    render();
  }
  if (target.dataset.droneAction) {
    if (target.dataset.droneAction === "launch") {
      Object.assign(state.drone, { status: "airborne", battery: Math.max(72, state.drone.battery - 5), mission: "AI perimeter sweep", eta: "02:10" });
      state.audit.unshift(audit("drone.launch", "Drone launched for perimeter sweep"));
    }
    if (target.dataset.droneAction === "return") {
      Object.assign(state.drone, { status: "returning", battery: Math.max(68, state.drone.battery - 3), mission: "return to Dock A", eta: "01:30" });
      state.audit.unshift(audit("drone.return", "Drone returning to Dock A"));
    }
    save();
    render();
  }
  if (target.dataset.action === "health") {
    state.devices.forEach((device) => {
      if (device.status !== "offline") device.heartbeat = Math.max(10, device.heartbeat - 5);
    });
    state.audit.unshift(audit("device.health_sweep", "Fleet health sweep completed"));
    save();
    render();
  }
  if (target.dataset.deviceAction) {
    const device = state.devices.find((item) => item.id === target.dataset.device);
    if (!device) return;
    if (target.dataset.deviceAction === "ota") Object.assign(device, { firmware: "2.4.0", status: "healthy", heartbeat: 14 });
    if (target.dataset.deviceAction === "reboot") Object.assign(device, { status: "rebooting", heartbeat: 0 });
    if (target.dataset.deviceAction === "clear") Object.assign(device, { status: "healthy", tamper: "clear", heartbeat: 15 });
    state.audit.unshift(audit("device.update", `${device.id} ${target.dataset.deviceAction}`));
    save();
    render();
  }
  if (target.dataset.ruleToggle) {
    state.rules[target.dataset.ruleToggle].active = !state.rules[target.dataset.ruleToggle].active;
    state.audit.unshift(audit("rule.toggle", `${threatCatalog[target.dataset.ruleToggle].label} changed`));
    save();
    render();
  }
  if (target.dataset.configToggle) {
    const [moduleKey, field] = target.dataset.configToggle.split(".");
    const value = !state.moduleConfig[moduleKey][field];
    setConfigValue(target.dataset.configToggle, value);
  }
  if (target.dataset.configPreset === "enterprise") {
    Object.assign(state.moduleConfig.camera, { retentionDays: 45, preRollSec: 15, postRollSec: 30, minFps: 18 });
    Object.assign(state.moduleConfig.ai, { inferenceMode: "hybrid", modelUpdate: "auto-canary", humanReview: true });
    Object.assign(state.moduleConfig.incident, { autoCreate: true, mandatoryNote: true, closeRequiresFeedback: true, slaMinutes: 10 });
    Object.assign(state.moduleConfig.drone, { autoLaunch: true, minBattery: 45, maxWindKmh: 24, nightMode: true });
    Object.assign(state.moduleConfig.api, { webhookRetries: 8, retryBackoff: "exponential", signedPayload: true, offlineBufferHours: 48 });
    state.audit.unshift(audit("config.preset", "Enterprise preset applied"));
    save();
    render();
  }
});

function handleConfigInput(event) {
  const target = event.target;
  if (target.dataset.rule) {
    const rule = state.rules[target.dataset.rule];
    if (target.dataset.ruleField === "confidence") rule.confidence = Number(target.value) / 100;
    if (target.dataset.ruleField === "duration") rule.duration = Number(target.value);
    if (target.dataset.ruleField === "schedule") rule.schedule = target.value;
    if (target.dataset.ruleField === "action") rule.action = target.value;
    if (target.dataset.ruleField === "escalation") rule.escalation = target.value;
    state.audit.unshift(audit("rule.update", `${threatCatalog[target.dataset.rule].label} ${target.dataset.ruleField} updated`));
    save();
    render();
    return;
  }
  if (target.dataset.config) {
    const numericTypes = ["retentionDays", "preRollSec", "postRollSec", "minFps", "slaMinutes", "minBattery", "maxWindKmh", "webhookRetries", "offlineBufferHours"];
    const field = target.dataset.config.split(".")[1];
    setConfigValue(target.dataset.config, numericTypes.includes(field) ? Number(target.value) : target.value);
  }
}

root.addEventListener("input", (event) => {
  const target = event.target;
  if (target.tagName === "SELECT") return;
  handleConfigInput(event);
});

root.addEventListener("change", (event) => {
  handleConfigInput(event);
});

render();

