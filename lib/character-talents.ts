export type TalentStatRow = {
  label: string;
  /** Значения по уровням (число колонок задаётся на талант) */
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

/** Дефолт для новых талантов (обычные атаки / E / Q) */
export const TALENT_LEVEL_COUNT = 13;
export const TALENT_LEVEL_MIN = 1;
export const TALENT_LEVEL_MAX = 20;

export function defaultTalentLevelLabels(count = TALENT_LEVEL_COUNT): string[] {
  return Array.from({ length: count }, (_, i) => String(i + 1));
}

export function emptyTalentStatValues(count = TALENT_LEVEL_COUNT): string[] {
  return Array(count).fill("");
}

export function talentUid() {
  return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function valuesLen(values: string[]): number {
  return values.length;
}

function filledLen(values: string[]): number {
  let end = values.length;
  while (end > 0 && !String(values[end - 1] ?? "").trim()) end -= 1;
  return end;
}

/** Число колонок в редакторе (как сохранено, без обрезки пустых) */
export function talentLevelCount(talent: CharacterTalent): number {
  const fromLabels = talent.levelLabels?.length ?? 0;
  const fromStats = (talent.stats || []).reduce(
    (max, s) => Math.max(max, valuesLen(s.values)),
    0,
  );
  const n = Math.max(fromLabels, fromStats);
  if (n > 0) return Math.min(TALENT_LEVEL_MAX, n);
  return TALENT_LEVEL_COUNT;
}

/** Число колонок на публичной странице — без хвостовых пустых (без прочерков) */
export function talentDisplayLevelCount(talent: CharacterTalent): number {
  const filled = (talent.stats || []).reduce(
    (max, s) => Math.max(max, filledLen(s.values)),
    0,
  );
  if (filled > 0) return filled;
  const labeled = talent.levelLabels?.length ?? 0;
  if (labeled > 0) return labeled;
  return 0;
}

export function resizeTalentLevels(
  talent: CharacterTalent,
  count: number,
): Pick<CharacterTalent, "levelLabels" | "stats"> {
  const n = Math.max(TALENT_LEVEL_MIN, Math.min(TALENT_LEVEL_MAX, count));
  const prevLabels = talent.levelLabels?.length
    ? talent.levelLabels
    : defaultTalentLevelLabels(talentLevelCount(talent));
  const levelLabels = defaultTalentLevelLabels(n).map(
    (fallback, i) => prevLabels[i] || fallback,
  );
  const stats = (talent.stats || []).map((s) => ({
    label: s.label,
    values: resizeValues(s.values, n),
  }));
  return { levelLabels, stats };
}

function resizeValues(values: string[], count: number): string[] {
  const next = values.map((v) => String(v ?? ""));
  while (next.length < count) next.push("");
  return next.slice(0, count);
}

export function parseTalents(raw: unknown): CharacterTalent[] {
  if (!Array.isArray(raw)) return [];
  const out: CharacterTalent[] = [];
  raw.forEach((row, i) => {
    if (!row || typeof row !== "object") return;
    const r = row as Record<string, unknown>;
    const name = typeof r.name === "string" ? r.name.trim() : "";
    if (!name) return;

    const rawStats = Array.isArray(r.stats)
      ? (r.stats as TalentStatRow[])
          .filter((s) => s && typeof s.label === "string" && Array.isArray(s.values))
          .map((s) => ({
            label: String(s.label),
            values: s.values.map((v) => String(v ?? "")),
          }))
      : undefined;

    const rawLabels = Array.isArray(r.levelLabels)
      ? r.levelLabels.map((x) => String(x))
      : undefined;

    let count = Math.max(
      rawLabels?.length ?? 0,
      ...(rawStats || []).map((s) => s.values.length),
    );
    if (count < 1) count = TALENT_LEVEL_COUNT;
    count = Math.min(TALENT_LEVEL_MAX, count);

    const stats = rawStats?.map((s) => ({
      label: s.label,
      values: resizeValues(s.values, count),
    }));
    const levelLabels = defaultTalentLevelLabels(count).map(
      (fb, j) => rawLabels?.[j] || fb,
    );

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
