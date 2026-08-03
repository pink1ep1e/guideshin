/** Клиентские и серверные хелперы аналитики. */

export type AnalyticsEventType =
  | "pageview"
  | "click"
  | "telegram_click"
  | "outbound";

export type AnalyticsEntityType =
  | "character"
  | "weapon"
  | "artifact"
  | "material"
  | "home"
  | "map"
  | "other";

export type ClientAnalyticsPayload = {
  type: AnalyticsEventType;
  path: string;
  title?: string;
  entityType?: AnalyticsEntityType | string;
  entitySlug?: string;
  entityName?: string;
  sessionId: string;
  visitorId: string;
  referrer?: string;
  language?: string;
  screen?: string;
  meta?: Record<string, unknown>;
};

const BOT_RE =
  /bot|spider|crawl|slurp|facebookexternalhit|preview|pingdom|lighthouse|headless|phantom|selenium|wget|curl|python-requests|scrapy/i;

export function isBotUserAgent(ua: string | null | undefined): boolean {
  if (!ua) return false;
  return BOT_RE.test(ua);
}

export function parseEntityFromPath(pathname: string): {
  entityType: AnalyticsEntityType;
  entitySlug?: string;
} {
  if (pathname === "/" || pathname === "") return { entityType: "home" };
  if (pathname === "/map" || pathname.startsWith("/map/")) return { entityType: "map" };

  const m = pathname.match(
    /^\/wiki\/(characters|weapons|artifacts|materials)(?:\/([^/?#]+))?/,
  );
  if (!m) return { entityType: "other" };

  const kind = m[1] as "characters" | "weapons" | "artifacts" | "materials";
  const map = {
    characters: "character",
    weapons: "weapon",
    artifacts: "artifact",
    materials: "material",
  } as const;

  return {
    entityType: map[kind],
    entitySlug: m[2] ? decodeURIComponent(m[2]) : undefined,
  };
}

export function shouldTrackPath(pathname: string): boolean {
  if (!pathname) return false;
  if (pathname.startsWith("/admin")) return false;
  if (pathname.startsWith("/api")) return false;
  if (pathname.startsWith("/_next")) return false;
  return true;
}

export function clientIpFromHeaders(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return (
    headers.get("x-real-ip") ||
    headers.get("cf-connecting-ip") ||
    headers.get("true-client-ip") ||
    null
  );
}

export function countryFromHeaders(headers: Headers): {
  countryCode?: string;
  country?: string;
} {
  const code =
    headers.get("x-vercel-ip-country") ||
    headers.get("cf-ipcountry") ||
    headers.get("x-country-code") ||
    headers.get("cloudfront-viewer-country") ||
    undefined;
  if (!code || code === "XX" || code === "T1") return {};
  return { countryCode: code.toUpperCase() };
}

type GeoCacheEntry = {
  country?: string;
  countryCode?: string;
  city?: string;
  region?: string;
  at: number;
};

const geoCache = new Map<string, GeoCacheEntry>();
const GEO_TTL_MS = 1000 * 60 * 60 * 12;

function isPrivateIp(ip: string): boolean {
  return (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)
  );
}

/** Обогащение гео по IP (кэш + ip-api.com, без ключа). */
export async function lookupGeo(ip: string | null): Promise<{
  country?: string;
  countryCode?: string;
  city?: string;
  region?: string;
}> {
  if (!ip || isPrivateIp(ip)) return {};

  const cached = geoCache.get(ip);
  if (cached && Date.now() - cached.at < GEO_TTL_MS) {
    const { at: _at, ...rest } = cached;
    return rest;
  }

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 1800);
    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,countryCode,city,regionName`,
      { signal: ctrl.signal, next: { revalidate: 0 } },
    );
    clearTimeout(timer);
    if (!res.ok) return {};
    const data = (await res.json()) as {
      status?: string;
      country?: string;
      countryCode?: string;
      city?: string;
      regionName?: string;
    };
    if (data.status !== "success") return {};
    const entry: GeoCacheEntry = {
      country: data.country,
      countryCode: data.countryCode,
      city: data.city,
      region: data.regionName,
      at: Date.now(),
    };
    geoCache.set(ip, entry);
    if (geoCache.size > 5000) {
      const first = geoCache.keys().next().value;
      if (first) geoCache.delete(first);
    }
    const { at: _a, ...rest } = entry;
    return rest;
  } catch {
    return {};
  }
}

export const ENTITY_TYPE_LABEL: Record<string, string> = {
  character: "Персонаж",
  weapon: "Оружие",
  artifact: "Артефакт",
  material: "Материал",
  home: "Главная",
  map: "Карта",
  other: "Другое",
};

export const EVENT_TYPE_LABEL: Record<string, string> = {
  pageview: "Просмотр",
  click: "Клик",
  telegram_click: "Telegram",
  outbound: "Внешняя ссылка",
};
