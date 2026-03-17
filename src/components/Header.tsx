import Link from "next/link";
import { config } from "@/lib/config";

export function Header() {
  const modeLabel = config.providerMode === "enhanced" ? "Enhanced Mode" : "Free Mode";

  return (
    <header className="glass-elevated sticky top-0 z-50 border-b border-border">
      <div className="max-w-2xl mx-auto flex items-center justify-between px-5 py-4">
        <Link href="/" className="flex items-center gap-2 transition-smooth hover:opacity-70">
          <span className="text-xl font-bold tracking-tight">SafeDine</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2 py-1 rounded-full bg-accent/10 text-accent font-semibold tracking-wide uppercase">
            {modeLabel}
          </span>
          <span className="text-xs text-muted font-medium tracking-wide uppercase">
            Phase B
          </span>
        </div>
      </div>
    </header>
  );
}
