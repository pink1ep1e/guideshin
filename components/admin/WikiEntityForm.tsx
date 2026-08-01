"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MediaUpload from "@/components/admin/MediaUpload";
import FancySelect from "@/components/ui/FancySelect";
import AdminStickyActions from "@/components/admin/AdminStickyActions";
import { invalidateGuideCatalog } from "@/components/admin/CatalogPicker";
import WeaponGuideEditor from "@/components/admin/WeaponGuideEditor";
import MaterialGuideEditor from "@/components/admin/MaterialGuideEditor";
import { emptyMaterialGuide, emptyWeaponGuide } from "@/lib/wiki-guide-data";
import { REGION_OPTIONS } from "@/lib/regions";
import { slugFromName } from "@/lib/slug";

export type WikiEntityKind = "weapon" | "artifact" | "material";

type BaseValues = {
  id?: number;
  name: string;
  slug: string;
  image: string;
  sticker: string;
  shortDesc: string;
  contentHtml: string;
  region: string;
  guideData?: unknown;
  published: boolean;
  order: number;
};

type WeaponValues = BaseValues & {
  rarity: "LEGEND" | "EPIC" | "RARE" | "COMMON";
  weaponType: string;
};

type ArtifactValues = BaseValues & {
  rarity: "LEGEND" | "EPIC" | "RARE" | "COMMON";
};

type MaterialValues = BaseValues & {
  rarityStars: number;
  category: string;
};

type Props =
  | { kind: "weapon"; initial?: Partial<WeaponValues> }
  | { kind: "artifact"; initial?: Partial<ArtifactValues> }
  | { kind: "material"; initial?: Partial<MaterialValues> };

const WEAPONS = ["Меч", "Двуручник", "Копьё", "Лук", "Катализатор"];
const MATERIAL_CATEGORIES = [
  { value: "local", label: "Диковинка" },
  { value: "ascension", label: "Возвышение" },
  { value: "talent", label: "Таланты" },
  { value: "boss", label: "Босс" },
  { value: "exp", label: "Опыт / мора" },
  { value: "consumable", label: "Расходник" },
  { value: "other", label: "Другое" },
];

const API: Record<WikiEntityKind, string> = {
  weapon: "/api/admin/weapons",
  artifact: "/api/admin/artifacts",
  material: "/api/admin/materials",
};

const LABELS: Record<WikiEntityKind, string> = {
  weapon: "оружие",
  artifact: "артефакт",
  material: "материал",
};

const UPLOAD_KIND: Record<WikiEntityKind, "weapon" | "artifact" | "material"> = {
  weapon: "weapon",
  artifact: "artifact",
  material: "material",
};

