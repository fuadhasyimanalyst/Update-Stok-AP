const STYLES = {
  "Fast Moving": { bg: "var(--fast-soft)", fg: "var(--fast)", label: "Fast Moving" },
  "Slow Moving": { bg: "var(--slow-soft)", fg: "var(--slow)", label: "Slow Moving" },
  DEAD: { bg: "var(--dead-soft)", fg: "var(--dead)", label: "Dead Stock" },
  "-": { bg: "var(--neutral-soft)", fg: "var(--neutral-fg)", label: "Belum Dikategorikan" },
};

export default function CategoryBadge({ value }) {
  const style = STYLES[value] || STYLES["-"];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase whitespace-nowrap"
      style={{ backgroundColor: style.bg, color: style.fg }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: style.fg }} />
      {style.label}
    </span>
  );
}

export { STYLES as CATEGORY_STYLES };
