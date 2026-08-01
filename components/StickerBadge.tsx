type StickerBadgeProps = {
  label: string;
  size?: "sm" | "md";
  className?: string;
  /** Corner ribbon on cards */
  variant?: "pill" | "ribbon";
};

function toneFor(_label: string) {
  return { from: "#189b8e", to: "#127a70", glow: "rgba(24,155,142,0.4)" };
}

export default function StickerBadge({
  label,
  size = "sm",
  className = "",
  variant = "pill",
}: StickerBadgeProps) {
  const tone = toneFor(label);

  if (variant === "ribbon") {
    return (
      <span
        className={`pointer-events-none z-20 inline-flex items-center justify-center font-extrabold uppercase tracking-[0.06em] text-white ${className}`}
        style={{
          background: `linear-gradient(135deg, ${tone.from}, ${tone.to})`,
          boxShadow: `0 4px 12px ${tone.glow}`,
          fontSize: size === "sm" ? "8px" : "10px",
          padding: size === "sm" ? "3px 8px 3px 6px" : "4px 10px 4px 8px",
          borderRadius: "0 8px 0 10px",
        }}
      >
        {label}
      </span>
    );
  }

  const pad = size === "sm" ? "px-2.5 py-0.5 text-[9px]" : "px-3 py-1 text-[11px]";

  return (
    <span
      className={`pointer-events-none relative inline-flex items-center justify-center rounded-full font-extrabold uppercase tracking-[0.08em] text-white ${pad} ${className}`}
      style={{
        background: `linear-gradient(135deg, ${tone.from}, ${tone.to})`,
        boxShadow: `0 6px 14px ${tone.glow}`,
      }}
    >
      <span
        className="pointer-events-none absolute inset-x-1 top-0 h-px rounded-full bg-white/50"
        aria-hidden
      />
      {label}
    </span>
  );
}
