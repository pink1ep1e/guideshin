import slugify from "slugify";

/** URL-slug из названия (с транслитом русского). */
export function slugFromName(name: string): string {
  const raw = name.trim();
  if (!raw) return "";
  return (
    slugify(raw, { lower: true, strict: true, locale: "ru" }) ||
    slugify(raw, { lower: true, strict: true }) ||
    ""
  );
}
