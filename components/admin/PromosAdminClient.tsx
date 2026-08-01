"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Promo = {
  id?: number;
  code: string;
  reward: string;
  expiresAt: string | null;
  published: boolean;
  order: number;
};

const input =
  "w-full rounded-[12px] border border-black/[0.08] bg-white/90 px-3 py-2 text-sm font-medium outline-none ring-[#189b8e]/25 focus:ring-2";
const label = "mb-1 block text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground";

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function PromosAdminClient({ initial }: { initial: Promo[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [draft, setDraft] = useState<Promo>({
    code: "",
    reward: "",
    expiresAt: null,
    published: true,
    order: 0,
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    const payload = {
      ...draft,
      expiresAt: draft.expiresAt || null,
    };
    const res = await fetch(editingId ? `/api/admin/promos/${editingId}` : "/api/admin/promos", {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error || "Ошибка сохранения");
      return;
    }
    setDraft({ code: "", reward: "", expiresAt: null, published: true, order: 0 });
    setEditingId(null);
    const list = await fetch("/api/admin/promos").then((r) => r.json());
    setItems(list);
    router.refresh();
  }

  async function remove(id: number) {
    if (!confirm("Удалить промокод?")) return;
    await fetch(`/api/admin/promos/${id}`, { method: "DELETE" });
    setItems((p) => p.filter((x) => x.id !== id));
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="glass-panel space-y-3 p-5">
        <p className="text-sm font-bold text-[#189b8e]">
          {editingId ? "Редактировать промокод" : "Новый промокод"}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={label}>Код</label>
            <input
              className={input}
              value={draft.code}
              onChange={(e) => setDraft((d) => ({ ...d, code: e.target.value.toUpperCase() }))}
              placeholder="GENSHINGIFT"
            />
          </div>
          <div>
            <label className={label}>Награда / описание</label>
            <input
              className={input}
              value={draft.reward}
              onChange={(e) => setDraft((d) => ({ ...d, reward: e.target.value }))}
            />
          </div>
          <div>
            <label className={label}>Действует до</label>
            <input
              className={input}
              type="datetime-local"
              value={toLocalInput(draft.expiresAt)}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  expiresAt: e.target.value ? new Date(e.target.value).toISOString() : null,
                }))
              }
            />
          </div>
          <div>
            <label className={label}>Порядок</label>
            <input
              className={input}
              type="number"
              value={draft.order}
              onChange={(e) => setDraft((d) => ({ ...d, order: Number(e.target.value) || 0 }))}
            />
          </div>
          <label className="flex items-center gap-2 sm:col-span-2">
            <input
              type="checkbox"
              className="accent-[#189b8e]"
              checked={draft.published}
              onChange={(e) => setDraft((d) => ({ ...d, published: e.target.checked }))}
            />
            <span className="text-sm font-semibold">Опубликован</span>
          </label>
        </div>
        {error && <p className="text-sm font-semibold text-destructive">{error}</p>}
        <button type="button" className="ui-btn-primary" disabled={saving} onClick={() => void save()}>
          {saving ? "…" : editingId ? "Обновить" : "Добавить"}
        </button>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-black/[0.06] bg-white px-4 py-3"
          >
            <div>
              <p className="font-bold">{item.code}</p>
              <p className="text-xs text-muted-foreground">{item.reward}</p>
              {item.expiresAt && (
                <p className="text-[11px] font-semibold text-[#189b8e]">
                  до {new Date(item.expiresAt).toLocaleString("ru-RU")}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-xl bg-[#189b8e]/10 px-3 py-1.5 text-xs font-bold text-[#189b8e]"
                onClick={() => {
                  setEditingId(item.id!);
                  setDraft({
                    ...item,
                    expiresAt: item.expiresAt,
                  });
                }}
              >
                Изменить
              </button>
              <button
                type="button"
                className="text-xs font-bold text-destructive"
                onClick={() => void remove(item.id!)}
              >
                Удалить
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
