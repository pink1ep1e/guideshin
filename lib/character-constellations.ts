export type CharacterConstellation = {
  id: string;
  /** C1 … C6 */
  level: number;
  name: string;
  /** URL иконки; пусто = заглушка */
  icon?: string;
  /** Описание; **слово** — акцент сайта */
  description: string;
  order: number;
};

export function constellationUid() {
  return `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function parseConstellations(raw: unknown): CharacterConstellation[] {
  if (!Array.isArray(raw)) return [];
  const out: CharacterConstellation[] = [];
  raw.forEach((row, i) => {
    if (!row || typeof row !== "object") return;
    const r = row as Record<string, unknown>;
    const name = typeof r.name === "string" ? r.name.trim() : "";
    if (!name) return;
    const level =
      typeof r.level === "number" && r.level >= 1
        ? Math.min(6, Math.floor(r.level))
        : i + 1;
    out.push({
      id: typeof r.id === "string" && r.id ? r.id : constellationUid(),
      level,
      name,
      icon: typeof r.icon === "string" && r.icon ? r.icon : undefined,
      description: typeof r.description === "string" ? r.description : "",
      order: typeof r.order === "number" ? r.order : i,
    });
  });
  return out.sort((a, b) => a.order - b.order || a.level - b.level);
}

/** Подсветка **ключевых** слов акцентным цветом сайта */
export function renderConstellationDescription(md: string): string {
  const esc = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return esc
    .replace(/\*\*([^*]+)\*\*/g, '<span class="guide-hl">$1</span>')
    .replace(/^[-–—]\s+/gm, '<span class="guide-bullet">—</span> ')
    .replace(/\n\n+/g, "</p><p>")
    .replace(/\n/g, "<br/>");
}
