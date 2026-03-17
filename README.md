# SafeDine — Diet-Safe Restaurant Finder

Phase B now supports **Free Mode by default** (OpenStreetMap/Overpass) with optional Google Places enhanced mode.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Free Mode (default, no API keys)

No setup required. If `GOOGLE_MAPS_API_KEY` is not present, the app automatically uses:

- **Overpass API (OpenStreetMap)** for nearby restaurant search
- OSM tags for detail fields (address, hours, website/phone when available)

UI and API metadata will show **Free Mode**.

## Optional Enhanced Mode (Google Places)

Create `.env.local` and set:

```bash
GOOGLE_MAPS_API_KEY=your_key_here
```

When present, provider switches to **Enhanced Mode** (Google Places nearby/details).

## Environment Variables

All env vars are optional.

```bash
# Optional: enables Enhanced Mode (Google Places). If unset => Free Mode.
GOOGLE_MAPS_API_KEY=

# Optional cache TTL in ms (default: 3600000 / 1 hour)
CACHE_TTL_MS=3600000

# Optional Overpass endpoint for Free Mode
OVERPASS_API_URL=https://overpass-api.de/api/interpreter

# Optional Nominatim endpoint (reserved for future geocoding use)
NOMINATIM_URL=https://nominatim.openstreetmap.org

# Optional free-provider pacing and retries
FREE_PROVIDER_MIN_INTERVAL_MS=1200
FREE_PROVIDER_MAX_RETRIES=3
FREE_PROVIDER_BACKOFF_MS=500
```

## Build / Verify

```bash
npm run build
npm start
```

## API

- `GET /api/location/nearby?lat=&lng=&radius=`
- `GET /api/restaurants?lat=&lng=&radius=`
- `GET /api/restaurants/:id`
- `GET /api/restaurants/:id/recommendations`
- `POST /api/restaurants/:id/ingest-menu` (optional body: `{ "menuUrl": "https://..." }`)
- `GET /api/avoid-list`

Responses include metadata where applicable:
- `mode` (`free` / `enhanced` / `demo` fallback)
- `source`
- `confidence`
- `freshness` (`fresh`/`cached`/`stale`)
- `fetchedAt`

## Notes

- Free Mode includes basic rate limiting, retry/backoff, and cache to avoid hammering public endpoints.
- If free provider is temporarily unavailable/throttled, app gracefully falls back to seeded demo data.
- Scoring + recommendation pipeline is preserved across free/enhanced providers.
