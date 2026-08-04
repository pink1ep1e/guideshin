"use client";

import { Plus, Trash2 } from "lucide-react";
import MediaUpload from "@/components/admin/MediaUpload";
import {
  TALENT_LEVEL_COUNT,
  TALENT_LEVEL_MAX,
  TALENT_LEVEL_MIN,
  defaultTalentLevelLabels,
  emptyTalentStatValues,
  resizeTalentLevels,
  talentLevelCount,
  talentUid,
  type CharacterTalent,
  type TalentStatRow,
} from "@/lib/character-talents";

type Props = {
  value: CharacterTalent[];
  onChange: (next: CharacterTalent[]) => void;
};

function emptyStats(levels: number): TalentStatRow[] {
  return [
    { label: "Урон навыка", values: emptyTalentStatValues(levels) },
    { label: "Время отката", values: emptyTalentStatValues(levels) },
  ];
}

export default function TalentsEditor({ value, onChange }: Props) {
  const input =
    "w-full rounded-[12px] border border-black/[0.08] bg-white/90 px-3 py-2 text-sm font-medium outline-none ring-[#189b8e]/25 focus:ring-2";
  const label =
    "mb-1 block text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground";

  function updateRow(id: string, patch: Partial<CharacterTalent>) {
    onChange(value.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function addRow() {
    onChange([
      ...value,
      {
        id: talentUid(),
        name: "",
        icon: "",
        videoUrl: "",
        description: "",
        loreText: "",
        levelLabels: defaultTalentLevelLabels(),
        stats: emptyStats(TALENT_LEVEL_COUNT),
        order: value.length,
      },
    ]);
  }

  function updateStat(
    talentId: string,
    rowIdx: number,
    patch: Partial<TalentStatRow>,
  ) {
    const t = value.find((x) => x.id === talentId);
    if (!t?.stats) return;
    const stats = t.stats.map((s, i) => (i === rowIdx ? { ...s, ...patch } : s));
    updateRow(talentId, { stats });
  }

  function setStatCell(talentId: string, rowIdx: number, col: number, v: string) {
    const t = value.find((x) => x.id === talentId);
    if (!t?.stats) return;
    const cols = talentLevelCount(t);
    const stats = t.stats.map((s, i) => {
      if (i !== rowIdx) return s;
      const values = [...s.values];
      while (values.length < cols) values.push("");
      values[col] = v;
      return { ...s, values: values.slice(0, cols) };
    });
    updateRow(talentId, { stats });
  }

  function setLevelCount(talentId: string, count: number) {
    const t = value.find((x) => x.id === talentId);
    if (!t) return;
    updateRow(talentId, resizeTalentLevels(t, count));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#189b8e]">
            Таланты
          </p>
          <p className="text-sm font-medium text-muted-foreground">
            Иконки, видео/gif, описание и таблица уровней (можно менять число колонок)
          </p>
        </div>
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#189b8e]/12 px-3 py-2 text-xs font-bold text-[#189b8e]"
        >
          <Plus className="h-3.5 w-3.5" />
          Добавить талант
        </button>
      </div>

      {value.length === 0 && (
        <p className="rounded-[14px] border border-dashed border-black/[0.08] bg-white/60 px-4 py-6 text-center text-sm font-medium text-muted-foreground">
          Пока пусто — добавьте обычную атаку, E, ульту и пассивки.
        </p>
      )}

      <div className="space-y-4">
        {value.map((row, idx) => {
          const cols = talentLevelCount(row);
          return (
            <div
              key={row.id}
              className="rounded-[16px] border border-black/[0.05] bg-[#0b1f44]/[0.02] p-3 sm:p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-muted-foreground">
                  Талант #{idx + 1}
                </p>
                <button
                  type="button"
                  onClick={() => onChange(value.filter((x) => x.id !== row.id))}
                  className="inline-flex items-center gap-1 text-xs font-bold text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Удалить
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <MediaUpload
                  label="Иконка таланта"
                  value={row.icon}
                  onChange={(icon) => updateRow(row.id, { icon })}
                  kind="other"
                />
                <MediaUpload
                  label="Видео применения"
                  value={row.videoUrl || ""}
                  onChange={(videoUrl) => updateRow(row.id, { videoUrl })}
                  kind="video"
                  preview="video"
                  accept="video/mp4,video/webm,image/gif"
                  hint="mp4 / webm / gif · можно оставить пустым"
                />
              </div>

              <div className="mt-3 grid gap-3">
                <div>
                  <label className={label}>Название</label>
                  <input
                    className={input}
                    value={row.name}
                    onChange={(e) => updateRow(row.id, { name: e.target.value })}
                  />
                </div>
                <div>
                  <label className={label}>
                    Описание (**слово** — акцент)
                  </label>
                  <textarea
                    className={`${input} min-h-[100px]`}
                    value={row.description}
                    onChange={(e) =>
                      updateRow(row.id, { description: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className={label}>Лор (курсив)</label>
                  <textarea
                    className={`${input} min-h-[60px]`}
                    value={row.loreText || ""}
                    onChange={(e) =>
                      updateRow(row.id, { loreText: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className={`${label} mb-0`}>Таблица ({cols} ур.)</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className="text-xs font-bold text-muted-foreground hover:text-destructive disabled:opacity-40"
                      disabled={cols <= TALENT_LEVEL_MIN}
                      onClick={() => setLevelCount(row.id, cols - 1)}
                    >
                      − уровень
                    </button>
                    <button
                      type="button"
                      className="text-xs font-bold text-[#189b8e] disabled:opacity-40"
                      disabled={cols >= TALENT_LEVEL_MAX}
                      onClick={() => setLevelCount(row.id, cols + 1)}
                    >
                      + уровень
                    </button>
                    <button
                      type="button"
                      className="text-xs font-bold text-[#189b8e]"
                      onClick={() =>
                        updateRow(row.id, {
                          stats: [
                            ...(row.stats || []),
                            { label: "", values: emptyTalentStatValues(cols) },
                          ],
                        })
                      }
                    >
                      + строка
                    </button>
                  </div>
                </div>
                {(row.stats || []).map((stat, si) => (
                  <div
                    key={si}
                    className="mb-2 rounded-[12px] border border-black/[0.06] bg-white/70 p-2"
                  >
                    <div className="mb-2 flex gap-2">
                      <input
                        className={input}
                        value={stat.label}
                        placeholder="Урон навыка"
                        onChange={(e) =>
                          updateStat(row.id, si, { label: e.target.value })
                        }
                      />
                      <button
                        type="button"
                        className="shrink-0 text-xs font-bold text-destructive"
                        onClick={() =>
                          updateRow(row.id, {
                            stats: (row.stats || []).filter((_, j) => j !== si),
                          })
                        }
                      >
                        ×
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">
                      {Array.from({ length: cols }).map((_, ci) => (
                        <input
                          key={ci}
                          className={`${input} px-1 py-1.5 text-center text-[10px]`}
                          value={stat.values[ci] || ""}
                          placeholder={`${ci + 1}`}
                          onChange={(e) =>
                            setStatCell(row.id, si, ci, e.target.value)
                          }
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
