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
      className="overflow-hidden rounded-[18px] border border-black/[0.045] bg-white shadow-soft"
    >
      <div className="border-b border-black/[0.04] bg-gradient-to-r from-[#189b8e]/[0.07] to-transparent px-4 py-4 sm:px-5">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#189b8e]">
          Прокачка
        </p>
        <h2 className="font-genshin text-lg tracking-wide text-foreground sm:text-xl">
          {title}
        </h2>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
          Полный список ресурсов на 90 уровень и таланты. Наводите на иконку — краткая справка.
        </p>
      </div>

      <div className="divide-y divide-black/[0.04]">
        {categories.map((category) => (
          <div key={category} className="px-3 py-3 sm:px-4">
            <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {MATERIAL_CATEGORY_LABEL[category as keyof typeof MATERIAL_CATEGORY_LABEL] ??
                category}
            </p>
            <ul className="space-y-1">
              {grouped[category].map((m) => (
                <li
                  key={m.id}
                  className="flex items-center gap-3 rounded-[12px] px-1.5 py-1.5 transition hover:bg-[#f7f9fb]"
                >
                  <ItemIconCard
                    name={m.name}
                    image={m.image}
                    rarityStars={m.rarityStars ?? 3}
                    size="sm"
                    compact
                    className="!h-10 !w-10"
                    lore={loreOf(m.name)}
                    preview
                  />
                  <p className="min-w-0 flex-1 truncate text-[13px] text-foreground" title={m.name}>
                    {m.name}
                  </p>
                  {m.qty > 0 ? (
                    <span className="shrink-0 rounded-md bg-[#189b8e]/10 px-2 py-0.5 text-[12px] font-semibold tabular-nums text-[#189b8e]">
                      ×{formatQty(m.qty)}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
