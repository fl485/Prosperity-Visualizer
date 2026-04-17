export interface RawLogEntry {
  sandboxLog: string;
  lambdaLog: string;
  timestamp: number;
}

export interface RawTrade {
  timestamp: number;
  buyer: string;
  seller: string;
  symbol: string;
  currency: string;
  price: number;
  quantity: number;
}

export interface RawLogFile {
  submissionId: string;
  activitiesLog: string;
  logs: RawLogEntry[];
  tradeHistory: RawTrade[];
}

export interface OrderBookLevel {
  price: number;
  volume: number;
}

export interface ProductTickRow {
  day: number;
  timestamp: number;
  product: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  midPrice: number;
  pnl: number;
}

/**
 * Per-product time series. Indices align across all arrays and match
 * `timestamps`. Missing/empty data uses NaN. Stored as plain arrays
 * (not typed) for ergonomic NaN handling and uPlot compatibility.
 */
export interface ProductSeries {
  product: string;
  timestamps: number[];
  midPrice: number[];
  microPrice: number[];
  spread: number[];
  bestBid: number[];
  bestAsk: number[];
  bidVol: number[];
  askVol: number[];
  imbalance: number[];
  pnl: number[];
  position: number[];
  cumOwnVolume: number[];
  /** per-tick raw book snapshots (for the order book panel) */
  books: { bids: OrderBookLevel[]; asks: OrderBookLevel[] }[];
  /** index into shared trades list per tick (start, count) — empty if none */
  ownFillIndices: { start: number; count: number }[];
}

export interface OwnFill {
  timestamp: number;
  product: string;
  side: "buy" | "sell";
  price: number;
  quantity: number;
  cashFlow: number;
}

export interface SummaryMetrics {
  totalPnl: number;
  perProductPnl: Record<string, number>;
  maxDrawdown: number;
  maxAbsPosition: number;
  tradeCount: number;
  winRate: number;
  sharpe: number;
  finalPositions: Record<string, number>;
}

export interface DecodedLambdaLog {
  ok: boolean;
  pretty?: string;
  state?: unknown;
  orders?: unknown;
  conversions?: unknown;
  traderData?: unknown;
  error?: string;
}

export interface ParsedStrategy {
  /** stable id for this strategy (uuid-ish) */
  id: string;
  /** original submissionId from the log file */
  submissionId: string;
  /** display name (user-editable, defaults to filename) */
  name: string;
  /** color swatch (#rrggbb) */
  color: string;
  /** original filename if known */
  filename?: string;
  /** sorted unique timestamps (shared across products) */
  timestamps: number[];
  /** sorted unique product list */
  products: string[];
  /** product → time series (length aligned with timestamps) */
  series: Record<string, ProductSeries>;
  /** flat cumulative PnL across all products, aligned with timestamps */
  totalPnl: number[];
  /** all sandbox/lambda logs aligned with timestamps */
  rawLogs: RawLogEntry[];
  /** all SUBMISSION fills, in chronological order */
  ownFills: OwnFill[];
  /** all trades (all bots, in chronological order) */
  trades: RawTrade[];
  /** per-tick log-index range (start,count) into rawLogs */
  logIndexByTick: Record<number, { start: number; count: number }>;
  /** position limits by product (overridable in UI) */
  positionLimits: Record<string, number>;
  summary: SummaryMetrics;
  /** ISO date string of when the file was loaded */
  loadedAt: string;
}

export interface ParseProgress {
  phase: "reading" | "parsing-csv" | "computing" | "done";
  pct: number;
  message: string;
}

export interface ParseResult {
  ok: true;
  strategy: ParsedStrategy;
}

export interface ParseError {
  ok: false;
  error: string;
}
