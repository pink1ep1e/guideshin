import { normalizeWishRow, type NormalizedWish } from "@/lib/wishes";
import {
  localizeWishLookupKey,
  wishEnToRuEntries,
} from "@/lib/wish-guide-links";

const PAIMON_BANNER_KEYS: Record<string, string> = {
  "wish-counter-character-event": "301",
  "wish-counter-weapon-event": "302",
  "wish-counter-standard": "200",
  "wish-counter-chronicled": "500",
  "wish-counter-novice": "100",
};

/** paimon id → ключ для поиска RU-имени в каталоге Guideshin */
const PAIMON_ID_ALIASES: Record<string, string[]> = {
  raiden_shogun: ["райдэн", "shougun", "raiden"],
  raiden: ["райдэн", "shougun"],
  kaedehara_kazuha: ["кадзуха", "kazuha"],
  kazuha: ["кадзуха", "kazuha"],
  hu_tao: ["ху тао", "hutao"],
  hutao: ["ху тао", "hutao"],
  yae_miko: ["яэ мико", "yae"],
  sangonomiya_kokomi: ["кокоми", "kokomi"],
  kamisato_ayaka: ["аяка", "ayaka"],
  kamisato_ayato: ["аято", "ayato"],
  arataki_itto: ["итто", "itto"],
  shikanoin_heizou: ["хэйдзо", "heizou"],
  kujou_sara: ["сара", "sara"],
  kuki_shinobu: ["синобу", "shinobu"],
  yumemizuki_mizuki: ["мидзуки", "mizuki"],
  staff_of_homa: ["посох хомы", "posoh-homy"],
  skyward_blade: ["небесный меч", "nebesnyj-mech"],
  skyward_spine: ["небесная ось", "nebesnaya-os"],
  skyward_atlas: ["небесный атлас", "nebesnyj-atlas"],
  skyward_harp: ["небесное крыло", "nebesnoe-krylo"],
  skyward_pride: ["небесное величие", "nebesnoe-velichie"],
  emerald_orb: ["изумрудный шар", "izumrudnyj-shar"],
  black_tassel: ["чёрная кисть", "chyornaya-kist"],
  debate_club: ["дубина переговоров", "club"],
  thrilling_tales_of_dragon_slayers: ["эпические сказания", "thrilling"],
  primordial_jade_winged_spear: ["нефритовый крылатый", "primordial"],
  redhorn_stonethresher: ["краснорогий", "redhorn"],
  the_widsith: ["песнь разбитых струн", "widsith"],
  rust: ["ржавый лук", "rust"],
  the_flute: ["флейта", "flute"],
  the_bell: ["меч-колокол", "bell"],
  rainslasher: ["дождерез", "rainslasher"],
  favonius_warbow: ["боевой лук фавония", "favonius"],
  favonius_greatsword: ["двуручный меч фавония"],
  favonius_sword: ["меч фавония"],
  favonius_lance: ["копьё фавония"],
  favonius_codex: ["кодекс фавония"],
  sacrificial_sword: ["церемониальный меч"],
  sacrificial_greatsword: ["церемониальный двуручный"],
  sacrificial_bow: ["церемониальный лук"],
  sacrificial_fragments: ["церемониальные мемуары"],
  lions_roar: ["львиный рёв"],
  dragon_bane: ["гром дракона"],
  eye_of_perception: ["острый глаз"],
  blackcliff: ["чёрного обсидиана"],
};

