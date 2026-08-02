"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import AdminListToolbar from "@/components/admin/AdminListToolbar";
import DeleteEntityButton from "@/components/admin/AdminNavTabs";
import { DuplicateEntityButton } from "@/components/admin/DuplicateEntityButton";
import {
  MATERIAL_CATEGORY_LABEL,
  MATERIAL_CATEGORY_ORDER,
} from "@/lib/character-materials";

export type AdminMaterialRow = {
  id: number;
  slug: string;
  name: string;
  image: string;
  rarityStars: number;
  category: string;
  published: boolean;
};

export default function AdminMaterialsList({ items }: { items: AdminMaterialRow[] }) {
  const [query, setQuery] = useState("");
  const [rarity, setRarity] = useState("ALL");
  const [category, setCategory] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const deferred = useDeferredValue(query.trim().toLowerCase());

  const filtered = useMemo(() => {
    return items.filter((m) => {
      if (rarity !== "ALL" && String(m.rarityStars) !== rarity) return false;
      if (category !== "ALL" && m.category !== category) return false;
      if (status === "published" && !m.published) return false;
      if (status === "draft" && m.published) return false;
      if (!deferred) return true;
      return (
        m.name.toLowerCase().includes(deferred) ||
        m.slug.toLowerCase().includes(deferred)
      );
    });
  }, [items, deferred, rarity, category, status]);

  return (
    <div className="glass-panel overflow-hidden">
      <AdminListToolbar
        query={query}
        onQuery={setQuery}
        placeholder="Поиск по названию или slug…"
        resultCount={filtered.length}
        totalCount={items.length}
        filters={[
          {
            label: "Редкость",
            value: rarity,
            onChange: setRarity,
            options: [
              { value: "ALL", label: "Все" },
              { value: "5", label: "5★" },
              { value: "4", label: "4★" },
              { value: "3", label: "3★" },
              { value: "2", label: "2★" },
              { value: "1", label: "1★" },
            ],
          },
          {
            label: "Категория",
            value: category,
            onChange: setCategory,
            options: [
              { value: "ALL", label: "Все" },
              ...MATERIAL_CATEGORY_ORDER.map((c) => ({
                value: c,
                label: MATERIAL_CATEGORY_LABEL[c],
              })),
            ],
          },
          {
            label: "Статус",
            value: status,
            onChange: setStatus,
            options: [
              { value: "ALL", label: "Все" },
              { value: "published", label: "Опубликован" },
              { value: "draft", label: "Черновик" },
            ],
          },
        ]}
      />

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-[#189b8e]/8 text-xs uppercase tracking-[0.06em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-bold">Материал</th>
              <th className="px-4 py-3 font-bold">Категория</th>
              <th className="px-4 py-3 font-bold">★</th>
              <th className="px-4 py-3 font-bold">Статус</th>
              <th className="px-4 py-3 text-right font-bold">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.05]">
            {filtered.map((m) => (
              <tr key={m.id} className="bg-white/40">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={m.image || "/images/legend-bg.jpg"}
                      alt=""
                      className="h-10 w-10 rounded-xl object-contain ring-1 ring-black/[0.06]"
                    />
                    <div>
                      <p className="font-semibold">{m.name}</p>
                      <p className="text-xs text-muted-foreground">/{m.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-medium">
                  {MATERIAL_CATEGORY_LABEL[m.category as keyof typeof MATERIAL_CATEGORY_LABEL] ??
                    m.category}
                </td>
                <td className="px-4 py-3 font-medium">{m.rarityStars}★</td>
                <td className="px-4 py-3">
                  {m.published ? (
                    <span className="rounded-full bg-[#189b8e]/12 px-2.5 py-1 text-xs font-bold text-[#189b8e]">
                      Опубликован
                    </span>
                  ) : (
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">
                      Черновик
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/wiki/materials/${m.slug}`}
                      target="_blank"
                      className="rounded-xl border border-black/[0.08] bg-white px-3 py-1.5 text-xs font-bold text-muted-foreground"
                    >
                      Открыть
                    </Link>
                    <Link
                      href={`/admin/materials/${m.id}/edit`}
                      className="rounded-xl border border-black/[0.08] bg-white px-3 py-1.5 text-xs font-bold text-[#189b8e]"
                    >
                      Править
                    </Link>
                    <DuplicateEntityButton
                      apiBase="/api/admin/materials"
                      id={m.id}
                      name={m.name}
                      editBase="/admin/materials"
                    />
                    <DeleteEntityButton apiBase="/api/admin/materials" id={m.id} name={m.name} />
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  {items.length === 0
                    ? "Пока нет материалов — создайте первый."
                    : "Ничего не найдено по текущим фильтрам."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
