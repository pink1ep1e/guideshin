/** Таксономия регионов для каталогов и админки (группировка, aliases). */
export const REGION_SLUGS = [
  "nod-krai",
  "snezhnaya",
  "natlan",
  "fontaine",
  "sumeru",
  "inazuma",
  "liyue",
  "mondstadt",
  "other",
] as const;

export type RegionSlug = (typeof REGION_SLUGS)[number];

export type RegionMeta = {
  slug: RegionSlug;
  /** Именительный падеж: «Нод-Край», «Снежная». */
  name: string;
  /** Родительный для секций каталога: «Нод-края», «Снежной». */
  genitive: string;
  shortDesc: string;
  intro: string;
  keywords: string[];
  /** Картинка для OG / карточек (если есть). */
  image?: string;
  /** Приоритет в sitemap (0–1). */
  sitemapPriority: number;
};

export const REGIONS_META: Record<RegionSlug, RegionMeta> = {
  "nod-krai": {
    slug: "nod-krai",
    name: "Нод-Край",
    genitive: "Нод-края",
    shortDesc: "Новый северный регион: гайды на персонажей, артефакты и материалы.",
    intro:
      "Нод-Край — актуальный регион Genshin Impact на севере Тейвата. Здесь собраны гайды на персонажей, сеты артефактов и материалы прокачки: билды, оружие и приоритет талантов. Обновляем страницу по мере выхода новых героев и контента версии.",
    keywords: [
      "Нод-Край",
      "гайды Нод-Край",
      "персонажи Нод-Край",
      "Nod-Krai Genshin",
      "билды Нод-Край",
    ],
    image: "/images/home/hero-bg.jpg",
    sitemapPriority: 0.9,
  },
  snezhnaya: {
    slug: "snezhnaya",
    name: "Снежная",
    genitive: "Снежной",
    shortDesc: "Крио, Царица и Фатуи — готовим гайды к обновлению Снежной.",
    intro:
      "Снежная — родина Фатуи и Царицы, следующий крупный регион Genshin Impact. На Guideshin заранее собираем гайды на персонажей, связанные с Снежной, артефакты и материалы. Следите за разделом: контент появится сразу после анонсов и релиза.",
    keywords: [
      "Снежная",
      "Снежная Genshin",
      "гайды Снежная",
      "персонажи Снежная",
      "Snezhnaya Genshin",
    ],
    image: "/images/home/feature-side.jpg",
    sitemapPriority: 0.9,
  },
  natlan: {
    slug: "natlan",
    name: "Натлан",
    genitive: "Натлана",
    shortDesc: "Пиро, племена и война — персонажи и материалы Натлана.",
    intro:
      "Натлан — регион Пиро в Genshin Impact. В каталоге — гайды на персонажей Натлана, артефакты и материалы возвышения. Выберите героя, чтобы открыть билд, оружие и приоритет талантов.",
    keywords: ["Натлан", "персонажи Натлан", "гайды Натлан", "Natlan Genshin"],
    image: "/images/home/offer-art.jpg",
    sitemapPriority: 0.75,
  },
  fontaine: {
    slug: "fontaine",
    name: "Фонтейн",
    genitive: "Фонтейна",
    shortDesc: "Гидро, механика и суд — гайды по Фонтейну.",
    intro:
      "Фонтейн — регион Гидро. Здесь собраны персонажи Фонтейна, артефакты и материалы для прокачки. Актуальные билды и рекомендации по экипировке — на страницах гайдов.",
    keywords: ["Фонтейн", "персонажи Фонтейн", "гайды Фонтейн", "Fontaine Genshin"],
    image: "/images/home/regions/fontaine.jpg",
    sitemapPriority: 0.7,
  },
  sumeru: {
    slug: "sumeru",
    name: "Сумеру",
    genitive: "Сумеру",
    shortDesc: "Дендро, реакции и Академия — гайды по Сумеру.",
    intro:
      "Сумеру — регион Дендро. Каталог персонажей Сумеру, артефактов и материалов поможет быстро собрать билд и спланировать фарм.",
    keywords: ["Сумеру", "персонажи Сумеру", "гайды Сумеру", "Sumeru Genshin"],
    image: "/images/home/regions/sumeru.jpg",
    sitemapPriority: 0.7,
  },
  inazuma: {
    slug: "inazuma",
    name: "Инадзума",
    genitive: "Инадзумы",
    shortDesc: "Электро, острова и сложный мир — гайды по Инадзуме.",
    intro:
      "Инадзума — архипелаг Электро. В разделе — персонажи Инадзумы, артефакты и материалы. Откройте гайд героя для билдов и ротаций.",
    keywords: ["Инадзума", "персонажи Инадзума", "гайды Инадзума", "Inazuma Genshin"],
    image: "/images/home/regions/inazuma.jpg",
    sitemapPriority: 0.7,
  },
  liyue: {
    slug: "liyue",
    name: "Ли Юэ",
    genitive: "Ли Юэ",
    shortDesc: "Гео, контракты и сильные саппорты — гайды по Ли Юэ.",
    intro:
      "Ли Юэ — регион Гео. Здесь собраны гайды на персонажей Ли Юэ, артефакты и материалы прокачки для комфортного прогресса.",
    keywords: ["Ли Юэ", "персонажи Ли Юэ", "гайды Ли Юэ", "Liyue Genshin"],
    image: "/images/home/regions/liyue.jpg",
    sitemapPriority: 0.7,
  },
  mondstadt: {
    slug: "mondstadt",
    name: "Мондштадт",
    genitive: "Мондштадта",
    shortDesc: "Анемо, свобода и ранний прогресс — гайды по Мондштадту.",
    intro:
      "Мондштадт — стартовый регион Анемо. Гайды на персонажей Мондштадта, артефакты и материалы помогут новичкам и ветеранам собрать рабочие билды.",
    keywords: [
      "Мондштадт",
      "персонажи Мондштадт",
      "гайды Мондштадт",
      "Mondstadt Genshin",
    ],
    image: "/images/home/regions/mondstadt.jpg",
    sitemapPriority: 0.7,
  },
  other: {
    slug: "other",
    name: "Другое",
    genitive: "Другое",
    shortDesc: "Персонажи и материалы без привязки к региону или из прочих зон.",
    intro:
      "В этом разделе — персонажи, артефакты и материалы без чёткой привязки к региону Тейвата или из прочих категорий. Откройте карточку, чтобы перейти к гайду.",
    keywords: ["Genshin Impact", "гайды", "персонажи Genshin"],
    sitemapPriority: 0.4,
  },
};

