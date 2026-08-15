import { localizeWishLookupKey } from "@/lib/wish-guide-links";

export const GACHA_TYPES = {
  novice: "100",
  permanent: "200",
  character: "301",
  character2: "400",
  weapon: "302",
  /** Баннер хроник */
  chronicled: "500",
} as const;

export type GachaBannerKey =
  | "character"
  | "weapon"
  | "permanent"
  | "chronicled"
  | "novice";

/** Основные баннеры в кабинете (без новичка). */
export const DASHBOARD_BANNERS: GachaBannerKey[] = [
  "character",
  "weapon",
  "permanent",
  "chronicled",
];

export const BANNER_LABELS: Record<GachaBannerKey, string> = {
  character: "Персонажи",
  weapon: "Оружие",
  permanent: "Стандарт",
  chronicled: "Хроники",
  novice: "Новичок",
};

export const BANNER_SHORT: Record<GachaBannerKey, string> = {
  character: "Ивент персонажей",
  weapon: "Ивент оружия",
  permanent: "Стандартная молитва",
  chronicled: "Молитва хроник",
  novice: "Новичок",
};

/**
 * Журнал молитв в игре и API Hoyoverse / UIGF — wall-clock Asia/Shanghai (UTC+8),
 * без перевода в локальный часовой пояс игрока.
 */
export const WISH_TIME_ZONE = "Asia/Shanghai";

