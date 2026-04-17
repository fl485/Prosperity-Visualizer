import type { ParsedStrategy } from "../types";

let workerRef: Worker | null = null;
let nextReqId = 1;

function getWorker(): Worker {
  if (!workerRef) {
    workerRef = new Worker(new URL("./parseWorker.ts", import.meta.url), {
      type: "module",
    });
  }
  return workerRef;
}

export interface ParseHandlers {
  onProgress?: (pct: number, message: string) => void;
}

export function parseLogText(
  text: string,
  meta: { id: string; name: string; color: string; filename?: string },
  handlers: ParseHandlers = {}
): Promise<ParsedStrategy> {
  return new Promise((resolve, reject) => {
    const w = getWorker();
    const reqId = nextReqId++;
    const onMsg = (ev: MessageEvent) => {
      const m = ev.data;
      if (m.reqId !== reqId) return;
      if (m.type === "progress") handlers.onProgress?.(m.pct, m.message);
      else if (m.type === "done") {
        w.removeEventListener("message", onMsg);
        resolve(m.strategy as ParsedStrategy);
      } else if (m.type === "error") {
        w.removeEventListener("message", onMsg);
        reject(new Error(m.error));
      }
    };
    w.addEventListener("message", onMsg);
    w.postMessage({ type: "parse", reqId, text, meta });
  });
}
