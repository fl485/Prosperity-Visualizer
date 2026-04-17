import { useMemo } from "react";
import { useStore, getReferenceStrategy } from "../../lib/store";
import { fmtPrice } from "../../lib/format";

export function OrderBookPanel() {
  const ref = useStore(getReferenceStrategy);
  const tickIdx = useStore((s) => s.tickIdx);
  const selectedProduct = useStore((s) => s.selectedProduct);
  const product = selectedProduct ?? ref?.products[0] ?? null;

  const view = useMemo(() => {
    if (!ref || !product) return null;
    const ps = ref.series[product];
    const book = ps.books[tickIdx] ?? { bids: [], asks: [] };
    const bestBid = book.bids[0]?.price ?? NaN;
    const bestAsk = book.asks[0]?.price ?? NaN;
    const mid = ps.midPrice[tickIdx];
    const spread =
      Number.isFinite(bestBid) && Number.isFinite(bestAsk) ? bestAsk - bestBid : NaN;
    let maxVol = 0;
    for (const b of book.bids) maxVol = Math.max(maxVol, b.volume);
    for (const a of book.asks) maxVol = Math.max(maxVol, a.volume);
    return { book, bestBid, bestAsk, mid, spread, maxVol };
  }, [ref, product, tickIdx]);

  if (!ref || !product || !view) {
    return <div className="p-3 text-xs text-zinc-500">No order book at this tick.</div>;
  }
  const { book, mid, spread, maxVol } = view;

  return (
    <div className="flex h-full flex-col">
      <div className="panel-header">
        <span>Order Book · {product}</span>
        <span className="num normal-case tracking-normal text-zinc-400">
          mid {fmtPrice(mid)} · spread {Number.isFinite(spread) ? spread.toFixed(1) : "—"}
        </span>
      </div>
      <div className="flex-1 overflow-auto p-2">
        <div className="space-y-0.5">
          {[...book.asks].reverse().map((lvl, i) => (
            <Row
              key={`a${i}`}
              side="ask"
              level={book.asks.length - i}
              price={lvl.price}
              volume={lvl.volume}
              maxVol={maxVol}
            />
          ))}
          <div className="my-1 flex items-center gap-2 border-y border-dashed border-zinc-700 px-2 py-1 text-[10px] text-zinc-400">
            <span className="num">{fmtPrice(mid)}</span>
            <span>mid</span>
            <span className="ml-auto num">spread {Number.isFinite(spread) ? spread.toFixed(1) : "—"}</span>
          </div>
          {book.bids.map((lvl, i) => (
            <Row
              key={`b${i}`}
              side="bid"
              level={i + 1}
              price={lvl.price}
              volume={lvl.volume}
              maxVol={maxVol}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Row({
  side,
  level,
  price,
  volume,
  maxVol,
}: {
  side: "ask" | "bid";
  level: number;
  price: number;
  volume: number;
  maxVol: number;
}) {
  const pct = maxVol > 0 ? (volume / maxVol) * 100 : 0;
  const bg = side === "ask" ? "bg-rose-500/15" : "bg-emerald-500/15";
  const txt = side === "ask" ? "text-rose-300" : "text-emerald-300";
  return (
    <div className="relative flex items-center gap-2 rounded px-2 py-0.5 text-[11px]">
      <div
        className={`absolute inset-y-0 ${
          side === "ask" ? "right-0" : "left-0"
        } ${bg} rounded`}
        style={{ width: `${pct}%` }}
      />
      <span className="num relative z-10 w-4 text-zinc-500">L{level}</span>
      <span className={`num relative z-10 flex-1 ${txt}`}>{price.toFixed(1)}</span>
      <span className="num relative z-10 w-10 text-right text-zinc-300">{volume}</span>
    </div>
  );
}
