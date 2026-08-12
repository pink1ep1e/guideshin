"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import ArtifactCard from "@/components/ArtifactCard";
import CatalogSectionHeader from "@/components/CatalogSectionHeader";
import { sortByRarityDesc } from "@/lib/genshin";
import { groupByRegion, regionSectionTitle } from "@/lib/regions";

export type ArtifactItem = {
  name: string;
  img: string;
  href: string;
  rarity?: 4 | 5;
  region?: string | null;
  lore?: string | null;
};

type RarityFilter = "ALL" | 4 | 5;

export default function ArtifactCatalog({ artifacts }: { artifacts: ArtifactItem[] }) {
  const [query, setQuery] = useState("");
  const [rarity, setRarity] = useState<RarityFilter>("ALL");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const filtered = useMemo(() => {
    const list = artifacts.filter((a) => {
      const itemRarity = a.rarity ?? 5;
      if (rarity !== "ALL" && itemRarity !== rarity) return false;
      if (!deferredQuery) return true;
      return a.name.toLowerCase().includes(deferredQuery);
    });
    return sortByRarityDesc(list, (a) => a.rarity ?? 5, (a) => a.name);
  }, [artifacts, deferredQuery, rarity]);

  const groups = useMemo(
    () => groupByRegion(filtered, (a) => a.region),
    [filtered],
  );

  const hasFilters = query.length > 0 || rarity !== "ALL";

  function resetFilters() {
    setQuery("");
    setRarity("ALL");
  }

  return (
    <div className="space-y-6">
      <div className="glass-panel relative overflow-hidden p-5 sm:p-6">
        <span className="pointer-events-none absolute -left-10 -bottom-10 h-36 w-36 rounded-full bg-[#189b8e]/10 blur-2xl" />
        <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#189b8e] to-[#67d5cc]" />

        <div className="relative space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#189b8e]" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по названию сета…"
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

          <div className="flex flex-wrap items-center justify-between gap-3">
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
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-panel p-8 text-center">
          <p className="text-base font-medium text-muted-foreground">
            Сетов не найдено. Попробуйте другое название.
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
            <section key={group.region}>
              <CatalogSectionHeader
                title={regionSectionTitle("artifacts", group.region)}
                count={group.items.length}
              />
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
                {group.items.map((a) => (
                  <ArtifactCard
                    key={`${a.href}-${a.name}`}
                    name={a.name}
                    img={a.img}
                    href={a.href}
                    rarity={a.rarity ?? 5}
                    lore={a.lore}
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
