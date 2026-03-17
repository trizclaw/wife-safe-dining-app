import { AvoidItem } from "./types";

export const AVOID_LIST: AvoidItem[] = [
  {
    id: "shellfish",
    name: "Shellfish",
    severity: "critical",
    notes: "Includes shrimp, crab, lobster, crawfish, mussels, clams, oysters",
  },
  {
    id: "tree-nuts",
    name: "Tree Nuts",
    severity: "critical",
    notes: "Walnuts, pecans, almonds, cashews, pistachios, macadamia",
  },
  {
    id: "peanuts",
    name: "Peanuts",
    severity: "critical",
    notes: "Includes peanut oil and peanut flour",
  },
  {
    id: "sesame",
    name: "Sesame",
    severity: "high",
    notes: "Seeds, oil, tahini, halvah",
  },
  {
    id: "raw-fish",
    name: "Raw Fish",
    severity: "high",
    notes: "Sushi-grade, ceviche, poke — cooked fish is fine",
  },
  {
    id: "msg-added",
    name: "Added MSG",
    severity: "moderate",
    notes: "Naturally occurring glutamates (tomato, parmesan) are OK",
  },
];

export const AVOID_LIST_LAST_UPDATED = "2026-03-01T00:00:00Z";
