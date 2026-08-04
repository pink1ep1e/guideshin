"use client";

import { Plus, Trash2 } from "lucide-react";
import MediaUpload from "@/components/admin/MediaUpload";
import {
  constellationUid,
  type CharacterConstellation,
} from "@/lib/character-constellations";

type Props = {
  value: CharacterConstellation[];
  onChange: (next: CharacterConstellation[]) => void;
};

export default function ConstellationsEditor({ value, onChange }: Props) {
  const input =
    "w-full rounded-[12px] border border-black/[0.08] bg-white/90 px-3 py-2 text-sm font-medium outline-none ring-[#189b8e]/25 focus:ring-2";
  const label =
    "mb-1 block text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground";

  function updateRow(id: string, patch: Partial<CharacterConstellation>) {
    onChange(value.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function addRow() {
    const level = Math.min(6, value.length + 1);
    onChange([
      ...value,
      {
        id: constellationUid(),
        level,
        name: "",
        icon: "",
        description: "",
        order: value.length,
      },
    ]);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#189b8e]">
            Созвездия
          </p>
          <p className="text-sm font-medium text-muted-foreground">
            C1–C6: название, описание (**акцент**), иконка позже
          </p>
        </div>
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#189b8e]/12 px-3 py-2 text-xs font-bold text-[#189b8e]"
        >
          <Plus className="h-3.5 w-3.5" />
          Добавить
        </button>
      </div>

      {value.length === 0 && (
        <p className="rounded-[14px] border border-dashed border-black/[0.08] bg-white/60 px-4 py-6 text-center text-sm font-medium text-muted-foreground">
          Пока пусто — добавьте созвездия по порядку.
        </p>
      )}

      <div className="space-y-3">
        {value.map((row, idx) => (
          <div
            key={row.id}
            className="rounded-[16px] border border-black/[0.05] bg-[#0b1f44]/[0.02] p-3 sm:p-4"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-xs font-bold text-muted-foreground">
                Созвездие #{idx + 1}
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

            <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
              <MediaUpload
                label="Иконка (опц.)"
                value={row.icon || ""}
                onChange={(icon) => updateRow(row.id, { icon })}
                kind="other"
                compact
              />
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-[88px_1fr]">
                  <div>
                    <label className={label}>Уровень</label>
                    <input
                      type="number"
                      min={1}
                      max={6}
                      className={input}
                      value={row.level}
                      onChange={(e) =>
                        updateRow(row.id, {
                          level: Math.min(6, Math.max(1, Number(e.target.value) || 1)),
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className={label}>Название</label>
                    <input
                      className={input}
                      value={row.name}
                      onChange={(e) => updateRow(row.id, { name: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className={label}>Описание (**акцент**)</label>
                  <textarea
                    className={`${input} min-h-[100px]`}
                    value={row.description}
                    onChange={(e) =>
                      updateRow(row.id, { description: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
