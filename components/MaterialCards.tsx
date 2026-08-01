import ItemIconCard from "@/components/ItemIconCard";
import {
  MATERIAL_CATEGORY_LABEL,
  type CharacterMaterial,
} from "@/lib/character-materials";

export default function MaterialCards({
  materials,
  title = "Материалы для прокачки",
}: {
  materials: CharacterMaterial[];
  title?: string;
}) {
  if (materials.length === 0) return null;

  const grouped = materials.reduce<Record<string, CharacterMaterial[]>>((acc, m) => {
    (acc[m.category] ??= []).push(m);
    return acc;
  }, {});

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
        {Object.entries(grouped).map(([category, rows]) => (
          <div key={category}>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
              {MATERIAL_CATEGORY_LABEL[category as keyof typeof MATERIAL_CATEGORY_LABEL] ??
                category}
            </p>
            <div className="flex flex-wrap gap-3">
              {rows.map((m) => (
                <ItemIconCard
                  key={m.id}
                  name={m.name}
                  image={m.image}
                  rarityStars={m.rarityStars ?? 3}
                  qty={m.qty}
                  size="md"
                  showName
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
