import { DEFAULT_CENTER, distanceMiles } from "./geo";
import { RESTAURANTS, getRestaurantById as getMockRestaurantById } from "./mock-data";
import { computeSafetyScore } from "./scoring";
import { estimateFactorsFromCuisine, refineFactorsWithMenu } from "./cuisine-heuristics";
import { cacheFreshness, cacheGet, cacheSet } from "./cache";
import { config } from "./config";
import { getPlaceDetails, searchNearbyPlaces } from "./places";
import { ingestMenuFromUrl, menuMetaFromIngest } from "./menu-ingest";
import { DataMeta, Restaurant, RestaurantDetail } from "./types";

interface StoredMenu {
  items: RestaurantDetail["safeOptions"];
  requiredModifications: string[];
  riskNotes: string[];
  confidence: number;
  fetchedAt: string;
  menuUrl: string;
}

function getStoredMenu(id: string): StoredMenu | null {
  const cached = cacheGet<StoredMenu>(`stored_menu_${id}`);
  if (!cached) return null;
  return { ...cached.data, fetchedAt: cached.fetchedAt };
}

function setStoredMenu(id: string, data: StoredMenu) {
  cacheSet(`stored_menu_${id}`, data, config.cacheTtlMs * 24);
}

function meta(mode: "free" | "enhanced" | "demo", source: string, fetchedAt: string, confidence = 0.7): DataMeta {
  return {
    mode,
    source,
    fetchedAt,
    freshness: cacheFreshness(fetchedAt, config.cacheTtlMs),
    confidence,
    note: mode === "demo" ? "Demo fallback data (provider unavailable)" : undefined,
  };
}

function scoreRestaurant(cuisine: string, menuItems: number, safeItems: number, confidence: number) {
  const base = estimateFactorsFromCuisine(cuisine);
  const refined = refineFactorsWithMenu(base, menuItems, safeItems);
  return computeSafetyScore(refined, confidence);
}

function demoFallback(center: { lat: number; lng: number }, radiusMiles: number) {
  const fetchedAt = new Date().toISOString();
  const restaurants = RESTAURANTS.map((r) => ({
    ...r,
    distanceMiles: Math.round(distanceMiles(center, r.location) * 100) / 100,
    dataMeta: meta("demo", "seed-mock", fetchedAt, r.safetyScore.confidence),
  }))
    .filter((r) => (r.distanceMiles ?? 0) <= radiusMiles)
    .sort((a, b) => b.safetyScore.finalScore - a.safetyScore.finalScore);

  return { restaurants, dataMeta: meta("demo", "seed-mock", fetchedAt, 0.75) };
}

export async function getNearbyRestaurants(lat?: number, lng?: number, radiusMiles = 10) {
  const center = { lat: lat ?? DEFAULT_CENTER.lat, lng: lng ?? DEFAULT_CENTER.lng };

  try {
    const provider = await searchNearbyPlaces(center.lat, center.lng, radiusMiles);
    const restaurants: Restaurant[] = provider.restaurants.map((r) => {
      const storedMenu = getStoredMenu(r.id);
      const menuCount = storedMenu?.items.length ?? 0;
      const safeCount = storedMenu?.items.filter((i) => i.safe).length ?? 0;
      const conf = storedMenu ? Math.min(0.95, 0.6 + storedMenu.confidence * 0.4) : 0.62;

      return {
        ...r,
        distanceMiles: Math.round(distanceMiles(center, r.location) * 100) / 100,
        safetyScore: scoreRestaurant(r.cuisine, menuCount, safeCount, conf),
        dataMeta: meta(provider.mode, provider.source, provider.fetchedAt, conf),
        website: storedMenu?.menuUrl || r.website,
      };
    }).sort((a, b) => b.safetyScore.finalScore - a.safetyScore.finalScore);

    return {
      restaurants,
      dataMeta: meta(provider.mode, provider.source, provider.fetchedAt, 0.7),
    };
  } catch {
    return demoFallback(center, radiusMiles);
  }
}

export async function getRestaurantDetail(id: string): Promise<RestaurantDetail | null> {
  try {
    const details = await getPlaceDetails(id);
    if (!details.data) return null;

    const d = details.data;
    const storedMenu = getStoredMenu(id);
    const safeOptions = storedMenu?.items.filter((i) => i.safe).slice(0, 12) ?? [];
    const menuItems = storedMenu?.items ?? [];
    const safeCount = menuItems.filter((i) => i.safe).length;
    const conf = storedMenu ? Math.min(0.95, 0.6 + storedMenu.confidence * 0.4) : 0.58;

    return {
      id,
      name: d.name,
      cuisine: d.cuisine,
      address: d.address,
      location: d.location,
      priceLevel: d.priceLevel,
      rating: d.rating,
      phone: d.phone ?? "Not listed",
      hours: d.hours ?? "Call for hours",
      website: d.website ?? "",
      menuUrl: storedMenu?.menuUrl,
      safeOptions,
      requiredModifications: storedMenu?.requiredModifications ?? ["Ask server to review allergens for your avoid list."],
      riskNotes: storedMenu?.riskNotes ?? ["Menu not ingested yet; recommendations based on cuisine heuristics."],
      safetyScore: scoreRestaurant(d.cuisine, menuItems.length, safeCount, conf),
      dataMeta: meta(details.mode, details.source, details.fetchedAt, conf),
      menuDataMeta: storedMenu
        ? { mode: details.mode, source: "menu-url-ingest", fetchedAt: storedMenu.fetchedAt, freshness: cacheFreshness(storedMenu.fetchedAt, config.cacheTtlMs * 24), confidence: storedMenu.confidence }
        : { mode: details.mode, source: "menu-url-ingest", fetchedAt: details.fetchedAt, freshness: "stale", confidence: 0.35, note: "Menu not ingested yet" },
    };
  } catch {
    const demo = getMockRestaurantById(id);
    if (!demo) return null;
    return {
      ...demo,
      dataMeta: meta("demo", "seed-mock", new Date().toISOString(), demo.safetyScore.confidence),
      menuDataMeta: meta("demo", "seed-mock", new Date().toISOString(), demo.safetyScore.confidence),
    };
  }
}

export async function ingestRestaurantMenu(id: string, menuUrl?: string) {
  const detail = await getRestaurantDetail(id);
  if (!detail) return null;
  const targetUrl = menuUrl || detail.website;
  if (!targetUrl) throw new Error("No menu URL available. Provide menuUrl in request body.");

  const ingest = await ingestMenuFromUrl(targetUrl, id);
  setStoredMenu(id, {
    items: ingest.items,
    requiredModifications: ingest.requiredModifications,
    riskNotes: ingest.riskNotes,
    confidence: ingest.confidence,
    fetchedAt: ingest.fetchedAt,
    menuUrl: targetUrl,
  });

  const refreshed = await getRestaurantDetail(id);
  return {
    restaurant: refreshed,
    ingestedCount: ingest.items.length,
    menuDataMeta: menuMetaFromIngest(ingest, config.providerMode === "enhanced" ? "enhanced" : "free"),
  };
}
