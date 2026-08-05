export default function StatCard({ label, value, sub, accentColor }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3.5 flex flex-col gap-1 min-w-0">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
        {label}
      </span>
      <span
        className="font-[family-name:var(--font-display)] text-2xl leading-none tabular"
        style={{ color: accentColor || "var(--ink)" }}
      >
        {value}
      </span>
      {sub ? <span className="text-xs text-[var(--muted)]">{sub}</span> : null}
    </div>
  );
}
