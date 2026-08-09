import { normalizeWishRow, type NormalizedWish } from "@/lib/wishes";

const PAIMON_BANNER_KEYS: Record<string, string> = {
  "wish-counter-character-event": "301",
  "wish-counter-weapon-event": "302",
  "wish-counter-standard": "200",
  "wish-counter-chronicled": "500",
  "wish-counter-novice": "100",
};

export type PaimonRarityLookup = {
  /** slug or paimon id → 3|4|5 */
  bySlug: Map<string, string>;
  /** display name by slug */
  nameBySlug: Map<string, string>;
};

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

function rankFromPaimonPull(
  pull: { id?: string; type?: string; rate?: number; pity?: number },
  lookup?: PaimonRarityLookup,
): string {
  const slug = paimonIdToSlug(String(pull.id || ""));
  const fromDb = lookup?.bySlug.get(slug);
  if (fromDb) return fromDb;

  // rate есть у 4★/5★ в paimon; у 3★ обычно undefined
  if (pull.rate === undefined || pull.rate === null) return "3";

  const pity = Number(pull.pity) || 0;
  // 5★ почти всегда pity > 10; 4★ часто на 10
  if (pity > 10) return "5";
  return "4";
}

/** Разбор экспорта paimon.moe (paimon-moe-local-data.json). */
export function parsePaimonMoeExport(
  payload: unknown,
  lookup?: PaimonRarityLookup,
): NormalizedWish[] {
  if (!payload || typeof payload !== "object") return [];
  const obj = payload as Record<string, unknown>;

  const hasPaimon =
    "wish-counter-character-event" in obj ||
    "wish-counter-standard" in obj ||
    "wish-counter-weapon-event" in obj;
  if (!hasPaimon) return [];

  const out: NormalizedWish[] = [];
  const seen = new Set<string>();

  for (const [key, defaultGacha] of Object.entries(PAIMON_BANNER_KEYS)) {
    const block = obj[key];
    if (!block || typeof block !== "object") continue;
    const pulls = (block as { pulls?: unknown }).pulls;
    if (!Array.isArray(pulls)) continue;

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

      const slug = paimonIdToSlug(p.id);
      const display =
        lookup?.nameBySlug.get(slug) || titleFromId(p.id);
      const gachaType = String(p.code ?? defaultGacha);
      const itemType =
        /weapon/i.test(String(p.type)) || defaultGacha === "302"
          ? "Weapon"
          : "Character";
      const rankType = rankFromPaimonPull(p, lookup);
      const hoyoId = `paimon-${gachaType}-${p.time.replace(/\s+/g, "T")}-${slug}-${index}`;

      const n = normalizeWishRow({
        id: hoyoId,
        gacha_type: gachaType,
        name: display,
        item_type: itemType,
        rank_type: rankType,
        time: p.time,
        // сохраняем rate для 50:50
        paimon_rate: p.rate,
        paimon_id: p.id,
      });
      if (!n || seen.has(n.hoyoId)) return;
      seen.add(n.hoyoId);
      out.push(n);
    });
  }

  return out;
}

export function buildPaimonRarityLookup(input: {
  characters: { slug: string; name: string; rarity: string }[];
  weapons: { slug: string; name: string; rarity: string }[];
}): PaimonRarityLookup {
  const bySlug = new Map<string, string>();
  const nameBySlug = new Map<string, string>();

  const rarityToRank = (r: string) => {
    if (r === "LEGEND") return "5";
    if (r === "EPIC") return "4";
    if (r === "RARE") return "3";
    return "3";
  };

  for (const c of input.characters) {
    bySlug.set(c.slug.toLowerCase(), rarityToRank(c.rarity));
    nameBySlug.set(c.slug.toLowerCase(), c.name);
  }
  for (const w of input.weapons) {
    bySlug.set(w.slug.toLowerCase(), rarityToRank(w.rarity));
    nameBySlug.set(w.slug.toLowerCase(), w.name);
  }

  return { bySlug, nameBySlug };
}
