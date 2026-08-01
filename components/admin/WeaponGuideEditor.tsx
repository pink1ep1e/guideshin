"use client";

import { Plus, Trash2 } from "lucide-react";
import MediaUpload from "@/components/admin/MediaUpload";
import FancySelect from "@/components/ui/FancySelect";
import { CatalogPicker, useGuideCatalog } from "@/components/admin/CatalogPicker";
import {
  emptyWeaponGuide,
  parseWeaponGuide,
  buildWeaponRecommendedIntro,
  uid,
  type GuideMatRef,
  type WeaponAscensionPhase,
  type WeaponGuideData,
} from "@/lib/wiki-guide-data";
import { ELEMENT_SVG, type ElementKey } from "@/lib/genshin";
import { useEffect } from "react";

const input =
  "w-full rounded-[12px] border border-black/[0.08] bg-white/90 px-3 py-2 text-sm font-medium outline-none ring-[#189b8e]/25 focus:ring-2";
const label = "mb-1 block text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground";

function emptyMat(): GuideMatRef {
  return { id: uid(), name: "", image: "", qty: 0, rarityStars: 2, href: "" };
}

function emptyPhase(): WeaponAscensionPhase {
  return {
    id: uid(),
    phase: 1,
    maxLevel: 40,
    mora: 5000,
    materials: [emptyMat()],
  };
}