export default function WikiEntityForm(props: Props) {
  const { kind } = props;
  const router = useRouter();

  const defaultsWeapon: WeaponValues = {
    name: "",
    slug: "",
    image: "",
    rarity: "LEGEND",
    weaponType: "Меч",
    sticker: "",
    shortDesc: "",
    contentHtml: "",
    region: "Другое",
    guideData: emptyWeaponGuide(),
    published: true,
    order: 0,
  };
  const defaultsArtifact: ArtifactValues = {
    name: "",
    slug: "",
    image: "",
    rarity: "LEGEND",
    sticker: "",
    shortDesc: "",
    contentHtml: "",
    region: "Нодкрай",
    published: true,
    order: 0,
  };
  const defaultsMaterial: MaterialValues = {
    name: "",
    slug: "",
    image: "",
    rarityStars: 4,
    category: "other",
    sticker: "",
    shortDesc: "",
    contentHtml: "",
    region: "Нодкрай",
    guideData: emptyMaterialGuide(),
    published: true,
    order: 0,
  };

  const [values, setValues] = useState(() => {
    if (kind === "weapon") return { ...defaultsWeapon, ...props.initial };
    if (kind === "artifact") return { ...defaultsArtifact, ...props.initial };
    return { ...defaultsMaterial, ...props.initial };
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean((values as BaseValues).id);

  function update(patch: Record<string, unknown>) {
    setValues((v) => ({ ...v, ...patch }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const base = API[kind];
    const id = (values as BaseValues).id;
    const url = isEdit ? `${base}/${id}` : base;
    const method = isEdit ? "PUT" : "POST";
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error || `Не удалось сохранить ${LABELS[kind]}`);
        return;
      }
      invalidateGuideCatalog();
      router.push(
        `/admin/${kind === "weapon" ? "weapons" : kind === "artifact" ? "artifacts" : "materials"}`,
      );
      router.refresh();
    } catch {
      setError("Нет связи с сервером. Проверьте интернет и попробуйте снова.");
    } finally {
      setSaving(false);
    }
  }

  const input =
    "w-full rounded-[14px] border border-black/[0.08] bg-white/90 px-3.5 py-2.5 text-sm font-medium outline-none ring-[#189b8e]/25 focus:ring-2";
  const label = "mb-1.5 block text-xs font-bold uppercase tracking-[0.06em] text-muted-foreground";
  const listPath =
    kind === "weapon" ? "/admin/weapons" : kind === "artifact" ? "/admin/artifacts" : "/admin/materials";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="glass-panel grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
        <div>
          <label className={label}>Название</label>
          <input
            className={input}
            required
            value={(values as BaseValues).name}
            onChange={(e) => update({ name: e.target.value })}
          />
        </div>
        <div>
          <label className={label}>Slug</label>
          <div className="flex gap-2">
            <input
              className={input}
              value={(values as BaseValues).slug}
              onChange={(e) => update({ slug: e.target.value })}
              placeholder="пусто = из имени"
            />
            <button
              type="button"
              className="ui-btn-secondary shrink-0 px-3 py-2.5 text-xs"
              onClick={() => {
                const next = slugFromName((values as BaseValues).name);
                if (next) update({ slug: next });
              }}
            >
              Из названия
            </button>
          </div>
        </div>

        <MediaUpload
          label="Иконка"
          value={(values as BaseValues).image}
          onChange={(image) => update({ image })}
          kind={UPLOAD_KIND[kind]}
        />

        <div>
          <label className={label}>Плашка</label>
          <input
            className={input}
            value={(values as BaseValues).sticker}
            onChange={(e) => update({ sticker: e.target.value })}
            placeholder="Новый / Анонс"
          />
        </div>

        {kind !== "material" && (
          <div>
            <label className={label}>Редкость</label>
            <div className="flex flex-wrap gap-2">
              {(
                (kind === "weapon"
                  ? ([
                      ["LEGEND", "5★"],
                      ["EPIC", "4★"],
                      ["RARE", "3★"],
                      ["COMMON", "2★"],
                    ] as const)
                  : ([
                      ["LEGEND", "5★"],
                      ["EPIC", "4★"],
                    ] as const)
                )
              ).map(([value, title]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => update({ rarity: value })}
                  className={`flex-1 rounded-[14px] px-3 py-2.5 text-sm font-bold ${
                    (values as WeaponValues | ArtifactValues).rarity === value
                      ? "bg-[#189b8e] text-white"
                      : "bg-white ring-1 ring-black/[0.06]"
                  }`}
                >
                  {title}
                </button>
              ))}
            </div>
          </div>
        )}

        {kind === "weapon" && (
          <FancySelect
            label="Тип оружия"
            value={(values as WeaponValues).weaponType}
            onChange={(weaponType) => update({ weaponType })}
            options={WEAPONS.map((w) => ({ value: w, label: w }))}
          />
        )}

        {(kind === "artifact" || kind === "material") && (
          <FancySelect
            label="Регион"
            value={(values as BaseValues).region || "Другое"}
            onChange={(region) => update({ region })}
            options={REGION_OPTIONS.map((r) => ({ value: r, label: r }))}
          />
        )}

        {kind === "material" && (
          <>
            <FancySelect
              label="Категория"
              value={(values as MaterialValues).category}
              onChange={(category) => update({ category })}
              options={MATERIAL_CATEGORIES}
            />
            <FancySelect
              label="Редкость"
              value={String((values as MaterialValues).rarityStars)}
              onChange={(v) => update({ rarityStars: Number(v) })}
              options={[1, 2, 3, 4, 5].map((n) => ({
                value: String(n),
                label: `${n}★`,
              }))}
            />
          </>
        )}

        <div className="sm:col-span-2">
          <label className={label}>Короткое описание</label>
          <input
            className={input}
            value={(values as BaseValues).shortDesc}
            onChange={(e) => update({ shortDesc: e.target.value })}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={label}>Контент гайда (HTML)</label>
          <textarea
            className={`${input} min-h-[180px] font-mono text-xs`}
            value={(values as BaseValues).contentHtml}
            onChange={(e) => update({ contentHtml: e.target.value })}
            placeholder="<p>Описание, статы, советы…</p>"
          />
        </div>

        <label className="flex items-center gap-3 sm:col-span-2">
          <input
            type="checkbox"
            checked={(values as BaseValues).published}
            onChange={(e) => update({ published: e.target.checked })}
            className="h-4 w-4 accent-[#189b8e]"
          />
          <span className="text-sm font-semibold">Опубликован</span>
        </label>
      </div>

      {kind === "weapon" && (
        <WeaponGuideEditor
          weaponName={(values as BaseValues).name}
          value={(values as WeaponValues).guideData}
          onChange={(guideData) => update({ guideData })}
        />
      )}

      {kind === "material" && (
        <MaterialGuideEditor
          materialName={(values as BaseValues).name}
          value={(values as MaterialValues).guideData}
          onChange={(guideData) => update({ guideData })}
        />
      )}

      {error && (
        <p className="rounded-[14px] bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
          {error}
        </p>
      )}

      <div className="h-4" aria-hidden />

      <AdminStickyActions>
        <button
          type="submit"
          disabled={saving}
          className="ui-btn-primary w-full whitespace-nowrap px-6 py-3.5 text-sm disabled:opacity-60"
        >
          {saving ? "Сохраняем…" : isEdit ? "Сохранить" : `Создать`}
        </button>
        <Link href={listPath} className="ui-btn-secondary w-full whitespace-nowrap px-6 py-3.5 text-center text-sm">
          Отмена
        </Link>
      </AdminStickyActions>
    </form>
  );
}
