export type TalentStatRow = {
  label: string;
  /** Значения по уровням (1…13) */
  values: string[];
};

export type CharacterTalent = {
  id: string;
  name: string;
  icon: string;
  videoUrl?: string;
  /** Описание; **текст** подсвечивается */
  description: string;
  loreText?: string;
  levelLabels?: string[];
  stats?: TalentStatRow[];
  order: number;
};

export const TALENT_LEVEL_COUNT = 13;

export function defaultTalentLevelLabels(): string[] {
  return Array.from({ length: TALENT_LEVEL_COUNT }, (_, i) => String(i + 1));
}

export function emptyTalentStatValues(): string[] {
  return Array(TALENT_LEVEL_COUNT).fill("");
}

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
            values: padValues(s.values.map((v) => String(v ?? ""))),
          }))
      : undefined;
    const levelLabels = Array.isArray(r.levelLabels)
      ? padLabels(r.levelLabels.map((x) => String(x)))
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

function padValues(values: string[]): string[] {
  const next = [...values];
  while (next.length < TALENT_LEVEL_COUNT) next.push("");
  return next.slice(0, TALENT_LEVEL_COUNT);
}

function padLabels(labels: string[]): string[] {
  if (labels.length >= TALENT_LEVEL_COUNT) return labels.slice(0, TALENT_LEVEL_COUNT);
  const next = [...labels];
  while (next.length < TALENT_LEVEL_COUNT) next.push(String(next.length + 1));
  return next;
}

/** Подсветка **ключевых** слов */
export function renderTalentDescription(md: string): string {
  const esc = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return esc
    .replace(/\*\*([^*]+)\*\*/g, '<span class="guide-hl">$1</span>')
    .replace(/\n\n+/g, "</p><p>")
    .replace(/\n/g, "<br/>");
}
