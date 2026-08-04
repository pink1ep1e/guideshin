import ItemIconCard from "@/components/ItemIconCard";
import {
  MATERIAL_CATEGORY_LABEL,
  MATERIAL_CATEGORY_ORDER,
  type CharacterMaterial,
} from "@/lib/character-materials";
import { sortByRarityDesc } from "@/lib/genshin";

function formatQty(qty: number): string {
  return qty.toLocaleString("ru-RU");
}

export default function MaterialCards({
  materials,
  title = "Материалы для прокачки",
  loreByName = {},
}: {
  materials: CharacterMaterial[];
  title?: string;
  loreByName?: Record<string, string>;
}) {
  if (materials.length === 0) return null;

  const sorted = sortByRarityDesc(
    materials,
    (m) => m.rarityStars ?? 0,
    (m) => m.name,
  );

  const grouped = sorted.reduce<Record<string, CharacterMaterial[]>>((acc, m) => {
    (acc[m.category] ??= []).push(m);
    return acc;
  }, {});

  const categories = [
    ...MATERIAL_CATEGORY_ORDER.filter((c) => grouped[c]?.length),
    ...Object.keys(grouped).filter(
      (c) => !MATERIAL_CATEGORY_ORDER.includes(c as (typeof MATERIAL_CATEGORY_ORDER)[number]),
    ),
  ];

  function loreOf(name: string) {
    return loreByName[name.trim().toLowerCase()] || undefined;
  }

  return (
    <section id="guide-materials" className="guide-panel">
      <span className="guide-panel-ornament" aria-hidden />
      <header className="guide-section-head">
        <p className="guide-eyebrow">
          <span className="guide-eyebrow-mark" aria-hidden />
          Прокачка
        </p>
        <h2 className="guide-title">
          <span className="guide-title-glow" aria-hidden />
          {title}
        </h2>
        <p className="guide-intro">Наведите на иконку — краткая справка по материалу.</p>
      </header>
      <div className="guide-module-line" aria-hidden />

      <div className="relative z-[1] mt-5 space-y-5">
        {categories.map((category) => (
          <div key={category}>
            <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {MATERIAL_CATEGORY_LABEL[category as keyof typeof MATERIAL_CATEGORY_LABEL] ??
                category}
            </p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {grouped[category].map((m) => (
                <li
                  key={m.id}
                  className="flex items-center gap-3 rounded-[14px] bg-[#f7f9fb] px-2.5 py-2"
                >
                  <ItemIconCard
                    name={m.name}
                    image={m.image}
                    rarityStars={m.rarityStars ?? 3}
                    size="sm"
                    compact
                    lore={loreOf(m.name)}
                    preview
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] text-foreground" title={m.name}>
                      {m.name}
                    </p>
                    {m.qty > 0 ? (
                      <p className="mt-0.5 text-[13px] font-semibold tabular-nums text-[#189b8e]">
                        ×{formatQty(m.qty)}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
