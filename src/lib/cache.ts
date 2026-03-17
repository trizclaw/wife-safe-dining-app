/**
 * File-based JSON cache for server-side data.
 * Structured to mirror SQL tables — easy to migrate to Postgres later.
 */
import fs from "fs";
import path from "path";

const CACHE_DIR = path.join(process.cwd(), ".cache");

interface CacheEntry<T> {
  data: T;
  fetchedAt: string;
  ttlMs: number;
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function keyToPath(key: string): string {
  const safe = key.replace(/[^a-zA-Z0-9_.-]/g, "_");
  return path.join(CACHE_DIR, `${safe}.json`);
}

export function cacheGet<T>(key: string): { data: T; fetchedAt: string } | null {
  const file = keyToPath(key);
  if (!fs.existsSync(file)) return null;
  try {
    const entry: CacheEntry<T> = JSON.parse(fs.readFileSync(file, "utf-8"));
    const age = Date.now() - new Date(entry.fetchedAt).getTime();
    if (age > entry.ttlMs) {
      fs.unlinkSync(file);
      return null;
    }
    return { data: entry.data, fetchedAt: entry.fetchedAt };
  } catch {
    return null;
  }
}

export function cacheSet<T>(key: string, data: T, ttlMs: number): void {
  ensureDir(CACHE_DIR);
  const entry: CacheEntry<T> = {
    data,
    fetchedAt: new Date().toISOString(),
    ttlMs,
  };
  fs.writeFileSync(keyToPath(key), JSON.stringify(entry, null, 2));
}

export function cacheFreshness(
  fetchedAt: string,
  ttlMs: number
): "fresh" | "cached" | "stale" {
  const age = Date.now() - new Date(fetchedAt).getTime();
  if (age < ttlMs * 0.25) return "fresh";
  if (age < ttlMs) return "cached";
  return "stale";
}
