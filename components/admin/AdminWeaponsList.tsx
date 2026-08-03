"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import AdminListToolbar from "@/components/admin/AdminListToolbar";
import { useAdminDelete } from "@/components/admin/AdminDeleteContext";
import DeleteEntityButton from "@/components/admin/AdminNavTabs";
import { DuplicateEntityButton } from "@/components/admin/DuplicateEntityButton";
import { RARITY_LABEL } from "@/lib/genshin";
import { WEAPON_TYPE_ORDER } from "@/lib/regions";

export type AdminWeaponRow = {
  id: number;
  slug: string;
  name: string;
  image: string;
  rarity: "LEGEND" | "EPIC" | "RARE" | "COMMON";
  weaponType: string;
  published: boolean;
};

export default function AdminWeaponsList({ items }: { items: AdminWeaponRow[] }) {
  const { pendingKeys } = useAdminDelete();
  const [query, setQuery] = useState("");
  const [rarity, setRarity] = useState("ALL");
  const [type, setType] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const deferred = useDeferredValue(query.trim().toLowerCase());

  const filtered = useMemo(() => {
    return items.filter((w) => {
      if (pendingKeys.has(`weapons:${w.id}`)) return false;
      if (rarity !== "ALL" && w.rarity !== rarity) return false;
      if (type !== "ALL" && w.weaponType !== type) return false;
      if (status === "published" && !w.published) return false;
      if (status === "draft" && w.published) return false;
      if (!deferred) return true;
      return (
        w.name.toLowerCase().includes(deferred) ||
        w.slug.toLowerCase().includes(deferred) ||
        w.weaponType.toLowerCase().includes(deferred)
      );
    });
  }, [items, deferred, rarity, type, status, pendingKeys]);

  return (
    <div className="glass-panel overflow-hidden">
      <AdminListToolbar
        query={query}
        onQuery={setQuery}
        placeholder="Поиск по названию, slug или типу…"
        resultCount={filtered.length}
        totalCount={items.length}
        filters={[
          {
            label: "Редкость",
            value: rarity,
            onChange: setRarity,
            options: [
              { value: "ALL", label: "Все" },
              { value: "LEGEND", label: "5★" },
              { value: "EPIC", label: "4★" },
              { value: "RARE", label: "3★" },
              { value: "COMMON", label: "2★" },
            ],
          },
          {
            label: "Тип",
            value: type,
            onChange: setType,
            options: [
              { value: "ALL", label: "Все" },
              ...WEAPON_TYPE_ORDER.map((t) => ({ value: t, label: t })),
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
              <th className="px-4 py-3 font-bold">Оружие</th>
              <th className="px-4 py-3 font-bold">Тип</th>
              <th className="px-4 py-3 font-bold">Редкость</th>
              <th className="px-4 py-3 font-bold">Статус</th>
              <th className="px-4 py-3 text-right font-bold">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.05]">
            {filtered.map((w) => (
              <tr key={w.id} className="bg-white/40">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={w.image || "/images/legend-bg.jpg"}
                      alt=""
                      className="h-10 w-10 rounded-xl object-cover ring-1 ring-black/[0.06]"
                    />
                    <div>
                      <p className="font-semibold">{w.name}</p>
                      <p className="text-xs text-muted-foreground">/{w.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-medium">{w.weaponType}</td>
                <td className="px-4 py-3 font-medium">{RARITY_LABEL[w.rarity]}</td>
                <td className="px-4 py-3">
                  {w.published ? (
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
                      href={`/wiki/weapons/${w.slug}`}
                      target="_blank"
                      className="rounded-xl border border-black/[0.08] bg-white px-3 py-1.5 text-xs font-bold text-muted-foreground"
                    >
                      Открыть
                    </Link>
                    <Link
                      href={`/admin/weapons/${w.id}/edit`}
                      className="rounded-xl border border-black/[0.08] bg-white px-3 py-1.5 text-xs font-bold text-[#189b8e]"
                    >
                      Править
                    </Link>
                    <DuplicateEntityButton
                      apiBase="/api/admin/weapons"
                      id={w.id}
                      name={w.name}
                      editBase="/admin/weapons"
                    />
                    <DeleteEntityButton apiBase="/api/admin/weapons" id={w.id} name={w.name} />
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  {items.length === 0
                    ? "Пока нет оружия — создайте первое."
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
