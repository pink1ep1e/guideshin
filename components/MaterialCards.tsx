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
}: {
  materials: CharacterMaterial[];
  title?: string;
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

  return (
    <section className="glass-panel relative overflow-hidden p-5 sm:p-6">
      <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#189b8e] to-[#67d5cc]" />
      <p className="mb-1 text-sm font-bold uppercase tracking-[0.08em] text-[#189b8e]">
        Прокачка
      </p>
      <h2 className="font-genshin mb-5 text-xl tracking-wide text-foreground sm:text-2xl">
        {title}
      </h2>

      <div className="space-y-6">
        {categories.map((category) => (
          <div key={category}>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
              {MATERIAL_CATEGORY_LABEL[category as keyof typeof MATERIAL_CATEGORY_LABEL] ??
                category}
            </p>
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3 md:grid-cols-5 lg:grid-cols-6">
              {grouped[category].map((m) => (
                <ItemIconCard
                  key={m.id}
                  name={m.name}
                  image={m.image}
                  rarityStars={m.rarityStars ?? 3}
                  qty={m.qty}
                  size="md"
                  fluid
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
