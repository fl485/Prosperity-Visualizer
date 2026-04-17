import { useEffect, useRef } from "react";
import uPlot, { type AlignedData, type Options } from "uplot";

interface Props {
  data: AlignedData;
  options: Options;
  /** if you want to do something with the canvas (e.g. PNG export) */
  onChartReady?: (u: uPlot) => void;
}

/**
 * Light wrapper around uPlot that handles container resizing and option/data
 * updates without recreating the chart instance.
 */
export function UPlotChart({ data, options, onChartReady }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<uPlot | null>(null);
  const optsRef = useRef<Options>(options);

  // Initial mount + observe size
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const opts: Options = {
      ...optsRef.current,
      width: el.clientWidth || 400,
      height: el.clientHeight || 200,
    };
    const u = new uPlot(opts, data, el);
    plotRef.current = u;
    onChartReady?.(u);

    const ro = new ResizeObserver(() => {
      if (!plotRef.current) return;
      plotRef.current.setSize({
        width: el.clientWidth,
        height: el.clientHeight,
      });
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      u.destroy();
      plotRef.current = null;
    };
    // intentionally only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update data without rebuilding
  useEffect(() => {
    if (!plotRef.current) return;
    plotRef.current.setData(data);
  }, [data]);

  // Recreate chart on options-shape changes (series count etc.)
  useEffect(() => {
    optsRef.current = options;
    if (!plotRef.current || !containerRef.current) return;
    const el = containerRef.current;
    const u = plotRef.current;
    // Cheap path: same number of series → setSize triggers re-style
    if (u.series.length === options.series.length) {
      // Update axis labels & series colors in-place if we can.
      for (let i = 0; i < options.series.length; i++) {
        const target = options.series[i];
        const cur = u.series[i];
        if (target.label && cur.label !== target.label) {
          // uPlot has no setLabel API; rebuild needed for labels.
          u.destroy();
          plotRef.current = new uPlot(
            { ...options, width: el.clientWidth, height: el.clientHeight },
            data,
            el
          );
          onChartReady?.(plotRef.current);
          return;
        }
      }
      u.redraw();
      return;
    }
    // Rebuild
    u.destroy();
    plotRef.current = new uPlot(
      { ...options, width: el.clientWidth, height: el.clientHeight },
      data,
      el
    );
    onChartReady?.(plotRef.current);
  }, [options, data, onChartReady]);

  return <div ref={containerRef} className="h-full w-full" />;
}
