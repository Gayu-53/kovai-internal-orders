import type { DashboardStats } from "@/lib/types";

export function StatsGrid({ stats }: { stats: DashboardStats }) {
  const items = [
    { label: "Total Orders", value: stats.total, className: "text-ink" },
    { label: "Pending", value: stats.pending, className: "text-status-pending-text" },
    { label: "Production", value: stats.production, className: "text-status-production-text" },
    { label: "Ready", value: stats.ready, className: "text-status-ready-text" },
    { label: "Dispatched", value: stats.dispatched, className: "text-status-dispatched-text" },
    { label: "Urgent", value: stats.urgent, className: "text-status-pending-text" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl border border-border bg-white p-4">
          <p className="text-xs font-medium text-ink-muted">{item.label}</p>
          <p className={`mt-1 font-display text-2xl font-bold ${item.className}`}>{item.value}</p>
        </div>
      ))}
    </div>
  );
}
