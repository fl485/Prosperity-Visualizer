import { useEffect, useImperativeHandle, useRef, forwardRef } from "react";
import uPlot, { type AlignedData, type Options } from "uplot";

export interface UPlotChartHandle {
  /** access the underlying uPlot instance */
  getPlot(): uPlot | null;
  /** programmatically move the crosshair to a given x value */
  syncCursorToX(x: number): void;
}

interface Props {
  data: AlignedData;
  options: Options;
}

/**
 * Light wrapper around uPlot.
 *
 * Stability rules (these matter — react-grid-layout plus our store update
 * torrent can trigger 60+ renders/sec):
 * - The chart instance is built ONCE on mount.
 * - Data updates use `setData` (no teardown).
 * - Options updates try an in-place stroke/label diff and only rebuild
 *   when the series count or labels actually change.
 * - The ResizeObserver callback is debounced inside a RAF frame to avoid
 *   "ResizeObserver loop limit exceeded" feedback with our grid layout.
 */
export const UPlotChart = forwardRef<UPlotChartHandle, Props>(function UPlotChart(
  { data, options },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<uPlot | null>(null);
  const optsRef = useRef<Options>(options);
  const dataRef = useRef<AlignedData>(data);
  optsRef.current = options;
  dataRef.current = data;

  useImperativeHandle(
    ref,
    () => ({
      getPlot: () => plotRef.current,
      syncCursorToX: (x: number) => {
        const u = plotRef.current;
        if (!u) return;
        const xs = u.data[0] as number[];
        if (!xs || xs.length === 0) return;
        let lo = 0;
        let hi = xs.length - 1;
        while (lo < hi) {
          const mid = (lo + hi) >>> 1;
          if (xs[mid] < x) lo = mid + 1;
          else hi = mid;
        }
        const left = u.valToPos(xs[lo], "x");
        if (Number.isFinite(left)) {
          u.setCursor({ left, top: 0 });
        }
      },
    }),
    []
  );

  // Build once, tear down on unmount.
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const opts: Options = {
      ...optsRef.current,
      width: el.clientWidth || 400,
      height: el.clientHeight || 200,
    };
    const u = new uPlot(opts, dataRef.current, el);
    plotRef.current = u;

    let rafId: number | null = null;
    const ro = new ResizeObserver(() => {
      if (rafId != null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const p = plotRef.current;
        if (!p) return;
        const w = el.clientWidth;
        const h = el.clientHeight;
        if (w > 0 && h > 0 && (p.width !== w || p.height !== h)) {
          p.setSize({ width: w, height: h });
        }
      });
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      if (rafId != null) cancelAnimationFrame(rafId);
      u.destroy();
      plotRef.current = null;
    };
  }, []);

  // Push new data without rebuilding.
  useEffect(() => {
    const u = plotRef.current;
    if (!u) return;
    u.setData(data);
  }, [data]);

  // Diff options in place; rebuild only when we can't.
  useEffect(() => {
    const u = plotRef.current;
    const el = containerRef.current;
    if (!u || !el) return;

    const needRebuild =
      u.series.length !== options.series.length ||
      options.series.some((s, i) => s.label !== u.series[i]?.label);

    if (!needRebuild) {
      // Update stroke/width/dash in place — no teardown, no flicker.
      for (let i = 1; i < options.series.length; i++) {
        const target = options.series[i];
        const cur = u.series[i];
        if (!cur) continue;
        if (target.stroke !== undefined && target.stroke !== cur.stroke) {
          cur.stroke = target.stroke;
        }
        if (target.width !== undefined && target.width !== cur.width) {
          cur.width = target.width;
        }
      }
      u.redraw();
      return;
    }

    u.destroy();
    plotRef.current = new uPlot(
      { ...options, width: el.clientWidth, height: el.clientHeight },
      dataRef.current,
      el
    );
  }, [options]);

  return <div ref={containerRef} className="h-full w-full" />;
});
