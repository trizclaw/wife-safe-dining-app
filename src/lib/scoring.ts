import { SafetyScore, ScoreFactor, Tier } from "./types";

/**
 * Chef-style weighted diet-safety rubric.
 *
 * Factors & weights:
 *   Menu Transparency       0.20
 *   Customization Friendly  0.20
 *   Cross-Contamination     0.25
 *   Avoid-List Overlap      0.25
 *   Staff Knowledge         0.10
 */

export interface RawFactors {
  menuTransparency: number;   // 0–100
  customization: number;      // 0–100
  crossContamination: number; // 0–100 (higher = safer)
  avoidListOverlap: number;   // 0–100 (higher = fewer overlaps)
  staffKnowledge: number;     // 0–100
}

const WEIGHTS: { key: keyof RawFactors; label: string; weight: number }[] = [
  { key: "menuTransparency", label: "Menu Transparency", weight: 0.2 },
  { key: "customization", label: "Customization Friendly", weight: 0.2 },
  { key: "crossContamination", label: "Cross-Contamination Risk", weight: 0.25 },
  { key: "avoidListOverlap", label: "Avoid-List Safety", weight: 0.25 },
  { key: "staffKnowledge", label: "Staff Knowledge", weight: 0.1 },
];

function tierFromScore(score: number): Tier {
  if (score >= 75) return "PASS";
  if (score >= 50) return "CAUTION";
  return "AVOID";
}

function noteForFactor(key: keyof RawFactors, score: number): string {
  const level = score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Fair" : "Poor";
  const descriptions: Record<keyof RawFactors, string> = {
    menuTransparency: `${level} — allergen labeling and ingredient disclosure`,
    customization: `${level} — willingness to modify dishes on request`,
    crossContamination: `${level} — kitchen separation and shared-equipment practices`,
    avoidListOverlap: `${level} — proportion of menu free from avoid-list items`,
    staffKnowledge: `${level} — staff training on dietary restrictions`,
  };
  return descriptions[key];
}

export function computeSafetyScore(raw: RawFactors, confidence: number = 0.7): SafetyScore {
  const factors: ScoreFactor[] = WEIGHTS.map(({ key, label, weight }) => ({
    name: label,
    weight,
    score: raw[key],
    note: noteForFactor(key, raw[key]),
  }));

  const finalScore = Math.round(
    factors.reduce((sum, f) => sum + f.score * f.weight, 0)
  );

  return {
    factors,
    finalScore,
    tier: tierFromScore(finalScore),
    confidence,
  };
}
