export function generateId(prefix = 'id'): string {
  const randomPart = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now().toString(36)}-${randomPart}`;
}

/**
 * Keep exact 2-decimal precision without distorted rounding
 */
export function roundExact(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatScore(value: number): string {
  const rounded = roundExact(value);
  return rounded.toLocaleString('vi-VN', {
    minimumFractionDigits: Number.isInteger(rounded) ? 0 : 1,
    maximumFractionDigits: 2,
  });
}

export function countWords(text: string): number {
  const cleaned = text.trim();
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).filter(Boolean).length;
}

export function formatDateVN(isoDate?: string): string {
  if (!isoDate) return '';
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTimeVN(isoDate?: string): string {
  if (!isoDate) return '';
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function slugifyFilename(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60) || 'tai_lieu';
}
