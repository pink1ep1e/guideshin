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
    <section
      id="guide-materials"
      className="rounded-[18px] border border-black/[0.045] bg-white p-4 shadow-soft sm:p-5"
    >
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#189b8e]">
        Прокачка
      </p>
      <h2 className="font-genshin mb-1 text-lg tracking-wide text-foreground sm:text-xl">
        {title}
      </h2>
      <p className="mb-4 text-[13px] leading-relaxed text-muted-foreground">
        Сколько ресурсов нужно на полную прокачку персонажа и талантов.
      </p>

      <div className="space-y-4">
        {categories.map((category) => (
          <div key={category}>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {MATERIAL_CATEGORY_LABEL[category as keyof typeof MATERIAL_CATEGORY_LABEL] ??
                category}
            </p>
            <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
              {grouped[category].map((m) => (
                <li
                  key={m.id}
                  className="flex items-center gap-2.5 rounded-[12px] border border-black/[0.04] bg-[#f7f9fb] px-2 py-1.5"
                >
                  <ItemIconCard
                    name={m.name}
                    image={m.image}
                    rarityStars={m.rarityStars ?? 3}
                    size="sm"
                    compact
                    className="!h-11 !w-11"
                    lore={loreOf(m.name)}
                    preview
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-[12.5px] leading-snug text-foreground"
                      title={m.name}
                    >
                      {m.name}
                    </p>
                    {m.qty > 0 ? (
                      <p className="mt-0.5 text-[12px] font-semibold tabular-nums text-[#189b8e]">
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
