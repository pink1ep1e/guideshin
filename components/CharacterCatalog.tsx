"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import CharacterCard, { type CharacterCardData } from "@/components/CharacterCard";
import CatalogSectionHeader from "@/components/CatalogSectionHeader";
import {
  ELEMENT_LABEL,
  ELEMENT_SVG,
  ELEMENT_THEME,
  sortByRarityDesc,
  type ElementKey,
} from "@/lib/genshin";
import { groupByRegion, regionSectionTitle } from "@/lib/regions";

const ELEMENTS: ElementKey[] = [
  "PYRO",
  "HYDRO",
  "ANEMO",
  "ELECTRO",
  "DENDRO",
  "CRYO",
  "GEO",
];

type RarityFilter = "ALL" | "LEGEND" | "EPIC";

export default function CharacterCatalog({
  characters,
}: {
  characters: CharacterCardData[];
}) {
  const [query, setQuery] = useState("");
  const [element, setElement] = useState<ElementKey | "ALL">("ALL");
  const [rarity, setRarity] = useState<RarityFilter>("ALL");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const filtered = useMemo(() => {
    const list = characters.filter((c) => {
      if (element !== "ALL" && c.element.toUpperCase() !== element) return false;
      if (rarity !== "ALL" && c.rarity !== rarity) return false;
      if (!deferredQuery) return true;
      return (
        c.name.toLowerCase().includes(deferredQuery) ||
        c.slug.toLowerCase().includes(deferredQuery)
      );
    });
    return sortByRarityDesc(list, (c) => c.rarity, (c) => c.name);
  }, [characters, deferredQuery, element, rarity]);

  const groups = useMemo(
    () => groupByRegion(filtered, (c) => c.region),
    [filtered],
  );

  const hasFilters = query.length > 0 || element !== "ALL" || rarity !== "ALL";

  function resetFilters() {
    setQuery("");
    setElement("ALL");
    setRarity("ALL");
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
              placeholder="Поиск по имени персонажа…"
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

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
              Стихия
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setElement("ALL")}
                className={`rounded-xl px-3.5 py-2 text-sm font-bold transition ${
                  element === "ALL"
                    ? "bg-[#189b8e] text-white shadow-sm"
                    : "bg-black/[0.03] text-foreground/70 ring-1 ring-black/[0.06] hover:bg-[#189b8e]/10 hover:text-[#189b8e] dark:bg-white/[0.06] dark:ring-white/10"
                }`}
              >
                Все
              </button>
              {ELEMENTS.map((key) => {
                const active = element === key;
                const theme = ELEMENT_THEME[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setElement(active ? "ALL" : key)}
                    className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition ring-1 ${
                      active
                        ? ""
                        : "bg-black/[0.03] ring-black/[0.06] hover:bg-[#189b8e]/10 dark:bg-white/[0.06] dark:ring-white/10"
                    }`}
                    style={
                      active
                        ? {
                            backgroundColor: theme.solid,
                            color: theme.onSolid,
                            boxShadow: `0 0 0 1px ${theme.solid}`,
                            borderColor: "transparent",
                          }
                        : {
                            color: theme.accent,
                          }
                    }
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ELEMENT_SVG[key]}
                      alt=""
                      className={`h-4 w-4 ${active ? "brightness-0 invert drop-shadow-sm" : ""}`}
                    />
                    {ELEMENT_LABEL[key]}
                  </button>
                );
              })}
            </div>
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
                    ["LEGEND", "5★"],
                    ["EPIC", "4★"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
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
            Никого не нашли. Попробуйте другое имя или стихию.
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
                title={regionSectionTitle("characters", group.region)}
                count={group.items.length}
              />
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
                {group.items.map((c) => (
                  <CharacterCard key={c.slug} character={c} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
