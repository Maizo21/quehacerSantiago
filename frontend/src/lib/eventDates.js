export function dateKey(value) {
  if (!value) return '';
  const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : '';
}

export function todayInSantiago() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function formatEventDate(value, options = {}) {
  const key = dateKey(value);
  if (!key) return '';
  return new Intl.DateTimeFormat('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    ...options,
    timeZone: 'UTC'
  }).format(new Date(`${key}T12:00:00.000Z`));
}

export function formatEventRange(start, end) {
  const startLabel = formatEventDate(start);
  const startKey = dateKey(start);
  const endKey = dateKey(end);
  if (!endKey || endKey === startKey) return startLabel;
  return `${startLabel} — ${formatEventDate(end)}`;
}
