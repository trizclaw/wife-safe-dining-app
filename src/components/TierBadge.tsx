import { Tier } from "@/lib/types";

const config: Record<Tier, { label: string; bg: string; text: string }> = {
  PASS: { label: "PASS", bg: "bg-pass/12", text: "text-pass" },
  CAUTION: { label: "CAUTION", bg: "bg-caution/12", text: "text-caution" },
  AVOID: { label: "AVOID", bg: "bg-avoid/12", text: "text-avoid" },
};

export function TierBadge({ tier, size = "sm" }: { tier: Tier; size?: "sm" | "lg" }) {
  const c = config[tier];
  const sizeClass = size === "lg" ? "px-4 py-1.5 text-sm" : "px-2.5 py-0.5 text-xs";
  return (
    <span
      className={`inline-flex items-center font-semibold tracking-wide rounded-full ${c.bg} ${c.text} ${sizeClass}`}
    >
      {c.label}
    </span>
  );
}
