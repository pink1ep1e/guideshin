export const GACHA_TYPES = {
  novice: "100",
  permanent: "200",
  character: "301",
  character2: "400",
  weapon: "302",
} as const;

export type GachaBannerKey = "character" | "weapon" | "permanent" | "novice";

export const BANNER_LABELS: Record<GachaBannerKey, string> = {
  character: "Ивент персонажей",
  weapon: "Ивент оружия",
  permanent: "Стандарт",
  novice: "Новичок",
};

export function bannerKeyFromGachaType(gachaType: string): GachaBannerKey {
  if (gachaType === GACHA_TYPES.weapon) return "weapon";
  if (gachaType === GACHA_TYPES.permanent) return "permanent";
  if (gachaType === GACHA_TYPES.novice) return "novice";
  return "character";
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
  guaranteed5: boolean;
  last5Star: string | null;
  fiveStars: { name: string; pity: number; time: string }[];
};

/** Считает pity по баннеру (хронология от старых к новым). */
export function computeBannerStats(
  pulls: WishPullLike[],
  key: GachaBannerKey,
): BannerPityStats {
  const types: string[] =
    key === "character"
      ? [GACHA_TYPES.character, GACHA_TYPES.character2]
      : key === "weapon"
        ? [GACHA_TYPES.weapon]
        : key === "permanent"
          ? [GACHA_TYPES.permanent]
          : [GACHA_TYPES.novice];

  const filtered = pulls
    .filter((p) => types.includes(p.gachaType))
    .slice()
    .sort(
      (a, b) =>
        new Date(a.wishTime).getTime() - new Date(b.wishTime).getTime(),
    );

  let pity4 = 0;
  let pity5 = 0;
  let guaranteed5 = false;
  let last5Star: string | null = null;
  const fiveStars: BannerPityStats["fiveStars"] = [];

  for (const pull of filtered) {
    pity4 += 1;
    pity5 += 1;
    const rank = String(pull.rankType);

    if (rank === "4") {
      pity4 = 0;
    }
    if (rank === "5") {
      fiveStars.push({
        name: pull.itemName,
        pity: pity5,
        time: new Date(pull.wishTime).toISOString(),
      });
      last5Star = pull.itemName;
      pity5 = 0;
      pity4 = 0;
      // Упрощённо: после стандартного 5★ на ивенте — гарант (эвристика)
      if (key === "character") {
        // Не знаем featured без баннер-календаря; оставляем false по умолчанию
        guaranteed5 = false;
      }
    }
  }

  return {
    key,
    label: BANNER_LABELS[key],
    total: filtered.length,
    pity4,
    pity5,
    guaranteed5,
    last5Star,
    fiveStars: fiveStars.slice().reverse(),
  };
}

export function computeAllBannerStats(pulls: WishPullLike[]) {
  return (["character", "weapon", "permanent"] as GachaBannerKey[]).map(
    (key) => computeBannerStats(pulls, key),
  );
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
