export type ElementKey =
  | "PYRO"
  | "HYDRO"
  | "ANEMO"
  | "ELECTRO"
  | "DENDRO"
  | "CRYO"
  | "GEO";

export const ELEMENT_ICON: Record<string, string> = {
  PYRO: "/images/elements/mini-pyro.png",
  HYDRO: "/images/elements/mini-hydro.png",
  ANEMO: "/images/elements/mini-anemo.png",
  ELECTRO: "/images/elements/mini-electro.png",
  DENDRO: "/images/elements/mini-dendro.png",
  CRYO: "/images/elements/mini-cryo.png",
  GEO: "/images/elements/mini-geo.png",
};

export const ELEMENT_SVG: Record<string, string> = {
  PYRO: "/images/default-elements/Pyro.svg",
  HYDRO: "/images/default-elements/Hydro.svg",
  ANEMO: "/images/default-elements/Anemo.svg",
  ELECTRO: "/images/default-elements/Electro.svg",
  DENDRO: "/images/default-elements/Dendro.svg",
  CRYO: "/images/default-elements/Cryo.svg",
  GEO: "/images/default-elements/Geo.svg",
};

export const ELEMENT_LABEL: Record<string, string> = {
  PYRO: "Пиро",
  HYDRO: "Гидро",
  ANEMO: "Анемо",
  ELECTRO: "Электро",
  DENDRO: "Дендро",
  CRYO: "Крио",
  GEO: "Гео",
};

export const RARITY_LABEL: Record<string, string> = {
  LEGEND: "5★",
  EPIC: "4★",
  RARE: "3★",
  COMMON: "2★",
};

export const RARITY_STARS: Record<string, 1 | 2 | 3 | 4 | 5> = {
  LEGEND: 5,
  EPIC: 4,
  RARE: 3,
  COMMON: 2,
};

/** Фон карточки предмета по числу звёзд (1–5). */
export function rarityBg(stars: number): string {
  if (stars >= 5) return "/images/legend-bg.jpg";
  if (stars >= 4) return "/images/epic-bg.jpg";
  if (stars >= 3) return "/images/rare-bg.jpg";
  if (stars >= 2) return "/images/common-bg.jpg";
  return "/images/default-bg.jpg";
}

export function rarityStarsFromEnum(rarity: string): number {
  return RARITY_STARS[rarity] ?? 4;
}

/** Сравнение: сначала легендарные (5★), потом ниже по редкости. */
export function compareRarityDesc(
  a: number | string | null | undefined,
  b: number | string | null | undefined,
): number {
  const starsA =
    typeof a === "number" ? a : typeof a === "string" ? rarityStarsFromEnum(a) : 0;
  const starsB =
    typeof b === "number" ? b : typeof b === "string" ? rarityStarsFromEnum(b) : 0;
  return starsB - starsA;
}

/** Сортировка массива по редкости (легендарные → обычные), затем по имени. */
export function sortByRarityDesc<T>(
  items: T[],
  getRarity: (item: T) => number | string | null | undefined,
  getName?: (item: T) => string,
): T[] {
  return [...items].sort((a, b) => {
    const byRarity = compareRarityDesc(getRarity(a), getRarity(b));
    if (byRarity !== 0) return byRarity;
    if (getName) return getName(a).localeCompare(getName(b), "ru");
    return 0;
  });
}

export type ElementTheme = {
  solid: string;
  hover: string;
  soft: string;
  softHover: string;
  accent: string;
  onSolid: string;
  glow: string;
};

export const ELEMENT_THEME: Record<ElementKey, ElementTheme> = {
  PYRO: {
    solid: "#ef7333",
    hover: "#ff8a4a",
    soft: "rgba(239,115,51,0.14)",
    softHover: "rgba(239,115,51,0.24)",
    accent: "#d46528",
    onSolid: "#1b1b22",
    glow: "rgba(239,115,51,0.28)",
  },
  HYDRO: {
    solid: "#4cc2f1",
    hover: "#6dd0f5",
    soft: "rgba(76,194,241,0.16)",
    softHover: "rgba(76,194,241,0.28)",
    accent: "#2a9bc8",
    onSolid: "#1b1b22",
    glow: "rgba(76,194,241,0.28)",
  },
  ANEMO: {
    solid: "#63c6a5",
    hover: "#7dd4b5",
    soft: "rgba(99,198,165,0.16)",
    softHover: "rgba(99,198,165,0.28)",
    accent: "#3a9f82",
    onSolid: "#1b1b22",
    glow: "rgba(99,198,165,0.28)",
  },
  ELECTRO: {
    solid: "#bf7fdb",
    hover: "#d09aeb",
    soft: "rgba(191,127,219,0.16)",
    softHover: "rgba(191,127,219,0.28)",
    accent: "#a66bc4",
    onSolid: "#1b1b22",
    glow: "rgba(191,127,219,0.28)",
  },
  DENDRO: {
    solid: "#a5c83b",
    hover: "#b8d85a",
    soft: "rgba(165,200,59,0.18)",
    softHover: "rgba(165,200,59,0.3)",
    accent: "#7a9a28",
    onSolid: "#1b1b22",
    glow: "rgba(165,200,59,0.28)",
  },
  CRYO: {
    solid: "#a5e3f0",
    hover: "#c0eef7",
    soft: "rgba(165,227,240,0.22)",
    softHover: "rgba(165,227,240,0.36)",
    accent: "#5eb0c2",
    onSolid: "#1b1b22",
    glow: "rgba(165,227,240,0.32)",
  },
  GEO: {
    solid: "#f7b93e",
    hover: "#ffcb66",
    soft: "rgba(247,185,62,0.18)",
    softHover: "rgba(247,185,62,0.3)",
    accent: "#c9922a",
    onSolid: "#1b1b22",
    glow: "rgba(247,185,62,0.28)",
  },
};

export function getElementTheme(element: string): ElementTheme {
  const key = element.toUpperCase() as ElementKey;
  return ELEMENT_THEME[key] ?? ELEMENT_THEME.ANEMO;
}

/** Splash art: поле из БД, иначе автопуть только для стоковых иконок в /images/. */
export function resolveCharacterSplash(
  image: string,
  splashImage?: string | null,
): string {
  if (splashImage?.trim()) return splashImage.trim();
  if (!image) return "";

  // Загрузки из /uploads/ не маппятся на splesh-atrs по имени файла
  if (image.includes("/uploads/")) return image;

  const file = image.split("/").pop();
  if (!file) return image;

  if (image.startsWith("/images/")) {
    return `/images/splesh-atrs/${file}`;
  }

  return image;
}
