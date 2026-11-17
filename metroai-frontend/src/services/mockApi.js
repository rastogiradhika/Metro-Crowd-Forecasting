// ============================================================
// METROAI — Mock API Service
// Matches Passenger & Admin Operational Flows
// ============================================================

import { STATIONS, getRiskFromInflow } from '../data/stations';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function mockInflow(stationId, hour, horizon) {
  // Deterministic pseudo-random based on station + time + horizon
  const seed = (stationId * 37 + hour * 13 + horizon * 7) % 100;
  const base = 80 + seed * 6; // 80–680
  const peakMultiplier = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20) ? 1.55 : 1.0;
  return Math.round(base * peakMultiplier);
}

export async function mockFetchStations() {
  await sleep(250);
  return STATIONS.map((s) => ({
    id: s.id,
    name: s.name,
    lat: s.lat,
    lon: s.lon,
    line: s.line,
    interchange: s.interchange || false,
    gates: s.gates,
    lifts: s.lifts,
    platforms: s.platforms,
    concourses: s.concourses,
  }));
}

export async function mockFetchForecast({ origin_id, destination_id, travel_time }) {
  await sleep(700);
  const hour = travel_time ? parseInt(travel_time.split(':')[0]) : new Date().getHours();
  const originStation = STATIONS.find((s) => s.id === origin_id) || STATIONS.find((s) => s.id === 50) || STATIONS[0];
  const destStation = STATIONS.find((s) => s.id === destination_id) || STATIONS.find((s) => s.id === 59) || STATIONS[1];

  // Origin values across 10m, 20m, 30m horizons
  const inflow10 = mockInflow(origin_id, hour, 10);
  const inflow20 = mockInflow(origin_id, hour, 20);
  const inflow30 = mockInflow(origin_id, hour, 30);

  const risk10 = getRiskFromInflow(inflow10);
  const risk20 = getRiskFromInflow(inflow20);
  const risk30 = getRiskFromInflow(inflow30);

  // Destination value (~30 min later arrival)
  const destInflow = mockInflow(destination_id, hour + 1, 20);
  const destRisk = getRiskFromInflow(destInflow);

  // Intermediate stations
  const minId = Math.min(origin_id, destination_id);
  const maxId = Math.max(origin_id, destination_id);
  const intermediates = STATIONS
    .filter((s) => s.id > minId && s.id < maxId)
    .slice(0, 4)
    .map((s) => ({ id: s.id, name: s.name, line: s.line }));

  // Recommended gate based on accessibility
  const recommendedGate = originStation.gates > 2 ? `Gate ${Math.min(4, Math.floor(originStation.gates))}` : 'Gate 1';

  // Calculate 15 min later time string
  const [h, m] = (travel_time || '08:15').split(':').map(Number);
  const totalOffset = h * 60 + m + 15;
  const laterH = Math.floor(totalOffset / 60) % 24;
  const laterM = totalOffset % 60;
  const laterTimeFormatted = `${String(laterH).padStart(2, '0')}:${String(laterM).padStart(2, '0')}`;

  // Destination arrival time
  const arrivalTotal = h * 60 + m + 30;
  const arrH = Math.floor(arrivalTotal / 60) % 24;
  const arrM = arrivalTotal % 60;
  const arrivalFormatted = `${String(arrH).padStart(2, '0')}:${String(arrM).padStart(2, '0')}`;

  return {
    demo: true,
    origin: {
      station_id: origin_id,
      station_name: originStation.name,
      predicted_inflow: inflow20,
      risk_level: risk20,
      horizon_minutes: 20,
      forecast_time: travel_time || '08:15',
      gates: originStation.gates,
      lifts: originStation.lifts,
      platforms: originStation.platforms,
      concourses: originStation.concourses,
      horizon_series: [
        { horizon: 10, inflow: inflow10, risk: risk10 },
        { horizon: 20, inflow: inflow20, risk: risk20 },
        { horizon: 30, inflow: inflow30, risk: risk30 },
      ],
    },
    destination: {
      station_id: destination_id,
      station_name: destStation.name,
      predicted_inflow: destInflow,
      risk_level: destRisk,
      horizon_minutes: 20,
      forecast_time: arrivalFormatted,
      gates: destStation.gates,
      lifts: destStation.lifts,
      platforms: destStation.platforms,
      concourses: destStation.concourses,
    },
    route: {
      origin: { id: origin_id, name: originStation.name, line: originStation.line },
      intermediate: intermediates,
      destination: { id: destination_id, name: destStation.name, line: destStation.line },
    },
    advisory: {
      message:
        risk20 === 'HIGH' || risk20 === 'CRITICAL'
          ? `Wait 15 mins: The crowd at ${originStation.name} is predicted to drop from ${risk20.toLowerCase()} to moderate levels around ${laterTimeFormatted}. If you can delay your trip, you will have a much more comfortable journey.`
          : `Station crowd at ${originStation.name} is currently ${risk20.toLowerCase()}. Proceed with your planned travel time at ${travel_time}.`,
      gate_recommendation: `Use ${recommendedGate}: Entry ${recommendedGate.toLowerCase()} usually has optimal concourse accessibility and faster clearance during this time slot.`,
      suggest_time_offset: risk20 === 'HIGH' || risk20 === 'CRITICAL' ? 15 : null,
      later_time: laterTimeFormatted,
    },
  };
}

