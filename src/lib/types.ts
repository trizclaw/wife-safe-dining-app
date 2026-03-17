// ── Core domain types ──

export type Tier = "PASS" | "CAUTION" | "AVOID";

export interface ScoreFactor {
  name: string;
  weight: number;
  score: number; // 0–100
  note: string;
}

export interface SafetyScore {
  factors: ScoreFactor[];
  finalScore: number; // 0–100
  tier: Tier;
  confidence: number; // 0–1
}

export interface DataMeta {
  mode: "free" | "enhanced" | "demo";
  source: string;
  fetchedAt: string;
  freshness: "fresh" | "cached" | "stale";
  confidence: number; // 0-1
  note?: string;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  address: string;
  location: LatLng;
  distanceMiles?: number;
  priceLevel: 1 | 2 | 3 | 4;
  rating: number; // 1–5
  imageUrl?: string;
  website?: string;
  menuUrl?: string;
  safetyScore: SafetyScore;
  dataMeta?: DataMeta;
}

export interface MenuItem {
  name: string;
  description: string;
  safe: boolean;
  modifications?: string[];
}

export interface RestaurantDetail extends Restaurant {
  phone: string;
  hours: string;
  website: string;
  safeOptions: MenuItem[];
  requiredModifications: string[];
  riskNotes: string[];
  menuDataMeta?: DataMeta;
}

export interface AvoidItem {
  id: string;
  name: string;
  severity: "critical" | "high" | "moderate";
  notes?: string;
}

// ── API response shapes ──

export interface NearbyResponse {
  restaurants: Restaurant[];
  center: LatLng;
  radiusMiles: number;
  dataMeta?: DataMeta;
}

export interface AvoidListResponse {
  items: AvoidItem[];
  lastUpdated: string;
}

export interface RecommendationsResponse {
  restaurantId: string;
  safeOptions: MenuItem[];
  requiredModifications: string[];
  riskNotes: string[];
}
