import { useStore, getReferenceStrategy } from "../../lib/store";
import { fmtInt, fmtPrice, fmtSigned } from "../../lib/format";

export function KpiPanel() {
  const ref = useStore(getReferenceStrategy);
  const tickIdx = useStore((s) => s.tickIdx);
  const selectedProduct = useStore((s) => s.selectedProduct);

  if (!ref) {
    return <Empty />;
  }
  const totalAtTick = ref.totalPnl[tickIdx] ?? 0;
  const finalTotal = ref.summary.totalPnl;

  // Per-product PnL at current tick
  const productPnl: { p: string; v: number }[] = [];
  for (const p of ref.products) {
    if (selectedProduct && selectedProduct !== p) continue;
    const arr = ref.series[p].pnl;
    let v = 0;
    for (let i = tickIdx; i >= 0; i--) {
      if (Number.isFinite(arr[i])) {
        v = arr[i];
        break;
      }
    }
    productPnl.push({ p, v });
  }

  // Current position (sum across products if all)
  let curPos = 0;
  if (selectedProduct) {
    curPos = ref.series[selectedProduct]?.position[tickIdx] ?? 0;
  } else {
    for (const p of ref.products) curPos += ref.series[p].position[tickIdx] ?? 0;
  }

  // Microprice (selected or first product)
  const showProd = selectedProduct ?? ref.products[0];
  const micro = ref.series[showProd]?.microPrice[tickIdx] ?? NaN;

  return (
    <div className="grid h-full grid-cols-2 gap-3 p-3 sm:grid-cols-3 xl:grid-cols-6">
      <Kpi label="Total PnL · live">
        <span className={totalAtTick >= 0 ? "text-emerald-400" : "text-rose-400"}>
          {fmtSigned(totalAtTick)}
        </span>
      </Kpi>
      <Kpi label="Total PnL · final">
        <span className={finalTotal >= 0 ? "text-emerald-400" : "text-rose-400"}>
          {fmtSigned(finalTotal)}
        </span>
      </Kpi>
      <Kpi label="Max Drawdown">
        <span className="text-rose-400">−{fmtInt(ref.summary.maxDrawdown)}</span>
      </Kpi>
      <Kpi label={`Position · ${selectedProduct ?? "net"}`}>
        <span className={curPos === 0 ? "" : curPos > 0 ? "text-emerald-400" : "text-rose-400"}>
          {fmtSigned(curPos, 0)}
        </span>
      </Kpi>
      <Kpi label={`Microprice · ${showProd ?? "—"}`}>{fmtPrice(micro)}</Kpi>
      <Kpi label="Trades">
        <span className="num">{fmtInt(ref.summary.tradeCount)}</span>
      </Kpi>
      {productPnl.length > 1 &&
        productPnl.slice(0, 6).map(({ p, v }) => (
          <Kpi key={p} label={`PnL · ${p}`}>
            <span className={v >= 0 ? "text-emerald-400" : "text-rose-400"}>
              {fmtSigned(v)}
            </span>
          </Kpi>
        ))}
    </div>
  );
}

function Kpi({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="kpi">
      <div className="kpi-label truncate" title={label}>
        {label}
      </div>
      <div className="kpi-value truncate">{children}</div>
    </div>
  );
}

function Empty() {
  return (
    <div className="flex h-full items-center justify-center text-xs text-zinc-500">
      Load a log to see KPIs.
    </div>
  );
}
