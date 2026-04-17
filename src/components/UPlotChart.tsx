import { useEffect, useLayoutEffect, useRef, type MutableRefObject } from "react";
import uPlot, { type AlignedData, type Options } from "uplot";

interface Props {
  data: AlignedData;
  options: Options;
  /**
   * Stable ref container that receives the current uPlot instance.
   * MUST come from useRef — passing an inline object would rebuild
   * the chart on every render of the parent.
   */
  plotRef?: MutableRefObject<uPlot | null>;
}

/**
 * Thin wrapper around uPlot.
 *
 * Invariants (every one of these was learned the hard way):
 * 1. Mount creates a uPlot instance after the container has non-zero
 *    width, so the chart's canvases are created at the right size.
 * 2. `data` updates go through `setData()` (no teardown).
 * 3. `options` updates rebuild the instance (uPlot has no
 *    `setSeries`/`setScales` — in-place patching was too error-prone).
 * 4. The render body is pure. All ref assignments happen inside
 *    effects, so double-invocation in StrictMode can't thrash state.
 * 5. The ResizeObserver callback is debounced inside a RAF frame so a
 *    single layout pass doesn't trigger two setSize calls.
 */
export function UPlotChart({ data, options, plotRef }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerPlotRef = useRef<uPlot | null>(null);
  const dataRef = useRef<AlignedData>(data);
  dataRef.current = data;

  // Build / rebuild the chart when options change.
  // useLayoutEffect (instead of useEffect) so we don't paint an empty
  // stub before uPlot draws.
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Defer if the container hasn't laid out yet — react-grid-layout's
    // WidthProvider can mount a panel with 0 width on the very first
    // render. Creating uPlot at 0 width produces a chart that never
    // redraws correctly until setSize is called.
    const firstW = el.clientWidth;
    const firstH = el.clientHeight;

    let u: uPlot | null = null;
    const build = (w: number, h: number) => {
      u = new uPlot({ ...options, width: w, height: h }, dataRef.current, el);
      innerPlotRef.current = u;
      if (plotRef) plotRef.current = u;
    };

    let pending: number | null = null;
    if (firstW > 0 && firstH > 0) {
      build(firstW, firstH);
    } else {
      // Wait one rAF for the container to lay out
      pending = requestAnimationFrame(() => {
        pending = null;
        const w2 = el.clientWidth || 400;
        const h2 = el.clientHeight || 200;
        build(w2, h2);
      });
    }

    let rafId: number | null = null;
    const ro = new ResizeObserver(() => {
      if (rafId != null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const p = innerPlotRef.current;
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
      if (pending != null) cancelAnimationFrame(pending);
      if (u) u.destroy();
      if (innerPlotRef.current === u) innerPlotRef.current = null;
      if (plotRef && plotRef.current === u) plotRef.current = null;
    };
    // We intentionally exclude `data` and `plotRef` — data updates go
    // through setData below, plotRef is a ref container that's stable
    // across renders by contract.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options]);

  // Push new data without rebuilding.
  useEffect(() => {
    const u = innerPlotRef.current;
    if (!u) return;
    u.setData(data);
  }, [data]);

  return <div ref={containerRef} className="h-full w-full" />;
}

/** Find the x-array index nearest to `x` and move the chart's crosshair. */
export function syncPlotCursorToX(u: uPlot | null, x: number) {
  if (!u) return;
  const xs = u.data[0] as number[] | undefined;
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
}
