import ItemIconCard from "@/components/ItemIconCard";
import {
  MATERIAL_CATEGORY_LABEL,
  MATERIAL_CATEGORY_ORDER,
  type CharacterMaterial,
} from "@/lib/character-materials";
import { sortByRarityDesc } from "@/lib/genshin";

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
    <section
      id="guide-materials"
      className="overflow-hidden rounded-[20px] bg-white/95 shadow-panel ring-1 ring-black/[0.04]"
    >
      <div className="border-b border-black/[0.04] px-4 py-4 sm:px-5">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--el-accent,#189b8e)]">
          Прокачка
        </p>
        <h2 className="font-genshin text-[1.3rem] tracking-wide text-foreground sm:text-[1.45rem]">
          {title}
        </h2>
        <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">
          Полный список на 90 уровень и таланты. Наведите на карточку — краткая справка.
        </p>
      </div>

      <div className="space-y-5 px-4 py-4 sm:px-5 sm:py-5">
        {categories.map((category) => (
          <div key={category}>
            <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {MATERIAL_CATEGORY_LABEL[category as keyof typeof MATERIAL_CATEGORY_LABEL] ??
                category}
            </p>
            <ul className="flex flex-wrap gap-2.5">
              {grouped[category].map((m) => (
                <li key={m.id}>
                  <ItemIconCard
                    name={m.name}
                    image={m.image}
                    rarityStars={m.rarityStars ?? 3}
                    qty={m.qty > 0 ? m.qty : undefined}
                    size="md"
                    lore={loreOf(m.name)}
                    preview
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
