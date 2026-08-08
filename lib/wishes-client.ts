/** Клиентские хелперы для импорта молитв (без серверных fetch). */

export function looksLikeWishAuthUrl(value: string): boolean {
  const v = value.trim();
  if (!v.startsWith("http")) return false;
  try {
    const url = new URL(v);
    return url.searchParams.has("authkey") || url.searchParams.has("auth_key");
  } catch {
    return /authkey=/i.test(v);
  }
}
