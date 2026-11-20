// ============================================================
// METROAI — Risk Utilities & Semantic Scale
// Enterprise SaaS Palette: Emerald / Amber / Orange / Red
// ============================================================

export const RISK_CONFIG = {
  LOW: {
    label: 'Low',
    shortLabel: 'LOW',
    color: '#059669',
    bg: 'rgba(5, 150, 105, 0.10)',
    border: 'rgba(5, 150, 105, 0.20)',
    pulse: 'none',
    icon: 'CheckCircle2',
    description: 'Comfortable transit & minimal turnstile queue',
  },
  MODERATE: {
    label: 'Moderate',
    shortLabel: 'MODERATE',
    color: '#D97706',
    bg: 'rgba(217, 119, 6, 0.10)',
    border: 'rgba(217, 119, 6, 0.20)',
    pulse: 'none',
    icon: 'AlertTriangle',
    description: 'Active commuter building flow',
  },
  HIGH: {
    label: 'High',
    shortLabel: 'HIGH',
    color: '#EA580C',
    bg: 'rgba(234, 88, 12, 0.10)',
    border: 'rgba(234, 88, 12, 0.20)',
    pulse: 'none',
    icon: 'ShieldAlert',
    description: 'Heavy entrance pressure & concourse bottlenecks',
  },
  CRITICAL: {
    label: 'Critical',
    shortLabel: 'CRITICAL',
    color: '#DC2626',
    bg: 'rgba(220, 38, 38, 0.10)',
    border: 'rgba(220, 38, 38, 0.20)',
    pulse: 'pulse-critical',
    icon: 'AlertOctagon',
    description: 'Surge containment & extreme turnstile saturation',
  },
};

export function getRiskConfig(level) {
  const normalized = (level || 'LOW').toUpperCase();
  return RISK_CONFIG[normalized] || RISK_CONFIG.LOW;
}

export function classifyRisk(inflow, stationId = null) {
  const hubs = [8, 13, 16, 37, 40, 45, 50, 59, 61, 70, 75, 120];
  if (stationId && hubs.includes(stationId)) {
    if (inflow < 400) return 'LOW';
    if (inflow < 850) return 'MODERATE';
    if (inflow < 1150) return 'HIGH';
    return 'CRITICAL';
  }
  if (inflow < 150) return 'LOW';
  if (inflow < 350) return 'MODERATE';
  if (inflow < 550) return 'HIGH';
  return 'CRITICAL';
}

export function getRiskStyles(level) {
  const cfg = getRiskConfig(level);
  return {
    color: cfg.color,
    backgroundColor: cfg.bg,
    borderColor: cfg.border,
  };
}
