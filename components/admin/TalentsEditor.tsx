"use client";

import { Plus, Trash2 } from "lucide-react";
import MediaUpload from "@/components/admin/MediaUpload";
import {
  talentUid,
  type CharacterTalent,
  type TalentStatRow,
} from "@/lib/character-talents";

type Props = {
  value: CharacterTalent[];
  onChange: (next: CharacterTalent[]) => void;
};

const DEFAULT_LEVELS = Array.from({ length: 8 }, (_, i) => `Ур. ${i + 1}`);

function emptyStats(): TalentStatRow[] {
  return [
    { label: "Урон навыка", values: Array(8).fill("") },
    { label: "Время отката", values: Array(8).fill("") },
  ];
}

export default function TalentsEditor({ value, onChange }: Props) {
  const input =
    "w-full rounded-[12px] border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-foreground outline-none ring-[#189b8e]/25 focus:ring-2";
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
        levelLabels: [...DEFAULT_LEVELS],
        stats: emptyStats(),
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
    const stats = t.stats.map((s, i) => {
      if (i !== rowIdx) return s;
      const values = [...s.values];
      values[col] = v;
      return { ...s, values };
    });
    updateRow(talentId, { stats });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#189b8e]">
            Таланты
          </p>
          <p className="text-sm font-medium text-muted-foreground">
            Иконки, видео применения, описание и таблица уровней
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
        <p className="rounded-[14px] border border-dashed border-white/10 bg-white/[0.03] px-4 py-6 text-center text-sm font-medium text-muted-foreground">
          Пока пусто — добавьте обычную атаку, E, ульту и пассивки.
        </p>
      )}

      <div className="space-y-4">
        {value.map((row, idx) => (
          <div
            key={row.id}
            className="rounded-[16px] border border-white/10 bg-white/[0.03] p-3 sm:p-4"
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
                accept="video/*"
                hint="mp4 / webm"
              />
            </div>

            <div className="mt-3 grid gap-3">
              <div>
                <label className={label}>Название</label>
                <input
                  className={input}
                  value={row.name}
                  onChange={(e) => updateRow(row.id, { name: e.target.value })}
                  placeholder="Тоска во свете луны"
                />
              </div>
              <div>
                <label className={label}>
                  Описание (**слово** — золотая подсветка)
                </label>
                <textarea
                  className={`${input} min-h-[100px]`}
                  value={row.description}
                  onChange={(e) =>
                    updateRow(row.id, { description: e.target.value })
                  }
                  placeholder="Создаёт **Владения луны**, наносящие **Гидро урон**..."
                />
              </div>
              <div>
                <label className={label}>Лор (курсив внизу)</label>
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
                <p className={label + " mb-0"}>Таблица уровней</p>
                <button
                  type="button"
                  className="text-xs font-bold text-[#189b8e]"
                  onClick={() =>
                    updateRow(row.id, {
                      stats: [...(row.stats || []), { label: "", values: Array(8).fill("") }],
                    })
                  }
                >
                  + строка
                </button>
              </div>
              {(row.stats || []).map((stat, si) => (
                <div
                  key={si}
                  className="mb-2 rounded-[12px] border border-white/10 bg-black/20 p-2"
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
                  <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-8">
                    {Array.from({ length: 8 }).map((_, ci) => (
                      <input
                        key={ci}
                        className={`${input} px-1.5 py-1.5 text-center text-[11px]`}
                        value={stat.values[ci] || ""}
                        placeholder={`Ур.${ci + 1}`}
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
        ))}
      </div>
    </div>
  );
}
