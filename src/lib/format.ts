export function fmtNum(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (abs >= 10_000) return (n / 1_000).toFixed(2) + "k";
  return n.toFixed(digits);
}

export function fmtSigned(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return "—";
  return (n >= 0 ? "+" : "") + fmtNum(n, digits);
}

export function fmtInt(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return Math.round(n).toLocaleString();
}

export function fmtPct(n: number, digits = 1): string {
  if (!Number.isFinite(n)) return "—";
  return (n * 100).toFixed(digits) + "%";
}

export function fmtPrice(n: number): string {
  if (!Number.isFinite(n) || n === 0) return "—";
  return n.toFixed(1);
}

export function fmtTimestamp(ts: number): string {
  if (!Number.isFinite(ts)) return "—";
  return ts.toLocaleString();
}

export function shortName(s: string, max = 24): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}