export async function mockFetchAdminForecast(horizon = 20) {
  await sleep(400);
  const hour = new Date().getHours();

  const forecasts = STATIONS.map((s) => {
    const inflow = mockInflow(s.id, hour, horizon);
    const risk = getRiskFromInflow(inflow);
    return {
      station_id: s.id,
      station_name: s.name,
      line: s.line,
      interchange: s.interchange || false,
      predicted_inflow: inflow,
      risk_level: risk,
      horizon_minutes: horizon,
      trend: inflow > mockInflow(s.id, hour - 1, horizon) ? 'UP' : 'DOWN',
      reason:
        risk === 'CRITICAL'
          ? s.interchange
            ? '4 trains arriving in 10-min window + interchange transfer load'
            : 'Morning peak hour + high scheduled train frequency'
          : risk === 'HIGH'
          ? 'Morning peak influx + high scheduled timetable volume'
          : 'Standard scheduled timetable volume',
    };
  });

  const priorityAlerts = forecasts
    .filter((f) => f.risk_level === 'CRITICAL' || f.risk_level === 'HIGH')
    .sort((a, b) => b.predicted_inflow - a.predicted_inflow)
    .slice(0, 5);

  return {
    demo: true,
    horizon_minutes: horizon,
    updated_at: new Date().toISOString(),
    forecasts,
    summary: {
      critical: forecasts.filter((f) => f.risk_level === 'CRITICAL').length,
      high: forecasts.filter((f) => f.risk_level === 'HIGH').length,
      moderate: forecasts.filter((f) => f.risk_level === 'MODERATE').length,
      low: forecasts.filter((f) => f.risk_level === 'LOW').length,
    },
    priority_alerts: priorityAlerts,
    active_predictive_alert: priorityAlerts[0]
      ? {
          station_id: priorityAlerts[0].station_id,
          station_name: priorityAlerts[0].station_name,
          horizon_minutes: horizon,
          predicted_inflow: priorityAlerts[0].predicted_inflow,
          text: `Predictive Alert: ${priorityAlerts[0].station_name} station par agle ${horizon} minute mein Inflow 90th percentile cross karega. Critical crowd expected.`,
        }
      : null,
  };
}

export async function mockFetchStationForecast(stationId, horizon = 20) {
  await sleep(300);
  const hour = new Date().getHours();
  const station = STATIONS.find((s) => s.id === stationId) || STATIONS[0];

  // Continuous curve (7:00 AM to 9:00 AM)
  const hourlyCurve = [
    { time: '07:00', inflow: Math.round(mockInflow(stationId, 7, 20) * 0.45) },
    { time: '07:30', inflow: Math.round(mockInflow(stationId, 7, 20) * 0.7) },
    { time: '08:00', inflow: Math.round(mockInflow(stationId, 8, 20) * 0.95) },
    { time: '08:20', inflow: mockInflow(stationId, 8, 20) },
    { time: '08:40', inflow: Math.round(mockInflow(stationId, 8, 20) * 0.85) },
    { time: '09:00', inflow: Math.round(mockInflow(stationId, 9, 20) * 0.65) },
  ];

  const series = [10, 20, 30].map((h) => ({
    horizon_minutes: h,
    predicted_inflow: mockInflow(stationId, hour, h),
    risk_level: getRiskFromInflow(mockInflow(stationId, hour, h)),
  }));

  return {
    demo: true,
    station_id: stationId,
    station_name: station.name,
    forecast_series: series,
    hourly_curve: hourlyCurve,
    gates: station.gates,
    lifts: station.lifts,
    platforms: station.platforms,
    concourses: station.concourses,
    line: station.line,
    interchange: station.interchange || false,
    train_status: {
      scheduled_trains_10m: station.interchange ? 4 : 2,
      trains_description: `${station.interchange ? '4' : '2'} trains arriving in next 10-minute window (${station.line} Line + connecting transfers). Headway: 2.5 mins.`,
    },
    recommendation: {
      action: `Deploy 3 additional RPF staff at Platform ${station.platforms > 2 ? '2' : '1'}. Divert incoming passengers to Gate ${station.gates > 2 ? '5' : '2'}.`,
      platform: station.platforms > 2 ? 2 : 1,
      gate: station.gates > 2 ? 5 : 2,
    },
  };
}

export async function mockFetchStationExplanation(stationId, horizon = 20) {
  await sleep(200);
  const station = STATIONS.find((s) => s.id === stationId) || STATIONS[0];

  return {
    demo: true,
    station_id: stationId,
    horizon_minutes: horizon,
    available: true,
    factors: [
      {
        label: 'Scheduled Train Activity',
        impact: 42,
        description: `${station.interchange ? '4 trains arriving' : '2 trains scheduled'} within the next 10-minute headway block.`,
      },
      {
        label: 'Peak Commuter Window',
        impact: 34,
        description: 'Morning office peak rush hour (08:00 - 09:30 AM).',
      },
      {
        label: station.interchange ? 'Interchange Transfer Hub' : 'Historical Station Velocity',
        impact: 24,
        description: station.interchange
          ? 'Dual-line interchange passenger interchange influx.'
          : 'Elevated lag-10m and lag-20m rolling inflow acceleration.',
      },
    ],
  };
}
