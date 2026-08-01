"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Promo = {
  id: number;
  code: string;
  reward: string;
  expiresAt: string | null;
  published: boolean;
  order: number;
};

const input =
  "w-full rounded-[12px] border border-black/[0.08] bg-white/90 px-3 py-2 text-sm font-medium outline-none ring-[#189b8e]/25 focus:ring-2";

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function PromoAdminClient({ initial }: { initial: Promo[] }) {
  const router = useRouter();
  const [items, setItems] = useState(
    initial.map((p) => ({
      ...p,
      expiresAt: p.expiresAt,
    })),
  );
  const [error, setError] = useState<string | null>(null);

  async function create() {
    const res = await fetch("/api/admin/promos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: "NEWCODE",
        reward: "Награда",
        expiresAt: null,
        published: true,
        order: items.length,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error || "Ошибка");
      return;
    }
    const item = (await res.json()) as Promo;
    setItems((prev) => [...prev, item]);
    router.refresh();
  }

  async function save(item: Promo) {
    const res = await fetch(`/api/admin/promos/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error || "Ошибка сохранения");
      return;
    }
    const next = (await res.json()) as Promo;
    setItems((prev) => prev.map((x) => (x.id === next.id ? next : x)));
    router.refresh();
  }

  async function remove(id: number) {
    if (!confirm("Удалить промокод?")) return;
    await fetch(`/api/admin/promos/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((x) => x.id !== id));
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button type="button" className="ui-btn-primary" onClick={() => void create()}>
          + Промокод
        </button>
      </div>
      {error && (
        <p className="rounded-[12px] bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">
          {error}
        </p>
      )}
      {items.map((item) => (
        <div key={item.id} className="glass-panel grid gap-3 p-4 sm:grid-cols-[1fr_1fr_auto]">
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase text-muted-foreground">Код</label>
            <input
              className={input}
              value={item.code}
              onChange={(e) =>
                setItems((prev) =>
                  prev.map((x) => (x.id === item.id ? { ...x, code: e.target.value } : x)),
                )
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase text-muted-foreground">Награда</label>
            <input
              className={input}
              value={item.reward}
              onChange={(e) =>
                setItems((prev) =>
                  prev.map((x) => (x.id === item.id ? { ...x, reward: e.target.value } : x)),
                )
              }
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-[11px] font-bold uppercase text-muted-foreground">
              Действует до
            </label>
            <input
              className={input}
              type="datetime-local"
              value={toLocalInput(item.expiresAt)}
              onChange={(e) =>
                setItems((prev) =>
                  prev.map((x) =>
                    x.id === item.id
                      ? { ...x, expiresAt: e.target.value ? new Date(e.target.value).toISOString() : null }
                      : x,
                  ),
                )
              }
            />
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={item.published}
              onChange={(e) =>
                setItems((prev) =>
                  prev.map((x) => (x.id === item.id ? { ...x, published: e.target.checked } : x)),
                )
              }
              className="accent-[#189b8e]"
            />
            Опубликован
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <button type="button" className="ui-btn-secondary px-3 py-1.5 text-xs" onClick={() => void save(item)}>
              Сохранить
            </button>
            <button type="button" className="text-xs font-bold text-destructive" onClick={() => void remove(item.id)}>
              Удалить
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
