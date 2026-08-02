"use client";

import { useDeferredValue, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Search, X } from "lucide-react";

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
};

function pickWeapon(w: CatalogWeapon): Picked {
  const stars =
    w.rarity === "LEGEND" ? 5 : w.rarity === "EPIC" ? 4 : w.rarity === "RARE" ? 3 : 2;
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
    const stars =
      a.rarity === "LEGEND" ? 5 : a.rarity === "EPIC" ? 4 : a.rarity === "RARE" ? 3 : 2;
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
    rarityStars: c.rarity === "LEGEND" ? 5 : c.rarity === "EPIC" ? 4 : c.rarity === "RARE" ? 3 : 2,
  };
}

function buildList(kind: CatalogPickerKind, catalog: GuideCatalog): ListItem[] {
  if (kind === "weapons") {
    return catalog.weapons.map((w) => ({
      key: `w-${w.id}`,
      slug: w.slug,
      name: w.name,
      image: w.image,
      source: "weapons" as const,
      rawId: w.id,
    }));
  }
  if (kind === "artifacts") {
    return catalog.artifacts.map((a) => ({
      key: `a-${a.id}`,
      slug: a.slug,
      name: a.name,
      image: a.image,
      source: "artifacts" as const,
      rawId: a.id,
    }));
  }
  if (kind === "materials") {
    return catalog.materials.map((m) => ({
      key: `m-${m.id}`,
      slug: m.slug,
      name: m.name,
      image: m.image,
      source: "materials" as const,
      rawId: m.id,
    }));
  }
  if (kind === "characters") {
    return catalog.characters.map((c) => ({
      key: `c-${c.id}`,
      slug: c.slug,
      name: c.name,
      image: c.image,
      source: "characters" as const,
      rawId: c.id,
    }));
  }
  const materials = catalog.materials.map((m) => ({
    key: `m-${m.id}`,
    slug: m.slug,
    name: m.name,
    image: m.image,
    source: "materials" as const,
    rawId: m.id,
  }));
  const weapons = catalog.weapons.map((w) => ({
    key: `w-${w.id}`,
    slug: w.slug,
    name: w.name,
    image: w.image,
    source: "weapons" as const,
    rawId: w.id,
  }));
  return [...materials, ...weapons].sort((a, b) =>
    a.name.localeCompare(b.name, "ru", { sensitivity: "base" }),
  );
}

/** Поиск по базе с вводом имени. */
export function CatalogPicker({ label, kind, catalog, onPick }: PickerProps) {
  const list = useMemo(() => buildList(kind, catalog), [kind, catalog]);

  const [query, setQuery] = useState("");
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

  const filtered = useMemo(() => {
    if (!deferred) return list.slice(0, 120);
    return list
      .filter(
        (item) =>
          item.name.toLowerCase().includes(deferred) ||
          item.slug.toLowerCase().includes(deferred),
      )
      .slice(0, 200);
  }, [list, deferred]);

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
      width: rect.width,
      maxHeight: Math.min(280, Math.max(140, spaceBelow)),
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
            className="overflow-auto rounded-[16px] border border-black/[0.06] bg-white p-1.5 shadow-panel"
          >
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-sm font-medium text-muted-foreground">
                Ничего не найдено по «{query.trim()}»
              </p>
            ) : (
              filtered.map((item) => (
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
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-foreground transition hover:bg-[#189b8e]/10 hover:text-[#189b8e]"
                >
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt="" className="h-6 w-6 shrink-0 rounded object-contain" />
                  ) : (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[#0b1f44]/[0.06] text-[9px] font-bold text-muted-foreground">
                      —
                    </span>
                  )}
                  <span className="min-w-0 flex-1 truncate">{item.name}</span>
                  {kind === "materialsAndWeapons" ? (
                    <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                      {item.source === "weapons" ? "оружие" : "мат."}
                    </span>
                  ) : (
                    <Check className="h-3.5 w-3.5 shrink-0 opacity-0" />
                  )}
                </button>
              ))
            )}
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
          placeholder="Начните вводить имя…"
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
