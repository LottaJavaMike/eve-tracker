export function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso.includes('T') || iso.includes('Z') ? iso : iso.replace(' ', 'T') + 'Z');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso.includes('T') || iso.includes('Z') ? iso : iso.replace(' ', 'T') + 'Z');
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function formatIsk(value) {
  if (value === null || value === undefined) return '—';
  return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value)} ISK`;
}

/** Returns { label, tone } where tone is one of good|warning|serious|critical|neutral */
export function timeRemaining(iso) {
  if (!iso) return { label: '—', tone: 'neutral' };
  const end = new Date(iso.includes('T') || iso.includes('Z') ? iso : iso.replace(' ', 'T') + 'Z').getTime();
  const diffMs = end - Date.now();

  if (diffMs <= 0) return { label: 'Ready', tone: 'good' };

  const hours = diffMs / (1000 * 60 * 60);
  const days = Math.floor(hours / 24);
  const remHours = Math.floor(hours % 24);
  const label = days > 0 ? `${days}d ${remHours}h` : `${remHours}h`;

  let tone = 'good';
  if (hours < 6) tone = 'critical';
  else if (hours < 24) tone = 'serious';
  else if (hours < 72) tone = 'warning';

  return { label, tone };
}
