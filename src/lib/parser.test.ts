import { describe, expect, it } from "vitest";
import { buildStrategy, decodeLambdaLog, parseActivitiesCsv } from "./parser";
import type { RawLogFile } from "../types";

const CSV = `day;timestamp;product;bid_price_1;bid_volume_1;bid_price_2;bid_volume_2;bid_price_3;bid_volume_3;ask_price_1;ask_volume_1;ask_price_2;ask_volume_2;ask_price_3;ask_volume_3;mid_price;profit_and_loss
0;0;AAA;100;10;;;;;101;10;;;;;100.5;0.0
0;0;BBB;200;5;199;3;;;202;5;;;;;201.0;0.0
0;100;AAA;101;12;;;;;102;12;;;;;101.5;10.0
0;100;BBB;;;;;;;202;5;;;;;202.0;-5.0
`;

const RAW: RawLogFile = {
  submissionId: "test",
  activitiesLog: CSV,
  logs: [
    { sandboxLog: "", lambdaLog: "", timestamp: 0 },
    { sandboxLog: "", lambdaLog: "", timestamp: 100 },
  ],
  tradeHistory: [
    {
      timestamp: 0,
      buyer: "SUBMISSION",
      seller: "",
      symbol: "AAA",
      currency: "X",
      price: 100,
      quantity: 5,
    },
    {
      timestamp: 100,
      buyer: "",
      seller: "SUBMISSION",
      symbol: "AAA",
      currency: "X",
      price: 102,
      quantity: 2,
    },
    {
      timestamp: 100,
      buyer: "",
      seller: "",
      symbol: "BBB",
      currency: "X",
      price: 200,
      quantity: 1,
    },
  ],
};

describe("parseActivitiesCsv", () => {
  it("parses a simple 2-tick, 2-product CSV", () => {
    const rows = parseActivitiesCsv(CSV);
    expect(rows).toHaveLength(4);
    const aaa0 = rows.find((r) => r.timestamp === 0 && r.product === "AAA")!;
    expect(aaa0.bids[0]).toEqual({ price: 100, volume: 10 });
    expect(aaa0.asks[0]).toEqual({ price: 101, volume: 10 });
    expect(aaa0.midPrice).toBe(100.5);
  });

  it("handles missing depth levels", () => {
    const rows = parseActivitiesCsv(CSV);
    const bbb100 = rows.find((r) => r.timestamp === 100 && r.product === "BBB")!;
    expect(bbb100.bids).toHaveLength(0);
    expect(bbb100.asks).toHaveLength(1);
  });
});

describe("buildStrategy", () => {
  it("computes position trace from SUBMISSION fills", () => {
    const rows = parseActivitiesCsv(CSV);
    const s = buildStrategy(RAW, rows, {
      id: "a",
      name: "test",
      color: "#f00",
    });
    expect(s.products).toEqual(["AAA", "BBB"]);
    expect(s.timestamps).toEqual([0, 100]);
    // After tick 0, we bought 5 AAA
    expect(s.series.AAA.position[0]).toBe(5);
    // After tick 100, we sold 2 AAA, net +3
    expect(s.series.AAA.position[1]).toBe(3);
    // BBB never traded (the pure market trade doesn't affect us)
    expect(s.series.BBB.position[0]).toBe(0);
    expect(s.series.BBB.position[1]).toBe(0);
  });

  it("produces own-fill cashflow with correct sign", () => {
    const rows = parseActivitiesCsv(CSV);
    const s = buildStrategy(RAW, rows, {
      id: "a",
      name: "test",
      color: "#f00",
    });
    expect(s.ownFills).toHaveLength(2);
    // buy cash-out: negative
    expect(s.ownFills[0].cashFlow).toBe(-500);
    // sell cash-in: positive
    expect(s.ownFills[1].cashFlow).toBe(204);
  });

  it("computes totalPnl as running sum of per-product cumulative PnL", () => {
    const rows = parseActivitiesCsv(CSV);
    const s = buildStrategy(RAW, rows, {
      id: "a",
      name: "test",
      color: "#f00",
    });
    // AAA pnl at t=100 is 10; BBB pnl at t=100 is -5 → total 5
    expect(s.totalPnl[1]).toBeCloseTo(5);
  });

  it("computes summary max drawdown", () => {
    const rows = parseActivitiesCsv(CSV);
    const s = buildStrategy(RAW, rows, {
      id: "a",
      name: "test",
      color: "#f00",
    });
    // total pnl goes 0 -> 5, no drawdown
    expect(s.summary.maxDrawdown).toBe(0);
  });
});

describe("decodeLambdaLog", () => {
  it("returns not-ok for empty input", () => {
    expect(decodeLambdaLog("")).toEqual({ ok: false, error: "empty" });
  });
  it("decodes a base64 JSON blob", () => {
    const payload = [{ t: 100 }, [], 0, "td", ""];
    const encoded = btoa(JSON.stringify(payload));
    const d = decodeLambdaLog(`some preamble\n${encoded}`);
    expect(d.ok).toBe(true);
    if (d.ok) expect(d.traderData).toBe("td");
  });
});
