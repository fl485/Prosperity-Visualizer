// Distinguishable palette designed to read on both light and dark backgrounds.
// 12 colors; cycle if the user loads more than 12 strategies.
export const STRATEGY_PALETTE = [
  "#2dd4bf", // teal
  "#fbbf24", // amber
  "#f472b6", // pink
  "#a78bfa", // violet
  "#60a5fa", // blue
  "#34d399", // emerald
  "#fb923c", // orange
  "#f87171", // red
  "#4ade80", // green
  "#c084fc", // purple
  "#facc15", // yellow
  "#22d3ee", // cyan
];

export function pickColor(usedColors: string[]): string {
  for (const c of STRATEGY_PALETTE) {
    if (!usedColors.includes(c)) return c;
  }
  return STRATEGY_PALETTE[usedColors.length % STRATEGY_PALETTE.length];
}
