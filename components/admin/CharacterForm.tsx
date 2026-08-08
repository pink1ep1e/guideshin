"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Code2, Eye, LayoutTemplate } from "lucide-react";
import {
  ELEMENT_LABEL,
  ELEMENT_SVG,
  ELEMENT_THEME,
  type ElementKey,
} from "@/lib/genshin";
import MediaUpload from "@/components/admin/MediaUpload";
import GuideBuilder from "@/components/admin/GuideBuilder";
import MaterialsEditor from "@/components/admin/MaterialsEditor";
import TalentsEditor from "@/components/admin/TalentsEditor";
import ConstellationsEditor from "@/components/admin/ConstellationsEditor";
import AdminStickyActions from "@/components/admin/AdminStickyActions";
import { useAdminToast } from "@/components/admin/AdminToastContext";
import { invalidateGuideCatalog } from "@/components/admin/CatalogPicker";
import FancySelect from "@/components/ui/FancySelect";
import { slugFromName } from "@/lib/slug";
import { createEmptyBlocks, serializeGuide } from "@/lib/guide-builder";
import {
  parseMaterials,
  type CharacterMaterial,
} from "@/lib/character-materials";
import {
  parseTalents,
  type CharacterTalent,
} from "@/lib/character-talents";
import {
  parseConstellations,
  type CharacterConstellation,
} from "@/lib/character-constellations";
import { REGION_OPTIONS } from "@/lib/regions";

