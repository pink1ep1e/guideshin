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
};

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
};

export type PityChartPoint = {
  index: number;
  name: string;
  pity: number;
  banner: GachaBannerKey;
  time: string;
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

  const filtered = pulls
    .filter((p) => types.includes(p.gachaType))
    .slice()
    .sort(
      (a, b) =>
        new Date(a.wishTime).getTime() - new Date(b.wishTime).getTime(),
    );

  let pity4 = 0;
  let pity5 = 0;
  const guaranteed5 = false;
  let last5Star: string | null = null;
  const fiveStars: BannerPityStats["fiveStars"] = [];
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
      if (/weapon|оруж/i.test(pull.itemType)) count5Weapon += 1;
      else count5Char += 1;
      fiveStars.push({
        name: pull.itemName,
        pity: pity5,
        time: new Date(pull.wishTime).toISOString(),
        itemType: pull.itemType,
      });
      last5Star = pull.itemName;
      pity5 = 0;
      pity4 = 0;
    }
  }

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
    fiveStars: fiveStars.slice().reverse(),
    count5,
    count4,
    count3,
    count5Char,
    count5Weapon,
    rate5: total ? (count5 / total) * 100 : 0,
    rate4: total ? (count4 / total) * 100 : 0,
    avgPity5: avg(fiveStars.map((f) => f.pity)),
    avgPity4: avg(fourPities),
    primogems: total * 160,
  };
}

export function computeAllBannerStats(pulls: WishPullLike[]) {
  return DASHBOARD_BANNERS.map((key) => computeBannerStats(pulls, key));
}

