"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import WikiItemCard from "@/components/WikiItemCard";
import CatalogSectionHeader from "@/components/CatalogSectionHeader";
import { rarityStarsFromEnum, sortByRarityDesc } from "@/lib/genshin";
import { groupByWeaponType, WEAPON_TYPE_ORDER } from "@/lib/regions";
import type { WeaponHoverMeta } from "@/lib/wiki-guide-data";

export type WeaponCatalogItem = {
  id: number;
  slug: string;
  name: string;
  image: string;
  rarity: string;
  weaponType: string;
  lore?: string | null;
  weaponMeta?: WeaponHoverMeta | null;
};

const WEAPON_TYPES = ["Все", ...WEAPON_TYPE_ORDER] as const;

type RarityFilter = "ALL" | 5 | 4 | 3 | 2;

export default function WeaponCatalog({ weapons }: { weapons: WeaponCatalogItem[] }) {
  const [query, setQuery] = useState("");
  const [rarity, setRarity] = useState<RarityFilter>("ALL");
  const [type, setType] = useState<(typeof WEAPON_TYPES)[number]>("Все");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const filtered = useMemo(() => {
    const list = weapons.filter((w) => {
      const stars = rarityStarsFromEnum(w.rarity);
      if (rarity !== "ALL" && stars !== rarity && !(rarity === 2 && stars <= 2)) return false;
      if (type !== "Все" && w.weaponType !== type) return false;
      if (!deferredQuery) return true;
      return (
        w.name.toLowerCase().includes(deferredQuery) ||
        w.slug.toLowerCase().includes(deferredQuery) ||
        w.weaponType.toLowerCase().includes(deferredQuery)
      );
    });
    return sortByRarityDesc(list, (w) => w.rarity, (w) => w.name);
  }, [weapons, deferredQuery, rarity, type]);

  const groups = useMemo(
    () => groupByWeaponType(filtered, (w) => w.weaponType),
    [filtered],
  );

  const hasFilters = query.length > 0 || rarity !== "ALL" || type !== "Все";

  function resetFilters() {
    setQuery("");
    setRarity("ALL");
    setType("Все");
  }

  return (
    <div className="space-y-6">
      <div className="glass-panel relative overflow-hidden p-5 sm:p-6">
        <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#189b8e] to-[#67d5cc]" />

        <div className="relative space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#189b8e]" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по названию оружия…"
              className="w-full rounded-[16px] border border-black/[0.06] bg-card py-3.5 pl-11 pr-11 text-sm font-medium text-foreground outline-none ring-[#189b8e]/25 placeholder:text-muted-foreground focus:ring-2"
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
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={String(value)}
                    type="button"
                    onClick={() => setRarity(value)}
                    className={`rounded-xl px-3.5 py-2 text-sm font-bold transition ${
                      rarity === value
                        ? "bg-[#189b8e] text-white shadow-sm"
                        : "bg-black/[0.03] text-foreground/70 ring-1 ring-black/[0.06] hover:bg-[#189b8e]/10 hover:text-[#189b8e] dark:bg-white/[0.06] dark:ring-white/10"
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
              Тип
            </p>
            <div className="flex flex-wrap gap-2">
              {WEAPON_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`rounded-xl px-3.5 py-2 text-sm font-bold transition ${
                    type === t
                      ? "bg-[#189b8e] text-white shadow-sm"
                      : "bg-black/[0.03] text-foreground/70 ring-1 ring-black/[0.06] hover:bg-[#189b8e]/10 hover:text-[#189b8e] dark:bg-white/[0.06] dark:ring-white/10"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-panel p-8 text-center">
          <p className="text-base font-medium text-muted-foreground">
            Оружие не найдено. Попробуйте другое название или фильтр.
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
            <section key={group.type}>
              <CatalogSectionHeader title={group.title} count={group.items.length} />
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
                {group.items.map((w) => (
                  <WikiItemCard
                    key={w.id}
                    name={w.name}
                    image={w.image}
                    href={`/wiki/weapons/${w.slug}`}
                    rarityStars={rarityStarsFromEnum(w.rarity)}
                    fit="contain"
                    weaponMeta={w.weaponMeta}
                    fluid
                    preview
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
