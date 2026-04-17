export function uid(prefix = "s"): string {
  // Compact, sortable-ish id: time + 4 random bytes. crypto.randomUUID would
  // also work but that's 36 chars and not all browsers expose it.
  const t = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${t}_${r}`;
}
