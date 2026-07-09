/** Parse an API decimal string like "1261.00" into a number (0 on failure). */
export const num = (v: string | number | null | undefined): number => {
  const n = typeof v === 'number' ? v : parseFloat(v ?? '');
  return Number.isFinite(n) ? n : 0;
};

/** Format a number as Indian Rupees, no decimals. */
export const inr = (v: string | number | null | undefined): string =>
  `₹${num(v).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

/** Format a plain integer with thousands separators. */
export const count = (v: string | number | null | undefined): string =>
  num(v).toLocaleString('en-IN');

/** Short date (e.g. "19 Nov 2025") from an ISO string or YYYY-MM-DD. */
export const shortDate = (v: string | null | undefined): string => {
  if (!v) return '—';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export type TrendMode = 'daily' | 'weekly' | 'monthly';

/** Bucket key for grouping a date into a daily / weekly / monthly period. */
export const periodKey = (iso: string, mode: TrendMode): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');

  if (mode === 'monthly') return `${y}-${m}`;

  if (mode === 'weekly') {
    // ISO week number (Mon-based).
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = (date.getUTCDay() + 6) % 7;
    date.setUTCDate(date.getUTCDate() - dayNum + 3);
    const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
    const week =
      1 +
      Math.round(
        ((date.getTime() - firstThursday.getTime()) / 86400000 -
          3 +
          ((firstThursday.getUTCDay() + 6) % 7)) /
          7,
      );
    return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
  }

  return `${y}-${m}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Human label for a period key produced by `periodKey`. */
export const periodLabel = (key: string, mode: TrendMode): string => {
  if (mode === 'weekly') return key.replace('-W', ' W');
  if (mode === 'monthly') {
    const [y, m] = key.split('-');
    const d = new Date(Number(y), Number(m) - 1, 1);
    return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  }
  const d = new Date(key);
  return Number.isNaN(d.getTime())
    ? key
    : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};
