export default function StatCard({ label, value, sub, accentColor, icon: Icon }) {
  return (
    <div className="kpi-card card p-4 sm:p-5 flex flex-col gap-2 min-w-0">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
          {label}
        </span>
        {Icon ? (
          <span
            className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              backgroundColor: accentColor ? `${accentColor}1a` : "var(--accent-soft)",
              color: accentColor || "var(--accent)",
            }}
          >
            <Icon size={16} />
          </span>
        ) : null}
      </div>
      <span
        className="kpi-value font-extrabold tracking-tight leading-snug tabular min-w-0"
        style={{ color: accentColor || "var(--ink)" }}
      >
        {value}
      </span>
      {sub ? <span className="text-xs text-[var(--muted)]">{sub}</span> : null}
    </div>
  );
}
