"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MediaUpload from "@/components/admin/MediaUpload";
import FancySelect from "@/components/ui/FancySelect";
import { CatalogPicker, useGuideCatalog } from "@/components/admin/CatalogPicker";
import { useAdminDelete } from "@/components/admin/AdminDeleteContext";
import { slugFromName } from "@/lib/slug";

type Slide = {
  id?: number;
  half: string;
  name: string;
  slug: string;
  role: string;
  element: string;
  rarity: number;
  text: string;
  image: string;
  icon: string;
  published: boolean;
  order: number;
};

const empty = (): Slide => ({
  half: "first",
  name: "",
  slug: "",
  role: "",
  element: "pyro",
  rarity: 5,
  text: "",
  image: "",
  icon: "",
  published: true,
  order: 0,
});

const input =
  "w-full rounded-[12px] border border-black/[0.08] bg-white/90 px-3 py-2 text-sm font-medium outline-none ring-[#189b8e]/25 focus:ring-2";
const label = "mb-1 block text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground";

export default function BannerAdminClient({ initial }: { initial: Slide[] }) {
  const router = useRouter();
  const { catalog } = useGuideCatalog();
  const { requestDelete, pendingKeys } = useAdminDelete();
  const [items, setItems] = useState<Slide[]>(initial);
  const [draft, setDraft] = useState<Slide>(empty());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    const url = editingId ? `/api/admin/banners/${editingId}` : "/api/admin/banners";
    const method = editingId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error || "Не удалось сохранить");
      return;
    }
    setDraft(empty());
    setEditingId(null);
    router.refresh();
    const list = await fetch("/api/admin/banners").then((r) => r.json());
    setItems(list);
  }

  function remove(id: number, name: string) {
    requestDelete({
      key: `banners:${id}`,
      name: name.trim() || `Слайд #${id}`,
      execute: async () => {
        await fetch(`/api/admin/banners/${id}`, { method: "DELETE" });
        setItems((prev) => prev.filter((x) => x.id !== id));
        router.refresh();
      },
    });
  }

  const visibleItems = items.filter(
    (item) => !item.id || !pendingKeys.has(`banners:${item.id}`),
  );

  return (
    <div className="space-y-6">
      <div className="glass-panel space-y-4 p-5">
        <p className="text-sm font-bold text-[#189b8e]">
          {editingId ? `Редактирование #${editingId}` : "Новый слайд баннера"}
        </p>
        <CatalogPicker
          label="Подставить персонажа из базы"
          kind="characters"
          catalog={catalog}
          onPick={(picked) => {
            const splash = picked.splashImage?.trim() || "";
            setDraft((d) => ({
              ...d,
              name: picked.name,
              slug: picked.href.replace("/wiki/characters/", ""),
              icon: picked.image,
              // Только реальный splash из БД — не выдумываем путь из иконки
              image: splash,
              rarity: picked.rarity,
              element: (picked.element || "PYRO").toLowerCase(),
              role: d.role || `Персонаж · ${(picked.element || "").toUpperCase()}`,
            }));
          }}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={label}>Половина</label>
            <FancySelect
              value={draft.half}
              onChange={(half) => setDraft((d) => ({ ...d, half }))}
              options={[
                { value: "first", label: "Текущие молитвы" },
                { value: "second", label: "Вторая половина" },
              ]}
              size="sm"
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
          <div>
            <label className={label}>Имя</label>
            <input
              className={input}
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            />
          </div>
          <div>
            <label className={label}>Slug (ссылка /wiki/characters/…)</label>
            <div className="flex gap-2">
              <input
                className={input}
                value={draft.slug}
                onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))}
              />
              <button
                type="button"
                className="ui-btn-secondary shrink-0 px-3 py-2 text-xs"
                onClick={() => {
                  const next = slugFromName(draft.name);
                  if (next) setDraft((d) => ({ ...d, slug: next }));
                }}
              >
                Из названия
              </button>
            </div>
          </div>
          <div>
            <label className={label}>Роль</label>
            <input
              className={input}
              value={draft.role}
              onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value }))}
              placeholder="Саппорт · Пиро"
            />
          </div>
          <div>
            <label className={label}>Стихия</label>
            <FancySelect
              value={draft.element}
              onChange={(element) => setDraft((d) => ({ ...d, element }))}
              options={["pyro", "hydro", "anemo", "electro", "dendro", "cryo", "geo"].map((e) => ({
                value: e,
                label: e,
              }))}
              size="sm"
            />
          </div>
          <div>
            <label className={label}>Редкость</label>
            <FancySelect
              value={String(draft.rarity)}
              onChange={(v) => setDraft((d) => ({ ...d, rarity: Number(v) }))}
              options={[
                { value: "5", label: "5★" },
                { value: "4", label: "4★" },
              ]}
              size="sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Описание</label>
            <textarea
              className={`${input} min-h-[72px]`}
              value={draft.text}
              onChange={(e) => setDraft((d) => ({ ...d, text: e.target.value }))}
            />
          </div>
          <MediaUpload
            label="Splash / арт"
            value={draft.image}
            onChange={(image) => setDraft((d) => ({ ...d, image }))}
            kind="splash"
          />
          <MediaUpload
            label="Иконка карточки"
            value={draft.icon}
            onChange={(icon) => setDraft((d) => ({ ...d, icon }))}
            kind="icon"
          />
          <label className="flex items-center gap-2 sm:col-span-2">
            <input
              type="checkbox"
              checked={draft.published}
              onChange={(e) => setDraft((d) => ({ ...d, published: e.target.checked }))}
              className="accent-[#189b8e]"
            />
            <span className="text-sm font-semibold">Опубликован</span>
          </label>
        </div>
        {error && <p className="text-sm font-semibold text-destructive">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={saving} onClick={() => void save()} className="ui-btn-primary">
            {saving ? "Сохранение…" : editingId ? "Обновить" : "Добавить"}
          </button>
          {editingId && (
            <button
              type="button"
              className="ui-btn-secondary"
              onClick={() => {
                setEditingId(null);
                setDraft(empty());
              }}
            >
              Отмена
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {visibleItems.map((item) => (
          <div
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-black/[0.06] bg-white/90 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              {item.icon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.icon} alt="" className="h-12 w-12 rounded-xl object-cover" />
              ) : null}
              <div>
                <p className="font-bold text-foreground">
                  {item.name}{" "}
                  <span className="text-xs font-semibold text-muted-foreground">
                    · {item.half === "second" ? "2-я половина" : "текущие"} · {item.rarity}★
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">{item.role}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-xl bg-[#189b8e]/10 px-3 py-1.5 text-xs font-bold text-[#189b8e]"
                onClick={() => {
                  setEditingId(item.id!);
                  setDraft({ ...item });
                }}
              >
                Изменить
              </button>
              <button
                type="button"
                className="rounded-xl border border-black/[0.08] bg-white px-3 py-1.5 text-xs font-bold text-[#189b8e]"
                onClick={() => {
                  setDraft({
                    ...item,
                    id: undefined,
                    name: `${item.name} (копия)`,
                    slug: `${item.slug}-copy`,
                    published: false,
                  });
                  setEditingId(null);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Дублировать
              </button>
              <button
                type="button"
                className="rounded-xl px-3 py-1.5 text-xs font-bold text-destructive"
                onClick={() => remove(item.id!, item.name)}
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
