"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Tip = {
  id?: number;
  title: string;
  body: string;
  published: boolean;
  order: number;
};

const input =
  "w-full rounded-[12px] border border-black/[0.08] bg-white/90 px-3 py-2 text-sm font-medium outline-none ring-[#189b8e]/25 focus:ring-2";
const label = "mb-1 block text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground";

export default function TipsAdminClient({ initial }: { initial: Tip[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [draft, setDraft] = useState<Tip>({ title: "", body: "", published: true, order: 0 });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    const res = await fetch(editingId ? `/api/admin/tips/${editingId}` : "/api/admin/tips", {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error || "Ошибка сохранения");
      return;
    }
    setDraft({ title: "", body: "", published: true, order: 0 });
    setEditingId(null);
    setItems(await fetch("/api/admin/tips").then((r) => r.json()));
    router.refresh();
  }

  async function remove(id: number) {
    if (!confirm("Удалить совет?")) return;
    await fetch(`/api/admin/tips/${id}`, { method: "DELETE" });
    setItems((p) => p.filter((x) => x.id !== id));
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="glass-panel space-y-3 p-5">
        <p className="text-sm font-bold text-[#189b8e]">
          {editingId ? "Редактировать совет" : "Новый совет дня"}
        </p>
        <div>
          <label className={label}>Заголовок</label>
          <input
            className={input}
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
          />
        </div>
        <div>
          <label className={label}>Текст</label>
          <textarea
            className={`${input} min-h-[80px]`}
            value={draft.body}
            onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={label}>Порядок</label>
            <input
              className={input}
              type="number"
              value={draft.order}
              onChange={(e) => setDraft((d) => ({ ...d, order: Number(e.target.value) || 0 }))}
            />
          </div>
          <label className="flex items-center gap-2 self-end pb-2">
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
            className="rounded-[14px] border border-black/[0.06] bg-white px-4 py-3"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-bold">{item.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-xl bg-[#189b8e]/10 px-3 py-1.5 text-xs font-bold text-[#189b8e]"
                  onClick={() => {
                    setEditingId(item.id!);
                    setDraft(item);
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
          </div>
        ))}
      </div>
    </div>
  );
}
