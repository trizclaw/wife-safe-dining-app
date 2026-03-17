import { cacheFreshness, cacheGet, cacheSet } from "./cache";
import { config } from "./config";
import { LatLng } from "./types";

export interface PlaceRestaurant {
  id: string;
  name: string;
  cuisine: string;
  address: string;
  location: LatLng;
  priceLevel: 1 | 2 | 3 | 4;
  rating: number;
  website?: string;
}

export interface PlaceDetails extends PlaceRestaurant {
  phone?: string;
  hours?: string;
}

type ProviderMode = "free" | "enhanced";

let lastFreeProviderRequestAt = 0;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normPrice(v: unknown): 1 | 2 | 3 | 4 {
  const n = Math.max(1, Math.min(4, Number(v || 2)));
  return n as 1 | 2 | 3 | 4;
}

function parseOsmPrice(tags: Record<string, string | undefined>): 1 | 2 | 3 | 4 {
  const range = (tags["price:range"] ?? tags["price"] ?? "").toLowerCase();
  if (range.includes("$$$$")) return 4;
  if (range.includes("$$$")) return 3;
  if (range.includes("$$")) return 2;
  if (range.includes("$")) return 1;

  const numeric = Number.parseFloat(tags["price"] ?? "");
  if (Number.isFinite(numeric)) {
    if (numeric >= 50) return 4;
    if (numeric >= 30) return 3;
    if (numeric >= 15) return 2;
    return 1;
  }

  return 2;
}

function normalizeCuisine(raw?: string): string {
  if (!raw) return "Restaurant";
  const first = raw.split(/[;,]/)[0]?.trim();
  if (!first) return "Restaurant";
  return first
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildAddress(tags: Record<string, string | undefined>): string {
  const parts = [
    tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:city"],
    tags["addr:state"],
  ].filter(Boolean);
  return parts.join(" ").trim() || tags["addr:full"] || "Address unavailable";
}

function extractWebsite(tags: Record<string, string | undefined>): string | undefined {
  return tags.website || tags["contact:website"];
}

function extractPhone(tags: Record<string, string | undefined>): string | undefined {
  return tags.phone || tags["contact:phone"];
}

async function fetchWithRetry(url: string, init: RequestInit, isFreeProvider: boolean): Promise<Response> {
  const maxRetries = isFreeProvider ? config.freeProviderMaxRetries : 1;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    if (isFreeProvider) {
      const wait = config.freeProviderMinIntervalMs - (Date.now() - lastFreeProviderRequestAt);
      if (wait > 0) await sleep(wait);
      lastFreeProviderRequestAt = Date.now();
    }

    const res = await fetch(url, init);
    if (res.ok) return res;

    const retryable = [429, 500, 502, 503, 504].includes(res.status);
    if (!retryable || attempt === maxRetries) {
      throw new Error(`${isFreeProvider ? "Free provider" : "Google Places"} error ${res.status}`);
    }

    const retryAfter = Number.parseInt(res.headers.get("retry-after") ?? "", 10);
    const waitMs = Number.isFinite(retryAfter)
      ? retryAfter * 1000
      : config.freeProviderBackoffMs * Math.pow(2, attempt);
    await sleep(waitMs);
  }

  throw new Error("Unreachable retry state");
}

interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string | undefined>;
}

function mapOverpassElement(el: OverpassElement): PlaceRestaurant | null {
  const tags = el.tags ?? {};
  const name = tags.name?.trim();
  const lat = el.lat ?? el.center?.lat;
  const lng = el.lon ?? el.center?.lon;
  if (!name || lat === undefined || lng === undefined) return null;

  const cuisine = normalizeCuisine(tags.cuisine);

  return {
    id: `osm-${el.type}-${el.id}`,
    name,
    cuisine,
    address: buildAddress(tags),
    location: { lat, lng },
    priceLevel: parseOsmPrice(tags),
    rating: Number.parseFloat(tags.stars ?? "") || 0,
    website: extractWebsite(tags),
  };
}

async function searchNearbyOsm(lat: number, lng: number, radiusMiles: number) {
  const radiusMeters = Math.min(25000, Math.round(radiusMiles * 1609.34));
  const query = `
[out:json][timeout:25];
(
  node["amenity"="restaurant"](around:${radiusMeters},${lat},${lng});
  way["amenity"="restaurant"](around:${radiusMeters},${lat},${lng});
  relation["amenity"="restaurant"](around:${radiusMeters},${lat},${lng});
);
out center tags;
`;

  const res = await fetchWithRetry(config.overpassUrl, {
    method: "POST",
    headers: {
      "content-type": "text/plain;charset=UTF-8",
      "user-agent": "SafeDine/1.0 (free-mode)",
    },
    body: query.trim(),
  }, true);

  const payload = await res.json();
  const elements: OverpassElement[] = payload.elements ?? [];
  const restaurants = elements
    .map(mapOverpassElement)
    .filter((r): r is PlaceRestaurant => Boolean(r))
    .slice(0, 40);

  return {
    restaurants,
    fetchedAt: new Date().toISOString(),
    freshness: "fresh" as const,
    mode: "free" as const,
    source: "osm-overpass",
  };
}

