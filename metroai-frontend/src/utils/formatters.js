// ============================================================
// METROAI — Formatters
// ============================================================

export function formatTime(timeStr) {
  if (!timeStr) return '';
  if (typeof timeStr !== 'string') return String(timeStr);

  // If ISO string with T
  if (timeStr.includes('T')) {
    const d = new Date(timeStr);
    const h = d.getHours();
    const m = d.getMinutes();
    return formatHourMinute(h, m);
  }

  // Strip any existing AM/PM markers to prevent double am/pm ("23:00 PM")
  const cleaned = timeStr.replace(/(AM|PM|am|pm)/g, '').trim();
  const parts = cleaned.split(':');
  if (parts.length < 2) return timeStr;

  const rawH = parseInt(parts[0], 10);
  const rawM = parseInt(parts[1], 10);

  if (isNaN(rawH)) return timeStr;

  return formatHourMinute(rawH, isNaN(rawM) ? 0 : rawM);
}

function formatHourMinute(rawH, rawM) {
  let hour = rawH;
  let ampm = 'AM';

  if (hour > 12) {
    hour = hour - 12;
    ampm = 'PM';
  } else if (hour === 12) {
    ampm = 'PM';
  } else if (hour === 0) {
    hour = 12;
    ampm = 'AM';
  } else {
    ampm = 'AM';
  }

  const formattedHour = String(hour).padStart(2, '0');
  const formattedMinute = String(rawM).padStart(2, '0');
  return `${formattedHour}:${formattedMinute} ${ampm}`;
}

export function formatDate(dateStr) {
  if (!dateStr) return 'Today';
  const d = new Date(dateStr);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Today';
  const tom = new Date(today);
  tom.setDate(tom.getDate() + 1);
  if (d.toDateString() === tom.toDateString()) return 'Tomorrow';
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function formatNumber(n) {
  if (n == null) return '—';
  return n.toLocaleString('en-IN');
}

export function addMinutes(timeStr, minutes) {
  if (!timeStr) return '';
  const cleaned = timeStr.replace(/(AM|PM|am|pm)/g, '').trim();
  const [hStr, mStr] = cleaned.split(':');
  let h = parseInt(hStr, 10) || 0;
  const m = parseInt(mStr, 10) || 0;

  // If original string had PM and h < 12, adjust to 24-hr
  if (/pm/i.test(timeStr) && h < 12) {
    h += 12;
  } else if (/am/i.test(timeStr) && h === 12) {
    h = 0;
  }

  const total = h * 60 + m + minutes;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

export function formatISODate(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}
