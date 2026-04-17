import { useMemo, useRef, useState } from "react";
import type uPlot from "uplot";
import type { AlignedData, Options } from "uplot";
import { useStore } from "../../lib/store";
import { lttb } from "../../lib/downsample";
import { downloadCanvasPng } from "../../lib/exporters";
import { UPlotChart } from "../UPlotChart";
import { DownloadIcon } from "../Icons";

const TARGET_POINTS = 1500;

export function PnlChartPanel() {
  const strategies = useStore((s) => s.strategies);
  const referenceId = useStore((s) => s.referenceId);
  const comparingIds = useStore((s) => s.comparingIds);
  const tickIdx = useStore((s) => s.tickIdx);
  const prefs = useStore((s) => s.prefs);
  const setPrefs = useStore((s) => s.setPrefs);

  const refStrat = strategies.find((s) => s.id === referenceId) ?? null;
  const compareList = strategies.filter(
    (s) => comparingIds.has(s.id) && (refStrat ? s.id !== refStrat.id : true)
  );

  const plotRef = useRef<uPlot | null>(null);
  const [hoverInfo, setHoverInfo] = useState<{
    ts: number;
    rows: { name: string; color: string; v: number }[];
  } | null>(null);

  const { data, options } = useMemo(() => {
    if (!refStrat) {
      const opts: Options = {
        title: "",
        width: 400,
        height: 200,
        legend: { show: false },
        scales: { x: { time: false } },
        series: [{}, { label: "PnL" }],
        axes: defaultAxes(),
      };
      return { data: [[], []] as AlignedData, options: opts };
    }

    // Build per-strategy x/y. If normalized x: map to 0..1. If diff mode:
    // subtract reference at each tick. Strategies with different tick counts
    // are compared by tick INDEX in normalized mode and by raw timestamp
    // otherwise (slower strats just stop early).
    const seriesArr: { name: string; color: string; xs: number[]; ys: number[] }[] = [];
    const refStratLocal = refStrat;
    const refXsRaw = refStratLocal.timestamps;
    const refYsRaw = refStratLocal.totalPnl;

    function project(strat: typeof refStratLocal): { xs: number[]; ys: number[] } {
      const xsBase = prefs.normalizedX
        ? strat.timestamps.map((_, i) =>
            strat.timestamps.length > 1 ? i / (strat.timestamps.length - 1) : 0
          )
        : strat.timestamps;
      let ys = strat.totalPnl;
      if (prefs.diffMode && strat.id !== refStratLocal.id) {
        // align to reference by tick index in normalized; by nearest-not-greater ts otherwise
        const out = new Array<number>(xsBase.length);
        if (prefs.normalizedX) {
          // sample reference at each normalized x
          for (let i = 0; i < xsBase.length; i++) {
            const t = xsBase[i];
            const refIdx = Math.min(
              refXsRaw.length - 1,
              Math.round(t * (refXsRaw.length - 1))
            );
            out[i] = ys[i] - refYsRaw[refIdx];
          }
        } else {
          // walk sorted ts arrays
          let j = 0;
          for (let i = 0; i < xsBase.length; i++) {
            while (j + 1 < refXsRaw.length && refXsRaw[j + 1] <= xsBase[i]) j++;
            out[i] = ys[i] - refYsRaw[j];
          }
        }
        ys = out;
      }
      return prefs.showSampled ? lttb(xsBase, ys, TARGET_POINTS) : { xs: xsBase, ys };
    }

    seriesArr.push({
      name: refStratLocal.name + " (ref)",
      color: refStratLocal.color,
      ...project(refStratLocal),
    });
    for (const s of compareList) {
      seriesArr.push({ name: s.name, color: s.color, ...project(s) });
    }

    // Build common x grid by union of all xs (uPlot needs aligned data).
    // Easier: use the longest xs as base and remap each y to nearest x.
    const baseXs = seriesArr.reduce((best, s) =>
      s.xs.length > best.length ? s.xs : best, seriesArr[0]?.xs ?? []
    );
    const ysMatrix: (number | null)[][] = seriesArr.map((s) => {
      const out = new Array<number | null>(baseXs.length).fill(null);
      let j = 0;
      for (let i = 0; i < baseXs.length; i++) {
        while (j + 1 < s.xs.length && s.xs[j + 1] <= baseXs[i]) j++;
        if (s.xs[j] === baseXs[i] || j < s.xs.length) {
          out[i] = s.ys[j];
        }
      }
      return out;
    });

    const data: AlignedData = [baseXs, ...ysMatrix] as AlignedData;
    const series: Options["series"] = [
      { label: prefs.normalizedX ? "Progress" : "Timestamp" },
      ...seriesArr.map((s, i) => ({
        label: s.name,
        stroke: s.color,
        width: i === 0 ? 2.2 : 1.2,
        alpha: i === 0 ? 1 : 0.85,
        points: { show: false },
      })),
    ];

    const opts: Options = {
      title: "",
      width: 400,
      height: 200,
      legend: { show: true, live: true },
      cursor: {
        focus: { prox: 16 },
        sync: { key: "prosperity" },
      },
      scales: {
        x: { time: false },
        y: { auto: true },
      },
      series,
      axes: defaultAxes(prefs.normalizedX ? "%" : ""),
      hooks: {
        setCursor: [
          (u) => {
            const idx = u.cursor.idx;
            if (idx == null || idx < 0) {
              setHoverInfo(null);
              return;
            }
            setHoverInfo({
              ts: baseXs[idx] ?? 0,
              rows: seriesArr.map((s, i) => ({
                name: s.name,
                color: s.color,
                v: ysMatrix[i][idx] ?? NaN,
              })),
            });
          },
        ],
      },
    };
    return { data, options: opts };
  }, [
    refStrat,
    compareList,
    prefs.diffMode,
    prefs.normalizedX,
    prefs.showSampled,
  ]);

  // Crosshair update on tick scrub (only when not normalized so x maps cleanly)
  useMemo(() => {
    if (!plotRef.current || !refStrat) return;
    const u = plotRef.current;
    const xs = u.data[0] as number[];
    if (!xs || xs.length === 0) return;
    let target: number;
    if (prefs.normalizedX) {
      target = refStrat.timestamps.length > 1 ? tickIdx / (refStrat.timestamps.length - 1) : 0;
    } else {
      target = refStrat.timestamps[tickIdx] ?? 0;
    }
    // find nearest x and emit a fake cursor event by setting cursor
    let lo = 0;
    let hi = xs.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (xs[mid] < target) lo = mid + 1;
      else hi = mid;
    }
    u.setCursor({ left: u.valToPos(xs[lo], "x"), top: 0 });
  }, [tickIdx, refStrat, prefs.normalizedX]);

  return (
    <div className="flex h-full flex-col">
      <div className="panel-header">
        <span>PnL Performance</span>
        <div className="flex items-center gap-2">
          <label className="inline-flex cursor-pointer items-center gap-1 normal-case tracking-normal text-zinc-400">
            <input
              type="checkbox"
              checked={prefs.normalizedX}
              onChange={(e) => setPrefs({ normalizedX: e.target.checked })}
              className="h-3 w-3 accent-accent-500"
            />
            normalize x
          </label>
          <label className="inline-flex cursor-pointer items-center gap-1 normal-case tracking-normal text-zinc-400">
            <input
              type="checkbox"
              checked={prefs.diffMode}
              onChange={(e) => setPrefs({ diffMode: e.target.checked })}
              className="h-3 w-3 accent-accent-500"
            />
            diff vs ref
          </label>
          <label className="inline-flex cursor-pointer items-center gap-1 normal-case tracking-normal text-zinc-400">
            <input
              type="checkbox"
              checked={prefs.showSampled}
              onChange={(e) => setPrefs({ showSampled: e.target.checked })}
              className="h-3 w-3 accent-accent-500"
            />
            sampled
          </label>
          <button
            className="btn !px-1.5 !py-0.5"
            title="Export PNG"
            onClick={() => {
              const u = plotRef.current;
              if (!u) return;
              const c = (u.root as HTMLElement).querySelector("canvas");
              if (c instanceof HTMLCanvasElement) {
                downloadCanvasPng(c, "pnl-performance.png");
              }
            }}
          >
            <DownloadIcon />
          </button>
        </div>
      </div>
      <div className="relative flex-1">
        <UPlotChart data={data} options={options} onChartReady={(u) => (plotRef.current = u)} />
        {hoverInfo && (
          <div className="pointer-events-none absolute right-2 top-2 max-w-[260px] rounded-md border border-zinc-800 bg-zinc-950/90 p-2 text-[10px] backdrop-blur">
            <div className="num mb-1 text-zinc-400">
              {prefs.normalizedX
                ? `${(hoverInfo.ts * 100).toFixed(1)}%`
                : `TS ${hoverInfo.ts.toLocaleString()}`}
            </div>
            {hoverInfo.rows.map((r, i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-1 truncate text-zinc-300">
                  <span
                    className="inline-block h-2 w-2 rounded-sm"
                    style={{ backgroundColor: r.color }}
                  />
                  <span className="truncate">{r.name}</span>
                </span>
                <span
                  className={`num shrink-0 ${
                    Number.isFinite(r.v) ? (r.v >= 0 ? "text-emerald-400" : "text-rose-400") : ""
                  }`}
                >
                  {Number.isFinite(r.v) ? r.v.toFixed(1) : "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function defaultAxes(xSuffix = ""): Options["axes"] {
  return [
    {
      stroke: "#71717a",
      grid: { stroke: "#27272a", width: 0.5 },
      ticks: { stroke: "#27272a" },
      values: (_u, splits) =>
        splits.map((v) =>
          xSuffix === "%" ? (v * 100).toFixed(0) + "%" : Math.round(v).toLocaleString()
        ),
    },
    {
      stroke: "#71717a",
      grid: { stroke: "#27272a", width: 0.5 },
      ticks: { stroke: "#27272a" },
    },
  ];
}
