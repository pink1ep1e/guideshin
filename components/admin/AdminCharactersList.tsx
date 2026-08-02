"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import AdminListToolbar from "@/components/admin/AdminListToolbar";
import DeleteCharacterButton from "@/components/admin/DeleteCharacterButton";
import { DuplicateEntityButton } from "@/components/admin/DuplicateEntityButton";
import {
  ELEMENT_LABEL,
  ELEMENT_SVG,
  RARITY_LABEL,
  type ElementKey,
} from "@/lib/genshin";

export type AdminCharacterRow = {
  id: number;
  slug: string;
  name: string;
  image: string;
  rarity: "LEGEND" | "EPIC" | "RARE" | "COMMON";
  element: string;
  published: boolean;
};

const ELEMENTS: ElementKey[] = [
  "PYRO",
  "HYDRO",
  "ANEMO",
  "ELECTRO",
  "DENDRO",
  "CRYO",
  "GEO",
];

export default function AdminCharactersList({ items }: { items: AdminCharacterRow[] }) {
  const [query, setQuery] = useState("");
  const [rarity, setRarity] = useState("ALL");
  const [element, setElement] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const deferred = useDeferredValue(query.trim().toLowerCase());

  const filtered = useMemo(() => {
    return items.filter((c) => {
      if (rarity !== "ALL" && c.rarity !== rarity) return false;
      if (element !== "ALL" && c.element !== element) return false;
      if (status === "published" && !c.published) return false;
      if (status === "draft" && c.published) return false;
      if (!deferred) return true;
      return (
        c.name.toLowerCase().includes(deferred) ||
        c.slug.toLowerCase().includes(deferred)
      );
    });
  }, [items, deferred, rarity, element, status]);

  return (
    <div className="glass-panel overflow-hidden">
      <AdminListToolbar
        query={query}
        onQuery={setQuery}
        placeholder="Поиск по имени или slug…"
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
            ],
          },
          {
            label: "Стихия",
            value: element,
            onChange: setElement,
            options: [
              { value: "ALL", label: "Все" },
              ...ELEMENTS.map((el) => ({ value: el, label: ELEMENT_LABEL[el] })),
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
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-[#189b8e]/8 text-xs uppercase tracking-[0.06em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-bold">Персонаж</th>
              <th className="px-4 py-3 font-bold">Редкость</th>
              <th className="px-4 py-3 font-bold">Стихия</th>
              <th className="px-4 py-3 font-bold">Статус</th>
              <th className="px-4 py-3 text-right font-bold">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.05]">
            {filtered.map((c) => (
              <tr key={c.id} className="bg-white/40">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={c.image}
                      alt={c.name}
                      className="h-10 w-10 rounded-xl object-cover ring-1 ring-black/[0.06]"
                    />
                    <div>
                      <p className="font-semibold text-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground">/{c.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-medium">{RARITY_LABEL[c.rarity]}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ELEMENT_SVG[c.element]} alt="" className="h-4 w-4" />
                    {ELEMENT_LABEL[c.element]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {c.published ? (
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
                      href={`/wiki/characters/${c.slug}`}
                      target="_blank"
                      className="rounded-xl border border-black/[0.08] bg-white px-3 py-1.5 text-xs font-bold text-muted-foreground"
                    >
                      Открыть
                    </Link>
                    <Link
                      href={`/admin/characters/${c.id}/edit`}
                      className="rounded-xl border border-black/[0.08] bg-white px-3 py-1.5 text-xs font-bold text-[#189b8e]"
                    >
                      Изменить
                    </Link>
                    <DuplicateEntityButton
                      apiBase="/api/admin/characters"
                      id={c.id}
                      name={c.name}
                      editBase="/admin/characters"
                    />
                    <DeleteCharacterButton id={c.id} name={c.name} />
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  {items.length === 0 ? (
                    <>
                      Персонажей пока нет.{" "}
                      <Link href="/admin/characters/new" className="font-bold text-[#189b8e]">
                        Добавьте первого
                      </Link>
                      .
                    </>
                  ) : (
                    "Ничего не найдено по текущим фильтрам."
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
