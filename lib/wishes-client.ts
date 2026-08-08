/** Клиентские хелперы для импорта молитв. */

export function looksLikeWishAuthUrl(value: string): boolean {
  const v = value.trim();
  if (!v.startsWith("http")) return false;
  return /[?&]authkey=/i.test(v) || /[?&]auth_key=/i.test(v);
}
