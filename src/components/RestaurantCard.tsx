"use client";

import Link from "next/link";
import { Restaurant } from "@/lib/types";
import { TierBadge } from "./TierBadge";
import { ScoreRing } from "./ScoreRing";

function priceLabel(level: number): string {
  return "$".repeat(level);
}

export function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const { id, name, cuisine, address, distanceMiles, priceLevel, safetyScore } = restaurant;
  const distance = distanceMiles !== undefined ? `${distanceMiles.toFixed(1)} mi` : "";

  return (
    <Link href={`/restaurant/${id}`} className="block">
      <div className="glass rounded-2xl p-5 transition-smooth hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] cursor-pointer">
        <div className="flex items-start gap-4">
          {/* Score ring */}
          <ScoreRing score={safetyScore.finalScore} tier={safetyScore.tier} size={56} />

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-semibold truncate">{name}</h3>
              <TierBadge tier={safetyScore.tier} />
            </div>
            <p className="text-sm text-muted mb-2">
              {cuisine} · {priceLabel(priceLevel)}
            </p>
            <p className="text-xs text-muted truncate">{address}</p>
          </div>

          {/* Distance + confidence */}
          <div className="text-right shrink-0">
            {distance && (
              <p className="text-sm font-medium tabular-nums">{distance}</p>
            )}
            <p className="text-xs text-muted mt-1">
              {Math.round(safetyScore.confidence * 100)}% conf
              {restaurant.dataMeta ? ` · ${restaurant.dataMeta.freshness}` : ""}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
