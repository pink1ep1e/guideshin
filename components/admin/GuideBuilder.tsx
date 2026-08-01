"use client";

import { useState } from "react";
import {
  GripVertical,
  Plus,
  Trash2,
  Sword,
  Gem,
  Flower2,
  Users,
  Type,
  Video,
  Table2,
  BarChart3,
  Package,
} from "lucide-react";
import MediaUpload from "@/components/admin/MediaUpload";
import FancySelect from "@/components/ui/FancySelect";
import { CatalogPicker, useGuideCatalog } from "@/components/admin/CatalogPicker";
import { ELEMENT_LABEL, ELEMENT_SVG, type ElementKey } from "@/lib/genshin";
import {
  type GuideBlock,
  type GuideItem,
  type GuideTeamMember,
  createEmptyBlocks,
  emptyResourceRow,
  emptyRoleRow,
  emptyStatsRow,
  parseGuideBlocks,
  serializeGuide,
  uid,
} from "@/lib/guide-builder";

type Props = {
  characterName: string;
  value: string;
  onChange: (html: string) => void;
};

function emptyItem(): GuideItem {
  return { id: uid(), name: "", image: "", rarity: 5, note: "", href: "" };
}

function emptyMember(): GuideTeamMember {
  return {
    id: uid(),
    name: "",
    image: "",
    elementIcon: ELEMENT_SVG.HYDRO,
    rarity: 5,
    href: "",
  };
}

