// ============================================================
// METROAI — Risk Utilities
// Single source of truth for risk display logic
// ============================================================

export const RISK_CONFIG = {
  LOW: {
    label: 'Low',
    shortLabel: 'LOW',
    color: '#16a34a',
    bg: 'rgba(22,163,74,0.15)',
    border: 'rgba(22,163,74,0.35)',
    pulse: 'none',
    icon: 'CheckCircle2',
    description: 'Comfortable travel expected',
  },
  MODERATE: {
    label: 'Moderate',
    shortLabel: 'MODERATE',
    color: '#d97706',
    bg: 'rgba(217,119,6,0.15)',
    border: 'rgba(217,119,6,0.35)',
    pulse: 'none',
    icon: 'AlertTriangle',
    description: 'Some crowding expected',
  },
  HIGH: {
    label: 'High',
    shortLabel: 'HIGH',
    color: '#dc2626',
    bg: 'rgba(220,38,38,0.15)',
    border: 'rgba(220,38,38,0.40)',
    pulse: 'pulse-high',
    icon: 'ShieldAlert',
    description: 'High passenger pressure expected',
  },
  CRITICAL: {
    label: 'Critical',
    shortLabel: 'CRITICAL',
    color: '#991b1b',
    bg: 'rgba(153,27,27,0.20)',
    border: 'rgba(153,27,27,0.50)',
    pulse: 'pulse-critical',
    icon: 'AlertOctagon',
    description: 'Very high passenger pressure expected',
  },
};

export function getRiskConfig(level) {
  return RISK_CONFIG[level] || RISK_CONFIG.LOW;
}

export function classifyRisk(inflow) {
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