/** Порядок регионов в каталогах и хабах (Нод-Край и Снежная первыми). */
export const REGION_ORDER: RegionSlug[] = [...REGION_SLUGS];

/** @deprecated Используйте RegionSlug; оставлено для совместимости алиасов. */
export type RegionName = RegionMeta["genitive"];

/** Именительные названия для админ-форм. */
export const REGION_OPTIONS: string[] = REGION_ORDER.map(
  (slug) => REGIONS_META[slug].name,
);

/** Публичные регионы для хаба (без «Другое»). */
export const PUBLIC_REGION_SLUGS: RegionSlug[] = REGION_ORDER.filter(
  (s) => s !== "other",
);

const REGION_ALIASES: Record<string, RegionSlug> = {
  // nod-krai
  "нод-края": "nod-krai",
  "нод-край": "nod-krai",
  нодкрай: "nod-krai",
  "nod-krai": "nod-krai",
  nodkrai: "nod-krai",
  // snezhnaya
  снежной: "snezhnaya",
  снежная: "snezhnaya",
  snezhnaya: "snezhnaya",
  // natlan
  натлана: "natlan",
  натлан: "natlan",
  natlan: "natlan",
  // fontaine
  фонтейна: "fontaine",
  фонтейн: "fontaine",
  fontaine: "fontaine",
  // sumeru
  сумеру: "sumeru",
  sumeru: "sumeru",
  // inazuma
  инадзумы: "inazuma",
  инадзума: "inazuma",
  inazuma: "inazuma",
  // liyue
  "ли юэ": "liyue",
  лиюэ: "liyue",
  liyue: "liyue",
  // mondstadt
  мондштадта: "mondstadt",
  мондштадт: "mondstadt",
  mondstadt: "mondstadt",
  // other
  другое: "other",
  "прочих регионов": "other",
  other: "other",
};

