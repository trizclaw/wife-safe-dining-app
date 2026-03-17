import { AvoidItem } from "@/lib/types";

const severityStyle: Record<string, { dot: string; text: string }> = {
  critical: { dot: "bg-avoid", text: "text-avoid" },
  high: { dot: "bg-caution", text: "text-caution" },
  moderate: { dot: "bg-muted", text: "text-muted" },
};

export function AvoidListPanel({
  items,
  lastUpdated,
}: {
  items: AvoidItem[];
  lastUpdated: string;
}) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Avoid List</h2>
        <span className="text-xs text-muted">Read-only</span>
      </div>
      <ul className="space-y-3">
        {items.map((item) => {
          const s = severityStyle[item.severity] ?? severityStyle.moderate;
          return (
            <li key={item.id} className="flex items-start gap-3">
              <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
              <div>
                <span className="text-sm font-medium">{item.name}</span>
                <span className={`ml-2 text-xs font-medium uppercase ${s.text}`}>
                  {item.severity}
                </span>
                {item.notes && (
                  <p className="text-xs text-muted mt-0.5">{item.notes}</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-muted mt-4 pt-3 border-t border-border">
        Last updated: {new Date(lastUpdated).toLocaleDateString()}
      </p>
    </div>
  );
}
