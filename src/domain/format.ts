/** $1,000+ → 0 dp · $1+ → 2 dp · below $1 → 4 dp (web fmtPrice rule). */
export function fmtPrice(n: number | null | undefined): string {
  if (n == null || !isFinite(n)) return '—';
  const dp = Math.abs(n) >= 1000 ? 0 : Math.abs(n) >= 1 ? 2 : 4;
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
}

/** Money amounts (pay, balances): always 2 dp. */
export function fmtUsd(n: number | null | undefined): string {
  if (n == null || !isFinite(n)) return '—';
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtPct(n: number, dp = 2): string {
  return `${n.toFixed(dp)}%`;
}

export function fmtSignedPct(fraction: number): string {
  const v = fraction * 100;
  return `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(1)}%`;
}

/** Token amounts: SOL 4 dp, others 4 significant figures. */
export function fmtUnits(n: number, symbol: string): string {
  if (!isFinite(n)) return '—';
  if (symbol === 'SOL') return n.toLocaleString('en-US', { maximumFractionDigits: 4 });
  if (n >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  return Number(n.toPrecision(4)).toLocaleString('en-US', { maximumFractionDigits: 6 });
}

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Fri 30 Oct" in local time. */
export function fmtDay(ms: number): string {
  const d = new Date(ms);
  return `${WEEKDAY[d.getDay()]} ${d.getDate()} ${MONTH[d.getMonth()]}`;
}

/** "4:00 PM" in local time. */
export function fmtTime(ms: number): string {
  const d = new Date(ms);
  let h = d.getHours();
  const m = d.getMinutes();
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, '0')} ${ap}`;
}

export function fmtDayTime(ms: number): string {
  return `${fmtDay(ms)} · ${fmtTime(ms)}`;
}

/** "in 32 days" / "in 1 day" / "in 5 hours" / "3 days ago". */
export function fmtRelative(ms: number, now: number): string {
  const diff = ms - now;
  const abs = Math.abs(diff);
  const min = 60_000;
  const hour = 60 * min;
  const day = 24 * hour;
  let s: string;
  if (abs < hour) s = `${Math.max(1, Math.round(abs / min))} min`;
  else if (abs < day) {
    const h = Math.round(abs / hour);
    s = `${h} hour${h === 1 ? '' : 's'}`;
  } else {
    const d = Math.round(abs / day);
    s = `${d} day${d === 1 ? '' : 's'}`;
  }
  return diff >= 0 ? `in ${s}` : `${s} ago`;
}

export function fmtCountdown(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}

export function shortAddress(a: string): string {
  return a.length > 10 ? `${a.slice(0, 4)}…${a.slice(-4)}` : a;
}
