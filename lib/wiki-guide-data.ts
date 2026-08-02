export type GuideMatRef = {
  id: string;
  name: string;
  image: string;
  qty: number;
  rarityStars: number;
  href?: string;
};

export type WeaponAscensionPhase = {
  id: string;
  phase: number;
  maxLevel: number;
  mora: number;
  materials: GuideMatRef[];
};

export type WeaponBannerCard = {
  id: string;
  name: string;
  image: string;
  typeLabel: string;
  typeTone: "blue" | "purple" | "orange";
  featured: string;
  status?: string;
  href?: string;
};

export type WeaponGuideData = {
  /** Сила атаки на 1 ур. */
  atkMin: string;
  /** Сила атаки на макс. ур. */
  atkMax: string;
  /** Название доп. стата, напр. «Крит. урон» */
  subStatLabel: string;
  subStatMin: string;
  subStatMax: string;
  /** Пассивное умение / описание эффекта */
  passive: string;
  /** Текст про опыт и мору до 90 ур. */
  levelUpNote: string;
  moraTotal: number;
  materialsSummary: GuideMatRef[];
  ascensionNote: string;
  phases: WeaponAscensionPhase[];
  recommendedIntro: string;
  recommended: {
    id: string;
    name: string;
    image: string;
    element: string;
    rarityStars: number;
    href?: string;
  }[];
  howToGetTitle: string;
  howToGetIntro: string;
  banners: WeaponBannerCard[];
};

export type MaterialGuideData = {
  description: string;
  lore: string;
  charactersIntro: string;
  characters: {
    id: string;
    name: string;
    image: string;
    element: string;
    rarityStars: number;
    href?: string;
  }[];
  weaponsIntro: string;
  weapons: {
    id: string;
    name: string;
    image: string;
    rarityStars: number;
    href?: string;
  }[];
  /** Создание предметов в чайнике (красители и т.п.). */
  teapotIntro: string;
  teapotItems: {
    id: string;
    name: string;
    image: string;
    rarityStars: number;
    href?: string;
  }[];
  alchemyUseIntro: string;
  alchemyUses: GuideMatRef[];
  /** Предметы, создаваемые в кузнице из этого материала. */
  forgingUseIntro: string;
  forgingUses: {
    id: string;
    name: string;
    image: string;
    rarityStars: number;
    href?: string;
  }[];
  sourcesIntro: string;
  sources: {
    id: string;
    name: string;
    image: string;
    href?: string;
  }[];
  alchemyCraftIntro: string;
  alchemyCraft: GuideMatRef[];
  /** Диаграмма / чертёж для ковки (имя в тексте со ссылкой). */
  forgingDiagram: {
    id: string;
    name: string;
    image: string;
    rarityStars: number;
    href?: string;
  };
  forgingIntro: string;
  /** Материалы для ковки (с количеством). */
  forgingIngredients: GuideMatRef[];
  mapTitle: string;
  mapIntro: string;
  /** Ссылка на интерактивную карту Hoyolab (встраивается в iframe). */
  mapUrl: string;
};

export function emptyWeaponGuide(): WeaponGuideData {
  return {
    atkMin: "",
    atkMax: "",
    subStatLabel: "",
    subStatMin: "",
    subStatMax: "",
    passive: "",
    levelUpNote: "",
    moraTotal: 0,
    materialsSummary: [],
    ascensionNote:
      "Помимо перечисленных материалов, также понадобится мора. Ресурсы, необходимые для возвышения до определённого ранга, указаны в таблице ниже.",
    phases: [],
    recommendedIntro: "",
    recommended: [],
    howToGetTitle: "",
    howToGetIntro: "",
    banners: [],
  };
}

export function emptyMaterialGuide(): MaterialGuideData {
  return {
    description: "",
    lore: "",
    charactersIntro: "Материал используется для улучшения следующих персонажей:",
    characters: [],
    weaponsIntro: "",
    weapons: [],
    teapotIntro: "",
    teapotItems: [],
    alchemyUseIntro: "",
    alchemyUses: [],
    forgingUseIntro: "",
    forgingUses: [],
    sourcesIntro: "",
    sources: [],
    alchemyCraftIntro: "",
    alchemyCraft: [],
    forgingDiagram: emptyForgingDiagram(),
    forgingIntro: "",
    forgingIngredients: [],
    mapTitle: "Интерактивная карта",
    mapIntro: "",
    mapUrl: "",
  };
}

export function emptyForgingDiagram(): MaterialGuideData["forgingDiagram"] {
  return { id: uid(), name: "", image: "", rarityStars: 1, href: "" };
}

/** Разрешённые хосты для встраивания карты. */
export function isAllowedMapEmbedUrl(url: string): boolean {
  try {
    const u = new URL(url.trim());
    if (u.protocol !== "https:") return false;
    const host = u.hostname.toLowerCase();
    return (
      host === "act.hoyolab.com" ||
      host.endsWith(".hoyolab.com") ||
      host.endsWith(".mihoyo.com") ||
      host.endsWith(".hoyoverse.com")
    );
  } catch {
    return false;
  }
}

export function parseWeaponGuide(raw: unknown): WeaponGuideData {
  const base = emptyWeaponGuide();
  if (!raw || typeof raw !== "object") return base;
  const d = raw as Partial<WeaponGuideData>;
  return {
    ...base,
    ...d,
    materialsSummary: Array.isArray(d.materialsSummary) ? d.materialsSummary : [],
    phases: Array.isArray(d.phases) ? d.phases : [],
    recommended: Array.isArray(d.recommended) ? d.recommended : [],
    banners: Array.isArray(d.banners) ? d.banners : [],
  };
}

