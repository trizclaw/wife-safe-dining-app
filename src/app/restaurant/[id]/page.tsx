"use client";

import { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import { RestaurantDetail } from "@/lib/types";
import { TierBadge } from "@/components/TierBadge";
import { ScoreRing } from "@/components/ScoreRing";
import { ScoreBreakdown } from "@/components/ScoreBreakdown";

export default function RestaurantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [restaurant, setRestaurant] = useState<RestaurantDetail | null>(null);
  const [error, setError] = useState(false);
  const [ingesting, setIngesting] = useState(false);

  const loadRestaurant = useCallback(() => {
    fetch(`/api/restaurants/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(setRestaurant)
      .catch(() => setError(true));
  }, [id]);

  useEffect(() => {
    loadRestaurant();
  }, [loadRestaurant]);

  async function ingestMenu() {
    setIngesting(true);
    try {
      await fetch(`/api/restaurants/${id}/ingest-menu`, { method: "POST" });
      loadRestaurant();
    } finally {
      setIngesting(false);
    }
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-lg font-medium mb-2">Restaurant not found</p>
        <Link href="/" className="text-sm text-accent hover:underline">
          Back to list
        </Link>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const r = restaurant;
  const ss = r.safetyScore;

  return (
    <div className="space-y-6 pb-12">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-accent hover:underline -mt-1"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
          <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back
      </Link>

      {/* Header */}
      <div className="glass-elevated rounded-2xl p-6">
        <div className="flex items-start gap-5">
          <ScoreRing score={ss.finalScore} tier={ss.tier} size={72} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-xl font-bold">{r.name}</h1>
              <TierBadge tier={ss.tier} size="lg" />
            </div>
            <p className="text-sm text-muted">
              {r.cuisine} · {"$".repeat(r.priceLevel)} · {r.rating} stars
            </p>
            <p className="text-sm text-muted mt-1">{r.address}</p>
            {r.dataMeta && (
              <p className="text-xs text-muted mt-2">
                {r.dataMeta.mode === "free" ? "Free Mode" : r.dataMeta.mode === "enhanced" ? "Enhanced Mode" : "Demo fallback"} · {r.dataMeta.source} · {r.dataMeta.freshness}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-border text-center">
          <div>
            <p className="text-2xl font-bold tabular-nums">{ss.finalScore}</p>
            <p className="text-xs text-muted">Safety Score</p>
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums">{Math.round(ss.confidence * 100)}%</p>
            <p className="text-xs text-muted">Confidence</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{r.safeOptions.length}</p>
            <p className="text-xs text-muted">Safe Options</p>
          </div>
        </div>
      </div>

      {r.dataMeta?.mode !== "demo" && (
        <div className="flex items-center justify-between glass rounded-xl p-3">
          <p className="text-xs text-muted">
            Menu freshness: {r.menuDataMeta?.freshness ?? "unknown"} · confidence {Math.round((r.menuDataMeta?.confidence ?? 0) * 100)}%
          </p>
          <button
            onClick={ingestMenu}
            disabled={ingesting}
            className="text-xs px-3 py-1.5 rounded-lg bg-accent text-white disabled:opacity-60"
          >
            {ingesting ? "Refreshing..." : "Refresh menu"}
          </button>
        </div>
      )}

      {/* Safe options */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-pass mb-3">
          Likely Safe Options
        </h2>
        <div className="space-y-2">
          {r.safeOptions.map((item, i) => (
            <div key={i} className="glass rounded-xl p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{item.name}</p>
                  <p className="text-xs text-muted mt-0.5">{item.description}</p>
                </div>
                {item.safe && (
                  <span className="shrink-0 w-5 h-5 rounded-full bg-pass/15 flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6.5L5 9l4.5-6" stroke="var(--pass)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                )}
              </div>
              {item.modifications && item.modifications.length > 0 && (
                <div className="mt-2 pt-2 border-t border-border">
                  {item.modifications.map((mod, j) => (
                    <p key={j} className="text-xs text-caution">
                      &#9888; {mod}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Required modifications */}
      {r.requiredModifications.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-caution mb-3">
            Required Modifications
          </h2>
          <div className="glass rounded-xl p-4 space-y-2">
            {r.requiredModifications.map((mod, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-caution text-sm shrink-0 mt-0.5">&#9888;</span>
                <p className="text-sm">{mod}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Risk notes */}
      {r.riskNotes.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-avoid mb-3">
            Risk Notes
          </h2>
          <div className="glass rounded-xl p-4 space-y-2">
            {r.riskNotes.map((note, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-avoid text-sm shrink-0 mt-0.5">&#9679;</span>
                <p className="text-sm">{note}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Score breakdown */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted mb-3">
          Score Breakdown
        </h2>
        <div className="glass rounded-xl p-4">
          <ScoreBreakdown factors={ss.factors} />
        </div>
      </section>

      {/* Contact info */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted mb-3">
          Details
        </h2>
        <div className="glass rounded-xl p-4 space-y-2 text-sm">
          <p><span className="text-muted">Phone:</span> {r.phone}</p>
          <p><span className="text-muted">Hours:</span> {r.hours}</p>
          <p>
            <span className="text-muted">Website:</span>{" "}
            <span className="text-accent">{r.website.replace(/^https?:\/\//, "")}</span>
          </p>
        </div>
      </section>
    </div>
  );
}
