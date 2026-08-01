/** Заголовок секции каталога в стиле главной («РАЗДЕЛЫ» + крупный title). */
export default function CatalogSectionHeader({
  eyebrow = "Разделы",
  title,
  count,
}: {
  eyebrow?: string;
  title: string;
  count?: number;
}) {
  return (
    <div className="mb-4">
      <p className="mb-1 text-sm font-bold uppercase tracking-[0.08em] text-[#189b8e]">
        {eyebrow}
      </p>
      <h2 className="section-title text-[22px] sm:text-2xl">
        {title}
        {typeof count === "number" ? (
          <span className="ml-2 text-base font-semibold text-muted-foreground">· {count}</span>
        ) : null}
      </h2>
    </div>
  );
}
