/**
 * Heuristic safety factor estimates by cuisine type.
 * Used when no menu has been ingested yet — provides conservative
 * baseline scores based on common allergen risk profiles.
 */
import { RawFactors } from "./scoring";

const CUISINE_DEFAULTS: Record<string, RawFactors> = {
  American:       { menuTransparency: 65, customization: 75, crossContamination: 70, avoidListOverlap: 75, staffKnowledge: 60 },
  Mexican:        { menuTransparency: 60, customization: 75, crossContamination: 70, avoidListOverlap: 80, staffKnowledge: 55 },
  "Tex-Mex":      { menuTransparency: 60, customization: 75, crossContamination: 70, avoidListOverlap: 80, staffKnowledge: 55 },
  Italian:        { menuTransparency: 65, customization: 70, crossContamination: 65, avoidListOverlap: 60, staffKnowledge: 60 },
  Chinese:        { menuTransparency: 40, customization: 45, crossContamination: 35, avoidListOverlap: 30, staffKnowledge: 35 },
  Japanese:       { menuTransparency: 55, customization: 45, crossContamination: 40, avoidListOverlap: 35, staffKnowledge: 50 },
  "Japanese/Sushi": { menuTransparency: 55, customization: 40, crossContamination: 35, avoidListOverlap: 30, staffKnowledge: 50 },
  Thai:           { menuTransparency: 45, customization: 50, crossContamination: 35, avoidListOverlap: 30, staffKnowledge: 40 },
  Indian:         { menuTransparency: 50, customization: 60, crossContamination: 45, avoidListOverlap: 40, staffKnowledge: 50 },
  French:         { menuTransparency: 70, customization: 65, crossContamination: 70, avoidListOverlap: 60, staffKnowledge: 70 },
  Korean:         { menuTransparency: 50, customization: 45, crossContamination: 40, avoidListOverlap: 35, staffKnowledge: 40 },
  Vietnamese:     { menuTransparency: 45, customization: 50, crossContamination: 40, avoidListOverlap: 35, staffKnowledge: 40 },
  Mediterranean:  { menuTransparency: 65, customization: 70, crossContamination: 65, avoidListOverlap: 55, staffKnowledge: 60 },
  Seafood:        { menuTransparency: 60, customization: 55, crossContamination: 40, avoidListOverlap: 30, staffKnowledge: 55 },
  Steakhouse:     { menuTransparency: 70, customization: 75, crossContamination: 75, avoidListOverlap: 80, staffKnowledge: 65 },
  Pizza:          { menuTransparency: 60, customization: 70, crossContamination: 65, avoidListOverlap: 70, staffKnowledge: 50 },
  Burgers:        { menuTransparency: 60, customization: 75, crossContamination: 70, avoidListOverlap: 75, staffKnowledge: 50 },
  Barbecue:       { menuTransparency: 55, customization: 50, crossContamination: 80, avoidListOverlap: 85, staffKnowledge: 50 },
  "Farm-to-Table": { menuTransparency: 85, customization: 80, crossContamination: 80, avoidListOverlap: 75, staffKnowledge: 80 },
  Cafe:           { menuTransparency: 55, customization: 60, crossContamination: 55, avoidListOverlap: 60, staffKnowledge: 50 },
  Bakery:         { menuTransparency: 50, customization: 40, crossContamination: 40, avoidListOverlap: 45, staffKnowledge: 45 },
};

const FALLBACK: RawFactors = {
  menuTransparency: 50,
  customization: 50,
  crossContamination: 50,
  avoidListOverlap: 50,
  staffKnowledge: 50,
};

export function estimateFactorsFromCuisine(cuisine: string): RawFactors {
  return CUISINE_DEFAULTS[cuisine] ?? FALLBACK;
}

/**
 * Refine heuristic factors with actual ingested menu data.
 * Bumps relevant scores based on what we found in the menu.
 */
export function refineFactorsWithMenu(
  base: RawFactors,
  totalItems: number,
  safeItems: number
): RawFactors {
  if (totalItems === 0) return base;

  const safeRatio = safeItems / totalItems;
  const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

  return {
    menuTransparency: clamp(base.menuTransparency + 15), // bonus for having a parseable menu
    customization: clamp(base.customization + 10),
    crossContamination: base.crossContamination, // can't determine from menu text
    avoidListOverlap: clamp(safeRatio * 100),
    staffKnowledge: base.staffKnowledge,
  };
}
