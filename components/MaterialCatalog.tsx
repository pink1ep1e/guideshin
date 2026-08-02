"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import WikiItemCard from "@/components/WikiItemCard";
import CatalogSectionHeader from "@/components/CatalogSectionHeader";
import {
  groupByMaterialCategory,
  MATERIAL_CATEGORY_LABEL,
  MATERIAL_CATEGORY_ORDER,
  type MaterialCategory,
} from "@/lib/character-materials";
import { sortByRarityDesc } from "@/lib/genshin";

export type MaterialCatalogItem = {
  id: number;
  slug: string;
  name: string;
  image: string;
  rarityStars: number;
  category: string;
  region?: string | null;
  lore?: string | null;
};

const CATEGORIES: Array<MaterialCategory | "ALL"> = [
  "ALL",
  ...MATERIAL_CATEGORY_ORDER,
];

type RarityFilter = "ALL" | 5 | 4 | 3 | 2 | 1;

export default function MaterialCatalog({ materials }: { materials: MaterialCatalogItem[] }) {
  const [query, setQuery] = useState("");
  const [rarity, setRarity] = useState<RarityFilter>("ALL");
  const [category, setCategory] = useState<MaterialCategory | "ALL">("ALL");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const filtered = useMemo(() => {
    const list = materials.filter((m) => {
      if (rarity !== "ALL" && m.rarityStars !== rarity) return false;
      if (category !== "ALL" && m.category !== category) return false;
      if (!deferredQuery) return true;
      return (
        m.name.toLowerCase().includes(deferredQuery) ||
        m.slug.toLowerCase().includes(deferredQuery)
      );
    });
    return sortByRarityDesc(list, (m) => m.rarityStars, (m) => m.name);
  }, [materials, deferredQuery, rarity, category]);

  const groups = useMemo(
    () => groupByMaterialCategory(filtered, (m) => m.category),
    [filtered],
  );

  const hasFilters = query.length > 0 || rarity !== "ALL" || category !== "ALL";

  function resetFilters() {
    setQuery("");
    setRarity("ALL");
    setCategory("ALL");
  }

  return (
    <div className="space-y-6">
      <div className="glass-panel relative overflow-hidden p-5 sm:p-6">
        <span className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-[#189b8e]/10 blur-2xl" />
        <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#189b8e] to-[#67d5cc]" />

        <div className="relative space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#189b8e]" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по названию материала…"
              className="w-full rounded-[16px] border border-black/[0.06] bg-white/90 py-3.5 pl-11 pr-11 text-sm font-medium text-foreground outline-none ring-[#189b8e]/25 placeholder:text-muted-foreground focus:ring-2"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-[#189b8e]/10 hover:text-[#189b8e]"
                aria-label="Очистить поиск"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
                Редкость
              </p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["ALL", "Все"],
                    [5, "5★"],
                    [4, "4★"],
                    [3, "3★"],
                    [2, "2★"],
                    [1, "1★"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={String(value)}
                    type="button"
                    onClick={() => setRarity(value)}
                    className={`rounded-xl px-3.5 py-2 text-sm font-bold transition ${
                      rarity === value
                        ? "bg-[#189b8e] text-white shadow-sm"
                        : "bg-white/80 text-foreground/70 ring-1 ring-black/[0.06] hover:bg-[#189b8e]/10 hover:text-[#189b8e]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="ui-btn-secondary px-4 py-2 text-xs"
              >
                Сбросить
              </button>
            )}
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
              Категория
            </p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`rounded-xl px-3.5 py-2 text-sm font-bold transition ${
                    category === c
                      ? "bg-[#189b8e] text-white shadow-sm"
                      : "bg-white/80 text-foreground/70 ring-1 ring-black/[0.06] hover:bg-[#189b8e]/10 hover:text-[#189b8e]"
                  }`}
                >
                  {c === "ALL" ? "Все" : MATERIAL_CATEGORY_LABEL[c]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-panel p-8 text-center">
          <p className="text-base font-medium text-muted-foreground">
            Материалы не найдены. Попробуйте другое название или фильтр.
          </p>
          {hasFilters && (
            <button type="button" onClick={resetFilters} className="ui-btn-primary mt-5">
              Сбросить фильтры
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-10">
          {groups.map((group) => (
            <section key={group.category}>
              <CatalogSectionHeader title={group.title} count={group.items.length} />
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
                {group.items.map((m) => (
                  <WikiItemCard
                    key={m.id}
                    name={m.name}
                    image={m.image}
                    href={`/wiki/materials/${m.slug}`}
                    rarityStars={m.rarityStars}
                    fit="contain"
                    lore={m.lore}
                    fluid
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
