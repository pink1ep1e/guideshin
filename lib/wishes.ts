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
  raw?: { paimon_rate?: number } | null;
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
    remaining5: Math.max(0, pity5Max - pity5),
    remaining4: Math.max(0, pity4Max - pity4),
    softPityAt,
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
 */
export function extractQueryParam(rawUrl: string, key: string): string | null {
  const m = rawUrl.match(new RegExp(`[?&#]${key}=([^&]*)`, "i"));
  if (!m) return null;
  const encoded = m[1].replace(/\+/g, "%2B");
  try {
    return decodeURIComponent(encoded);
  } catch {
    return m[1];
  }
}

export function resolveGachaApiHosts(rawUrl: string): string[] {
  const gameBiz = (
    extractQueryParam(rawUrl, "game_biz") || "hk4e_global"
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

  const authkey =
    extractQueryParam(trimmed, "authkey") ||
    extractQueryParam(trimmed, "auth_key");
  if (!authkey) return null;

  const gameBiz = extractQueryParam(trimmed, "game_biz") || "hk4e_global";
  const lang = extractQueryParam(trimmed, "lang") || "ru";
  const region = extractQueryParam(trimmed, "region");
  const authkeyVer = extractQueryParam(trimmed, "authkey_ver") || "1";
  const signType = extractQueryParam(trimmed, "sign_type") || "2";

  const base = apiBase || resolveGachaApiHosts(trimmed)[0];
  const url = new URL(base);
  url.searchParams.set("authkey_ver", authkeyVer);
  url.searchParams.set("sign_type", signType);
  url.searchParams.set("auth_appid", "webview_gacha");
  url.searchParams.set("lang", lang);
  url.searchParams.set("game_biz", gameBiz);
  if (region) url.searchParams.set("region", region);
  url.searchParams.set("authkey", authkey);
  url.searchParams.set("gacha_type", gachaType);
  url.searchParams.set("page", "1");
  url.searchParams.set("size", "20");
  url.searchParams.set("end_id", endId);

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
    let lastError = "Не удалось подключиться к API Hoyoverse.";
    let found = false;
    for (const host of hosts) {
      const probe = buildGachaLogUrl(trimmed, GACHA_TYPES.character, "0", host);
      if (!probe) continue;
      const { json, error, network } = await fetchGachaPage(probe);
      if (network || !json) {
        lastError = error || lastError;
        continue;
      }
      if (json.retcode === 0) {
        workingHost = host;
        found = true;
        break;
      }
      lastError =
        json.message ||
        `Ошибка API (${json.retcode}). Ссылка устарела — откройте историю молитв снова.`;
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

      const { json, error } = await fetchGachaPage(apiUrl);
      if (!json) {
        return { pulls: [], error: error || "Ошибка запроса к Hoyoverse." };
      }

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

      onProgress?.({
        phase: "banner",
        label: `Импорт: ${bannerLabel} · стр. ${page + 1}`,
        step: ti + 1,
        steps: types.length,
        page: page + 1,
        totalPulled: all.length,
      });

      endId = String(list[list.length - 1]?.id ?? "0");
      await new Promise((r) => setTimeout(r, 180));
    }
  }

  if (all.length === 0) {
    return {
      pulls: [],
      error:
        "Молитв не найдено. Откройте историю в игре, дождитесь загрузки и получите свежую ссылку.",
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