export function normalizeRegion(raw?: string | null): RegionSlug {
  if (!raw?.trim()) return "other";
  const key = raw.trim().toLowerCase();
  if (REGION_ALIASES[key]) return REGION_ALIASES[key];
  const bySlug = REGION_SLUGS.find((s) => s === key);
  if (bySlug) return bySlug;
  const byName = REGION_ORDER.find(
    (slug) => REGIONS_META[slug].name.toLowerCase() === key,
  );
  if (byName) return byName;
  const byGenitive = REGION_ORDER.find(
    (slug) => REGIONS_META[slug].genitive.toLowerCase() === key,
  );
  return byGenitive ?? "other";
}

export function getRegionMeta(raw?: string | null): RegionMeta {
  return REGIONS_META[normalizeRegion(raw)];
}

export function regionToSlug(raw?: string | null): RegionSlug {
  return normalizeRegion(raw);
}

export function slugToRegion(slug: string): RegionMeta | null {
  const key = slug.trim().toLowerCase();
  if ((REGION_SLUGS as readonly string[]).includes(key)) {
    return REGIONS_META[key as RegionSlug];
  }
  return null;
}

export function regionSeoTitle(meta: RegionMeta): string {
  return `${meta.name}: персонажи, гайды и материалы`;
}

export function regionSeoDescription(meta: RegionMeta): string {
  return `${meta.shortDesc} Актуальные билды Genshin Impact на Guideshin.`;
}

export function regionSectionTitle(
  kind: "characters" | "artifacts" | "materials",
  region: string,
): string {
  const r = getRegionMeta(region).genitive;
  if (kind === "characters") return `Персонажи из ${r}`;
  if (kind === "artifacts") return `Артефакты ${r}`;
  return `Материалы ${r}`;
}

/** Типы оружия и заголовки секций каталога. */
export const WEAPON_TYPE_ORDER = [
  "Меч",
  "Двуручник",
  "Копьё",
  "Лук",
  "Катализатор",
] as const;

export type WeaponTypeName = (typeof WEAPON_TYPE_ORDER)[number];

export const WEAPON_TYPE_SECTION_TITLE: Record<WeaponTypeName, string> = {
  Меч: "Мечи",
  Двуручник: "Двуручное оружие",
  Копьё: "Древковое оружие",
  Лук: "Луки",
  Катализатор: "Катализаторы",
};

export function weaponTypeSectionTitle(type: string): string {
  const key = WEAPON_TYPE_ORDER.find((t) => t === type);
  if (key) return WEAPON_TYPE_SECTION_TITLE[key];
  return type || "Другое";
}

export type RegionGroup<T> = { region: RegionSlug; items: T[] };

export function groupByRegion<T>(
  items: T[],
  getRegion: (item: T) => string | null | undefined,
): RegionGroup<T>[] {
  const map = new Map<RegionSlug, T[]>();
  for (const item of items) {
    const region = normalizeRegion(getRegion(item));
    const list = map.get(region) ?? [];
    list.push(item);
    map.set(region, list);
  }
  const groups: RegionGroup<T>[] = [];
  for (const region of REGION_ORDER) {
    const list = map.get(region);
    if (list?.length) groups.push({ region, items: list });
  }
  return groups;
}

export type TypeGroup<T> = { type: string; title: string; items: T[] };

export function groupByWeaponType<T>(
  items: T[],
  getType: (item: T) => string,
): TypeGroup<T>[] {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const type = getType(item) || "Другое";
    const list = map.get(type) ?? [];
    list.push(item);
    map.set(type, list);
  }
  const groups: TypeGroup<T>[] = [];
  for (const type of WEAPON_TYPE_ORDER) {
    const list = map.get(type);
    if (list?.length) {
      groups.push({
        type,
        title: WEAPON_TYPE_SECTION_TITLE[type],
        items: list,
      });
    }
  }
  for (const [type, list] of map) {
    if (
      !(WEAPON_TYPE_ORDER as readonly string[]).includes(type) &&
      list.length
    ) {
      groups.push({ type, title: type, items: list });
    }
  }
  return groups;
}
