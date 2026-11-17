// ============================================================
// METROAI — API Service
// All backend calls go through this module.
// Set VITE_API_BASE_URL in .env to connect real backend.
// Falls back to mock service when unavailable.
// ============================================================

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

function getUserSafeError(status) {
  switch (status) {
    case 401: return 'Session expired. Please log in again.';
    case 403: return 'Access denied. Insufficient permissions.';
    case 404: return 'Requested resource not found.';
    case 429: return 'Too many requests. Please wait a moment.';
    case 500:
    case 502:
    case 503: return 'Server unavailable. Please try again later.';
    default: return 'An unexpected network error occurred.';
  }
}

async function request(method, path, body = null) {
  const controller = new AbortController();
  // 45s timeout accommodates backend cold starts on Render/serverless
  const timeoutId = setTimeout(() => controller.abort(), 45000);

  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Enables HTTP-Only cookies across origin for secure auth
    signal: controller.signal,
  };
  if (body) opts.body = JSON.stringify(body);

  try {
    const res = await fetch(`${API_BASE}${path}`, opts);
    clearTimeout(timeoutId);

    if (res.status === 401) {
      if (path.startsWith('/auth/')) {
        throw new Error(path === '/auth/login' ? 'Invalid email or password.' : 'Not signed in.');
      }
      // Dispatch custom event so AuthContext/ProtectedRoute can intercept and open login
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('metroai:unauthorized'));
      }
      throw new Error('Session expired. Please log in again.');
    }

    if (!res.ok) {
      throw new Error(getUserSafeError(res.status));
    }
    return res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection.');
    }
    throw err;
  }
}

// ============================================================
// Auth Endpoints
// ============================================================

export async function loginUser(email, password) {
  if (DEMO_MODE) {
    return { message: 'Demo auth successful', user: { email, role: 'admin' } };
  }
  return request('POST', '/auth/login', { email, password });
}

export async function registerUser(email, password, role = 'operator', operator_id = null) {
  if (DEMO_MODE) {
    return { email, role };
  }
  return request('POST', '/auth/register', { email, password, role, operator_id });
}

export async function logoutUser() {
  if (DEMO_MODE) return { message: 'Logged out' };
  return request('POST', '/auth/logout');
}

export async function fetchCurrentUser() {
  if (DEMO_MODE) {
    return { email: 'operator@delhimetrorail.com', role: 'admin' };
  }
  return request('GET', '/auth/me');
}

// ============================================================
// Data & Forecast Endpoints
// ============================================================

// GET /api/stations
export async function fetchStations() {
  if (DEMO_MODE) {
    const { mockFetchStations } = await import('./mockApi');
    return mockFetchStations();
  }
  return request('GET', '/api/stations');
}

// POST /api/forecast  { origin_id, destination_id, travel_time }
export async function fetchForecast(payload) {
  if (DEMO_MODE) {
    const { mockFetchForecast } = await import('./mockApi');
    return mockFetchForecast(payload);
  }
  return request('POST', '/api/forecast', payload);
}

// GET /api/admin/forecast?horizon=20
export async function fetchAdminForecast(horizon = 20) {
  if (DEMO_MODE) {
    const { mockFetchAdminForecast } = await import('./mockApi');
    return mockFetchAdminForecast(horizon);
  }
  return request('GET', `/api/admin/forecast?horizon=${encodeURIComponent(horizon)}`);
}

// GET /api/stations/:id/forecast?horizon=20
export async function fetchStationForecast(stationId, horizon = 20) {
  if (DEMO_MODE) {
    const { mockFetchStationForecast } = await import('./mockApi');
    return mockFetchStationForecast(stationId, horizon);
  }
  return request('GET', `/api/stations/${encodeURIComponent(stationId)}/forecast?horizon=${encodeURIComponent(horizon)}`);
}

// GET /api/stations/:id/explanation?horizon=20
export async function fetchStationExplanation(stationId, horizon = 20) {
  if (DEMO_MODE) {
    const { mockFetchStationExplanation } = await import('./mockApi');
    return mockFetchStationExplanation(stationId, horizon);
  }
  return request('GET', `/api/stations/${encodeURIComponent(stationId)}/explanation?horizon=${encodeURIComponent(horizon)}`);
}

// GET /api/admin/alerts/history
export async function fetchAlertHistory(limit = 50) {
  if (DEMO_MODE) {
    return [
      { id: 1, station_id: 50, station_name: 'Rajiv Chowk', risk_level: 'HIGH', predicted_inflow: 780, timestamp: new Date().toISOString() },
      { id: 2, station_id: 8, station_name: 'Kashmere Gate', risk_level: 'CRITICAL', predicted_inflow: 1120, timestamp: new Date(Date.now() - 3600000).toISOString() },
    ];
  }
  return request('GET', `/api/admin/alerts/history?limit=${encodeURIComponent(limit)}`);
}
