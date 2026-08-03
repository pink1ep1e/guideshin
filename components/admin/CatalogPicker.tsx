"use client";

import { useDeferredValue, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Search, X } from "lucide-react";
import {
  ELEMENT_LABEL,
  ELEMENT_SVG,
  RARITY_LABEL,
  rarityBg,
  rarityStarsFromEnum,
  sortByRarityDesc,
} from "@/lib/genshin";

export type CatalogWeapon = {
  id: number;
  slug: string;
  name: string;
  image: string;
  rarity: "LEGEND" | "EPIC" | "RARE" | "COMMON";
  weaponType: string;
};
export type CatalogArtifact = {
  id: number;
  slug: string;
  name: string;
  image: string;
  rarity: "LEGEND" | "EPIC" | "RARE" | "COMMON";
};
export type CatalogMaterial = {
  id: number;
  slug: string;
  name: string;
  image: string;
  rarityStars: number;
  category: string;
};
export type CatalogCharacter = {
  id: number;
  slug: string;
  name: string;
  image: string;
  splashImage?: string | null;
  rarity: "LEGEND" | "EPIC" | "RARE" | "COMMON";
  element: string;
};

export type GuideCatalog = {
  characters: CatalogCharacter[];
  weapons: CatalogWeapon[];
  artifacts: CatalogArtifact[];
  materials: CatalogMaterial[];
};

let cache: GuideCatalog | null = null;

export function invalidateGuideCatalog() {
  cache = null;
}

export async function loadGuideCatalog(force = false): Promise<GuideCatalog> {
  if (cache && !force) return cache;
  const res = await fetch("/api/catalog", { cache: "no-store" });
  if (!res.ok) {
    return { characters: [], weapons: [], artifacts: [], materials: [] };
  }
  cache = (await res.json()) as GuideCatalog;
  return cache;
}