async function searchNearbyGoogle(lat: number, lng: number, radiusMiles: number) {
  const radiusMeters = Math.min(50000, Math.round(radiusMiles * 1609.34));
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radiusMeters}&type=restaurant&key=${config.googleMapsApiKey}`;
  const res = await fetchWithRetry(url, {}, false);
  const payload = await res.json();

  const list: PlaceRestaurant[] = (payload.results ?? []).slice(0, 20).map((p: any) => ({
    id: p.place_id,
    name: p.name,
    cuisine:
      (p.types ?? [])
        .find((t: string) => !["restaurant", "food", "point_of_interest", "establishment"].includes(t))
        ?.replace(/_/g, " ") ?? "Restaurant",
    address: p.vicinity ?? "",
    location: { lat: p.geometry?.location?.lat ?? lat, lng: p.geometry?.location?.lng ?? lng },
    priceLevel: normPrice(p.price_level),
    rating: Number(p.rating ?? 0),
  }));

  return {
    restaurants: list,
    fetchedAt: new Date().toISOString(),
    freshness: "fresh" as const,
    mode: "enhanced" as const,
    source: "google-places",
  };
}

export async function searchNearbyPlaces(lat: number, lng: number, radiusMiles: number) {
  const providerMode: ProviderMode = config.providerMode;
  const cacheKey = `${providerMode}_places_${lat.toFixed(3)}_${lng.toFixed(3)}_${radiusMiles.toFixed(1)}`;
  const cached = cacheGet<PlaceRestaurant[]>(cacheKey);
  if (cached) {
    return {
      restaurants: cached.data,
      fetchedAt: cached.fetchedAt,
      freshness: cacheFreshness(cached.fetchedAt, config.cacheTtlMs),
      mode: providerMode,
      source: providerMode === "enhanced" ? "google-places" : "osm-overpass",
    };
  }

  const result = providerMode === "enhanced"
    ? await searchNearbyGoogle(lat, lng, radiusMiles)
    : await searchNearbyOsm(lat, lng, radiusMiles);

  cacheSet(cacheKey, result.restaurants, config.cacheTtlMs);
  return result;
}

async function getGooglePlaceDetails(id: string) {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(id)}&fields=place_id,name,formatted_address,formatted_phone_number,website,opening_hours,rating,price_level,geometry,types&key=${config.googleMapsApiKey}`;
  const res = await fetchWithRetry(url, {}, false);
  const payload = await res.json();
  const p = payload.result;

  const data: PlaceDetails | null = p
    ? {
      id: p.place_id,
      name: p.name,
      cuisine:
        (p.types ?? [])
          .find((t: string) => !["restaurant", "food", "point_of_interest", "establishment"].includes(t))
          ?.replace(/_/g, " ") ?? "Restaurant",
      address: p.formatted_address ?? "",
      location: {
        lat: p.geometry?.location?.lat ?? 0,
        lng: p.geometry?.location?.lng ?? 0,
      },
      priceLevel: normPrice(p.price_level),
      rating: Number(p.rating ?? 0),
      website: p.website ?? "",
      phone: p.formatted_phone_number ?? "Not listed",
      hours: p.opening_hours?.weekday_text?.join(" · ") ?? "Call for hours",
    }
    : null;

  return {
    data,
    source: "google-places-details",
    mode: "enhanced" as const,
  };
}

function parseOsmId(id: string): { type: "node" | "way" | "relation"; osmId: number } | null {
  const m = /^osm-(node|way|relation)-(\d+)$/.exec(id);
  if (!m) return null;
  return { type: m[1] as "node" | "way" | "relation", osmId: Number.parseInt(m[2], 10) };
}

async function getOsmPlaceDetails(id: string) {
  const parsed = parseOsmId(id);
  if (!parsed) return { data: null, source: "osm-overpass-details", mode: "free" as const };

  const query = `
[out:json][timeout:25];
${parsed.type}(${parsed.osmId});
out center tags;
`;

  const res = await fetchWithRetry(config.overpassUrl, {
    method: "POST",
    headers: {
      "content-type": "text/plain;charset=UTF-8",
      "user-agent": "SafeDine/1.0 (free-mode)",
    },
    body: query.trim(),
  }, true);

  const payload = await res.json();
  const el: OverpassElement | undefined = payload.elements?.[0];
  if (!el) {
    return { data: null, source: "osm-overpass-details", mode: "free" as const };
  }

  const tags = el.tags ?? {};
  const lat = el.lat ?? el.center?.lat;
  const lng = el.lon ?? el.center?.lon;
  if (lat === undefined || lng === undefined) {
    return { data: null, source: "osm-overpass-details", mode: "free" as const };
  }

  const data: PlaceDetails = {
    id,
    name: tags.name ?? "Restaurant",
    cuisine: normalizeCuisine(tags.cuisine),
    address: buildAddress(tags),
    location: { lat, lng },
    priceLevel: parseOsmPrice(tags),
    rating: Number.parseFloat(tags.stars ?? "") || 0,
    website: extractWebsite(tags),
    phone: extractPhone(tags) ?? "Not listed",
    hours: tags.opening_hours ?? "Call for hours",
  };

  return {
    data,
    source: "osm-overpass-details",
    mode: "free" as const,
  };
}

export async function getPlaceDetails(id: string) {
  const providerMode: ProviderMode = config.providerMode;
  const cacheKey = `${providerMode}_place_detail_${id}`;
  const cached = cacheGet<PlaceDetails | null>(cacheKey);
  if (cached) {
    return {
      data: cached.data,
      fetchedAt: cached.fetchedAt,
      freshness: cacheFreshness(cached.fetchedAt, config.cacheTtlMs),
      mode: providerMode,
      source: providerMode === "enhanced" ? "google-places-details" : "osm-overpass-details",
    };
  }

  const result = providerMode === "enhanced"
    ? await getGooglePlaceDetails(id)
    : await getOsmPlaceDetails(id);

  cacheSet(cacheKey, result.data, config.cacheTtlMs);

  return {
    data: result.data,
    fetchedAt: new Date().toISOString(),
    freshness: "fresh" as const,
    mode: result.mode,
    source: result.source,
  };
}