export default function GuideBuilder({ characterName, value, onChange }: Props) {
  const { catalog } = useGuideCatalog();
  const [blocks, setBlocks] = useState<GuideBlock[]>(() => {
    return parseGuideBlocks(value) ?? createEmptyBlocks(characterName || "Персонаж");
  });

  function commit(next: GuideBlock[]) {
    setBlocks(next);
    onChange(serializeGuide(next));
  }

  function updateBlock(id: string, patch: Partial<GuideBlock>) {
    commit(
      blocks.map((b) => (b.id === id ? ({ ...b, ...patch } as GuideBlock) : b)),
    );
  }

  function removeBlock(id: string) {
    commit(blocks.filter((b) => b.id !== id));
  }

  function addBlock(type: GuideBlock["type"]) {
    const base = { id: uid() };
    let block: GuideBlock;
    if (type === "text") {
      block = { ...base, type, eyebrow: "Раздел", title: "Заголовок", body: "" };
    } else if (type === "video") {
      block = { ...base, type, title: "Видео-гайд", youtubeUrl: "", videoUrl: "" };
    } else if (type === "weapons") {
      block = { ...base, type, title: "Рекомендуемое оружие", items: [emptyItem()] };
    } else if (type === "artifacts") {
      block = { ...base, type, title: "Артефакты", items: [emptyItem()] };
    } else if (type === "materials") {
      block = {
        ...base,
        type,
        title: "Цветы, расходники и материалы",
        items: [emptyItem()],
      };
    } else if (type === "roleTable") {
      block = {
        ...base,
        type,
        eyebrow: "Саб-дд",
        title: "Карманные дамагеры",
        intro: "Персонажи, которые атакуют из кармана:",
        rows: [emptyRoleRow()],
      };
    } else if (type === "statsTable") {
      block = {
        ...base,
        type,
        title: "Характеристики: что повышается при возвышении",
        intro: "Базовые статы растут с уровнем. В последнем столбце — бонус возвышения.",
        colLabels: [
          "Уровень",
          "Базовое HP",
          "Базовая сила атаки",
          "Базовая защита",
          "Базовый крит. шанс",
          "Крит. шанс с возвышения",
        ],
        rows: [
          emptyStatsRow("1"),
          emptyStatsRow("20"),
          emptyStatsRow("40"),
          emptyStatsRow("50"),
          emptyStatsRow("60"),
          emptyStatsRow("70"),
          emptyStatsRow("80"),
          emptyStatsRow("90"),
        ],
      };
    } else if (type === "resourceTable") {
      block = {
        ...base,
        type,
        title: "Возвышение",
        intro: "Для повышения уровней персонажа нужны следующие ресурсы:",
        rows: [emptyResourceRow()],
      };
    } else {
      block = {
        ...base,
        type: "team",
        title: "Отряд",
        badge: "Топ",
        note: "",
        members: [emptyMember(), emptyMember(), emptyMember(), emptyMember()],
      };
    }
    commit([...blocks, block]);
  }

  function resetExample() {
    const next = createEmptyBlocks(characterName || "Персонаж");
    commit(next);
  }

  const input =
    "w-full rounded-[12px] border border-black/[0.08] bg-white/90 px-3 py-2 text-sm font-medium outline-none ring-[#189b8e]/25 focus:ring-2";
  const label = "mb-1 block text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground";

  const blockTitle = (type: GuideBlock["type"]) => {
    const map: Record<GuideBlock["type"], string> = {
      text: "Текст",
      video: "Видео / YouTube",
      weapons: "Оружие",
      artifacts: "Артефакты",
      materials: "Материалы / цветы / расходники",
      team: "Отряд",
      roleTable: "Таблица ролей",
      statsTable: "Таблица характеристик",
      resourceTable: "Таблица ресурсов",
    };
    return map[type];
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#189b8e]">
            Конструктор гайда
          </p>
          <p className="text-sm font-medium text-muted-foreground">
            Таблицы ролей, статов, ресурсов, оружие, отряды и видео
          </p>
        </div>
        <button
          type="button"
          onClick={resetExample}
          className="rounded-xl bg-[#189b8e]/12 px-3 py-2 text-xs font-bold text-[#189b8e]"
        >
          Сбросить шаблон
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["text", "Текст", Type],
            ["video", "Видео", Video],
            ["roleTable", "Роли", Table2],
            ["statsTable", "Статы", BarChart3],
            ["resourceTable", "Ресурсы", Package],
            ["weapons", "Оружие", Sword],
            ["artifacts", "Артефакты", Gem],
            ["materials", "Материалы", Flower2],
            ["team", "Отряд", Users],
          ] as const
        ).map(([type, title, Icon]) => (
          <button
            key={type}
            type="button"
            onClick={() => addBlock(type)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-bold text-foreground/75 ring-1 ring-black/[0.06] hover:bg-[#189b8e]/10 hover:text-[#189b8e]"
          >
            <Plus className="h-3.5 w-3.5" />
            <Icon className="h-3.5 w-3.5" />
            {title}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {blocks.map((block) => (
          <div
            key={block.id}
            className="overflow-hidden rounded-[20px] border border-black/[0.05] bg-white/90 shadow-soft"
          >
            <div className="flex items-center justify-between gap-3 border-b border-black/[0.05] bg-[#189b8e]/[0.04] px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                {blockTitle(block.type)}
              </div>
              <button
                type="button"
                onClick={() => removeBlock(block.id)}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Удалить
              </button>
            </div>

            <div className="space-y-4 p-4">
              {block.type === "text" && (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className={label}>Подпись</label>
                      <input
                        className={input}
                        value={block.eyebrow}
                        onChange={(e) => updateBlock(block.id, { eyebrow: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className={label}>Заголовок</label>
                      <input
                        className={input}
                        value={block.title}
                        onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={label}>Текст</label>
                    <textarea
                      className={`${input} min-h-[100px]`}
                      value={block.body}
                      onChange={(e) => updateBlock(block.id, { body: e.target.value })}
                    />
                  </div>
                </>
              )}

              {block.type === "video" && (
                <>
                  <div>
                    <label className={label}>Заголовок</label>
                    <input
                      className={input}
                      value={block.title}
                      onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={label}>Ссылка YouTube</label>
                    <input
                      className={input}
                      value={block.youtubeUrl}
                      onChange={(e) => updateBlock(block.id, { youtubeUrl: e.target.value })}
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                  </div>
                  <MediaUpload
                    label="Или загрузите видео (mp4/webm)"
                    value={block.videoUrl}
                    onChange={(videoUrl) => updateBlock(block.id, { videoUrl })}
                    kind="video"
                    preview="video"
                    accept="video/mp4,video/webm"
                    hint="/uploads/videos/..."
                  />
                </>
              )}

              {(block.type === "weapons" ||
                block.type === "artifacts" ||
                block.type === "materials") && (
                <>
                  <div>
                    <label className={label}>Заголовок блока</label>
                    <input
                      className={input}
                      value={block.title}
                      onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-3">
                    {block.items.map((item, idx) => (
                      <div
                        key={item.id}
                        className="rounded-[16px] border border-black/[0.05] bg-[#0b1f44]/[0.02] p-3"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-xs font-bold text-muted-foreground">
                            Карточка #{idx + 1}
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              updateBlock(block.id, {
                                items: block.items.filter((x) => x.id !== item.id),
                              })
                            }
                            className="text-xs font-bold text-destructive"
                          >
                            Удалить
                          </button>
                        </div>
                        <div className="mb-3">
                          <CatalogPicker
                            label="Подставить из базы"
                            kind={
                              block.type === "weapons"
                                ? "weapons"
                                : block.type === "artifacts"
                                  ? "artifacts"
                                  : "materials"
                            }
                            catalog={catalog}
                            onPick={(picked) =>
                              updateBlock(block.id, {
                                items: block.items.map((x) =>
                                  x.id === item.id
                                    ? {
                                        ...x,
                                        name: picked.name,
                                        image: picked.image,
                                        rarity: picked.rarity,
                                        href: picked.href,
                                      }
                                    : x,
                                ),
                              })
                            }
                          />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <MediaUpload
                            label="Иконка"
                            value={item.image}
                            onChange={(image) =>
                              updateBlock(block.id, {
                                items: block.items.map((x) =>
                                  x.id === item.id ? { ...x, image } : x,
                                ),
                              })
                            }
                            kind={
                              block.type === "weapons"
                                ? "weapon"
                                : block.type === "artifacts"
                                  ? "artifact"
                                  : "material"
                            }
                          />
                          <div className="space-y-3">
                            <div>
                              <label className={label}>Название</label>
                              <input
                                className={input}
                                value={item.name}
                                onChange={(e) =>
                                  updateBlock(block.id, {
                                    items: block.items.map((x) =>
                                      x.id === item.id ? { ...x, name: e.target.value } : x,
                                    ),
                                  })
                                }
                              />
                            </div>
                            <div>
                              <label className={label}>Заметка</label>
                              <input
                                className={input}
                                value={item.note}
                                onChange={(e) =>
                                  updateBlock(block.id, {
                                    items: block.items.map((x) =>
                                      x.id === item.id ? { ...x, note: e.target.value } : x,
                                    ),
                                  })
                                }
                                placeholder="Лучший выбор / F2P"
                              />
                            </div>
                            <div>
                              <label className={label}>Ссылка на гайд</label>
                              <input
                                className={input}
                                value={item.href || ""}
                                onChange={(e) =>
                                  updateBlock(block.id, {
                                    items: block.items.map((x) =>
                                      x.id === item.id ? { ...x, href: e.target.value } : x,
                                    ),
                                  })
                                }
                                placeholder="/wiki/weapons/..."
                              />
                            </div>
                            <div className="flex gap-2">
                              {([5, 4] as const).map((r) => (
                                <button
                                  key={r}
                                  type="button"
                                  onClick={() =>
                                    updateBlock(block.id, {
                                      items: block.items.map((x) =>
                                        x.id === item.id ? { ...x, rarity: r } : x,
                                      ),
                                    })
                                  }
                                  className={`flex-1 rounded-xl px-2 py-2 text-xs font-bold ${
                                    item.rarity === r
                                      ? "bg-[#189b8e] text-white"
                                      : "bg-white ring-1 ring-black/[0.06]"
                                  }`}
                                >
                                  {r}★
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      updateBlock(block.id, { items: [...block.items, emptyItem()] })
                    }
                    className="inline-flex items-center gap-1 rounded-xl bg-[#189b8e]/12 px-3 py-2 text-xs font-bold text-[#189b8e]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Добавить карточку
                  </button>
                </>
              )}

              {block.type === "roleTable" && (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className={label}>Подпись</label>
                      <input
                        className={input}
                        value={block.eyebrow}
                        onChange={(e) => updateBlock(block.id, { eyebrow: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className={label}>Заголовок</label>
                      <input
                        className={input}
                        value={block.title}
                        onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={label}>Вступление</label>
                    <textarea
                      className={`${input} min-h-[64px]`}
                      value={block.intro}
                      onChange={(e) => updateBlock(block.id, { intro: e.target.value })}
                    />
                  </div>
                  <div className="space-y-3">
                    {block.rows.map((row, idx) => (
                      <div
                        key={row.id}
                        className="rounded-[16px] border border-black/[0.05] bg-[#0b1f44]/[0.02] p-3"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-xs font-bold text-muted-foreground">
                            Строка #{idx + 1}
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              updateBlock(block.id, {
                                rows: block.rows.filter((x) => x.id !== row.id),
                              })
                            }
                            className="text-xs font-bold text-destructive"
                          >
                            Удалить
                          </button>
                        </div>
                        <div className="grid gap-3 lg:grid-cols-2">
                          <div className="space-y-3">
                            <CatalogPicker
                              label="Персонаж из базы"
                              kind="characters"
                              catalog={catalog}
                              onPick={(picked) =>
                                updateBlock(block.id, {
                                  rows: block.rows.map((x) =>
                                    x.id === row.id
                                      ? {
                                          ...x,
                                          name: picked.name,
                                          image: picked.image,
                                          href: picked.href,
                                          elementIcon: picked.element
                                            ? ELEMENT_SVG[picked.element as ElementKey] ||
                                              x.elementIcon
                                            : x.elementIcon,
                                        }
                                      : x,
                                  ),
                                })
                              }
                            />
                            <MediaUpload
                              label="Портрет"
                              value={row.image}
                              onChange={(image) =>
                                updateBlock(block.id, {
                                  rows: block.rows.map((x) =>
                                    x.id === row.id ? { ...x, image } : x,
                                  ),
                                })
                              }
                              kind="icon"
                            />
                          </div>
                          <div className="space-y-2">
                            <input
                              className={input}
                              value={row.name}
                              onChange={(e) =>
                                updateBlock(block.id, {
                                  rows: block.rows.map((x) =>
                                    x.id === row.id ? { ...x, name: e.target.value } : x,
                                  ),
                                })
                              }
                              placeholder="Имя персонажа"
                            />
                            <input
                              className={input}
                              value={row.href || ""}
                              onChange={(e) =>
                                updateBlock(block.id, {
                                  rows: block.rows.map((x) =>
                                    x.id === row.id ? { ...x, href: e.target.value } : x,
                                  ),
                                })
                              }
                              placeholder="/wiki/characters/..."
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                className={input}
                                value={row.element}
                                onChange={(e) =>
                                  updateBlock(block.id, {
                                    rows: block.rows.map((x) =>
                                      x.id === row.id ? { ...x, element: e.target.value } : x,
                                    ),
                                  })
                                }
                                placeholder="Гидро"
                              />
                              <FancySelect
                                value={
                                  Object.entries(ELEMENT_SVG).find(
                                    ([, v]) => v === row.elementIcon,
                                  )?.[0] || "HYDRO"
                                }
                                onChange={(el) =>
                                  updateBlock(block.id, {
                                    rows: block.rows.map((x) =>
                                      x.id === row.id
                                        ? {
                                            ...x,
                                            elementIcon: ELEMENT_SVG[el as ElementKey],
                                          }
                                        : x,
                                    ),
                                  })
                                }
                                options={Object.keys(ELEMENT_SVG).map((el) => ({
                                  value: el,
                                  label: ELEMENT_LABEL[el as ElementKey] ?? el,
                                  icon: ELEMENT_SVG[el as ElementKey],
                                }))}
                                size="sm"
                              />
                            </div>
                            <input
                              className={input}
                              value={row.weapon}
                              onChange={(e) =>
                                updateBlock(block.id, {
                                  rows: block.rows.map((x) =>
                                    x.id === row.id ? { ...x, weapon: e.target.value } : x,
                                  ),
                                })
                              }
                              placeholder="Лук / Меч / ..."
                            />
                            <MediaUpload
                              label="Иконка оружия (опционально)"
                              value={row.weaponIcon}
                              onChange={(weaponIcon) =>
                                updateBlock(block.id, {
                                  rows: block.rows.map((x) =>
                                    x.id === row.id ? { ...x, weaponIcon } : x,
                                  ),
                                })
                              }
                              kind="weapon"
                            />
                            <textarea
                              className={`${input} min-h-[72px]`}
                              value={row.description}
                              onChange={(e) =>
                                updateBlock(block.id, {
                                  rows: block.rows.map((x) =>
                                    x.id === row.id
                                      ? { ...x, description: e.target.value }
                                      : x,
                                  ),
                                })
                              }
                              placeholder="Описание роли / эффектов"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      updateBlock(block.id, { rows: [...block.rows, emptyRoleRow()] })
                    }
                    className="inline-flex items-center gap-1 rounded-xl bg-[#189b8e]/12 px-3 py-2 text-xs font-bold text-[#189b8e]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Добавить строку
                  </button>
                </>
              )}

              {block.type === "statsTable" && (
                <>
                  <div>
                    <label className={label}>Заголовок</label>
                    <input
                      className={input}
                      value={block.title}
                      onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={label}>Вступление</label>
                    <textarea
                      className={`${input} min-h-[64px]`}
                      value={block.intro}
                      onChange={(e) => updateBlock(block.id, { intro: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {block.colLabels.map((col, i) => (
                      <div key={i}>
                        <label className={label}>Колонка {i + 1}</label>
                        <input
                          className={input}
                          value={col}
                          onChange={(e) => {
                            const next = [...block.colLabels] as typeof block.colLabels;
                            next[i] = e.target.value;
                            updateBlock(block.id, { colLabels: next });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-left text-xs">
                      <thead>
                        <tr className="text-muted-foreground">
                          {block.colLabels.map((c) => (
                            <th key={c} className="px-1 py-1 font-bold">
                              {c}
                            </th>
                          ))}
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {block.rows.map((row) => (
                          <tr key={row.id}>
                            {(
                              [
                                "level",
                                "hp",
                                "atk",
                                "def",
                                "baseStat",
                                "ascStat",
                              ] as const
                            ).map((key) => (
                              <td key={key} className="px-1 py-1">
                                <input
                                  className={input}
                                  value={row[key]}
                                  onChange={(e) =>
                                    updateBlock(block.id, {
                                      rows: block.rows.map((x) =>
                                        x.id === row.id
                                          ? { ...x, [key]: e.target.value }
                                          : x,
                                      ),
                                    })
                                  }
                                />
                              </td>
                            ))}
                            <td className="px-1 py-1">
                              <button
                                type="button"
                                onClick={() =>
                                  updateBlock(block.id, {
                                    rows: block.rows.filter((x) => x.id !== row.id),
                                  })
                                }
                                className="text-xs font-bold text-destructive"
                              >
                                ×
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      updateBlock(block.id, { rows: [...block.rows, emptyStatsRow()] })
                    }
                    className="inline-flex items-center gap-1 rounded-xl bg-[#189b8e]/12 px-3 py-2 text-xs font-bold text-[#189b8e]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Добавить уровень
                  </button>
                </>
              )}

              {block.type === "resourceTable" && (
                <>
                  <div>
                    <label className={label}>Заголовок</label>
                    <input
                      className={input}
                      value={block.title}
                      onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={label}>Вступление</label>
                    <textarea
                      className={`${input} min-h-[64px]`}
                      value={block.intro}
                      onChange={(e) => updateBlock(block.id, { intro: e.target.value })}
                    />
                  </div>
                  <div className="space-y-3">
                    {block.rows.map((row, idx) => (
                      <div
                        key={row.id}
                        className="rounded-[16px] border border-black/[0.05] bg-[#0b1f44]/[0.02] p-3"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-xs font-bold text-muted-foreground">
                            Ресурс #{idx + 1}
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              updateBlock(block.id, {
                                rows: block.rows.filter((x) => x.id !== row.id),
                              })
                            }
                            className="text-xs font-bold text-destructive"
                          >
                            Удалить
                          </button>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-3">
                            <CatalogPicker
                              label="Материал из базы"
                              kind="materials"
                              catalog={catalog}
                              onPick={(picked) =>
                                updateBlock(block.id, {
                                  rows: block.rows.map((x) =>
                                    x.id === row.id
                                      ? {
                                          ...x,
                                          name: picked.name,
                                          image: picked.image,
                                          href: picked.href,
                                        }
                                      : x,
                                  ),
                                })
                              }
                            />
                            <MediaUpload
                              label="Иконка"
                              value={row.image}
                              onChange={(image) =>
                                updateBlock(block.id, {
                                  rows: block.rows.map((x) =>
                                    x.id === row.id ? { ...x, image } : x,
                                  ),
                                })
                              }
                              kind="material"
                            />
                          </div>
                          <div className="space-y-2">
                            <input
                              className={input}
                              value={row.name}
                              onChange={(e) =>
                                updateBlock(block.id, {
                                  rows: block.rows.map((x) =>
                                    x.id === row.id ? { ...x, name: e.target.value } : x,
                                  ),
                                })
                              }
                              placeholder="Название ресурса"
                            />
                            <input
                              className={input}
                              value={row.qty}
                              onChange={(e) =>
                                updateBlock(block.id, {
                                  rows: block.rows.map((x) =>
                                    x.id === row.id ? { ...x, qty: e.target.value } : x,
                                  ),
                                })
                              }
                              placeholder="Количество (168)"
                            />
                            <input
                              className={input}
                              value={row.href || ""}
                              onChange={(e) =>
                                updateBlock(block.id, {
                                  rows: block.rows.map((x) =>
                                    x.id === row.id ? { ...x, href: e.target.value } : x,
                                  ),
                                })
                              }
                              placeholder="/wiki/materials/..."
                            />
                            <textarea
                              className={`${input} min-h-[72px]`}
                              value={row.where}
                              onChange={(e) =>
                                updateBlock(block.id, {
                                  rows: block.rows.map((x) =>
                                    x.id === row.id ? { ...x, where: e.target.value } : x,
                                  ),
                                })
                              }
                              placeholder="Где найти"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      updateBlock(block.id, {
                        rows: [...block.rows, emptyResourceRow()],
                      })
                    }
                    className="inline-flex items-center gap-1 rounded-xl bg-[#189b8e]/12 px-3 py-2 text-xs font-bold text-[#189b8e]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Добавить ресурс
                  </button>
                </>
              )}

              {block.type === "team" && (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className={label}>Название отряда</label>
                      <input
                        className={input}
                        value={block.title}
                        onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className={label}>Бейдж</label>
                      <input
                        className={input}
                        value={block.badge}
                        onChange={(e) => updateBlock(block.id, { badge: e.target.value })}
                        placeholder="Топ / F2P"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={label}>Комментарий / ротация</label>
                    <textarea
                      className={`${input} min-h-[72px]`}
                      value={block.note}
                      onChange={(e) => updateBlock(block.id, { note: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {block.members.map((m, idx) => (
                      <div
                        key={m.id}
                        className="rounded-[16px] border border-black/[0.05] bg-[#0b1f44]/[0.02] p-3"
                      >
                        <p className="mb-2 text-xs font-bold text-muted-foreground">
                          Слот {idx + 1}
                        </p>
                        <div className="mb-2">
                          <CatalogPicker
                            label="Персонаж из базы"
                            kind="characters"
                            catalog={catalog}
                            onPick={(picked) =>
                              updateBlock(block.id, {
                                members: block.members.map((x) =>
                                  x.id === m.id
                                    ? {
                                        ...x,
                                        name: picked.name,
                                        image: picked.image,
                                        rarity: picked.rarity,
                                        href: picked.href,
                                        elementIcon: picked.element
                                          ? ELEMENT_SVG[picked.element as ElementKey] ||
                                            x.elementIcon
                                          : x.elementIcon,
                                      }
                                    : x,
                                ),
                              })
                            }
                          />
                        </div>
                        <MediaUpload
                          label="Портрет"
                          value={m.image}
                          onChange={(image) =>
                            updateBlock(block.id, {
                              members: block.members.map((x) =>
                                x.id === m.id ? { ...x, image } : x,
                              ),
                            })
                          }
                          kind="icon"
                        />
                        <div className="mt-2 space-y-2">
                          <input
                            className={input}
                            value={m.name}
                            onChange={(e) =>
                              updateBlock(block.id, {
                                members: block.members.map((x) =>
                                  x.id === m.id ? { ...x, name: e.target.value } : x,
                                ),
                              })
                            }
                            placeholder="Имя"
                          />
                          <input
                            className={input}
                            value={m.href || ""}
                            onChange={(e) =>
                              updateBlock(block.id, {
                                members: block.members.map((x) =>
                                  x.id === m.id ? { ...x, href: e.target.value } : x,
                                ),
                              })
                            }
                            placeholder="/wiki/characters/..."
                          />
                          <FancySelect
                            value={
                              Object.entries(ELEMENT_SVG).find(
                                ([, v]) => v === m.elementIcon,
                              )?.[0] || "HYDRO"
                            }
                            onChange={(el) =>
                              updateBlock(block.id, {
                                members: block.members.map((x) =>
                                  x.id === m.id
                                    ? {
                                        ...x,
                                        elementIcon: ELEMENT_SVG[el as ElementKey],
                                      }
                                    : x,
                                ),
                              })
                            }
                            options={Object.keys(ELEMENT_SVG).map((el) => ({
                              value: el,
                              label: ELEMENT_LABEL[el as ElementKey] ?? el,
                              icon: ELEMENT_SVG[el as ElementKey],
                            }))}
                            size="sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
