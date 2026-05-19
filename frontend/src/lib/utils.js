const avatarColors = [
  'avatar-green',
  'avatar-blue',
  'avatar-amber',
  'avatar-red',
  'avatar-purple',
];

export function getAvatarColor(name) {
  if (!name) return avatarColors[0];
  return avatarColors[name.charCodeAt(0) % avatarColors.length];
}

export function getInitials(name) {
  if (!name) return '??';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

export function fmtMoney(n) {
  const v = Number(n) || 0;
  return v.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

export function todayLocal() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDate(value) {
  if (!value) return '—';
  const normalized = String(value).slice(0, 10);
  const [year, month, day] = normalized.split('-').map(Number);
  if (!year || !month || !day) return String(value);
  return new Date(year, month - 1, day).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function monthValueToPeriodo(value) {
  if (!/^\d{4}-\d{2}$/.test(value || '')) return value;
  const [year, month] = value.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleString('es-MX', {
    month: 'long',
    year: 'numeric',
  });
}

export function estadoTareaToColumna(estado) {
  if (estado === 'pendiente') return 'semillas';
  if (estado === 'en_progreso') return 'crecimiento';
  if (estado === 'finalizada') return 'cosechado';
  return 'semillas';
}

export const labelsKanban = {
  semillas: { label: 'SEMILLAS', dot: 'gray' },
  crecimiento: { label: 'CRECIMIENTO', dot: 'green' },
  cosechado: { label: 'COSECHADO', dot: 'dark' },
};
