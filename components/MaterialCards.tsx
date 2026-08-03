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
  /** Короткий лор по имени (lowercase) для hover-превью. */
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
      className="rounded-[20px] border border-black/[0.045] bg-white p-5 shadow-soft sm:p-6"
    >
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#189b8e]">
        Прокачка
      </p>
      <h2 className="font-genshin mb-5 text-xl tracking-wide text-foreground">
        {title}
      </h2>

      <div className="space-y-6">
        {categories.map((category) => (
          <div key={category}>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {MATERIAL_CATEGORY_LABEL[category as keyof typeof MATERIAL_CATEGORY_LABEL] ??
                category}
            </p>
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-6">
              {grouped[category].map((m) => (
                <ItemIconCard
                  key={m.id}
                  name={m.name}
                  image={m.image}
                  rarityStars={m.rarityStars ?? 3}
                  qty={m.qty}
                  size="md"
                  fluid
                  lore={loreOf(m.name)}
                  preview
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
