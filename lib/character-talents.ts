export type TalentStatRow = {
  label: string;
  /** Значения по уровням (Ур.1 …) */
  values: string[];
};

export type CharacterTalent = {
  id: string;
  name: string;
  icon: string;
  /** Видео применения (URL после загрузки) */
  videoUrl?: string;
  /** Описание; **текст** подсвечивается золотым */
  description: string;
  /** Лор / курсив внизу */
  loreText?: string;
  levelLabels?: string[];
  stats?: TalentStatRow[];
  order: number;
};

export function talentUid() {
  return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function parseTalents(raw: unknown): CharacterTalent[] {
  if (!Array.isArray(raw)) return [];
  const out: CharacterTalent[] = [];
  raw.forEach((row, i) => {
    if (!row || typeof row !== "object") return;
    const r = row as Record<string, unknown>;
    const name = typeof r.name === "string" ? r.name.trim() : "";
    if (!name) return;
    const stats = Array.isArray(r.stats)
      ? (r.stats as TalentStatRow[])
          .filter((s) => s && typeof s.label === "string" && Array.isArray(s.values))
          .map((s) => ({
            label: String(s.label),
            values: s.values.map((v) => String(v ?? "")),
          }))
      : undefined;
    const levelLabels = Array.isArray(r.levelLabels)
      ? r.levelLabels.map((x) => String(x))
      : undefined;
    out.push({
      id: typeof r.id === "string" && r.id ? r.id : talentUid(),
      name,
      icon: typeof r.icon === "string" ? r.icon : "",
      videoUrl: typeof r.videoUrl === "string" && r.videoUrl ? r.videoUrl : undefined,
      description: typeof r.description === "string" ? r.description : "",
      loreText: typeof r.loreText === "string" && r.loreText ? r.loreText : undefined,
      levelLabels,
      stats,
      order: typeof r.order === "number" ? r.order : i,
    });
  });
  return out.sort((a, b) => a.order - b.order);
}

/** Подсветка **ключевых** слов золотым */
export function renderTalentDescription(md: string): string {
  const esc = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return esc
    .replace(/\*\*([^*]+)\*\*/g, '<span class="talent-hl">$1</span>')
    .replace(/\n\n+/g, "</p><p>")
    .replace(/\n/g, "<br/>");
}
