"use client";

import { useEffect } from "react";
import { Plus } from "lucide-react";
import MediaUpload from "@/components/admin/MediaUpload";
import FancySelect from "@/components/ui/FancySelect";
import { CatalogPicker, useGuideCatalog } from "@/components/admin/CatalogPicker";
import {
  buildMaterialCharactersIntro,
  buildMaterialForgingIntro,
  buildMaterialTeapotIntro,
  buildMaterialWeaponsIntro,
  emptyForgingDiagram,
  emptyMaterialGuide,
  parseMaterialGuide,
  uid,
  type GuideMatRef,
  type MaterialGuideData,
} from "@/lib/wiki-guide-data";

const input =
  "w-full rounded-[12px] border border-black/[0.08] bg-white/90 px-3 py-2 text-sm font-medium outline-none ring-[#189b8e]/25 focus:ring-2";
const label = "mb-1 block text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground";

function emptyMat(): GuideMatRef {
  return { id: uid(), name: "", image: "", qty: 0, rarityStars: 2, href: "" };
}

export default function MaterialGuideEditor({
  value,
  onChange,
  materialName = "материал",
}: {
  value: unknown;
  onChange: (next: MaterialGuideData) => void;
  materialName?: string;
}) {
  const data = parseMaterialGuide(value);
  const { catalog } = useGuideCatalog();

  function set(patch: Partial<MaterialGuideData>) {
    onChange({ ...data, ...patch });
  }

  function setCharacters(characters: MaterialGuideData["characters"]) {
    set({
      characters,
      charactersIntro: buildMaterialCharactersIntro(materialName, characters),
    });
  }

  function setWeapons(weapons: MaterialGuideData["weapons"]) {
    set({
      weapons,
      weaponsIntro: buildMaterialWeaponsIntro(materialName),
    });
  }

  function setTeapotItems(teapotItems: MaterialGuideData["teapotItems"]) {
    set({
      teapotItems,
      teapotIntro: buildMaterialTeapotIntro(materialName),
    });
  }

  function setForging(
    patch: Partial<Pick<MaterialGuideData, "forgingDiagram" | "forgingIngredients">>,
  ) {
    const diagram = patch.forgingDiagram ?? data.forgingDiagram;
    const ingredients = patch.forgingIngredients ?? data.forgingIngredients;
    set({
      forgingDiagram: diagram,
      forgingIngredients: ingredients,
      forgingIntro: buildMaterialForgingIntro(materialName, diagram),
    });
  }

  // Если переименовали материал — обновить тексты со ссылками
  useEffect(() => {
    const nextChars = buildMaterialCharactersIntro(materialName, data.characters);
    const nextWeapons = buildMaterialWeaponsIntro(materialName);
    const nextTeapot = buildMaterialTeapotIntro(materialName);
    const nextForge = buildMaterialForgingIntro(materialName, data.forgingDiagram);
    const patch: Partial<MaterialGuideData> = {};
    if (nextChars && nextChars !== data.charactersIntro) patch.charactersIntro = nextChars;
    if (data.weapons.length > 0 && nextWeapons !== data.weaponsIntro) {
      patch.weaponsIntro = nextWeapons;
    }
    if (data.teapotItems.length > 0 && nextTeapot !== data.teapotIntro) {
      patch.teapotIntro = nextTeapot;
    }
    if (nextForge !== data.forgingIntro) patch.forgingIntro = nextForge;
    if (Object.keys(patch).length) onChange({ ...data, ...patch });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- только при смене имени материала
  }, [materialName]);

  return (
    <div className="space-y-5 rounded-[16px] border border-black/[0.05] bg-[#0b1f44]/[0.02] p-4">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#189b8e]">Гайд материала</p>
        <p className="text-xs font-medium text-muted-foreground">
          Описание, оружие, алхимия, источники
        </p>
      </div>

      <div>
        <label className={label}>Описание</label>
        <textarea
          className={`${input} min-h-[80px]`}
          value={data.description}
          onChange={(e) => set({ description: e.target.value })}
        />
      </div>
      <div>
        <label className={label}>Лор (курсив)</label>
        <textarea
          className={`${input} min-h-[56px]`}
          value={data.lore}
          onChange={(e) => set({ lore: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.06em] text-muted-foreground">
            Улучшаемые персонажи
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
            Текст и ссылки собираются сами из названия материала и персонажей из базы
          </p>
        </div>

        {data.charactersIntro ? (
          <div
            className="rounded-[12px] border border-black/[0.06] bg-white/90 px-3 py-2.5 text-sm font-medium leading-relaxed text-muted-foreground [&_a]:font-semibold [&_a]:text-[#c45a1f]"
            dangerouslySetInnerHTML={{ __html: data.charactersIntro }}
          />
        ) : (
          <p className="rounded-[12px] bg-[#0b1f44]/[0.03] px-3 py-2 text-xs font-medium text-muted-foreground">
            Добавьте персонажей из базы — текст появится автоматически.
          </p>
        )}

        <div className="flex justify-between">
          <p className="text-xs font-bold uppercase text-muted-foreground">Персонажи</p>
          <button
            type="button"
            className="text-xs font-bold text-[#189b8e]"
            onClick={() =>
              setCharacters([
                ...data.characters,
                {
                  id: uid(),
                  name: "",
                  image: "",
                  element: "CRYO",
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
        {data.characters.map((c) => (
          <div key={c.id} className="rounded-[12px] border border-black/[0.05] bg-white/80 p-2">
            <CatalogPicker
              label="Из базы"
              kind="characters"
              catalog={catalog}
              onPick={(picked) =>
                setCharacters(
                  data.characters.map((x) =>
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
                  setCharacters(
                    data.characters.map((x) => (x.id === c.id ? { ...x, image } : x)),
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
                    setCharacters(
                      data.characters.map((x) =>
                        x.id === c.id ? { ...x, name: e.target.value } : x,
                      ),
                    )
                  }
                  placeholder="Имя"
                />
                <input
                  className={input}
                  value={c.element}
                  onChange={(e) =>
                    set({
                      characters: data.characters.map((x) =>
                        x.id === c.id ? { ...x, element: e.target.value } : x,
                      ),
                    })
                  }
                  placeholder="CRYO / GEO / ..."
                />
                <button
                  type="button"
                  className="text-xs font-bold text-destructive"
                  onClick={() =>
                    setCharacters(data.characters.filter((x) => x.id !== c.id))
                  }
                >
                  Удалить
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3 rounded-[14px] border border-black/[0.06] bg-[#0b1f44]/[0.02] p-4">
        <p className="text-xs font-bold uppercase tracking-[0.06em] text-muted-foreground">
          Интерактивная карта
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={label}>Заголовок</label>
            <input
              className={input}
              value={data.mapTitle}
              onChange={(e) => set({ mapTitle: e.target.value })}
              placeholder="Интерактивная карта"
            />
          </div>
          <div>
            <label className={label}>Текст под заголовком</label>
            <input
              className={input}
              value={data.mapIntro}
              onChange={(e) => set({ mapIntro: e.target.value })}
              placeholder="Где находится материал…"
            />
          </div>
        </div>
        <div>
          <label className={label}>Ссылка на карту Hoyolab</label>
          <input
            className={input}
            type="url"
            value={data.mapUrl}
            onChange={(e) => set({ mapUrl: e.target.value })}
            placeholder="https://act.hoyolab.com/ys/app/interactive-map/index.html?lang=ru-ru#/map/…"
          />
          <p className="mt-1.5 text-[11px] font-medium text-muted-foreground">
            Вставьте ссылку с нужными метками (shown_types, center, zoom). Карта отобразится в
            iframe на странице материала.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.06em] text-muted-foreground">
            Возвышаемое оружие
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
            Текст собирается сам из названия материала. Добавьте оружие из базы
          </p>
        </div>

        {(data.weaponsIntro || data.weapons.length > 0) && (
          <div className="rounded-[12px] border border-black/[0.06] bg-white/90 px-3 py-2.5 text-sm font-medium leading-relaxed text-muted-foreground">
            {data.weaponsIntro || buildMaterialWeaponsIntro(materialName)}
          </div>
        )}

        <div className="flex justify-between">
          <p className="text-xs font-bold uppercase text-muted-foreground">Оружие</p>
          <button
            type="button"
            className="text-xs font-bold text-[#189b8e]"
            onClick={() =>
              setWeapons([
                ...data.weapons,
                { id: uid(), name: "", image: "", rarityStars: 4, href: "" },
              ])
            }
          >
            <Plus className="mr-1 inline h-3.5 w-3.5" />
            Добавить
          </button>
        </div>
        {data.weapons.map((w) => (
          <div key={w.id} className="rounded-[12px] border border-black/[0.05] bg-white/80 p-2">
            <CatalogPicker
              label="Из базы"
              kind="weapons"
              catalog={catalog}
              onPick={(picked) =>
                setWeapons(
                  data.weapons.map((x) =>
                    x.id === w.id
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
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <MediaUpload
                label="Иконка"
                value={w.image}
                onChange={(image) =>
                  setWeapons(data.weapons.map((x) => (x.id === w.id ? { ...x, image } : x)))
                }
                kind="weapon"
              />
              <div className="space-y-2">
                <input
                  className={input}
                  value={w.name}
                  onChange={(e) =>
                    setWeapons(
                      data.weapons.map((x) =>
                        x.id === w.id ? { ...x, name: e.target.value } : x,
                      ),
                    )
                  }
                />
                <FancySelect
                  value={String(w.rarityStars)}
                  onChange={(v) =>
                    setWeapons(
                      data.weapons.map((x) =>
                        x.id === w.id ? { ...x, rarityStars: Number(v) } : x,
                      ),
                    )
                  }
                  options={[3, 4, 5].map((n) => ({ value: String(n), label: `${n}★` }))}
                  size="sm"
                />
                <button
                  type="button"
                  className="text-xs font-bold text-destructive"
                  onClick={() => setWeapons(data.weapons.filter((x) => x.id !== w.id))}
                >
                  Удалить
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.06em] text-muted-foreground">
            Создание материалов (чайник)
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
            Красители и предметы чайника. Текст собирается сам
          </p>
        </div>

        {(data.teapotIntro || data.teapotItems.length > 0) && (
          <div className="rounded-[12px] border border-black/[0.06] bg-white/90 px-3 py-2.5 text-sm font-medium leading-relaxed text-muted-foreground">
            {data.teapotIntro || buildMaterialTeapotIntro(materialName)}
          </div>
        )}

        <div className="flex justify-between">
          <p className="text-xs font-bold uppercase text-muted-foreground">Предметы</p>
          <button
            type="button"
            className="text-xs font-bold text-[#189b8e]"
            onClick={() =>
              setTeapotItems([
                ...data.teapotItems,
                { id: uid(), name: "", image: "", rarityStars: 1, href: "" },
              ])
            }
          >
            <Plus className="mr-1 inline h-3.5 w-3.5" />
            Добавить
          </button>
        </div>
        {data.teapotItems.map((item) => (
          <div key={item.id} className="rounded-[12px] border border-black/[0.05] bg-white/80 p-2">
            <CatalogPicker
              label="Из базы"
              kind="materials"
              catalog={catalog}
              onPick={(picked) =>
                setTeapotItems(
                  data.teapotItems.map((x) =>
                    x.id === item.id
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
                value={item.image}
                onChange={(image) =>
                  setTeapotItems(
                    data.teapotItems.map((x) => (x.id === item.id ? { ...x, image } : x)),
                  )
                }
                kind="material"
                compact
                className="w-[76px] shrink-0"
              />
              <div className="min-w-0 flex-1 space-y-2">
                <input
                  className={input}
                  value={item.name}
                  onChange={(e) =>
                    setTeapotItems(
                      data.teapotItems.map((x) =>
                        x.id === item.id ? { ...x, name: e.target.value } : x,
                      ),
                    )
                  }
                  placeholder="Синяя краска"
                />
                <button
                  type="button"
                  className="text-xs font-bold text-destructive"
                  onClick={() =>
                    setTeapotItems(data.teapotItems.filter((x) => x.id !== item.id))
                  }
                >
                  Удалить
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <MatBlock
        title="Применение в алхимии"
        intro={data.alchemyUseIntro}
        onIntro={(alchemyUseIntro) => set({ alchemyUseIntro })}
        items={data.alchemyUses}
        catalog={catalog}
        onChange={(alchemyUses) => set({ alchemyUses })}
      />

      <div className="space-y-2">
        <label className={label}>Источники — текст</label>
        <input
          className={input}
          value={data.sourcesIntro}
          onChange={(e) => set({ sourcesIntro: e.target.value })}
        />
        <div className="flex justify-between">
          <p className="text-xs font-bold uppercase text-muted-foreground">Враги / источники</p>
          <button
            type="button"
            className="text-xs font-bold text-[#189b8e]"
            onClick={() =>
              set({
                sources: [...data.sources, { id: uid(), name: "", image: "", href: "" }],
              })
            }
          >
            + Источник
          </button>
        </div>
        {data.sources.map((s) => (
          <div key={s.id} className="grid gap-2 rounded-[12px] border border-black/[0.05] bg-white/80 p-2 sm:grid-cols-2">
            <MediaUpload
              label="Картинка"
              value={s.image}
              onChange={(image) =>
                set({
                  sources: data.sources.map((x) => (x.id === s.id ? { ...x, image } : x)),
                })
              }
              kind="icon"
            />
            <div className="space-y-2">
              <input
                className={input}
                value={s.name}
                onChange={(e) =>
                  set({
                    sources: data.sources.map((x) =>
                      x.id === s.id ? { ...x, name: e.target.value } : x,
                    ),
                  })
                }
                placeholder="Маг Бездны"
              />
              <button
                type="button"
                className="text-xs font-bold text-destructive"
                onClick={() => set({ sources: data.sources.filter((x) => x.id !== s.id) })}
              >
                Удалить
              </button>
            </div>
          </div>
        ))}
      </div>

      <MatBlock
        title="Алхимия (рецепт получения)"
        intro={data.alchemyCraftIntro}
        onIntro={(alchemyCraftIntro) => set({ alchemyCraftIntro })}
        items={data.alchemyCraft}
        catalog={catalog}
        onChange={(alchemyCraft) => set({ alchemyCraft })}
      />

      <div className="space-y-3 rounded-[14px] border border-black/[0.06] bg-white/70 p-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.06em] text-muted-foreground">
            Рецепты ковки
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
            Диаграмма и материалы. Текст со ссылкой собирается сам
          </p>
        </div>

        {data.forgingIntro ? (
          <div
            className="rounded-[12px] border border-black/[0.06] bg-white/90 px-3 py-2.5 text-sm font-medium leading-relaxed text-muted-foreground [&_a]:font-semibold [&_a]:text-[#c45a1f]"
            dangerouslySetInnerHTML={{ __html: data.forgingIntro }}
          />
        ) : null}

        <div className="rounded-[12px] border border-black/[0.05] bg-white/80 p-2">
          <p className="mb-2 text-[11px] font-bold uppercase text-muted-foreground">Диаграмма</p>
          <CatalogPicker
            label="Из базы"
            kind="materials"
            catalog={catalog}
            onPick={(picked) =>
              setForging({
                forgingDiagram: {
                  id: data.forgingDiagram.id || uid(),
                  name: picked.name,
                  image: picked.image,
                  rarityStars: picked.rarityStars ?? picked.rarity,
                  href: picked.href,
                },
              })
            }
          />
          <div className="mt-2 flex items-start gap-3">
            <MediaUpload
              label="Иконка"
              value={data.forgingDiagram.image}
              onChange={(image) =>
                setForging({ forgingDiagram: { ...data.forgingDiagram, image } })
              }
              kind="material"
              compact
              className="w-[76px] shrink-0"
            />
            <div className="min-w-0 flex-1 space-y-2">
              <input
                className={input}
                value={data.forgingDiagram.name}
                onChange={(e) =>
                  setForging({
                    forgingDiagram: { ...data.forgingDiagram, name: e.target.value },
                  })
                }
                placeholder="Диаграмма: …"
              />
              <FancySelect
                value={String(data.forgingDiagram.rarityStars)}
                onChange={(v) =>
                  setForging({
                    forgingDiagram: {
                      ...data.forgingDiagram,
                      rarityStars: Number(v),
                    },
                  })
                }
                options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n}★` }))}
                size="sm"
              />
              <button
                type="button"
                className="text-xs font-bold text-destructive"
                onClick={() => setForging({ forgingDiagram: emptyForgingDiagram() })}
              >
                Очистить диаграмму
              </button>
            </div>
          </div>
        </div>

        <MatBlock
          title="Материалы для ковки"
          intro=""
          onIntro={() => {}}
          hideIntro
          items={data.forgingIngredients}
          catalog={catalog}
          onChange={(forgingIngredients) => setForging({ forgingIngredients })}
        />
      </div>

      <button type="button" className="text-xs font-bold text-muted-foreground" onClick={() => onChange(emptyMaterialGuide())}>
        Очистить гайд
      </button>
    </div>
  );
}

function MatBlock({
  title,
  intro,
  onIntro,
  items,
  catalog,
  onChange,
  hideIntro,
}: {
  title: string;
  intro: string;
  onIntro: (v: string) => void;
  items: GuideMatRef[];
  catalog: ReturnType<typeof useGuideCatalog>["catalog"];
  onChange: (items: GuideMatRef[]) => void;
  hideIntro?: boolean;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-bold uppercase text-muted-foreground">{title}</p>
      {!hideIntro && (
        <input className={input} value={intro} onChange={(e) => onIntro(e.target.value)} placeholder="Вступление" />
      )}
      <button
        type="button"
        className="text-xs font-bold text-[#189b8e]"
        onClick={() => onChange([...items, emptyMat()])}
      >
        + Предмет
      </button>
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
              onChange={(image) => onChange(items.map((x) => (x.id === m.id ? { ...x, image } : x)))}
              kind="material"
              compact
              className="w-[76px] shrink-0"
            />
            <div className="min-w-0 flex-1 space-y-2">
              <input
                className={input}
                value={m.name}
                onChange={(e) =>
                  onChange(items.map((x) => (x.id === m.id ? { ...x, name: e.target.value } : x)))
                }
              />
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
                      items.map((x) => (x.id === m.id ? { ...x, rarityStars: Number(v) } : x)),
                    )
                  }
                  options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n}★` }))}
                  size="sm"
                />
              </div>
              <button
                type="button"
                className="text-xs font-bold text-destructive"
                onClick={() => onChange(items.filter((x) => x.id !== m.id))}
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

