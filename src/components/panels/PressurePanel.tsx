import { useStore, getReferenceStrategy } from "../../lib/store";

export function PressurePanel() {
  const ref = useStore(getReferenceStrategy);
  const tickIdx = useStore((s) => s.tickIdx);
  const selectedProduct = useStore((s) => s.selectedProduct);
  const product = selectedProduct ?? ref?.products[0] ?? null;

  if (!ref || !product) {
    return <div className="p-3 text-xs text-zinc-500">—</div>;
  }
  const ps = ref.series[product];
  const imb = ps.imbalance[tickIdx];
  const bidV = ps.bidVol[tickIdx];
  const askV = ps.askVol[tickIdx];
  const pct = Number.isFinite(imb) ? imb * 100 : 50;

  return (
    <div className="flex h-full flex-col">
      <div className="panel-header">
        <span>Market Pressure · {product}</span>
        <span className="num normal-case tracking-normal text-zinc-400">
          {Number.isFinite(imb) ? `${pct.toFixed(0)}% bids` : "—"}
        </span>
      </div>
      <div className="flex flex-1 flex-col justify-center gap-2 p-3">
        <div className="flex justify-between text-[10px] text-zinc-500">
          <span>Bids heavy ←</span>
          <span>→ Asks heavy</span>
        </div>
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className="absolute inset-y-0 left-0 bg-emerald-500/70 transition-all duration-150"
            style={{ width: `${pct}%` }}
          />
          <div
            className="absolute inset-y-0 left-1/2 w-px bg-zinc-500/70"
            style={{ transform: "translateX(-0.5px)" }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-zinc-300">
          <span className="num">
            <span className="text-emerald-400">●</span> {Number.isFinite(bidV) ? bidV : "—"}
          </span>
          <span className="num">
            {Number.isFinite(askV) ? askV : "—"} <span className="text-rose-400">●</span>
          </span>
        </div>
      </div>
    </div>
  );
}