export default function WeaponGuideEditor({
  value,
  onChange,
  weaponName = "Оружие",
}: {
  value: unknown;
  onChange: (next: WeaponGuideData) => void;
  weaponName?: string;
}) {
  const data = parseWeaponGuide(value);
  const { catalog } = useGuideCatalog();

  function set(patch: Partial<WeaponGuideData>) {
    onChange({ ...data, ...patch });
  }

  function setRecommended(recommended: WeaponGuideData["recommended"]) {
    set({
      recommended,
      recommendedIntro: buildWeaponRecommendedIntro(weaponName, recommended),
    });
  }

  // Если переименовали оружие — обновить текст со ссылками
  useEffect(() => {
    if (data.recommended.length === 0) return;
    const next = buildWeaponRecommendedIntro(weaponName, data.recommended);
    if (next && next !== data.recommendedIntro) {
      onChange({ ...data, recommendedIntro: next });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- только при смене имени оружия
  }, [weaponName]);

  return (
    <div className="space-y-6 rounded-[16px] border border-black/[0.05] bg-[#0b1f44]/[0.02] p-4">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#189b8e]">Гайд оружия</p>
        <p className="text-xs font-medium text-muted-foreground">
          Статы, пассивка, материалы, кому подходит, как получить
        </p>
      </div>

      <div className="space-y-3 rounded-[14px] border border-black/[0.06] bg-white/70 p-3">
        <p className="text-xs font-bold uppercase tracking-[0.06em] text-muted-foreground">
          Характеристики
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={label}>Сила атаки (мин)</label>
            <input
              className={input}
              value={data.atkMin}
              onChange={(e) => set({ atkMin: e.target.value })}
              placeholder="48"
            />
          </div>
          <div>
            <label className={label}>Сила атаки (макс)</label>
            <input
              className={input}
              value={data.atkMax}
              onChange={(e) => set({ atkMax: e.target.value })}
              placeholder="674"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Доп. характеристика</label>
            <input
              className={input}
              value={data.subStatLabel}
              onChange={(e) => set({ subStatLabel: e.target.value })}
              placeholder="Крит. урон"
            />
          </div>
          <div>
            <label className={label}>Доп. стат (мин)</label>
            <input
              className={input}
              value={data.subStatMin}
              onChange={(e) => set({ subStatMin: e.target.value })}
              placeholder="9.6%"
            />
          </div>
          <div>
            <label className={label}>Доп. стат (макс)</label>
            <input
              className={input}
              value={data.subStatMax}
              onChange={(e) => set({ subStatMax: e.target.value })}
              placeholder="44.1%"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Пассивное умение</label>
            <textarea
              className={`${input} min-h-[96px]`}
              value={data.passive}
              onChange={(e) => set({ passive: e.target.value })}
              placeholder="Увеличивает силу атаки на 28%…"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Текст про прокачку уровней (опыт / мора)</label>
            <textarea
              className={`${input} min-h-[64px]`}
              value={data.levelUpNote}
              onChange={(e) => set({ levelUpNote: e.target.value })}
              placeholder="Чтобы поднять оружие до 90 уровня, потребуется …"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={label}>Всего моры</label>
          <input
            className={input}
            type="number"
            value={data.moraTotal || ""}
            onChange={(e) => set({ moraTotal: Number(e.target.value) || 0 })}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={label}>Текст про материалы</label>
          <textarea
            className={`${input} min-h-[64px]`}
            value={data.ascensionNote}
            onChange={(e) => set({ ascensionNote: e.target.value })}
          />
        </div>
      </div>

      <MatList
        title="Сводка материалов (верхняя строка)"
        items={data.materialsSummary}
        catalog={catalog}
        onChange={(materialsSummary) => set({ materialsSummary })}
      />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-[0.06em] text-muted-foreground">
            Фазы возвышения
          </p>
          <button
            type="button"
            onClick={() => set({ phases: [...data.phases, emptyPhase()] })}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#189b8e]"
          >
            <Plus className="h-3.5 w-3.5" /> Фаза
          </button>
        </div>
        {data.phases.map((p, idx) => (
          <div key={p.id} className="rounded-[14px] border border-black/[0.06] bg-white/80 p-3">
            <div className="mb-2 flex justify-between">
              <p className="text-xs font-bold text-muted-foreground">Фаза #{idx + 1}</p>
              <button
                type="button"
                className="text-xs font-bold text-destructive"
                onClick={() => set({ phases: data.phases.filter((x) => x.id !== p.id) })}
              >
                Удалить
              </button>
            </div>
            <div className="mb-3 grid grid-cols-3 gap-2">
              <input
                className={input}
                type="number"
                placeholder="Фаза"
                value={p.phase}
                onChange={(e) =>
                  set({
                    phases: data.phases.map((x) =>
                      x.id === p.id ? { ...x, phase: Number(e.target.value) || 0 } : x,
                    ),
                  })
                }
              />
              <input
                className={input}
                type="number"
                placeholder="Макс. ур."
                value={p.maxLevel}
                onChange={(e) =>
                  set({
                    phases: data.phases.map((x) =>
                      x.id === p.id ? { ...x, maxLevel: Number(e.target.value) || 0 } : x,
                    ),
                  })
                }
              />
              <input
                className={input}
                type="number"
                placeholder="Мора"
                value={p.mora}
                onChange={(e) =>
                  set({
                    phases: data.phases.map((x) =>
                      x.id === p.id ? { ...x, mora: Number(e.target.value) || 0 } : x,
                    ),
                  })
                }
              />
            </div>
            <MatList
              title="Материалы фазы"
              items={p.materials}
              catalog={catalog}
              onChange={(materials) =>
                set({
                  phases: data.phases.map((x) => (x.id === p.id ? { ...x, materials } : x)),
                })
              }
            />
          </div>
        ))}
      </div>

      <div className="space-y-3 rounded-[14px] border border-black/[0.06] bg-white/70 p-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.06em] text-muted-foreground">
            Кому подойдёт
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
            Текст и ссылки собираются сами из названия оружия и персонажей из базы
          </p>
        </div>

        {data.recommendedIntro ? (
          <div
            className="rounded-[12px] border border-black/[0.06] bg-white/90 px-3 py-2.5 text-sm font-medium leading-relaxed text-muted-foreground [&_a]:font-semibold [&_a]:text-[#c45a1f]"
            dangerouslySetInnerHTML={{ __html: data.recommendedIntro }}
          />
        ) : (
          <p className="rounded-[12px] bg-[#0b1f44]/[0.03] px-3 py-2 text-xs font-medium text-muted-foreground">
            Добавьте персонажей из базы — текст появится автоматически.
          </p>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase text-muted-foreground">Персонажи</p>
            <button
              type="button"
              className="text-xs font-bold text-[#189b8e]"
              onClick={() =>
                setRecommended([
                  ...data.recommended,
                  {
                    id: uid(),
                    name: "",
                    image: "",
                    element: "HYDRO",
                    rarityStars: 5,
                    href: "",
                  },
                ])
              }
            >
              <Plus className="mr-1 inline h-3.5 w-3.5" />
              Добавить
            </button>
          </div>
          {data.recommended.map((c) => (
            <div key={c.id} className="rounded-[14px] border border-black/[0.06] bg-white/80 p-3">
              <CatalogPicker
                label="Из базы"
                kind="characters"
                catalog={catalog}
                onPick={(picked) =>
                  setRecommended(
                    data.recommended.map((x) =>
                      x.id === c.id
                        ? {
                            ...x,
                            name: picked.name,
                            image: picked.image,
                            rarityStars: picked.rarityStars ?? picked.rarity,
                            href: picked.href,
                            element: picked.element || x.element,
                          }
                        : x,
                    ),
                  )
                }
              />
              <div className="mt-2 flex items-start gap-3">
                <MediaUpload
                  label="Портрет"
                  value={c.image}
                  onChange={(image) =>
                    setRecommended(
                      data.recommended.map((x) =>
                        x.id === c.id ? { ...x, image } : x,
                      ),
                    )
                  }
                  kind="icon"
                  compact
                  className="w-[76px] shrink-0"
                />
                <div className="min-w-0 flex-1 space-y-2">
                  <input
                    className={input}
                    value={c.name}
                    onChange={(e) =>
                      setRecommended(
                        data.recommended.map((x) =>
                          x.id === c.id ? { ...x, name: e.target.value } : x,
                        ),
                      )
                    }
                    placeholder="Имя"
                  />
                  <FancySelect
                    value={c.element || "HYDRO"}
                    onChange={(element) =>
                      setRecommended(
                        data.recommended.map((x) =>
                          x.id === c.id ? { ...x, element } : x,
                        ),
                      )
                    }
                    options={Object.keys(ELEMENT_SVG).map((el) => ({
                      value: el,
                      label: el,
                      icon: ELEMENT_SVG[el as ElementKey],
                    }))}
                    size="sm"
                  />
                  <button
                    type="button"
                    className="text-xs font-bold text-destructive"
                    onClick={() =>
                      setRecommended(data.recommended.filter((x) => x.id !== c.id))
                    }
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={label}>Как получить — заголовок</label>
          <input
            className={input}
            value={data.howToGetTitle}
            onChange={(e) => set({ howToGetTitle: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={label}>Как получить — текст</label>
          <textarea
            className={`${input} min-h-[64px]`}
            value={data.howToGetIntro}
            onChange={(e) => set({ howToGetIntro: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase text-muted-foreground">Баннеры / источники</p>
          <button
            type="button"
            className="text-xs font-bold text-[#189b8e]"
            onClick={() =>
              set({
                banners: [
                  ...data.banners,
                  {
                    id: uid(),
                    name: "",
                    image: "",
                    typeLabel: "Молитва события оружия",
                    typeTone: "orange",
                    featured: "",
                    status: "Доступна Молитва",
                  },
                ],
              })
            }
          >
            + Баннер
          </button>
        </div>
        {data.banners.map((b) => (
          <div key={b.id} className="rounded-[14px] border border-black/[0.06] bg-white/80 p-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <MediaUpload
                label="Картинка баннера"
                value={b.image}
                onChange={(image) =>
                  set({
                    banners: data.banners.map((x) => (x.id === b.id ? { ...x, image } : x)),
                  })
                }
                kind="splash"
              />
              <div className="space-y-2">
                <input
                  className={input}
                  value={b.name}
                  onChange={(e) =>
                    set({
                      banners: data.banners.map((x) =>
                        x.id === b.id ? { ...x, name: e.target.value } : x,
                      ),
                    })
                  }
                  placeholder="Название"
                />
                <input
                  className={input}
                  value={b.typeLabel}
                  onChange={(e) =>
                    set({
                      banners: data.banners.map((x) =>
                        x.id === b.id ? { ...x, typeLabel: e.target.value } : x,
                      ),
                    })
                  }
                  placeholder="Тип молитвы"
                />
                <FancySelect
                  value={b.typeTone}
                  onChange={(typeTone) =>
                    set({
                      banners: data.banners.map((x) =>
                        x.id === b.id
                          ? { ...x, typeTone: typeTone as "blue" | "purple" | "orange" }
                          : x,
                      ),
                    })
                  }
                  options={[
                    { value: "blue", label: "Синий" },
                    { value: "purple", label: "Фиолетовый" },
                    { value: "orange", label: "Оранжевый" },
                  ]}
                  size="sm"
                />
                <input
                  className={input}
                  value={b.featured}
                  onChange={(e) =>
                    set({
                      banners: data.banners.map((x) =>
                        x.id === b.id ? { ...x, featured: e.target.value } : x,
                      ),
                    })
                  }
                  placeholder="Фичер (имя 5★)"
                />
                <button
                  type="button"
                  className="text-xs font-bold text-destructive"
                  onClick={() => set({ banners: data.banners.filter((x) => x.id !== b.id) })}
                >
                  <Trash2 className="mr-1 inline h-3 w-3" />
                  Удалить
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="text-xs font-bold text-muted-foreground"
        onClick={() => onChange(emptyWeaponGuide())}
      >
        Очистить гайд
      </button>
    </div>
  );
}

function MatList({
  title,
  items,
  catalog,
  onChange,
}: {
  title: string;
  items: GuideMatRef[];
  catalog: ReturnType<typeof useGuideCatalog>["catalog"];
  onChange: (items: GuideMatRef[]) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase text-muted-foreground">{title}</p>
        <button
          type="button"
          className="text-xs font-bold text-[#189b8e]"
          onClick={() => onChange([...items, emptyMat()])}
        >
          + Материал
        </button>
      </div>
      {items.map((m) => (
        <div key={m.id} className="rounded-[12px] border border-black/[0.05] bg-white/70 p-2">
          <CatalogPicker
            label="Из базы"
            kind="materials"
            catalog={catalog}
            onPick={(picked) =>
              onChange(
                items.map((x) =>
                  x.id === m.id
                    ? {
                        ...x,
                        name: picked.name,
                        image: picked.image,
                        rarityStars: picked.rarityStars ?? picked.rarity,
                        href: picked.href,
                      }
                    : x,
                ),
              )
            }
          />
          <div className="mt-2 flex items-start gap-3">
            <MediaUpload
              label="Иконка"
              value={m.image}
              onChange={(image) =>
                onChange(items.map((x) => (x.id === m.id ? { ...x, image } : x)))
              }
              kind="material"
              compact
              className="w-[76px] shrink-0"
            />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-start gap-2">
                <input
                  className={`${input} flex-1`}
                  value={m.name}
                  onChange={(e) =>
                    onChange(items.map((x) => (x.id === m.id ? { ...x, name: e.target.value } : x)))
                  }
                  placeholder="Название"
                />
                <button
                  type="button"
                  className="mt-1 shrink-0 px-1 text-sm font-bold text-destructive"
                  onClick={() => onChange(items.filter((x) => x.id !== m.id))}
                  aria-label="Удалить"
                >
                  ×
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  className={input}
                  type="number"
                  value={m.qty || ""}
                  onChange={(e) =>
                    onChange(
                      items.map((x) =>
                        x.id === m.id ? { ...x, qty: Number(e.target.value) || 0 } : x,
                      ),
                    )
                  }
                  placeholder="Кол-во"
                />
                <FancySelect
                  value={String(m.rarityStars)}
                  onChange={(v) =>
                    onChange(
                      items.map((x) =>
                        x.id === m.id ? { ...x, rarityStars: Number(v) } : x,
                      ),
                    )
                  }
                  options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n}★` }))}
                  size="sm"
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