/** Подтянуть image/href из каталога материалов по точному имени. */
export function enrichWeaponGuideMaterials(
  guide: WeaponGuideData,
  catalog: { name: string; slug: string; image: string; rarityStars: number }[],
): WeaponGuideData {
  if (catalog.length === 0) return guide;
  const byName = new Map(catalog.map((m) => [m.name.trim().toLowerCase(), m]));

  function enrich(mat: GuideMatRef): GuideMatRef {
    const hit = byName.get(mat.name.trim().toLowerCase());
    if (!hit) return mat;
    return {
      ...mat,
      image: mat.image || hit.image,
      href: mat.href || `/wiki/materials/${hit.slug}`,
      rarityStars: mat.rarityStars || hit.rarityStars,
    };
  }

  return {
    ...guide,
    materialsSummary: guide.materialsSummary.map(enrich),
    phases: guide.phases.map((p) => ({
      ...p,
      materials: p.materials.map(enrich),
    })),
  };
}

export function parseMaterialGuide(raw: unknown): MaterialGuideData {
  const base = emptyMaterialGuide();
  if (!raw || typeof raw !== "object") return base;
  const d = raw as Partial<MaterialGuideData>;
  const diagram =
    d.forgingDiagram && typeof d.forgingDiagram === "object"
      ? { ...emptyForgingDiagram(), ...d.forgingDiagram }
      : base.forgingDiagram;
  return {
    ...base,
    ...d,
    characters: Array.isArray(d.characters) ? d.characters : [],
    weapons: Array.isArray(d.weapons) ? d.weapons : [],
    teapotItems: Array.isArray(d.teapotItems) ? d.teapotItems : [],
    alchemyUses: Array.isArray(d.alchemyUses) ? d.alchemyUses : [],
    forgingUses: Array.isArray(d.forgingUses) ? d.forgingUses : [],
    sources: Array.isArray(d.sources) ? d.sources : [],
    alchemyCraft: Array.isArray(d.alchemyCraft) ? d.alchemyCraft : [],
    forgingDiagram: diagram,
    forgingIngredients: Array.isArray(d.forgingIngredients) ? d.forgingIngredients : [],
  };
}

function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function linkedName(item: { name: string; href?: string }): string {
  const name = escapeHtml(item.name.trim());
  const href = item.href?.trim();
  return href ? `<a href="${escapeHtml(href)}">${name}</a>` : name;
}

/** Список со ссылками: A; A и B; A, B и C. */
function formatLinkedList(items: { name: string; href?: string }[]): string {
  const named = items.filter((c) => c.name.trim());
  if (named.length === 0) return "";
  if (named.length === 1) return linkedName(named[0]);
  if (named.length === 2) return `${linkedName(named[0])} и ${linkedName(named[1])}`;
  const head = named.slice(0, -1).map(linkedName).join(", ");
  return `${head} и ${linkedName(named[named.length - 1])}`;
}

/** Текст «кому подойдёт» со ссылками из списка персонажей. */
export function buildWeaponRecommendedIntro(
  weaponName: string,
  characters: { name: string; href?: string }[],
): string {
  const links = formatLinkedList(characters);
  if (!links) return "";
  const wName = escapeHtml(weaponName.trim() || "Оружие");
  return `Оружие ${wName} может быть полезно персонажам: ${links}.`;
}

/** Текст «улучшаемые персонажи» со ссылками из списка. */
export function buildMaterialCharactersIntro(
  materialName: string,
  characters: { name: string; href?: string }[],
): string {
  const links = formatLinkedList(characters);
  if (!links) {
    return materialName.trim()
      ? `Материал ${escapeHtml(materialName.trim())} используется для улучшения следующих персонажей:`
      : "Материал используется для улучшения следующих персонажей:";
  }
  const mName = escapeHtml(materialName.trim() || "материал");
  return `Материал ${mName} используется для улучшения следующих персонажей: ${links}.`;
}

/** Текст «рецепты ковки» со ссылкой на диаграмму. */
export function buildMaterialForgingIntro(
  materialName: string,
  diagram: { name: string; href?: string },
): string {
  const mName = escapeHtml(materialName.trim() || "материал");
  const diagramName = diagram.name.trim();
  if (!diagramName) {
    return `Материал ${mName} можно получить в процессе ковки, материалы для создания приведены ниже`;
  }
  return `Материал ${mName} можно получить в процессе ковки используя ${linkedName(diagram)}, материалы для создания приведены ниже`;
}

/** Текст «возвышаемое оружие». */
export function buildMaterialWeaponsIntro(materialName: string): string {
  const mName = escapeHtml(materialName.trim() || "материал");
  return `Материал ${mName} нужен для улучшения следующего оружия`;
}

/** Текст «создание материалов» в чайнике. */
export function buildMaterialTeapotIntro(materialName: string): string {
  const mName = escapeHtml(materialName.trim() || "материал");
  return `Материал ${mName} может быть применён для создания следующих предметов`;
}

/** Текст «применение в ковке». */
export function buildMaterialForgingUseIntro(materialName: string): string {
  const mName = escapeHtml(materialName.trim() || "материал");
  return `Материал ${mName} может быть использован в кузнице для создания следующих предметов`;
}

export function hasForgingRecipe(data: MaterialGuideData): boolean {
  return (
    Boolean(data.forgingDiagram?.name?.trim()) ||
    data.forgingIngredients.some((m) => m.name.trim() || m.image)
  );
}

export function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Убрать HTML из описания для короткого лора в превью. */
export function plainLore(htmlOrText?: string | null, maxLen = 220): string {
  if (!htmlOrText?.trim()) return "";
  const text = htmlOrText
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen).trim()}…`;
}
