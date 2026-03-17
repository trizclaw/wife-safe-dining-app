"use client";

import { useState } from "react";

interface LocationPromptProps {
  onLocation: (lat: number, lng: number) => void;
  onFallback: () => void;
}

export function LocationPrompt({ onLocation, onFallback }: LocationPromptProps) {
  const [loading, setLoading] = useState(false);
  const [zip, setZip] = useState("");
  const [showManual, setShowManual] = useState(false);

  function requestGeo() {
    if (!navigator.geolocation) {
      setShowManual(true);
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onLocation(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setLoading(false);
        setShowManual(true);
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Stub: In Phase B this would geocode the zip/city
    onFallback();
  }

  if (showManual) {
    return (
      <div className="glass-elevated rounded-2xl p-8 text-center max-w-sm mx-auto">
        <div className="text-4xl mb-4">&#128205;</div>
        <h2 className="text-lg font-semibold mb-2">Enter your location</h2>
        <p className="text-sm text-muted mb-6">
          We&apos;ll show restaurants near you.
        </p>
        <form onSubmit={handleManualSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="City or ZIP code"
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent transition-smooth"
          />
          <button
            type="submit"
            className="w-full rounded-xl bg-accent text-white font-medium py-3 text-sm transition-smooth hover:opacity-90 active:scale-[0.98]"
          >
            Find Restaurants
          </button>
        </form>
        <button
          onClick={() => { setShowManual(false); requestGeo(); }}
          className="text-xs text-accent mt-4 hover:underline"
        >
          Try location again
        </button>
      </div>
    );
  }

  return (
    <div className="glass-elevated rounded-2xl p-8 text-center max-w-sm mx-auto">
      <div className="text-4xl mb-4">&#128205;</div>
      <h2 className="text-lg font-semibold mb-2">Find safe dining nearby</h2>
      <p className="text-sm text-muted mb-6">
        Allow location access so we can show diet-safe restaurants near you.
      </p>
      <button
        onClick={requestGeo}
        disabled={loading}
        className="w-full rounded-xl bg-accent text-white font-medium py-3 text-sm transition-smooth hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
      >
        {loading ? "Locating…" : "Share My Location"}
      </button>
      <button
        onClick={() => setShowManual(true)}
        className="text-xs text-muted mt-4 hover:text-foreground transition-smooth"
      >
        Enter location manually
      </button>
    </div>
  );
}
