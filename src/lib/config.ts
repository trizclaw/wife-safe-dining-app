/** Centralized environment-based configuration. */

function intFromEnv(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const config = {
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY ?? "",

  get isLiveMode(): boolean {
    return this.googleMapsApiKey.length > 0;
  },

  get providerMode(): "enhanced" | "free" {
    return this.isLiveMode ? "enhanced" : "free";
  },

  /** Cache TTL in milliseconds (default 1 hour). */
  cacheTtlMs: intFromEnv(process.env.CACHE_TTL_MS, 60 * 60 * 1000),

  /** OSM / free-provider settings */
  overpassUrl: process.env.OVERPASS_API_URL ?? "https://overpass-api.de/api/interpreter",
  nominatimUrl: process.env.NOMINATIM_URL ?? "https://nominatim.openstreetmap.org",
  freeProviderMinIntervalMs: intFromEnv(process.env.FREE_PROVIDER_MIN_INTERVAL_MS, 1200),
  freeProviderMaxRetries: intFromEnv(process.env.FREE_PROVIDER_MAX_RETRIES, 3),
  freeProviderBackoffMs: intFromEnv(process.env.FREE_PROVIDER_BACKOFF_MS, 500),
};
