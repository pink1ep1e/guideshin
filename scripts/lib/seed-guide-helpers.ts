/**
 * Общие хелперы для seed-*-guide.ts
 * Импорт: import { ... } from "./lib/seed-guide-helpers";
 * (из scripts/) или "@/../scripts/lib/..." — удобнее относительный путь.
 */
import { Rarity, Element } from "@prisma/client";
import {
  type GuideRankedItem,
  type GuideTeamMember,
  uid,
} from "@/lib/guide-builder";
import { ELEMENT_SVG, type ElementKey } from "@/lib/genshin";
import type { CharacterMaterial } from "@/lib/character-materials";

export const STUB_IMAGE = "";

export type CharRow = {
  id: number;
  name: string;
  slug: string;
  image: string;
  element: Element;
  rarity: Rarity;
};
export type WeaponRow = { name: string; slug: string; image: string; rarity: Rarity };
export type ArtifactRow = { name: string; slug: string; image: string; rarity: Rarity };
export type MatRow = {
  name: string;
  slug: string;
  image: string;
  rarityStars: number | null;
  category: string | null;
};

export function createMissingLog() {
  const missingLog: string[] = [];
  const noteMissing = (kind: string, name: string) => {
    const line = `${kind}: ${name}`;
    if (!missingLog.includes(line)) missingLog.push(line);
  };
  return { missingLog, noteMissing };
}

export function rarityStars(r: Rarity): 4 | 5 {
  return r === "LEGEND" ? 5 : 4;
}

export function elIcon(element: Element | string, fallback: ElementKey = "GEO"): string {
  return ELEMENT_SVG[String(element) as ElementKey] || ELEMENT_SVG[fallback];
}

export function elLabel(element: Element | string): string {
  const map: Record<string, string> = {
    PYRO: "Пиро",
    HYDRO: "Гидро",
    ANEMO: "Анемо",
    ELECTRO: "Электро",
    DENDRO: "Дендро",
    CRYO: "Крио",
    GEO: "Гео",
  };
  return map[String(element)] || String(element);
}

export function findChar(bySlug: Map<string, CharRow>, byName: Map<string, CharRow>, ...keys: string[]) {
  for (const k of keys) {
    const hit = bySlug.get(k) || byName.get(k.toLowerCase());
    if (hit) return hit;
  }
  return undefined;
}

export function findWeapon(byName: Map<string, WeaponRow>, ...names: string[]) {
  for (const n of names) {
    const hit = byName.get(n.toLowerCase());
    if (hit) return hit;
  }
  for (const [k, w] of byName) {
    for (const n of names) {
      if (k.includes(n.toLowerCase()) || n.toLowerCase().includes(k)) return w;
    }
  }
  return undefined;
}

export function findArt(byName: Map<string, ArtifactRow>, ...names: string[]) {
  for (const n of names) {
    const hit = byName.get(n.toLowerCase());
    if (hit) return hit;
  }
  for (const [k, a] of byName) {
    for (const n of names) {
      if (k.includes(n.toLowerCase()) || n.toLowerCase().includes(k)) return a;
    }
  }
  return undefined;
}

export function findMat(mats: MatRow[], ...names: string[]) {
  for (const n of names) {
    const hit = mats.find((m) => m.name === n || m.name.includes(n) || n.includes(m.name.trim()));
    if (hit) return hit;
  }
  return undefined;
}

export function makeRankedHelpers(noteMissing: (kind: string, name: string) => void) {
  function rankedWeapon(
    w: WeaponRow | undefined,
    rank: number,
    fallbackName: string,
    subtitle: string,
    effect: string,
    verdict: string,
    tier?: string,
  ): GuideRankedItem {
    if (w) {
      return {
        id: uid(),
        rank,
        name: w.name,
        image: w.image || STUB_IMAGE,
        rarity: rarityStars(w.rarity),
        href: `/wiki/weapons/${w.slug}`,
        subtitle,
        effect,
        verdict,
        tier,
      };
    }
    noteMissing("weapon", fallbackName);
    return {
      id: uid(),
      rank,
      name: fallbackName,
      image: STUB_IMAGE,
      rarity: 4,
      subtitle: subtitle ? `${subtitle} · заглушка` : "заглушка",
      effect,
      verdict: `Заглушка — нет в БД. ${verdict}`,
      tier,
    };
  }

  function rankedArt(
    a: ArtifactRow | undefined,
    rank: number,
    fallbackName: string,
    subtitle: string,
    effect: string,
    verdict: string,
    tier?: string,
  ): GuideRankedItem {
    if (a) {
      return {
        id: uid(),
        rank,
        name: a.name,
        image: a.image || STUB_IMAGE,
        rarity: rarityStars(a.rarity),
        href: `/wiki/artifacts/${a.slug}`,
        subtitle,
        effect,
        verdict,
        tier,
      };
    }
    noteMissing("artifact", fallbackName);
    return {
      id: uid(),
      rank,
      name: fallbackName.includes("заглушка") ? fallbackName : `${fallbackName}`,
      image: STUB_IMAGE,
      rarity: 5,
      subtitle: subtitle ? `${subtitle} · заглушка` : "заглушка",
      effect,
      verdict: `Заглушка — нет в БД. ${verdict}`,
      tier,
    };
  }

  function teamMember(
    ch: CharRow | undefined,
    fallbackName: string,
    role?: string,
  ): GuideTeamMember {
    if (ch) {
      return {
        id: uid(),
        name: ch.name,
        image: ch.image || STUB_IMAGE,
        elementIcon: elIcon(ch.element),
        rarity: rarityStars(ch.rarity),
        href: `/wiki/characters/${ch.slug}`,
        role,
      };
    }
    noteMissing("character", fallbackName);
    return {
      id: uid(),
      name: fallbackName,
      image: STUB_IMAGE,
      elementIcon: ELEMENT_SVG.GEO,
      rarity: 4,
      role: role ? `${role} · заглушка` : "заглушка",
    };
  }

  function matCard(
    mat: MatRow | undefined,
    fallbackName: string,
    qty: number,
    category: CharacterMaterial["category"],
    rarityFallback = 1,
  ): CharacterMaterial {
    if (!mat) noteMissing("material", fallbackName);
    return {
      id: uid(),
      name: mat?.name || fallbackName,
      image: mat?.image || STUB_IMAGE,
      qty,
      category,
      rarityStars: mat?.rarityStars || rarityFallback,
    };
  }

  function artImg(a: ArtifactRow | undefined, fallbackName: string): string {
    if (a?.image) return a.image;
    noteMissing("artifact", fallbackName);
    return STUB_IMAGE;
  }

  return { rankedWeapon, rankedArt, teamMember, matCard, artImg };
}

export type TalentValues = { na: string[][]; sk: string[][]; bu: string[][] };

/** Достаёт rows из yatta-extracted.json → TalentValues по индексам строк. */
export function talentValuesFromExtracted(
  extractedPath: string,
  map: { na: number[]; sk: number[]; bu: number[] },
): TalentValues {
  const fs = require("fs") as typeof import("fs");
  const j = JSON.parse(fs.readFileSync(extractedPath, "utf8"));
  const pick = (talentKey: string, rowIdx: number[]) => {
    const rows = j.talents?.[talentKey]?.rows || [];
    return rowIdx.map((i) => rows[i]?.values || Array(13).fill(""));
  };
  return {
    na: pick("0", map.na),
    sk: pick("1", map.sk),
    bu: pick("3", map.bu),
  };
}
