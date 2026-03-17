import { cacheFreshness, cacheGet, cacheSet } from "./cache";
import { config } from "./config";
import { AVOID_LIST } from "./avoid-list";
import { DataMeta, MenuItem } from "./types";

export interface IngestedMenu {
  items: MenuItem[];
  confidence: number;
  requiredModifications: string[];
  riskNotes: string[];
  fetchedAt: string;
  freshness: "fresh" | "cached" | "stale";
}

const FOOD_LINE = /(\$\d|burger|salad|taco|pizza|chicken|beef|pasta|soup|sandwich|shrimp|fish|roll|bowl|steak|noodle|curry|rice|fries|dessert)/i;

function stripHtml(input: string): string {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractMenuItems(raw: string): MenuItem[] {
  const lines = raw
    .split(/\.|\n|\||\u2022/g)
    .map((s) => s.trim())
    .filter((s) => s.length > 8 && s.length < 120 && FOOD_LINE.test(s));

  const seen = new Set<string>();
  const items: MenuItem[] = [];

  for (const line of lines) {
    const name = line.split(" - ")[0].slice(0, 60).trim();
    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());

    const lower = line.toLowerCase();
    const risky = /(shrimp|crab|lobster|clam|oyster|mussel|peanut|cashew|almond|walnut|sesame|tahini|poke|sashimi|raw|msg)/i.test(lower);
    items.push({
      name,
      description: line,
      safe: !risky,
      modifications: risky ? ["Confirm allergen-safe prep and substitutions"] : undefined,
    });

    if (items.length >= 40) break;
  }

  return items;
}

function deriveSignals(items: MenuItem[]) {
  const risky = items.filter((i) => !i.safe);
  const riskyText = risky.map((i) => i.description.toLowerCase()).join(" ");
  const requiredModifications: string[] = [];
  const riskNotes: string[] = [];

  for (const avoid of AVOID_LIST) {
    const term = avoid.name.toLowerCase().replace(/\s+/g, " ");
    if (riskyText.includes(term.split(" ")[0])) {
      requiredModifications.push(`Avoid ${avoid.name} items; ask kitchen for substitutions.`);
      riskNotes.push(`${avoid.name} appears in menu language; cross-contact risk may be elevated.`);
    }
  }

  if (!requiredModifications.length) {
    requiredModifications.push("Always confirm fryer oil, sauces, and garnish ingredients with staff.");
  }

  return { requiredModifications, riskNotes: [...new Set(riskNotes)] };
}

export async function ingestMenuFromUrl(menuUrl: string, cacheKey: string): Promise<IngestedMenu> {
  const key = `menu_ingest_${cacheKey}`;
  const cached = cacheGet<Omit<IngestedMenu, "freshness">>(key);
  if (cached) {
    return {
      ...cached.data,
      freshness: cacheFreshness(cached.fetchedAt, config.cacheTtlMs),
      fetchedAt: cached.fetchedAt,
    };
  }

  const res = await fetch(menuUrl, {
    headers: { "User-Agent": "wife-safe-dining-app/1.0 (+menu-ingest)" },
  });
  if (!res.ok) throw new Error(`Unable to ingest menu: ${res.status}`);

  const html = await res.text();
  const plain = stripHtml(html);
  const items = extractMenuItems(plain);
  const { requiredModifications, riskNotes } = deriveSignals(items);

  const confidence = Math.max(0.35, Math.min(0.9, items.length / 30));

  const payload = {
    items,
    confidence,
    requiredModifications,
    riskNotes,
  };

  cacheSet(key, payload, config.cacheTtlMs);

  return {
    ...payload,
    fetchedAt: new Date().toISOString(),
    freshness: "fresh",
  };
}

export function menuMetaFromIngest(ingest: IngestedMenu, mode: "free" | "enhanced" | "demo"): DataMeta {
  return {
    mode,
    source: "menu-url-ingest",
    fetchedAt: ingest.fetchedAt,
    freshness: ingest.freshness,
    confidence: ingest.confidence,
  };
}
