# OpenProsperity Visualizer

A local-first, open-source dashboard for the **IMC Prosperity** algorithmic
trading competition. Drop in your backtest `.log` files and get a fast,
information-dense view of what your algorithm actually did — and crucially,
load **N variants at once** to compare them side-by-side.

Your strategy never leaves your laptop. No uploads, no accounts, no telemetry.

> Status: v1. Feedback and PRs welcome.

## Why another visualizer?

jmerle's
[`imc-prosperity-3-visualizer`](https://github.com/jmerle/imc-prosperity-3-visualizer)
set the bar for what a static-SPA Prosperity tool should look like, and much
of OpenProsperity is downstream of that prior art.

We built this because we wanted a different emphasis:

- **Multi-strategy comparison as the default mental model.** Loading 2–10 log
  files at once is a first-class flow, not a bolt-on. Diff mode plots
  `variant − baseline` on the PnL chart. Normalized-x mode lets you compare a
  1k-tick preview against a 10k-tick full day on the same axis.
- **Local-first, proven.** There's a commercial-feeling hosted alternative
  that adds a community leaderboard behind an opaque backend. That's a
  perfectly fine product; it just isn't this one. OpenProsperity is 100%
  static files — open the devtools network tab and confirm nothing leaves
  the browser.
- **Open source all the way down.** MIT licensed, no analytics SDKs, no
  third-party scripts. If you want to run it offline or fork it for a
  private league, clone and go.

## Quick start

```bash
git clone https://github.com/lachy-dauth/prosperity-visualizer
cd prosperity-visualizer
npm install
npm run dev     # http://localhost:5173
```

Then drop any `.log` file from IMC's submission dashboard (or from
`prosperity3bt`) into the left rail.

## Deploy to GitHub Pages

This repo ships with a ready-to-go Pages workflow at
`.github/workflows/deploy.yml`. Asset paths are **relative** (`base: "./"` in
`vite.config.ts`), so the same build works at any repo path
(`/YourFork/`, `/prosperity-visualizer/`, or a custom domain root) without a
rebuild.

To turn it on for a fork:

1. Push to `main` (or run the workflow manually: Actions → _Deploy to GitHub
   Pages_ → _Run workflow_).
2. In the repo: **Settings → Pages → Build and deployment → Source: GitHub
   Actions**.
3. First successful run reports the live URL on the workflow summary page.

If you want a custom base path (e.g. deploying to a subdirectory of another
site), set `VITE_BASE=/your/path/` in the workflow's build step.

## Features

- Drop 1–N log files; each gets a color and appears in all comparison charts.
- Playback controls with variable speed (1×/2×/5×/10×/20×), scrubber,
  keyboard shortcuts (Space / ←→ / Shift+←→).
- KPI cards, PnL performance chart, per-product price & liquidity chart,
  position chart with limit bands, live order book, pressure gauge, own-fills
  table, and sandbox/algorithm/trader-data log tabs — all synchronized.
- Decodes jmerle-style base64 `lambdaLog` dumps automatically; falls back
  gracefully when your algo just uses `print()`.
- Export: PnL chart → PNG, comparison summary → CSV.
- Layout is draggable / resizable (`react-grid-layout`); persisted in
  `localStorage`.
- Optional "Save to browser" toggle persists parsed strategies to IndexedDB
  across reloads. Off by default.

## Data handling (read this)

1. Your file is read client-side with the File API and parsed in a Web Worker.
2. Parsed data lives only in JavaScript memory for the tab. Refresh the tab
   and it's gone, unless you opted in to IndexedDB persistence.
3. No network requests are made with the contents of your log. The only
   outbound requests are for the static HTML / JS / CSS bundle.
4. No analytics, no cookies, no Google-anything.

## Tech

Vite · React 18 · TypeScript · Tailwind · Zustand · uPlot ·
react-grid-layout · IndexedDB (via `idb`) · Web Workers.

## Screenshots

_Add a screenshot here after the first deploy._

## Adding a new Prosperity season

Product names and position limits change every year. See
[CONTRIBUTING.md](./CONTRIBUTING.md#adding-a-new-prosperity-season).

## Credits

- Inspired by
  [jmerle/imc-prosperity-3-visualizer](https://github.com/jmerle/imc-prosperity-3-visualizer).
- IMC Prosperity is © IMC Trading; this project is an independent fan tool.

## License

MIT — see [LICENSE](./LICENSE).
