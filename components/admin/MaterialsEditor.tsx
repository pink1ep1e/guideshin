"use client";

import { Plus, Trash2 } from "lucide-react";
import MediaUpload from "@/components/admin/MediaUpload";
import FancySelect from "@/components/ui/FancySelect";
import { CatalogPicker, useGuideCatalog } from "@/components/admin/CatalogPicker";
import {
  MATERIAL_CATEGORY_LABEL,
  materialUid,
  normalizeMaterialCategory,
  type CharacterMaterial,
  type MaterialCategory,
} from "@/lib/character-materials";

const CATEGORIES = Object.keys(MATERIAL_CATEGORY_LABEL) as MaterialCategory[];

type Props = {
  value: CharacterMaterial[];
  onChange: (next: CharacterMaterial[]) => void;
};

export default function MaterialsEditor({ value, onChange }: Props) {
  const { catalog } = useGuideCatalog();
  const input =
    "w-full rounded-[12px] border border-black/[0.08] bg-white/90 px-3 py-2 text-sm font-medium outline-none ring-[#189b8e]/25 focus:ring-2";
  const label =
    "mb-1 block text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground";

  function updateRow(id: string, patch: Partial<CharacterMaterial>) {
    onChange(value.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function emptyRow(): CharacterMaterial {
    return {
      id: materialUid(),
      name: "",
      image: "",
      qty: 0,
      category: "ascension",
      rarityStars: 3,
    };
  }

  function addRow() {
    onChange([...value, emptyRow()]);
  }

  function addFromCatalog(picked: {
    name: string;
    image: string;
    rarityStars?: number;
  }) {
    const fromDb = catalog.materials.find((m) => m.name === picked.name);
    onChange([
      ...value,
      {
        id: materialUid(),
        name: picked.name,
        image: picked.image,
        qty: 0,
        category: normalizeMaterialCategory(fromDb?.category),
        rarityStars: picked.rarityStars ?? fromDb?.rarityStars ?? 3,
      },
    ]);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#189b8e]">
            Материалы прокачки
          </p>
          <p className="text-sm font-medium text-muted-foreground">
            Берите из базы или вводите вручную — количество своё для персонажа
          </p>
        </div>
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#189b8e]/12 px-3 py-2 text-xs font-bold text-[#189b8e]"
        >
          <Plus className="h-3.5 w-3.5" />
          Пустая строка
        </button>
      </div>

      <CatalogPicker
        label="Добавить материал из базы"
        kind="materials"
        catalog={catalog}
        onPick={addFromCatalog}
      />

      {value.length === 0 && (
        <p className="rounded-[14px] border border-dashed border-black/[0.08] bg-white/60 px-4 py-6 text-center text-sm font-medium text-muted-foreground">
          Пока пусто — найдите материал в поиске выше или добавьте пустую строку.
        </p>
      )}

      <div className="space-y-3">
        {value.map((row, idx) => (
          <div
            key={row.id}
            className="rounded-[16px] border border-black/[0.05] bg-[#0b1f44]/[0.02] p-3"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-bold text-muted-foreground">
                Материал #{idx + 1}
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
            <div className="mb-3">
              <CatalogPicker
                label="Заменить из базы"
                kind="materials"
                catalog={catalog}
                onPick={(picked) => {
                  const fromDb = catalog.materials.find((m) => m.name === picked.name);
                  updateRow(row.id, {
                    name: picked.name,
                    image: picked.image,
                    rarityStars: picked.rarityStars ?? fromDb?.rarityStars ?? row.rarityStars,
                    category: normalizeMaterialCategory(
                      fromDb?.category ?? row.category,
                    ),
                  });
                }}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <MediaUpload
                label="Иконка"
                value={row.image}
                onChange={(image) => updateRow(row.id, { image })}
                kind="material"
              />
              <div className="space-y-3">
                <div>
                  <label className={label}>Название</label>
                  <input
                    className={input}
                    value={row.name}
                    onChange={(e) => updateRow(row.id, { name: e.target.value })}
                    placeholder="Лазурит Варунада"
                  />
                </div>
                <div>
                  <label className={label}>Количество</label>
                  <input
                    className={input}
                    type="number"
                    min={0}
                    value={row.qty || ""}
                    onChange={(e) =>
                      updateRow(row.id, { qty: Number(e.target.value) || 0 })
                    }
                    placeholder="168"
                  />
                </div>
                <FancySelect
                  label="Категория"
                  value={row.category}
                  onChange={(category) =>
                    updateRow(row.id, { category: category as MaterialCategory })
                  }
                  options={CATEGORIES.map((c) => ({
                    value: c,
                    label: MATERIAL_CATEGORY_LABEL[c],
                  }))}
                  size="sm"
                />
                <FancySelect
                  label="Редкость (фон)"
                  value={String(row.rarityStars ?? 3)}
                  onChange={(v) => updateRow(row.id, { rarityStars: Number(v) })}
                  options={[1, 2, 3, 4, 5].map((n) => ({
                    value: String(n),
                    label: `${n}★`,
                  }))}
                  size="sm"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
