import { openDB, type IDBPDatabase } from "idb";
import type { ParsedStrategy } from "../types";

const DB_NAME = "openprosperity";
const STORE = "strategies";

let dbPromise: Promise<IDBPDatabase> | null = null;

function db() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(d) {
        if (!d.objectStoreNames.contains(STORE)) {
          d.createObjectStore(STORE, { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

export async function saveStrategy(s: ParsedStrategy): Promise<void> {
  const d = await db();
  await d.put(STORE, s);
}

export async function loadStrategies(): Promise<ParsedStrategy[]> {
  const d = await db();
  return d.getAll(STORE);
}

export async function deleteStrategy(id: string): Promise<void> {
  const d = await db();
  await d.delete(STORE, id);
}

export async function clearAll(): Promise<void> {
  const d = await db();
  await d.clear(STORE);
}