/** Отображение как в журнале: `15.08.2026, 00:02:35` */
export function formatWishTime(value: Date | string): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("ru-RU", {
    timeZone: WISH_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

/** Строка API / UIGF: `YYYY-MM-DD HH:mm:ss` в Asia/Shanghai */
export function formatWishTimeApi(value: Date | string): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: WISH_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (type: string) =>
    parts.find((x) => x.type === type)?.value || "00";
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}:${get("second")}`;
}

/** Календарный месяц молитвы в TZ журнала: `YYYY-MM` */
export function wishMonthKey(value: Date | string): string | null {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: WISH_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(d);
  const y = parts.find((x) => x.type === "year")?.value;
  const m = parts.find((x) => x.type === "month")?.value;
  if (!y || !m) return null;
  return `${y}-${m}`;
}

/** Сколько молитв по каждому баннеру. */
export function countPullsByBanner(
  pulls: { gachaType: string }[],
): Record<GachaBannerKey, number> {
  const counts: Record<GachaBannerKey, number> = {
    character: 0,
    weapon: 0,
    permanent: 0,
    chronicled: 0,
    novice: 0,
  };
  for (const p of pulls) {
    counts[bannerKeyFromGachaType(p.gachaType)] += 1;
  }
  return counts;
}

/** «Персонажи — 12, Оружие — 3» (только ненулевые). */
export function formatBannerPullCounts(
  byBanner: Partial<Record<GachaBannerKey, number>> | null | undefined,
): string {
  if (!byBanner) return "";
  const parts: string[] = [];
  const order: GachaBannerKey[] = [
    "character",
    "weapon",
    "permanent",
    "chronicled",
    "novice",
  ];
  for (const key of order) {
    const n = byBanner[key] ?? 0;
    if (n <= 0) continue;
    parts.push(`${BANNER_LABELS[key]} — ${n.toLocaleString("ru-RU")}`);
  }
  return parts.join(", ");
}

export function bannerKeyFromGachaType(gachaType: string): GachaBannerKey {
  if (gachaType === GACHA_TYPES.weapon) return "weapon";
  if (gachaType === GACHA_TYPES.permanent) return "permanent";
  if (gachaType === GACHA_TYPES.novice) return "novice";
  if (gachaType === GACHA_TYPES.chronicled) return "chronicled";
  return "character";
}

export function gachaTypesForBanner(key: GachaBannerKey): string[] {
  switch (key) {
    case "character":
      return [GACHA_TYPES.character, GACHA_TYPES.character2];
    case "weapon":
      return [GACHA_TYPES.weapon];
    case "permanent":
      return [GACHA_TYPES.permanent];
    case "chronicled":
      return [GACHA_TYPES.chronicled];
    case "novice":
      return [GACHA_TYPES.novice];
  }
}

export type WishPullLike = {
  hoyoId: string;
  gachaType: string;
  itemName: string;
  itemType: string;
  rankType: string;
  wishTime: Date | string;
  raw?: { paimon_rate?: number } | null;
};

/** Синтетические id из paimon / fallback — не совпадают с Hoyoverse. */
export function isSyntheticWishId(hoyoId: string): boolean {
  return /^(paimon-|gen-)/i.test(String(hoyoId || ""));
}

function wishItemNameKey(name: string): string {
  return localizeWishLookupKey(String(name || ""));
}

/**
 * Ключ «той же» крутки для слияния paimon ↔ Hoyoverse
 * (разные hoyoId, одно событие).
 */
export function wishContentKey(p: {
  gachaType: string;
  itemName: string;
  wishTime: Date | string;
}): string {
  const t = new Date(p.wishTime).getTime();
  const sec = Number.isFinite(t) ? Math.floor(t / 1000) : 0;
  // 400 — второй ивент персонажей, для дедупа = 301
  const gacha = p.gachaType === "400" ? "301" : p.gachaType;
  return `${gacha}|${sec}|${wishItemNameKey(p.itemName)}`;
}

function wishTimeMs(wishTime: Date | string): number {
  const t = new Date(wishTime).getTime();
  return Number.isFinite(t) ? t : 0;
}

/** Диапазон дат официальных (Hoyoverse) круток. */
export function hoyoWishTimeWindow(
  pulls: { hoyoId: string; wishTime: Date | string }[],
): { min: number; max: number } | null {
  let min = Infinity;
  let max = -Infinity;
  for (const p of pulls) {
    if (isSyntheticWishId(p.hoyoId)) continue;
    const t = wishTimeMs(p.wishTime);
    if (!t) continue;
    if (t < min) min = t;
    if (t > max) max = t;
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
  return { min, max };
}

/**
 * Paimon закрывает «дыру» старше окна API Hoyoverse.
 * Внутри окна Hoyoverse — только официальные записи (имена EN/RU часто не совпадают).
 */
export function dedupeWishPulls<T extends WishPullLike>(pulls: T[]): T[] {
  const real = pulls.filter((p) => !isSyntheticWishId(p.hoyoId));
  const syn = pulls.filter((p) => isSyntheticWishId(p.hoyoId));

  if (real.length === 0) {
    return dedupeByContentKey(syn);
  }
  if (syn.length === 0) {
    return dedupeByContentKey(real);
  }

  const window = hoyoWishTimeWindow(real);
  // Небольшой запас на сдвиг TZ / округление секунд
  const padMs = 3000;
  const keptSyn = window
    ? syn.filter((p) => {
        const t = wishTimeMs(p.wishTime);
        return t < window.min - padMs;
      })
    : syn;

  // На границе окна ещё схлопываем по content-key
  return dedupeByContentKey([...keptSyn, ...real]);
}

function dedupeByContentKey<T extends WishPullLike>(pulls: T[]): T[] {
  const groups = new Map<string, T[]>();
  for (const p of pulls) {
    const k = wishContentKey(p);
    const list = groups.get(k);
    if (list) list.push(p);
    else groups.set(k, [p]);
  }
  const out: T[] = [];
  for (const group of groups.values()) {
    const official = group.filter((p) => !isSyntheticWishId(p.hoyoId));
    const keep = official.length > 0 ? official : group;
    const seen = new Set<string>();
    for (const p of keep) {
      if (seen.has(p.hoyoId)) continue;
      seen.add(p.hoyoId);
      out.push(p);
    }
  }
  return out.sort((a, b) => {
    const dt = wishTimeMs(a.wishTime) - wishTimeMs(b.wishTime);
    if (dt !== 0) return dt;
    const as = isSyntheticWishId(a.hoyoId) ? 1 : 0;
    const bs = isSyntheticWishId(b.hoyoId) ? 1 : 0;
    if (as !== bs) return as - bs;
    return a.hoyoId.localeCompare(b.hoyoId);
  });
}

/**
 * DB id синтетических строк, которые нужно удалить:
 * 1) внутри окна Hoyoverse
 * 2) content-key дубли официальных
 */
export function syntheticDuplicateDbIds(
  pulls: {
    id: string;
    hoyoId: string;
    gachaType: string;
    itemName: string;
    wishTime: Date | string;
  }[],
): string[] {
  const toDelete = new Set<string>();
  const window = hoyoWishTimeWindow(pulls);
  const padMs = 3000;

  if (window) {
    for (const p of pulls) {
      if (!isSyntheticWishId(p.hoyoId)) continue;
      const t = wishTimeMs(p.wishTime);
      if (t >= window.min - padMs) toDelete.add(p.id);
    }
  }

  const byKey = new Map<
    string,
    { hasReal: boolean; syntheticIds: string[] }
  >();
  for (const p of pulls) {
    if (toDelete.has(p.id)) continue;
    const k = wishContentKey(p);
    let g = byKey.get(k);
    if (!g) {
      g = { hasReal: false, syntheticIds: [] };
      byKey.set(k, g);
    }
    if (isSyntheticWishId(p.hoyoId)) g.syntheticIds.push(p.id);
    else g.hasReal = true;
  }
  for (const g of byKey.values()) {
    if (g.hasReal && g.syntheticIds.length) {
      for (const id of g.syntheticIds) toDelete.add(id);
    }
  }
  return [...toDelete];
}

/**
 * Готовит пачку к merge: пропускает уже известные крутки,
 * при появлении Hoyoverse — вычищает paimon в окне API и по content-key.
 */
export function planWishMerge<
  T extends {
    hoyoId: string;
    gachaType: string;
    itemName: string;
    wishTime: Date | string;
  },
>(
  existing: {
    id: string;
    hoyoId: string;
    gachaType: string;
    itemName: string;
    wishTime: Date | string;
  }[],
  incoming: T[],
): { toInsert: T[]; toDeleteIds: string[] } {
  const incomingReal = incoming.filter((p) => !isSyntheticWishId(p.hoyoId));
  const combinedForWindow = [
    ...existing.filter((p) => !isSyntheticWishId(p.hoyoId)),
    ...incomingReal,
  ];
  const window = hoyoWishTimeWindow(combinedForWindow);
  const padMs = 3000;

  const toDeleteIds: string[] = [];
  const remainingExisting = existing.filter((p) => {
    if (!isSyntheticWishId(p.hoyoId)) return true;
    if (window) {
      const t = wishTimeMs(p.wishTime);
      if (t >= window.min - padMs) {
        toDeleteIds.push(p.id);
        return false;
      }
    }
    return true;
  });

  const keyCounts = new Map<string, number>();
  const paimonIdsByKey = new Map<string, string[]>();

  for (const p of remainingExisting) {
    const k = wishContentKey(p);
    keyCounts.set(k, (keyCounts.get(k) || 0) + 1);
    if (isSyntheticWishId(p.hoyoId)) {
      const arr = paimonIdsByKey.get(k) || [];
      arr.push(p.id);
      paimonIdsByKey.set(k, arr);
    }
  }

  const toInsert: T[] = [];
  const seenIncoming = new Set<string>();

  for (const pull of incoming) {
    if (seenIncoming.has(pull.hoyoId)) continue;
    seenIncoming.add(pull.hoyoId);

    const k = wishContentKey(pull);
    const count = keyCounts.get(k) || 0;
    if (count > 0) {
      if (!isSyntheticWishId(pull.hoyoId)) {
        const paimons = paimonIdsByKey.get(k);
        if (paimons && paimons.length > 0) {
          toDeleteIds.push(paimons.shift()!);
          keyCounts.set(k, count - 1);
          toInsert.push(pull);
          continue;
        }
      }
      // Уже есть официальная или paimon-копия вне окна
      if (!isSyntheticWishId(pull.hoyoId)) {
        // Официальная уже в БД с тем же ключом — не вставляем
        keyCounts.set(k, count - 1);
        continue;
      }
      keyCounts.set(k, count - 1);
      continue;
    }
    toInsert.push(pull);
  }

  return { toInsert, toDeleteIds: [...new Set(toDeleteIds)] };
}

export type BannerPityStats = {
  key: GachaBannerKey;
  label: string;
  total: number;
  pity4: number;
  pity5: number;
  /** Soft pity cap for UI progress (90 character/standard, 80 weapon). */
  pity5Max: number;
  pity4Max: number;
  guaranteed5: boolean;
  last5Star: string | null;
  fiveStars: {
    name: string;
    pity: number;
    time: string;
    itemType: string;
    /** C0–C6 для персонажей, R1–R5 для оружия */
    constellation: number;
    copies: number;
  }[];
  count5: number;
  count4: number;
  count3: number;
  count5Char: number;
  count5Weapon: number;
  rate5: number;
  rate4: number;
  avgPity5: number | null;
  avgPity4: number | null;
  /** Primogems spent (total * 160). */
  primogems: number;
  /** Сколько молитв до жёсткого гаранта 5★. */
  remaining5: number;
  /** Сколько молитв до гаранта 4★. */
  remaining4: number;
  /** Порог soft pity (для подсказки в UI). */
  softPityAt: number;
};

export type PityChartPoint = {
  index: number;
  name: string;
  pity: number;
  banner: GachaBannerKey;
  time: string;
};

/** Крутки по месяцам для графика. */
export type MonthlyPullPoint = {
  monthKey: string;
  label: string;
  total: number;
  banner: GachaBannerKey | "all";
  character: number;
  weapon: number;
  permanent: number;
  chronicled: number;
};

export type WishOverview = {
  total: number;
  primogems: number;
  count5: number;
  count4: number;
  rate5: number;
  rate4: number;
  avgPity5: number | null;
};

/** Считает pity по баннеру (хронология от старых к новым). */
export function computeBannerStats(
  pulls: WishPullLike[],
  key: GachaBannerKey,
): BannerPityStats {
  const types = gachaTypesForBanner(key);
  const pity5Max = key === "weapon" ? 80 : 90;
  const pity4Max = 10;
  const softPityAt = key === "weapon" ? 63 : 74;

  const filtered = dedupeWishPulls(pulls)
    .filter((p) => types.includes(p.gachaType))
    .slice()
    .sort((a, b) => {
      const dt =
        new Date(a.wishTime).getTime() - new Date(b.wishTime).getTime();
      if (dt !== 0) return dt;
      // Официальные id раньше синтетических при равном времени
      const as = isSyntheticWishId(a.hoyoId) ? 1 : 0;
      const bs = isSyntheticWishId(b.hoyoId) ? 1 : 0;
      if (as !== bs) return as - bs;
      return a.hoyoId.localeCompare(b.hoyoId);
    });

  let pity4 = 0;
  let pity5 = 0;
  const guaranteed5 = false;
  let last5Star: string | null = null;
  const fiveStarPulls: {
    name: string;
    pity: number;
    time: string;
    itemType: string;
  }[] = [];
  const fourPities: number[] = [];
  let count5 = 0;
  let count4 = 0;
  let count3 = 0;
  let count5Char = 0;
  let count5Weapon = 0;

  for (const pull of filtered) {
    pity4 += 1;
    pity5 += 1;
    const rank = String(pull.rankType);

    if (rank === "3") count3 += 1;
    if (rank === "4") {
      count4 += 1;
      fourPities.push(pity4);
      pity4 = 0;
    }
    if (rank === "5") {
      count5 += 1;
      const isWeapon = /weapon|оруж/i.test(pull.itemType);
      if (isWeapon) count5Weapon += 1;
      else count5Char += 1;

      const skipCard =
        (key === "character" && isWeapon) ||
        (key === "weapon" && !isWeapon);

      if (!skipCard) {
        fiveStarPulls.push({
          name: pull.itemName,
          pity: pity5,
          time: new Date(pull.wishTime).toISOString(),
          itemType: pull.itemType,
        });
        last5Star = pull.itemName;
      }
      pity5 = 0;
      pity4 = 0;
    }
  }

  // Группируем копии в C0/C1… (оружие — R1/R2…)
  const grouped = new Map<
    string,
    {
      name: string;
      pity: number;
      time: string;
      itemType: string;
      constellation: number;
      copies: number;
    }
  >();
  const chrono = fiveStarPulls.slice(); // oldest → newest
  for (const f of chrono) {
    const isWeapon = /weapon|оруж/i.test(f.itemType);
    const key = `${isWeapon ? "w" : "c"}:${f.name.trim().toLowerCase()}`;
    const prev = grouped.get(key);
    if (!prev) {
      grouped.set(key, {
        ...f,
        constellation: isWeapon ? 1 : 0,
        copies: 1,
      });
    } else {
      prev.copies += 1;
      prev.constellation = isWeapon ? prev.copies : prev.copies - 1;
      prev.pity = f.pity;
      prev.time = f.time;
    }
  }
  const fiveStars = [...grouped.values()].sort(
    (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
  );

  const total = filtered.length;
  const avg = (arr: number[]) =>
    arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

  return {
    key,
    label: BANNER_LABELS[key],
    total,
    pity4,
    pity5,
    pity5Max,
    pity4Max,
    guaranteed5,
    last5Star,
    fiveStars,
    count5,
    count4,
    count3,
    count5Char,
    count5Weapon,
    rate5: total ? (count5 / total) * 100 : 0,
    rate4: total ? (count4 / total) * 100 : 0,
    avgPity5: avg(fiveStarPulls.map((f) => f.pity)),
    avgPity4: avg(fourPities),
    primogems: total * 160,
    remaining5: Math.max(0, pity5Max - pity5),
    remaining4: Math.max(0, pity4Max - pity4),
    softPityAt,
  };
}

export function computeAllBannerStats(pulls: WishPullLike[]) {
  return DASHBOARD_BANNERS.map((key) => computeBannerStats(pulls, key));
}

export function computeWishOverview(pulls: WishPullLike[]): WishOverview {
  const unique = dedupeWishPulls(pulls);
  const total = unique.length;
  const count5 = unique.filter((p) => String(p.rankType) === "5").length;
  const count4 = unique.filter((p) => String(p.rankType) === "4").length;
  const bannerAvgs = computeAllBannerStats(unique)
    .map((s) => s.avgPity5)
    .filter((n): n is number => n != null);
  const avgPity5 = bannerAvgs.length
    ? bannerAvgs.reduce((a, b) => a + b, 0) / bannerAvgs.length
    : null;

  return {
    total,
    primogems: total * 160,
    count5,
    count4,
    rate5: total ? (count5 / total) * 100 : 0,
    rate4: total ? (count4 / total) * 100 : 0,
    avgPity5,
  };
}

/** Точки для графика pity 5★ (по времени). */
export function buildPityChart(
  pulls: WishPullLike[],
  bannerFilter?: GachaBannerKey | "all",
): PityChartPoint[] {
  const keys =
    bannerFilter && bannerFilter !== "all"
      ? [bannerFilter]
      : DASHBOARD_BANNERS;
  const points: PityChartPoint[] = [];
  for (const key of keys) {
    const stats = computeBannerStats(pulls, key);
    // Разворачиваем копии для графика гаранта — берём avg pity по уникальным не подходит;
    // pity chart больше не основной — оставляем совместимость.
    for (const f of stats.fiveStars) {
      points.push({
        index: 0,
        name: f.name,
        pity: f.pity,
        banner: key,
        time: f.time,
      });
    }
  }
  points.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  return points.map((p, i) => ({ ...p, index: i + 1 }));
}

/** Крутки по календарным месяцам. */
export function buildMonthlyPullChart(
  pulls: WishPullLike[],
): MonthlyPullPoint[] {
  const byMonth = new Map<
    string,
    {
      total: number;
      character: number;
      weapon: number;
      permanent: number;
      chronicled: number;
    }
  >();

  for (const p of dedupeWishPulls(pulls)) {
    const monthKey = wishMonthKey(p.wishTime);
    if (!monthKey) continue;
    let row = byMonth.get(monthKey);
    if (!row) {
      row = {
        total: 0,
        character: 0,
        weapon: 0,
        permanent: 0,
        chronicled: 0,
      };
      byMonth.set(monthKey, row);
    }
    row.total += 1;
    const banner = bannerKeyFromGachaType(p.gachaType);
    if (banner === "character") row.character += 1;
    else if (banner === "weapon") row.weapon += 1;
    else if (banner === "permanent") row.permanent += 1;
    else if (banner === "chronicled") row.chronicled += 1;
  }

  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthKey, counts]) => {
      const [y, m] = monthKey.split("-").map(Number);
      const label = new Date(y, m - 1, 1).toLocaleDateString("ru-RU", {
        month: "short",
        year: "2-digit",
      });
      return {
        monthKey,
        label,
        banner: "all" as const,
        ...counts,
      };
    });
}

export function pityChipTone(pity: number, max = 90): "good" | "mid" | "bad" {
  const t = pity / max;
  if (t <= 0.45) return "good";
  if (t <= 0.75) return "mid";
  return "bad";
}

export type NormalizedWish = {
  hoyoId: string;
  gachaType: string;
  itemName: string;
  itemType: string;
  rankType: string;
  wishTime: Date;
  raw?: unknown;
};

/** Нормализация одной записи из Hoyoverse API / UIGF / paimon. */
export function normalizeWishRow(row: Record<string, unknown>): NormalizedWish | null {
  const gachaType = String(
    row.gacha_type ?? row.uigf_gacha_type ?? row.gachaType ?? "",
  );
  const itemName = String(row.name ?? row.item_name ?? row.itemName ?? "").trim();
  const itemType = String(
    row.item_type ?? row.itemType ?? row.item_type_name ?? "Unknown",
  );
  const rankType = String(row.rank_type ?? row.rankType ?? row.rank ?? "").trim();
  const timeRaw = row.time ?? row.wishTime ?? row.datetime;
  if (!gachaType || !itemName || !rankType || !timeRaw) return null;

  const timeStr = String(timeRaw).trim();
  let wishTime = new Date(
    /[TzZ]|[+-]\d{2}:?\d{2}$/.test(timeStr)
      ? timeStr
      : timeStr.replace(" ", "T") + "+08:00",
  );
  if (Number.isNaN(wishTime.getTime())) {
    wishTime = new Date(timeStr.replace(" ", "T"));
  }
  if (Number.isNaN(wishTime.getTime())) return null;

  const hoyoId = String(
    row.id ?? row.gacha_id ?? row.hoyoId ?? "",
  ).trim() || `gen-${gachaType}-${timeStr}-${itemName}`;

  return {
    hoyoId,
    gachaType,
    itemName,
    itemType: /weapon|оружие/i.test(itemType)
      ? "Weapon"
      : /character|персонаж/i.test(itemType)
        ? "Character"
        : itemType,
    rankType,
    wishTime,
    raw: row,
  };
}

export function parseWishImportPayload(payload: unknown): NormalizedWish[] {
  const rows: Record<string, unknown>[] = [];

  const pushWishArrays = (obj: Record<string, unknown>) => {
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (!Array.isArray(val) || val.length === 0) continue;
      if (Array.isArray(val[0])) {
        for (const entry of val as unknown[][]) {
          if (!Array.isArray(entry) || entry.length < 5) continue;
          rows.push({
            id: `paimon-${key}-${entry[1]}-${entry[2]}-${entry[0]}`,
            gacha_type: String(entry[0]),
            time: entry[1],
            name: entry[2],
            item_type: entry[3],
            rank_type: String(entry[4]),
          });
        }
        continue;
      }
      if (typeof val[0] === "object" && val[0]) {
        rows.push(...(val as Record<string, unknown>[]));
      }
    }
  };

  if (Array.isArray(payload)) {
    rows.push(...(payload as Record<string, unknown>[]));
  } else if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.list)) rows.push(...(obj.list as Record<string, unknown>[]));
    if (Array.isArray(obj.wish)) rows.push(...(obj.wish as Record<string, unknown>[]));
    if (obj.data && typeof obj.data === "object") {
      pushWishArrays(obj.data as Record<string, unknown>);
    }
    for (const key of Object.keys(obj)) {
      if (/^wish/i.test(key) && typeof obj[key] === "object" && obj[key]) {
        pushWishArrays(obj[key] as Record<string, unknown>);
      }
    }
    pushWishArrays(obj);
  }

  const out: NormalizedWish[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    const n = normalizeWishRow(row);
    if (!n || seen.has(n.hoyoId)) continue;
    seen.add(n.hoyoId);
    out.push(n);
  }
  return out;
}

/**
 * Достаёт query-параметр из сырой строки URL.
 * Нельзя использовать URLSearchParams.get для authkey: `+` превращается в пробел.
 * Возвращает значение как в URL (с %XX), плюсы нормализует в %2B.
 */
export function extractQueryParam(rawUrl: string, key: string): string | null {
  const m = rawUrl.match(new RegExp(`[?&#]${key}=([^&#]*)`, "i"));
  if (!m) return null;
  return m[1].replace(/\+/g, "%2B");
}

/** Декодирует param для сравнения / отображения; для authkey в API лучше raw. */
export function decodeQueryParamValue(raw: string): string {
  try {
    return decodeURIComponent(raw.replace(/\+/g, "%2B"));
  } catch {
    return raw;
  }
}

export function resolveGachaApiHosts(rawUrl: string): string[] {
  const gameBiz = (
    decodeQueryParamValue(extractQueryParam(rawUrl, "game_biz") || "") ||
    "hk4e_global"
  ).toLowerCase();
  const isCn = gameBiz.includes("cn") || /mihoyo\.com/i.test(rawUrl);

  if (isCn) {
    return [
      "https://public-operation-hk4e.mihoyo.com/gacha_info/api/getGachaLog",
      "https://hk4e-api.mihoyo.com/gacha_info/api/getGachaLog",
      "https://public-operation-hk4e.hoyoverse.com/gacha_info/api/getGachaLog",
    ];
  }

  return [
    "https://public-operation-hk4e-sg.hoyoverse.com/gacha_info/api/getGachaLog",
    "https://public-operation-hk4e.hoyoverse.com/gacha_info/api/getGachaLog",
    "https://hk4e-api-os.hoyoverse.com/gacha_info/api/getGachaLog",
    "https://hk4e-api-os.mihoyo.com/gacha_info/api/getGachaLog",
  ];
}

/** Собирает рабочий URL getGachaLog из страницы истории или API-ссылки. */
export function buildGachaLogUrl(
  rawInput: string,
  gachaType: string,
  endId = "0",
  apiBase?: string,
): string | null {
  const trimmed = rawInput.trim();
  if (!trimmed) return null;

  // authkey оставляем в исходном %-виде — повторный encode через URLSearchParams ломает ключ
  const authkeyRaw =
    extractQueryParam(trimmed, "authkey") ||
    extractQueryParam(trimmed, "auth_key");
  if (!authkeyRaw) return null;

  const gameBiz =
    decodeQueryParamValue(extractQueryParam(trimmed, "game_biz") || "") ||
    "hk4e_global";
  const lang =
    decodeQueryParamValue(extractQueryParam(trimmed, "lang") || "") || "ru";
  const regionRaw = extractQueryParam(trimmed, "region");
  const region = regionRaw ? decodeQueryParamValue(regionRaw) : null;
  const authkeyVer =
    decodeQueryParamValue(extractQueryParam(trimmed, "authkey_ver") || "") ||
    "1";
  const signType =
    decodeQueryParamValue(extractQueryParam(trimmed, "sign_type") || "") || "2";

  const base = apiBase || resolveGachaApiHosts(trimmed)[0];
  const url = new URL(base);
  // Собираем query вручную: authkey уже закодирован
  const q = new URLSearchParams();
  q.set("authkey_ver", authkeyVer);
  q.set("sign_type", signType);
  q.set("auth_appid", "webview_gacha");
  q.set("lang", lang);
  q.set("game_biz", gameBiz);
  if (region) q.set("region", region);
  q.set("gacha_type", gachaType);
  q.set("page", "1");
  q.set("size", "20");
  q.set("end_id", endId);
  // authkey вставляем отдельно, без searchParams (иначе +/% ломаются)
  url.search = `${q.toString()}&authkey=${authkeyRaw}`;

  return url.toString();
}

type GachaLogJson = {
  retcode?: number;
  message?: string;
  data?: { list?: Record<string, unknown>[] };
};

async function fetchGachaPage(
  apiUrl: string,
): Promise<{ json?: GachaLogJson; error?: string; network?: boolean }> {
  try {
    const res = await fetch(apiUrl, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) {
      return {
        error: `Hoyoverse API ответил ${res.status}. Откройте историю молитв в игре заново.`,
      };
    }
    return { json: (await res.json()) as GachaLogJson };
  } catch {
    return {
      network: true,
      error:
        "Не удалось связаться с Hoyoverse. Проверьте VPN/сеть или попробуйте ещё раз.",
    };
  }
}

function isTransientHoyoverse(json: GachaLogJson | undefined): boolean {
  if (!json) return false;
  const msg = json.message || "";
  return (
    /visit too frequently/i.test(msg) ||
    json.retcode === -110 ||
    json.retcode === 10001
  );
}

async function fetchGachaPageWithRetry(
  apiUrl: string,
  onWait?: () => void,
): Promise<{ json?: GachaLogJson; error?: string; network?: boolean }> {
  let last:
    | { json?: GachaLogJson; error?: string; network?: boolean }
    | undefined;
  for (let attempt = 0; attempt < 8; attempt++) {
    const result = await fetchGachaPage(apiUrl);
    last = result;
    if (result.network) return result;
    if (result.json && isTransientHoyoverse(result.json)) {
      onWait?.();
      await new Promise((r) => setTimeout(r, 1200 + attempt * 800));
      continue;
    }
    return result;
  }
  // Не отдаём сырое visit too frequently наружу
  return {
    json: last?.json,
    error:
      last?.error ||
      "Не удалось загрузить историю. Откройте молитвы в игре и попробуйте ещё раз.",
  };
}

export type WishImportProgress = {
  phase: "connecting" | "banner" | "saving" | "done";
  /** Человекочитаемый статус */
  label: string;
  /** Номер текущего баннера 1..N */
  step: number;
  /** Всего баннеров */
  steps: number;
  page: number;
  totalPulled: number;
  /** Ожидаемый объём (для прогресса разбора файла) */
  totalApprox?: number;
};

const GACHA_PROGRESS_LABEL: Record<string, string> = {
  [GACHA_TYPES.character]: "Ивент персонажей",
  [GACHA_TYPES.character2]: "Ивент персонажей · 2",
  [GACHA_TYPES.weapon]: "Ивент оружия",
  [GACHA_TYPES.permanent]: "Стандарт",
  [GACHA_TYPES.chronicled]: "Хроники",
  [GACHA_TYPES.novice]: "Новичок",
};

export async function fetchAllWishesFromAuthUrl(
  rawUrl: string,
  onProgress?: (p: WishImportProgress) => void,
): Promise<{ pulls: NormalizedWish[]; error?: string }> {
  const trimmed = rawUrl.trim();
  if (!extractQueryParam(trimmed, "authkey") && !extractQueryParam(trimmed, "auth_key")) {
    return {
      pulls: [],
      error: "Не удалось разобрать ссылку. Вставьте полный URL с authkey.",
    };
  }

  const types = [
    GACHA_TYPES.character,
    GACHA_TYPES.character2,
    GACHA_TYPES.weapon,
    GACHA_TYPES.permanent,
    GACHA_TYPES.chronicled,
    GACHA_TYPES.novice,
  ];

  onProgress?.({
    phase: "connecting",
    label: "Подключаемся к Hoyoverse…",
    step: 0,
    steps: types.length,
    page: 0,
    totalPulled: 0,
  });

  const hosts = resolveGachaApiHosts(trimmed);
  let workingHost = hosts[0];

  {
    let lastError =
      "Не удалось подключиться к API. Откройте историю молитв в игре и попробуйте снова.";
    let found = false;
    for (const host of hosts) {
      const probe = buildGachaLogUrl(trimmed, GACHA_TYPES.character, "0", host);
      if (!probe) continue;
      const { json, error, network } = await fetchGachaPageWithRetry(probe, () => {
        onProgress?.({
          phase: "connecting",
          label: "Подключаемся к Hoyoverse…",
          step: 0,
          steps: types.length,
          page: 0,
          totalPulled: 0,
        });
      });
      if (network || !json) {
        lastError = error || lastError;
        continue;
      }
      if (json.retcode === 0) {
        workingHost = host;
        found = true;
        break;
      }
      if (isTransientHoyoverse(json)) {
        // уже ретраили — пробуем другой хост без показа сырой ошибки
        continue;
      }
      lastError =
        /authkey|login|invalid|expired/i.test(json.message || "")
          ? "Ссылка устарела — откройте историю молитв в игре снова и скопируйте новую."
          : lastError;
      if (
        json.retcode === -101 ||
        json.retcode === -100 ||
        /authkey|login|invalid/i.test(json.message || "")
      ) {
        return { pulls: [], error: lastError };
      }
    }
    if (!found) return { pulls: [], error: lastError };
  }

  const all: NormalizedWish[] = [];
  const seen = new Set<string>();
  let apiRowsTotal = 0;

  for (let ti = 0; ti < types.length; ti++) {
    const gachaType = types[ti];
    const bannerLabel = GACHA_PROGRESS_LABEL[gachaType] || gachaType;
    let endId = "0";

    onProgress?.({
      phase: "banner",
      label: `Импорт: ${bannerLabel}`,
      step: ti + 1,
      steps: types.length,
      page: 1,
      totalPulled: all.length,
    });

    for (let page = 0; page < 80; page++) {
      const apiUrl = buildGachaLogUrl(trimmed, gachaType, endId, workingHost);
      if (!apiUrl) {
        return {
          pulls: [],
          error: "Не удалось разобрать ссылку. Вставьте полный URL с authkey.",
        };
      }

      const { json, error } = await fetchGachaPageWithRetry(apiUrl, () => {
        onProgress?.({
          phase: "banner",
          label: `Импорт: ${bannerLabel}…`,
          step: ti + 1,
          steps: types.length,
          page: page + 1,
          totalPulled: all.length,
        });
      });
      if (!json) {
        return {
          pulls: [],
          error:
            error ||
            "Не удалось загрузить историю. Откройте молитвы в игре и попробуйте ещё раз.",
        };
      }

      if (json.retcode !== 0) {
        if (isTransientHoyoverse(json)) {
          return {
            pulls: [],
            error:
              "Не удалось загрузить историю. Подождите немного и попробуйте ещё раз.",
          };
        }
        return {
          pulls: [],
          error: /authkey|login|invalid|expired/i.test(json.message || "")
            ? "Ссылка устарела — откройте историю молитв в игре снова и скопируйте новую."
            : "Не удалось загрузить историю. Откройте молитвы в игре и попробуйте ещё раз.",
        };
      }

      const list = json.data?.list ?? [];
      if (list.length === 0) break;

      for (const row of list) {
        apiRowsTotal += 1;
        const n = normalizeWishRow({ ...row, gacha_type: gachaType });
        if (!n || seen.has(n.hoyoId)) continue;
        seen.add(n.hoyoId);
        all.push(n);
      }

      onProgress?.({
        phase: "banner",
        label: `Импорт: ${bannerLabel} · стр. ${page + 1}`,
        step: ti + 1,
        steps: types.length,
        page: page + 1,
        totalPulled: all.length,
      });

      endId = String(list[list.length - 1]?.id ?? "0");
      await new Promise((r) => setTimeout(r, 320));
    }
    if (ti < types.length - 1) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  if (all.length === 0) {
    if (apiRowsTotal > 0) {
      return {
        pulls: [],
        error:
          "Ответ Hoyoverse получен, но записи не удалось разобрать. Обновите страницу и попробуйте снова.",
      };
    }
    return {
      pulls: [],
      error:
        "По этой ссылке история пустая. Откройте историю молитв именно на нужном игровом аккаунте, дождитесь загрузки и снова скопируйте ссылку скриптом.",
    };
  }

  onProgress?.({
    phase: "done",
    label: `Собрано ${all.length} молитв`,
    step: types.length,
    steps: types.length,
    page: 0,
    totalPulled: all.length,
  });

  return { pulls: all };
}
