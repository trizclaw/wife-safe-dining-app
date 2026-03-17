"use client";

import { useEffect, useState, useCallback } from "react";
import { Restaurant, AvoidItem, DataMeta } from "@/lib/types";
import { RestaurantCard } from "@/components/RestaurantCard";
import { LocationPrompt } from "@/components/LocationPrompt";
import { AvoidListPanel } from "@/components/AvoidListPanel";

type LocationState =
  | { status: "pending" }
  | { status: "granted"; lat: number; lng: number }
  | { status: "denied" };

export default function HomePage() {
  const [location, setLocation] = useState<LocationState>({ status: "pending" });
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [avoidItems, setAvoidItems] = useState<AvoidItem[]>([]);
  const [avoidUpdated, setAvoidUpdated] = useState("");
  const [loading, setLoading] = useState(false);
  const [dataMeta, setDataMeta] = useState<DataMeta | null>(null);

  // Fetch avoid list on mount
  useEffect(() => {
    fetch("/api/avoid-list")
      .then((r) => r.json())
      .then((data) => {
        setAvoidItems(data.items);
        setAvoidUpdated(data.lastUpdated);
      })
      .catch(() => {});
  }, []);

  // Auto-request geolocation on mount
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ status: "granted", lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        // Don't auto-show denied — let user interact with prompt
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }, []);

  const fetchNearby = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/location/nearby?lat=${lat}&lng=${lng}&radius=15`);
      const data = await res.json();
      setRestaurants(data.restaurants ?? []);
      setDataMeta(data.dataMeta ?? null);
    } catch {
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch restaurants when location is granted
  useEffect(() => {
    if (location.status === "granted") {
      fetchNearby(location.lat, location.lng);
    }
  }, [location, fetchNearby]);

  function handleLocation(lat: number, lng: number) {
    setLocation({ status: "granted", lat, lng });
  }

  function handleFallback() {
    // Use default Austin center
    setLocation({ status: "granted", lat: 30.2672, lng: -97.7431 });
  }

  // Count by tier
  const passList = restaurants.filter((r) => r.safetyScore.tier === "PASS");
  const cautionList = restaurants.filter((r) => r.safetyScore.tier === "CAUTION");
  const avoidRestaurants = restaurants.filter((r) => r.safetyScore.tier === "AVOID");

  return (
    <div className="space-y-8">
      {/* Location prompt or results */}
      {location.status === "pending" ? (
        <div className="mt-12">
          <LocationPrompt onLocation={handleLocation} onFallback={handleFallback} />
        </div>
      ) : (
        <>
          {/* Summary bar */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Nearby</h1>
              <p className="text-sm text-muted mt-0.5">
                {restaurants.length} restaurants · sorted by safety score
              </p>
            </div>
            {loading && (
              <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            )}
          </div>

          {dataMeta && (
            <div className="glass rounded-xl px-4 py-2 text-xs text-muted flex flex-wrap items-center gap-2">
              <span className="font-medium text-foreground">
                {dataMeta.mode === "free" ? "Free Mode" : dataMeta.mode === "enhanced" ? "Enhanced Mode" : "Demo fallback"}
              </span>
              <span>• {dataMeta.source}</span>
              <span>• {Math.round(dataMeta.confidence * 100)}% confidence</span>
              <span>• {dataMeta.freshness}</span>
            </div>
          )}

          {/* Tier sections */}
          {passList.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-pass uppercase tracking-wider mb-3">
                Safe choices ({passList.length})
              </h2>
              <div className="space-y-3">
                {passList.map((r) => (
                  <RestaurantCard key={r.id} restaurant={r} />
                ))}
              </div>
            </section>
          )}

          {cautionList.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-caution uppercase tracking-wider mb-3">
                Proceed with caution ({cautionList.length})
              </h2>
              <div className="space-y-3">
                {cautionList.map((r) => (
                  <RestaurantCard key={r.id} restaurant={r} />
                ))}
              </div>
            </section>
          )}

          {avoidRestaurants.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-avoid uppercase tracking-wider mb-3">
                Avoid ({avoidRestaurants.length})
              </h2>
              <div className="space-y-3">
                {avoidRestaurants.map((r) => (
                  <RestaurantCard key={r.id} restaurant={r} />
                ))}
              </div>
            </section>
          )}

          {!loading && restaurants.length === 0 && (
            <p className="text-center text-muted py-12">No restaurants found in this area.</p>
          )}
        </>
      )}

      {/* Avoid list (always visible) */}
      {avoidItems.length > 0 && (
        <AvoidListPanel items={avoidItems} lastUpdated={avoidUpdated} />
      )}
    </div>
  );
}