export type PaimonRarityLookup = {
  byKey: Map<string, { rank: string; name: string; image?: string | null }>;
};

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[''`´]/g, "")
    .replace(/[_./]+/g, " ")
    .replace(/-+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compact(s: string): string {
  return norm(s).replace(/\s+/g, "");
}

function paimonIdToSlug(id: string): string {
  return id.trim().toLowerCase().replace(/_/g, "-");
}

function titleFromId(id: string): string {
  return id
    .split(/[_-]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function addKeys(
  map: PaimonRarityLookup["byKey"],
  keys: string[],
  entry: { rank: string; name: string; image?: string | null },
) {
  for (const k of keys) {
    const a = norm(k);
    const b = compact(k);
    if (a) map.set(a, entry);
    if (b) map.set(b, entry);
    map.set(a.replace(/\s+/g, "-"), entry);
    map.set(a.replace(/\s+/g, "_"), entry);
  }
}

export function buildPaimonRarityLookup(input: {
  characters: {
    slug: string;
    name: string;
    rarity: string;
    image?: string | null;
  }[];
  weapons: {
    slug: string;
    name: string;
    rarity: string;
    image?: string | null;
  }[];
}): PaimonRarityLookup {
  const byKey = new Map<
    string,
    { rank: string; name: string; image?: string | null }
  >();

  const rarityToRank = (r: string) => {
    if (r === "LEGEND") return "5";
    if (r === "EPIC") return "4";
    if (r === "RARE") return "3";
    return "3";
  };

  for (const c of input.characters) {
    const entry = {
      rank: rarityToRank(c.rarity),
      name: c.name,
      image: c.image,
    };
    addKeys(byKey, [c.slug, c.name, c.slug.replace(/-/g, " ")], entry);
  }
  for (const w of input.weapons) {
    const entry = {
      rank: rarityToRank(w.rarity),
      name: w.name,
      image: w.image,
    };
    addKeys(byKey, [w.slug, w.name, w.slug.replace(/-/g, " ")], entry);
  }

  // Явные алиасы paimon → RU
  for (const [paimonId, aliases] of Object.entries(PAIMON_ID_ALIASES)) {
    let hit: { rank: string; name: string; image?: string | null } | undefined;
    for (const a of aliases) {
      hit =
        byKey.get(norm(a)) ||
        byKey.get(compact(a)) ||
        byKey.get(a.replace(/\s+/g, "-"));
      if (hit) break;
    }
    if (!hit) {
      const loc = localizeWishLookupKey(paimonId);
      hit = byKey.get(norm(loc)) || byKey.get(compact(loc));
    }
    if (!hit) continue;
    addKeys(byKey, [paimonId, paimonId.replace(/_/g, "-"), ...aliases], hit);
  }

  // EN-словарь → записи каталога (в т.ч. для id вида staff_of_homa)
  for (const [en, ru] of wishEnToRuEntries()) {
    const hit = byKey.get(norm(ru)) || byKey.get(compact(ru));
    if (!hit) continue;
    addKeys(byKey, [en, en.replace(/\s+/g, "_"), en.replace(/\s+/g, "-")], hit);
  }

  return { byKey };
}

function resolveFromLookup(id: string, lookup?: PaimonRarityLookup) {
  if (!lookup) return null;
  const slug = paimonIdToSlug(id);
  const localized = localizeWishLookupKey(id);
  const candidates = [
    norm(id),
    compact(id),
    norm(slug),
    compact(slug),
    norm(localized),
    compact(localized),
    // last token: kaedehara_kazuha → kazuha
    norm(id.split(/[_-]/).slice(-1)[0] || ""),
    compact(id.split(/[_-]/).slice(-1)[0] || ""),
  ];
  for (const c of candidates) {
    if (!c) continue;
    const hit = lookup.byKey.get(c);
    if (hit) return hit;
  }
  const aliases =
    PAIMON_ID_ALIASES[id] || PAIMON_ID_ALIASES[id.replace(/-/g, "_")];
  if (aliases) {
    for (const a of aliases) {
      const hit = lookup.byKey.get(norm(a)) || lookup.byKey.get(compact(a));
      if (hit) return hit;
    }
  }
  return null;
}

/**
 * Редкость из каталога. Поле `rate` у paimon.moe — исход 50:50 (0/1/2), НЕ редкость.
 * Pity: у 4★ обычно 1–10, у 5★ 1–90 (ранний 5★ тоже может быть ≤10).
 */
function rankFromPaimonPull(
  pull: { id?: string; pity?: number },
  lookup?: PaimonRarityLookup,
): string {
  const hit = resolveFromLookup(String(pull.id || ""), lookup);
  if (hit) return hit.rank;
  const pity = Number(pull.pity) || 0;
  if (pity > 10) return "5";
  if (pity >= 1) return "4";
  return "3";
}

const KNOWN_GACHA_TYPES = new Set([
  "100",
  "200",
  "301",
  "302",
  "400",
  "500",
]);

export type PaimonParseProgress = {
  bannerLabel: string;
  step: number;
  steps: number;
  processed: number;
  totalApprox: number;
};

/** Разбор экспорта paimon.moe с прогрессом. */
export function parsePaimonMoeExport(
  payload: unknown,
  lookup?: PaimonRarityLookup,
  onProgress?: (p: PaimonParseProgress) => void,
): NormalizedWish[] {
  if (!payload || typeof payload !== "object") return [];
  const obj = payload as Record<string, unknown>;

  const hasPaimon =
    "wish-counter-character-event" in obj ||
    "wish-counter-standard" in obj ||
    "wish-counter-weapon-event" in obj;
  if (!hasPaimon) return [];

  const bannerEntries = Object.entries(PAIMON_BANNER_KEYS);
  let totalApprox = 0;
  for (const [key] of bannerEntries) {
    const block = obj[key];
    const pulls = (block as { pulls?: unknown } | undefined)?.pulls;
    if (Array.isArray(pulls)) totalApprox += pulls.length;
  }

  const out: NormalizedWish[] = [];
  const seen = new Set<string>();
  let processed = 0;
  const labels: Record<string, string> = {
    "wish-counter-character-event": "Ивент персонажей",
    "wish-counter-weapon-event": "Ивент оружия",
    "wish-counter-standard": "Стандарт",
    "wish-counter-chronicled": "Хроники",
    "wish-counter-novice": "Новичок",
  };

  bannerEntries.forEach(([key, defaultGacha], bi) => {
    const block = obj[key];
    if (!block || typeof block !== "object") return;
    const pulls = (block as { pulls?: unknown }).pulls;
    if (!Array.isArray(pulls)) return;

    onProgress?.({
      bannerLabel: labels[key] || key,
      step: bi + 1,
      steps: bannerEntries.length,
      processed,
      totalApprox,
    });

    pulls.forEach((raw, index) => {
      if (!raw || typeof raw !== "object") return;
      const p = raw as {
        id?: string;
        type?: string;
        code?: string | number;
        time?: string;
        pity?: number;
        rate?: number;
      };
      if (!p.id || !p.time) return;

      const resolved = resolveFromLookup(p.id, lookup);
      const display = resolved?.name || titleFromId(p.id);
      const codeStr = p.code != null ? String(p.code) : "";
      const gachaType = KNOWN_GACHA_TYPES.has(codeStr)
        ? codeStr
        : defaultGacha;
      const itemType = /weapon/i.test(String(p.type))
        ? "Weapon"
        : /character/i.test(String(p.type))
          ? "Character"
          : defaultGacha === "302"
            ? "Weapon"
            : "Character";
      const rankType = rankFromPaimonPull(p, lookup);
      const slug = paimonIdToSlug(p.id);
      const hoyoId = `paimon-${gachaType}-${p.time.replace(/\s+/g, "T")}-${slug}-${index}`;

      const n = normalizeWishRow({
        id: hoyoId,
        gacha_type: gachaType,
        name: display,
        item_type: itemType,
        rank_type: rankType,
        time: p.time,
        paimon_rate: p.rate,
        paimon_id: p.id,
      });
      processed += 1;
      if (processed % 40 === 0 || index === pulls.length - 1) {
        onProgress?.({
          bannerLabel: labels[key] || key,
          step: bi + 1,
          steps: bannerEntries.length,
          processed,
          totalApprox,
        });
      }
      if (!n || seen.has(n.hoyoId)) return;
      seen.add(n.hoyoId);
      out.push(n);
    });
  });

  onProgress?.({
    bannerLabel: "Готово",
    step: bannerEntries.length,
    steps: bannerEntries.length,
    processed: out.length,
    totalApprox: out.length,
  });

  return out;
}

export function isPaimonMoeExport(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") return false;
  const obj = payload as Record<string, unknown>;
  return (
    "wish-counter-character-event" in obj ||
    "wish-counter-standard" in obj ||
    "wish-counter-weapon-event" in obj
  );
}
