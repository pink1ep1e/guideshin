"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAdminDelete } from "@/components/admin/AdminDeleteContext";

export default function DeleteEntityButton({
  apiBase,
  id,
  name,
  pendingKey,
}: {
  apiBase: string;
  id: number;
  name: string;
  /** Ключ для optimistic hide, по умолчанию из apiBase */
  pendingKey?: string;
}) {
  const router = useRouter();
  const { requestDelete } = useAdminDelete();
  const [loading, setLoading] = useState(false);

  function onDelete() {
    const key =
      pendingKey ??
      `${apiBase.replace(/^\/api\/admin\//, "").replace(/\/$/, "")}:${id}`;
    requestDelete({
      key,
      name,
      execute: async () => {
        setLoading(true);
        try {
          await fetch(`${apiBase}/${id}`, { method: "DELETE" });
          router.refresh();
        } finally {
          setLoading(false);
        }
      },
    });
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={onDelete}
      className="rounded-xl border border-destructive/20 bg-white px-3 py-1.5 text-xs font-bold text-destructive disabled:opacity-50"
    >
      {loading ? "…" : "Удалить"}
    </button>
  );
}

export function AdminNavTabs({ active }: { active: string }) {
  const tabs = [
    { href: "/admin", label: "Обзор", key: "overview" },
    { href: "/admin/characters", label: "Персонажи", key: "characters" },
    { href: "/admin/weapons", label: "Оружие", key: "weapons" },
    { href: "/admin/artifacts", label: "Артефакты", key: "artifacts" },
    { href: "/admin/materials", label: "Материалы", key: "materials" },
    { href: "/admin/banners", label: "Баннер", key: "banners" },
    { href: "/admin/promos", label: "Промокоды", key: "promos" },
    { href: "/admin/tips", label: "Советы", key: "tips" },
  ];
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          className={`rounded-xl px-3.5 py-2 text-sm font-bold transition ${
            active === t.key
              ? "bg-[#189b8e] text-white"
              : "bg-white text-foreground/70 ring-1 ring-black/[0.06] hover:text-[#189b8e]"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
