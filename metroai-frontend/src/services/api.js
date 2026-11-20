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

async function request(method, path, body = null, signal = null) {
  const timeoutController = new AbortController();
  // Extended 25s timeout for session verification on cold start (survives Render free-tier spinup)
  const timeoutMs = path === '/auth/me' ? 25000 : 15000;
  const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);

  // Link caller AbortController signal with timeout controller (Fix I3)
  let effectiveSignal = timeoutController.signal;
  if (signal) {
    if (signal.aborted) {
      clearTimeout(timeoutId);
      const abortErr = new DOMException('The user aborted a request.', 'AbortError');
      throw abortErr;
    }
    if (typeof AbortSignal.any === 'function') {
      effectiveSignal = AbortSignal.any([signal, timeoutController.signal]);
    } else {
      const combinedController = new AbortController();
      signal.addEventListener('abort', () => combinedController.abort(signal.reason), { once: true });
      timeoutController.signal.addEventListener('abort', () => combinedController.abort(timeoutController.signal.reason), { once: true });
      effectiveSignal = combinedController.signal;
    }
  }

  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Enables secure HTTP-Only cookies
    signal: effectiveSignal,
  };
  if (body) opts.body = JSON.stringify(body);

  try {
    const res = await fetch(`${API_BASE}${path}`, opts);
    clearTimeout(timeoutId);

    if (res.status === 401) {
      // Quietly return null for session inspection on page load without error throwing
      if (path === '/auth/me') {
        return null;
      }
      if (path.startsWith('/auth/')) {
        throw new Error(path === '/auth/login' ? 'Invalid credentials. Please verify your DMRC staff email & password.' : 'Not signed in.');
      }
      // Only dispatch unauthorized event for admin-scoped operations requests
      if (typeof window !== 'undefined' && path.startsWith('/api/admin')) {
        window.dispatchEvent(new CustomEvent('metroai:unauthorized'));
      }
      throw new Error('Session expired. Please log in again.');
    }

    if (res.status === 403) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || 'Access denied: Only authorized DMRC operations staff accounts can access this resource.');
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || getUserSafeError(res.status));
    }
    return res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    // Session check on page load should quietly resolve to null on any network failure
    if (path === '/auth/me') {
      return null;
    }
    if (signal && signal.aborted) {
      throw err;
    }
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection.');
    }
    throw err;
  }
}

// ============================================================
// Auth Endpoints (Pure HTTP-Only Cookie Based)
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

export async function fetchCurrentUser(signal = null) {
  if (DEMO_MODE) {
    return { email: 'operator@delhimetrorail.com', role: 'admin' };
  }
  return request('GET', '/auth/me', null, signal);
}

// ============================================================
// Data & Forecast Endpoints
// ============================================================

// GET /api/stations
export async function fetchStations(signal = null) {
  if (DEMO_MODE) {
    const { mockFetchStations } = await import('./mockApi');
    return mockFetchStations();
  }
  return request('GET', '/api/stations', null, signal);
}

// PUBLIC: GET /api/passenger/forecast/{station_id}?time={hhmm} (Fix C4)
export async function fetchPublicStationForecast(stationId, hhmm = '08:15', signal = null) {
  if (DEMO_MODE) {
    const { mockFetchStationForecast } = await import('./mockApi');
    return mockFetchStationForecast(stationId, 20);
  }
  return request('GET', `/api/passenger/forecast/${encodeURIComponent(stationId)}?time=${encodeURIComponent(hhmm)}`, null, signal);
}

// POST /api/forecast  { origin_id, destination_id, travel_time }
export async function fetchForecast(payload, signal = null) {
  if (DEMO_MODE) {
    const { mockFetchForecast } = await import('./mockApi');
    return mockFetchForecast(payload);
  }
  return request('POST', '/api/forecast', payload, signal);
}

// ADMIN: GET /api/admin/forecast?horizon=20
export async function fetchAdminForecast(horizon = 20, signal = null) {
  if (DEMO_MODE) {
    const { mockFetchAdminForecast } = await import('./mockApi');
    return mockFetchAdminForecast(horizon);
  }
  return request('GET', `/api/admin/forecast?horizon=${encodeURIComponent(horizon)}`, null, signal);
}

// ADMIN: GET /api/stations/:id/forecast?horizon=20
export async function fetchStationForecast(stationId, horizon = 20, signal = null) {
  if (DEMO_MODE) {
    const { mockFetchStationForecast } = await import('./mockApi');
    return mockFetchStationForecast(stationId, horizon);
  }
  return request('GET', `/api/stations/${encodeURIComponent(stationId)}/forecast?horizon=${encodeURIComponent(horizon)}`, null, signal);
}

// ADMIN: GET /api/stations/:id/explanation?horizon=20
export async function fetchStationExplanation(stationId, horizon = 20, signal = null) {
  if (DEMO_MODE) {
    const { mockFetchStationExplanation } = await import('./mockApi');
    return mockFetchStationExplanation(stationId, horizon);
  }
  return request('GET', `/api/stations/${encodeURIComponent(stationId)}/explanation?horizon=${encodeURIComponent(horizon)}`, null, signal);
}

// ADMIN: GET /api/admin/alerts/history
export async function fetchAlertHistory(limit = 50, signal = null) {
  if (DEMO_MODE) {
    return [
      { id: 1, station_id: 50, station_name: 'Rajiv Chowk', risk_level: 'HIGH', predicted_inflow: 780, timestamp: new Date().toISOString() },
      { id: 2, station_id: 8, station_name: 'Kashmere Gate', risk_level: 'CRITICAL', predicted_inflow: 1120, timestamp: new Date(Date.now() - 3600000).toISOString() },
    ];
  }
  return request('GET', `/api/admin/alerts/history?limit=${encodeURIComponent(limit)}`, null, signal);
}