type CharacterFormValues = {
  id?: number;
  name: string;
  slug: string;
  image: string;
  splashImage: string;
  rarity: "LEGEND" | "EPIC" | "RARE" | "COMMON";
  element: ElementKey;
  weaponType: string;
  region: string;
  sticker: string;
  shortDesc: string;
  contentHtml: string;
  levelMaterials: CharacterMaterial[];
  talents: CharacterTalent[];
  constellations: CharacterConstellation[];
  published: boolean;
  order: number;
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

const WEAPONS = ["Меч", "Двуручник", "Копьё", "Лук", "Катализатор"];
const REGIONS = REGION_OPTIONS;

const DEFAULTS: CharacterFormValues = {
  name: "",
  slug: "",
  image: "",
  splashImage: "",
  rarity: "LEGEND",
  element: "HYDRO",
  weaponType: "Меч",
  region: "Фонтейн",
  sticker: "",
  shortDesc: "",
  contentHtml: serializeGuide(createEmptyBlocks("Персонаж")),
  levelMaterials: [],
  talents: [],
  constellations: [],
  published: true,
  order: 0,
};

export default function CharacterForm({
  initial,
}: {
  initial?: Partial<CharacterFormValues>;
}) {
  const router = useRouter();
  const [values, setValues] = useState<CharacterFormValues>({
    ...DEFAULTS,
    ...initial,
    weaponType: initial?.weaponType || DEFAULTS.weaponType,
    region: initial?.region || DEFAULTS.region,
    contentHtml: initial?.contentHtml || DEFAULTS.contentHtml,
    levelMaterials: parseMaterials(initial?.levelMaterials),
    talents: parseTalents(initial?.talents),
    constellations: parseConstellations(initial?.constellations),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contentTab, setContentTab] = useState<"builder" | "html" | "preview">(
    "builder",
  );
  const [builderKey, setBuilderKey] = useState(0);
  const isEdit = Boolean(values.id);
  const { showError } = useAdminToast();

  const theme = ELEMENT_THEME[values.element];
  const stars = values.rarity === "LEGEND" ? 5 : 4;

  function update<K extends keyof CharacterFormValues>(
    key: K,
    value: CharacterFormValues[K],
  ) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const messages: string[] = [];
    if (!values.name.trim()) messages.push("Не заполнено имя");
    if (!values.image.trim()) messages.push("Не загружена иконка");
    if (messages.length) {
      const title =
        messages.length === 1 ? messages[0] : "Не все поля заполнены";
      showError(title, messages.length > 1 ? messages.join(" · ") : undefined);
      setError(messages.join(". "));
      return;
    }

    setSaving(true);
    setError(null);

    const url = isEdit
      ? `/api/admin/characters/${values.id}`
      : "/api/admin/characters";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        setError("Не удалось сохранить персонажа");
        showError("Ошибка сохранения", "Не удалось сохранить персонажа");
        return;
      }

      invalidateGuideCatalog();
      router.push("/admin/characters");
      router.refresh();
    } catch {
      setError("Нет связи с сервером");
      showError("Нет связи с сервером", "Проверьте интернет и попробуйте снова.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-[14px] border border-black/[0.08] bg-white/90 px-3.5 py-2.5 text-sm font-medium outline-none ring-[#189b8e]/25 placeholder:text-muted-foreground focus:ring-2";
  const labelClass =
    "mb-1.5 block text-xs font-bold uppercase tracking-[0.06em] text-muted-foreground";

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="glass-panel relative overflow-hidden p-5 sm:p-6">
        <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#189b8e] to-[#67d5cc]" />
        <div className="flex flex-wrap items-center gap-5">
          <div
            className="relative h-[96px] w-[96px] overflow-hidden rounded-[16px] bg-cover bg-center shadow-panel ring-1 ring-black/[0.06]"
            style={{
              backgroundImage: `url(${stars === 5 ? "/images/legend-bg.jpg" : "/images/epic-bg.jpg"})`,
            }}
          >
            {values.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={values.image}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs font-bold text-muted-foreground">
                Иконка
              </div>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ELEMENT_SVG[values.element]}
              alt=""
              className="absolute left-1.5 top-1.5 h-6 w-6 drop-shadow"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="text-sm font-bold uppercase tracking-[0.08em]"
              style={{ color: theme.accent }}
            >
              {ELEMENT_LABEL[values.element]} · {stars}★
            </p>
            <h2 className="font-genshin truncate text-2xl tracking-wide text-foreground">
              {values.name || "Новый персонаж"}
            </h2>
            <p className="mt-1 line-clamp-2 text-sm font-medium text-muted-foreground">
              {values.shortDesc ||
                "Загрузите иконку и splash, затем соберите гайд блоками"}
            </p>
          </div>
          {values.splashImage && (
            <div className="hidden h-[120px] w-[100px] overflow-hidden rounded-[14px] bg-white/50 ring-1 ring-black/[0.05] sm:block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={values.splashImage}
                alt=""
                className="h-full w-full object-contain object-bottom"
              />
            </div>
          )}
        </div>
      </div>

      <div className="glass-panel grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6">
        <div>
          <label className={labelClass}>Имя</label>
          <input
            className={inputClass}
            value={values.name}
            onChange={(e) => {
              const name = e.target.value;
              setValues((v) => ({
                ...v,
                name,
                shortDesc:
                  v.shortDesc && !v.shortDesc.startsWith("Гайд на ")
                    ? v.shortDesc
                    : `Гайд на ${name} — билды, таланты и материалы для прокачки.`,
              }));
            }}
            placeholder="Фурина"
          />
        </div>
        <div>
          <label className={labelClass}>Slug (URL)</label>
          <div className="flex gap-2">
            <input
              className={inputClass}
              value={values.slug}
              onChange={(e) => update("slug", e.target.value)}
              placeholder="пусто = из имени"
            />
            <button
              type="button"
              className="ui-btn-secondary shrink-0 px-3 py-2.5 text-xs"
              onClick={() => {
                const next = slugFromName(values.name);
                if (next) update("slug", next);
              }}
            >
              Из названия
            </button>
          </div>
        </div>

        <MediaUpload
          label="Иконка персонажа"
          value={values.image}
          onChange={(image) => update("image", image)}
          kind="icon"
          hint="/images/mini-characters/... или загрузите файл"
        />
        <MediaUpload
          label="Splash-арт"
          value={values.splashImage}
          onChange={(splashImage) => update("splashImage", splashImage)}
          kind="splash"
          hint="/images/splesh-atrs/... или загрузите файл"
        />

        <div className="sm:col-span-2">
          <label className={labelClass}>Стихия</label>
          <div className="flex flex-wrap gap-3">
            {ELEMENTS.map((key) => {
              const active = values.element === key;
              const t = ELEMENT_THEME[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => update("element", key)}
                  className="inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-bold transition"
                  style={
                    active
                      ? {
                          backgroundColor: t.solid,
                          color: t.onSolid,
                          borderColor: t.solid,
                        }
                      : {
                          backgroundColor: "rgba(255,255,255,0.95)",
                          color: t.accent,
                          borderColor: "rgba(0,0,0,0.1)",
                        }
                  }
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={ELEMENT_SVG[key]}
                    alt=""
                    className={`h-4 w-4 shrink-0 ${active ? "brightness-0 invert" : ""}`}
                  />
                  {ELEMENT_LABEL[key]}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className={labelClass}>Редкость</label>
          <div className="flex gap-2">
            {(
              [
                ["LEGEND", "5★"],
                ["EPIC", "4★"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => update("rarity", value)}
                className={`flex-1 rounded-[14px] px-3 py-2.5 text-sm font-bold ${
                  values.rarity === value
                    ? "bg-[#189b8e] text-white"
                    : "bg-white/90 text-foreground/70 ring-1 ring-black/[0.06]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <FancySelect
          label="Оружие"
          value={values.weaponType}
          onChange={(weaponType) => update("weaponType", weaponType)}
          options={WEAPONS.map((w) => ({ value: w, label: w }))}
        />

        <FancySelect
          label="Регион"
          value={values.region}
          onChange={(region) => update("region", region)}
          options={REGIONS.map((r) => ({ value: r, label: r }))}
        />

        <div>
          <label className={labelClass}>Плашка</label>
          <input
            className={inputClass}
            value={values.sticker}
            onChange={(e) => update("sticker", e.target.value)}
            placeholder="Новый / Анонс"
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>Короткое описание</label>
          <input
            className={inputClass}
            value={values.shortDesc}
            onChange={(e) => update("shortDesc", e.target.value)}
          />
        </div>

        <label className="flex items-center gap-3 sm:col-span-2">
          <input
            type="checkbox"
            checked={values.published}
            onChange={(e) => update("published", e.target.checked)}
            className="h-4 w-4 rounded accent-[#189b8e]"
          />
          <span className="text-sm font-semibold text-foreground">
            Опубликован на сайте
          </span>
        </label>
      </div>

      <div className="glass-panel p-5 sm:p-6">
        <MaterialsEditor
          value={values.levelMaterials}
          onChange={(levelMaterials) =>
            update("levelMaterials", levelMaterials)
          }
        />
      </div>

      <div className="glass-panel p-5 sm:p-6">
        <TalentsEditor
          value={values.talents}
          onChange={(talents) => update("talents", talents)}
        />
      </div>

      <div className="glass-panel p-5 sm:p-6">
        <ConstellationsEditor
          value={values.constellations}
          onChange={(constellations) => update("constellations", constellations)}
        />
      </div>

      <div className="glass-panel overflow-hidden p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#189b8e]">
              Гайд
            </p>
            <p className="text-sm font-medium text-muted-foreground">
              Собирайте блоки: оружие, артефакты, материалы, отряды, YouTube
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["builder", "Конструктор", LayoutTemplate],
                ["preview", "Превью", Eye],
                ["html", "HTML", Code2],
              ] as const
            ).map(([tab, title, Icon]) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  if (tab === "builder" && contentTab === "html") {
                    setBuilderKey((k) => k + 1);
                  }
                  setContentTab(tab);
                }}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold ${
                  contentTab === tab
                    ? "bg-[#189b8e] text-white"
                    : "bg-white text-foreground/70 ring-1 ring-black/[0.06]"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {title}
              </button>
            ))}
          </div>
        </div>

        {contentTab === "builder" && (
          <GuideBuilder
            key={builderKey}
            characterName={values.name}
            value={values.contentHtml}
            onChange={(contentHtml) => update("contentHtml", contentHtml)}
          />
        )}

        {contentTab === "preview" && (
          <div
            className="guide-html rounded-[16px] border border-black/[0.05] bg-white/70 p-5"
            dangerouslySetInnerHTML={{
              __html: values.contentHtml.replace(
                /<!--genshin-guide-blocks:[\s\S]*?-->/,
                "",
              ),
            }}
          />
        )}

        {contentTab === "html" && (
          <textarea
            className="min-h-[360px] w-full rounded-[16px] border border-black/[0.06] bg-[#0b1f44]/[0.03] p-4 font-mono text-xs leading-relaxed outline-none"
            value={values.contentHtml}
            onChange={(e) => update("contentHtml", e.target.value)}
            spellCheck={false}
          />
        )}
      </div>

      {error && (
        <p className="rounded-[14px] bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
          {error}
        </p>
      )}

      {/* запас снизу, чтобы контент не прятался под кнопками */}
      <div className="h-4" aria-hidden />

      <AdminStickyActions>
        <button
          type="submit"
          disabled={saving}
          className="ui-btn-primary w-full whitespace-nowrap px-6 py-3.5 text-sm disabled:opacity-60"
        >
          {saving ? "Сохраняем…" : isEdit ? "Сохранить" : "Создать"}
        </button>
        <Link
          href="/admin/characters"
          className="ui-btn-secondary w-full whitespace-nowrap px-6 py-3.5 text-center text-sm"
        >
          Отмена
        </Link>
      </AdminStickyActions>
    </form>
  );
}