export function computeWishOverview(pulls: WishPullLike[]): WishOverview {
  const total = pulls.length;
  const count5 = pulls.filter((p) => String(p.rankType) === "5").length;
  const count4 = pulls.filter((p) => String(p.rankType) === "4").length;
  const chart = buildPityChart(pulls);
  const avgPity5 = chart.length
    ? chart.reduce((a, b) => a + b.pity, 0) / chart.length
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
    const chrono = [...stats.fiveStars].reverse();
    for (const f of chrono) {
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
  const hoyoId = String(
    row.id ?? row.gacha_id ?? row.uigf_gacha_type ?? row.hoyoId ?? "",
  );
  const gachaType = String(
    row.gacha_type ?? row.uigf_gacha_type ?? row.gachaType ?? "",
  );
  const itemName = String(row.name ?? row.item_name ?? row.itemName ?? "");
  const itemType = String(
    row.item_type ?? row.itemType ?? row.item_type_name ?? "Unknown",
  );
  const rankType = String(row.rank_type ?? row.rankType ?? row.rank ?? "");
  const timeRaw = row.time ?? row.wishTime ?? row.datetime;
  if (!hoyoId || !gachaType || !itemName || !rankType || !timeRaw) return null;

  const wishTime = new Date(String(timeRaw).replace(" ", "T") + (String(timeRaw).includes("T") || String(timeRaw).includes("Z") ? "" : "+08:00"));
  if (Number.isNaN(wishTime.getTime())) return null;

  return {
    hoyoId,
    gachaType,
    itemName,
    itemType: /weapon|оружие/i.test(itemType) ? "Weapon" : /character|персонаж/i.test(itemType) ? "Character" : itemType,
    rankType,
    wishTime,
    raw: row,
  };
}

export function parseWishImportPayload(payload: unknown): NormalizedWish[] {
  const rows: Record<string, unknown>[] = [];

  if (Array.isArray(payload)) {
    rows.push(...(payload as Record<string, unknown>[]));
  } else if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    // UIGF v2.2 / v4
    if (Array.isArray(obj.list)) rows.push(...(obj.list as Record<string, unknown>[]));
    // paimon.moe export-ish
    if (Array.isArray(obj.wish)) rows.push(...(obj.wish as Record<string, unknown>[]));
    if (obj.data && typeof obj.data === "object") {
      const data = obj.data as Record<string, unknown>;
      for (const key of Object.keys(data)) {
        const val = data[key];
        if (Array.isArray(val)) rows.push(...(val as Record<string, unknown>[]));
      }
    }
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

/** Собирает рабочий URL getGachaLog из вставленной ссылки пользователя. */
export function buildGachaLogUrl(rawInput: string, gachaType: string, endId = "0"): string | null {
  const trimmed = rawInput.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  // Если это страница истории — пытаемся вытащить authkey из query
  const authkey = url.searchParams.get("authkey") || url.searchParams.get("auth_key");
  if (!authkey && !url.pathname.includes("getGachaLog")) {
    return null;
  }

  // Нормализуем host/path под публичный API
  const hosts = [
    "public-operation-hk4e-sg.hoyoverse.com",
    "public-operation-hk4e.hoyoverse.com",
    "hk4e-api-os.hoyoverse.com",
    "hk4e-api.hoyoverse.com",
    "hk4e-api-os.mihoyo.com",
    "hk4e-api.mihoyo.com",
  ];

  if (!hosts.some((h) => url.hostname.includes("hoyoverse") || url.hostname.includes("mihoyo"))) {
    // всё равно пробуем, если authkey есть
  }

  if (!url.pathname.includes("getGachaLog")) {
    url.hostname = url.hostname.includes("mihoyo") && !url.hostname.includes("os")
      ? "public-operation-hk4e.hoyoverse.com"
      : "public-operation-hk4e-sg.hoyoverse.com";
    url.pathname = "/gacha_info/api/getGachaLog";
  }

  url.searchParams.set("authkey_ver", url.searchParams.get("authkey_ver") || "1");
  url.searchParams.set("sign_type", url.searchParams.get("sign_type") || "2");
  url.searchParams.set("lang", url.searchParams.get("lang") || "ru");
  url.searchParams.set("game_biz", url.searchParams.get("game_biz") || "hk4e_global");
  url.searchParams.set("gacha_type", gachaType);
  url.searchParams.set("size", "20");
  url.searchParams.set("end_id", endId);
  if (authkey) url.searchParams.set("authkey", decodeURIComponent(authkey));

  return url.toString();
}

export async function fetchAllWishesFromAuthUrl(
  rawUrl: string,
): Promise<{ pulls: NormalizedWish[]; error?: string }> {
  const types = [
    GACHA_TYPES.character,
    GACHA_TYPES.character2,
    GACHA_TYPES.weapon,
    GACHA_TYPES.permanent,
    GACHA_TYPES.chronicled,
    GACHA_TYPES.novice,
  ];

  const all: NormalizedWish[] = [];
  const seen = new Set<string>();

  for (const gachaType of types) {
    let endId = "0";
    for (let page = 0; page < 50; page++) {
      const apiUrl = buildGachaLogUrl(rawUrl, gachaType, endId);
      if (!apiUrl) {
        return { pulls: [], error: "Не удалось разобрать ссылку. Вставьте полный URL с authkey." };
      }

      const res = await fetch(apiUrl, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!res.ok) {
        return {
          pulls: [],
          error: `Hoyoverse API ответил ${res.status}. Откройте историю молитв в игре заново и скопируйте свежую ссылку.`,
        };
      }

      const json = (await res.json()) as {
        retcode?: number;
        message?: string;
        data?: { list?: Record<string, unknown>[] };
      };

      if (json.retcode !== 0) {
        return {
          pulls: [],
          error:
            json.message ||
            `Ошибка API (${json.retcode}). Ссылка устарела — откройте историю молитв в игре снова.`,
        };
      }

      const list = json.data?.list ?? [];
      if (list.length === 0) break;

      for (const row of list) {
        const n = normalizeWishRow({ ...row, gacha_type: gachaType });
        if (!n || seen.has(n.hoyoId)) continue;
        seen.add(n.hoyoId);
        all.push(n);
      }

      endId = String(list[list.length - 1]?.id ?? "0");
      await new Promise((r) => setTimeout(r, 220));
    }
  }

  return { pulls: all };
}