export function useGuideCatalog() {
  const [catalog, setCatalog] = useState<GuideCatalog>(
    cache ?? { characters: [], weapons: [], artifacts: [], materials: [] },
  );
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    loadGuideCatalog(true).then((data) => {
      if (!alive) return;
      setCatalog(data);
      setLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  return { catalog, loaded };
}

type Picked = {
  name: string;
  image: string;
  splashImage?: string;
  rarity: 4 | 5;
  href: string;
  element?: string;
  rarityStars?: number;
};

export type CatalogPickerKind =
  | "weapons"
  | "artifacts"
  | "materials"
  | "characters"
  /** Материалы и оружие (ковка). */
  | "materialsAndWeapons";

type PickerProps = {
  label: string;
  kind: CatalogPickerKind;
  catalog: GuideCatalog;
  onPick: (item: Picked) => void;
};

type ListItem = {
  key: string;
  slug: string;
  name: string;
  image: string;
  source: "weapons" | "artifacts" | "materials" | "characters";
  rawId: number;
  rarityStars: number;
  meta?: string;
  element?: string;
};

const RARITY_BADGE: Record<number, string> = {
  5: "bg-[#c9a227]/15 text-[#9a7b12]",
  4: "bg-[#8b5cf6]/15 text-[#6d28d9]",
  3: "bg-[#3b82f6]/12 text-[#1d4ed8]",
  2: "bg-[#64748b]/12 text-[#475569]",
  1: "bg-[#64748b]/10 text-[#64748b]",
};

function pickWeapon(w: CatalogWeapon): Picked {
  const stars = rarityStarsFromEnum(w.rarity);
  return {
    name: w.name,
    image: w.image,
    rarity: (stars >= 5 ? 5 : 4) as 4 | 5,
    rarityStars: stars,
    href: `/wiki/weapons/${w.slug}`,
  };
}

function pickMaterial(m: CatalogMaterial): Picked {
  return {
    name: m.name,
    image: m.image,
    rarity: Math.min(5, Math.max(4, m.rarityStars || 4)) as 4 | 5,
    href: `/wiki/materials/${m.slug}`,
    rarityStars: m.rarityStars,
  };
}

function pickFromItem(catalog: GuideCatalog, item: ListItem): Picked | null {
  if (item.source === "weapons") {
    const w = catalog.weapons.find((x) => x.id === item.rawId);
    return w ? pickWeapon(w) : null;
  }
  if (item.source === "artifacts") {
    const a = catalog.artifacts.find((x) => x.id === item.rawId);
    if (!a) return null;
    const stars = rarityStarsFromEnum(a.rarity);
    return {
      name: a.name,
      image: a.image,
      rarity: (stars >= 5 ? 5 : 4) as 4 | 5,
      rarityStars: stars,
      href: `/wiki/artifacts/${a.slug}`,
    };
  }
  if (item.source === "materials") {
    const m = catalog.materials.find((x) => x.id === item.rawId);
    return m ? pickMaterial(m) : null;
  }
  const c = catalog.characters.find((x) => x.id === item.rawId);
  if (!c) return null;
  return {
    name: c.name,
    image: c.image,
    splashImage: c.splashImage || undefined,
    rarity: c.rarity === "LEGEND" ? 5 : 4,
    href: `/wiki/characters/${c.slug}`,
    element: c.element,
    rarityStars: rarityStarsFromEnum(c.rarity),
  };
}

function buildList(kind: CatalogPickerKind, catalog: GuideCatalog): ListItem[] {
  if (kind === "weapons") {
    return sortByRarityDesc(
      catalog.weapons.map((w) => ({
        key: `w-${w.id}`,
        slug: w.slug,
        name: w.name,
        image: w.image,
        source: "weapons" as const,
        rawId: w.id,
        rarityStars: rarityStarsFromEnum(w.rarity),
        meta: w.weaponType,
      })),
      (w) => w.rarityStars,
      (w) => w.name,
    );
  }
  if (kind === "artifacts") {
    return sortByRarityDesc(
      catalog.artifacts.map((a) => ({
        key: `a-${a.id}`,
        slug: a.slug,
        name: a.name,
        image: a.image,
        source: "artifacts" as const,
        rawId: a.id,
        rarityStars: rarityStarsFromEnum(a.rarity),
      })),
      (a) => a.rarityStars,
      (a) => a.name,
    );
  }
  if (kind === "materials") {
    return sortByRarityDesc(
      catalog.materials.map((m) => ({
        key: `m-${m.id}`,
        slug: m.slug,
        name: m.name,
        image: m.image,
        source: "materials" as const,
        rawId: m.id,
        rarityStars: m.rarityStars || 1,
      })),
      (m) => m.rarityStars,
      (m) => m.name,
    );
  }
  if (kind === "characters") {
    return sortByRarityDesc(
      catalog.characters.map((c) => ({
        key: `c-${c.id}`,
        slug: c.slug,
        name: c.name,
        image: c.image,
        source: "characters" as const,
        rawId: c.id,
        rarityStars: rarityStarsFromEnum(c.rarity),
        element: c.element,
        meta: ELEMENT_LABEL[c.element] || c.element,
      })),
      (c) => c.rarityStars,
      (c) => c.name,
    );
  }
  const materials = catalog.materials.map((m) => ({
    key: `m-${m.id}`,
    slug: m.slug,
    name: m.name,
    image: m.image,
    source: "materials" as const,
    rawId: m.id,
    rarityStars: m.rarityStars || 1,
    meta: "мат.",
  }));
  const weapons = catalog.weapons.map((w) => ({
    key: `w-${w.id}`,
    slug: w.slug,
    name: w.name,
    image: w.image,
    source: "weapons" as const,
    rawId: w.id,
    rarityStars: rarityStarsFromEnum(w.rarity),
    meta: w.weaponType,
  }));
  return sortByRarityDesc(
    [...materials, ...weapons],
    (x) => x.rarityStars,
    (x) => x.name,
  );
}

function rarityFiltersFor(kind: CatalogPickerKind, list: ListItem[]): number[] {
  const set = new Set(list.map((i) => i.rarityStars).filter((n) => n >= 1 && n <= 5));
  if (kind === "weapons" || kind === "artifacts" || kind === "materialsAndWeapons") {
    return [5, 4, 3, 2].filter((n) => set.has(n));
  }
  if (kind === "characters") return [5, 4].filter((n) => set.has(n));
  return [5, 4, 3, 2, 1].filter((n) => set.has(n));
}

/** Поиск по базе с вводом имени. */
export function CatalogPicker({ label, kind, catalog, onPick }: PickerProps) {
  const list = useMemo(() => buildList(kind, catalog), [kind, catalog]);

  const [query, setQuery] = useState("");
  const [rarityFilter, setRarityFilter] = useState<number | "ALL">("ALL");
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number; maxHeight: number } | null>(
    null,
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const deferred = useDeferredValue(query.trim().toLowerCase());

  const rarityOptions = useMemo(() => rarityFiltersFor(kind, list), [kind, list]);

  const filtered = useMemo(() => {
    let next = list;
    if (rarityFilter !== "ALL") {
      next = next.filter((item) => item.rarityStars === rarityFilter);
    }
    if (!deferred) return next.slice(0, 120);
    return next
      .filter(
        (item) =>
          item.name.toLowerCase().includes(deferred) ||
          item.slug.toLowerCase().includes(deferred) ||
          (item.meta && item.meta.toLowerCase().includes(deferred)),
      )
      .slice(0, 200);
  }, [list, deferred, rarityFilter]);

  useEffect(() => {
    setMounted(true);
  }, []);

  function updatePosition() {
    const el = inputRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const gap = 6;
    const spaceBelow = window.innerHeight - rect.bottom - gap - 12;
    setPos({
      top: rect.bottom + gap,
      left: rect.left,
      width: Math.max(rect.width, 280),
      maxHeight: Math.min(340, Math.max(160, spaceBelow)),
    });
  }

  useEffect(() => {
    if (!open) return;
    updatePosition();
    function onScrollOrResize() {
      updatePosition();
    }
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (rootRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (list.length === 0) {
    return (
      <p className="rounded-xl bg-[#0b1f44]/[0.03] px-3 py-2 text-xs font-medium text-muted-foreground">
        В базе пока нет записей для «{label}». Создайте их во вкладках админки.
      </p>
    );
  }

  const menu =
    open && mounted && pos
      ? createPortal(
          <div
            ref={menuRef}
            id={listId}
            role="listbox"
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              width: pos.width,
              maxHeight: pos.maxHeight,
              zIndex: 9999,
            }}
            className="flex flex-col overflow-hidden rounded-[16px] border border-black/[0.06] bg-white shadow-panel"
          >
            {rarityOptions.length > 1 && (
              <div className="flex flex-wrap gap-1.5 border-b border-black/[0.05] bg-[#f7f8fa] px-2.5 py-2">
                <button
                  type="button"
                  onClick={() => setRarityFilter("ALL")}
                  className={`rounded-lg px-2 py-1 text-[11px] font-bold transition ${
                    rarityFilter === "ALL"
                      ? "bg-[#189b8e] text-white"
                      : "bg-white text-muted-foreground ring-1 ring-black/[0.06] hover:text-[#189b8e]"
                  }`}
                >
                  Все
                </button>
                {rarityOptions.map((stars) => (
                  <button
                    key={stars}
                    type="button"
                    onClick={() => setRarityFilter(stars)}
                    className={`rounded-lg px-2 py-1 text-[11px] font-bold transition ${
                      rarityFilter === stars
                        ? "bg-[#189b8e] text-white"
                        : `bg-white ring-1 ring-black/[0.06] hover:ring-[#189b8e]/35 ${RARITY_BADGE[stars] || ""}`
                    }`}
                  >
                    {stars}★
                  </button>
                ))}
              </div>
            )}

            <div className="min-h-0 flex-1 overflow-auto p-1.5">
              {filtered.length === 0 ? (
                <p className="px-3 py-3 text-sm font-medium text-muted-foreground">
                  Ничего не найдено{query.trim() ? ` по «${query.trim()}»` : ""}
                </p>
              ) : (
                filtered.map((item) => {
                  const stars = item.rarityStars;
                  const badge = RARITY_BADGE[stars] || RARITY_BADGE[1];
                  return (
                    <button
                      key={item.key}
                      type="button"
                      role="option"
                      onClick={() => {
                        const picked = pickFromItem(catalog, item);
                        if (picked) onPick(picked);
                        setQuery("");
                        setOpen(false);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition hover:bg-[#189b8e]/10"
                    >
                      <span
                        className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-cover bg-center ring-1 ring-black/[0.06]"
                        style={{ backgroundImage: `url(${rarityBg(stars)})` }}
                      >
                        {item.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.image}
                            alt=""
                            className="h-[88%] w-[88%] object-contain"
                          />
                        ) : (
                          <span className="text-[9px] font-bold text-muted-foreground">—</span>
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-foreground">
                          {item.name}
                        </span>
                        {item.meta || item.element ? (
                          <span className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                            {item.element && ELEMENT_SVG[item.element] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={ELEMENT_SVG[item.element]}
                                alt=""
                                className="h-3 w-3"
                              />
                            ) : null}
                            {item.meta}
                          </span>
                        ) : null}
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-extrabold tabular-nums ${badge}`}
                      >
                        {RARITY_LABEL[
                          stars === 5
                            ? "LEGEND"
                            : stars === 4
                              ? "EPIC"
                              : stars === 3
                                ? "RARE"
                                : "COMMON"
                        ] || `${stars}★`}
                      </span>
                      {kind === "materialsAndWeapons" ? (
                        <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                          {item.source === "weapons" ? "оружие" : "мат."}
                        </span>
                      ) : (
                        <Check className="h-3.5 w-3.5 shrink-0 text-[#189b8e] opacity-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className="relative">
      <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </p>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#189b8e]" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          placeholder="Имя, тип или slug…"
          aria-controls={listId}
          aria-expanded={open}
          aria-autocomplete="list"
          onFocus={() => {
            setOpen(true);
            updatePosition();
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          className="w-full rounded-[14px] border border-black/[0.08] bg-white/95 py-2 pl-9 pr-9 text-sm font-semibold text-foreground shadow-sm outline-none transition placeholder:font-medium placeholder:text-muted-foreground focus:border-[#189b8e]/50 focus:ring-2 focus:ring-[#189b8e]/20"
        />
        {query && (
          <button
            type="button"
            className="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-[#189b8e]/10 hover:text-[#189b8e]"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            aria-label="Очистить"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {menu}
    </div>
  );
}
