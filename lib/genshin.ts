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
    hover: "#d96228",
    soft: "rgba(239,115,51,0.14)",
    softHover: "rgba(239,115,51,0.24)",
    accent: "#c45a1f",
    onSolid: "#ffffff",
    glow: "rgba(239,115,51,0.45)",
  },
  HYDRO: {
    solid: "#4cc2f1",
    hover: "#2aabd9",
    soft: "rgba(76,194,241,0.16)",
    softHover: "rgba(76,194,241,0.28)",
    accent: "#1a7aa8",
    onSolid: "#ffffff",
    glow: "rgba(76,194,241,0.45)",
  },
  ANEMO: {
    solid: "#63c6a5",
    hover: "#4aaf8e",
    soft: "rgba(99,198,165,0.16)",
    softHover: "rgba(99,198,165,0.28)",
    accent: "#2a8f74",
    onSolid: "#ffffff",
    glow: "rgba(99,198,165,0.45)",
  },
  ELECTRO: {
    solid: "#bf7fdb",
    hover: "#a666c4",
    soft: "rgba(191,127,219,0.16)",
    softHover: "rgba(191,127,219,0.28)",
    accent: "#8a4aa8",
    onSolid: "#ffffff",
    glow: "rgba(191,127,219,0.45)",
  },
  DENDRO: {
    solid: "#a5c83b",
    hover: "#8aab28",
    soft: "rgba(165,200,59,0.18)",
    softHover: "rgba(165,200,59,0.3)",
    accent: "#5f7a1a",
    onSolid: "#ffffff",
    glow: "rgba(165,200,59,0.45)",
  },
  CRYO: {
    solid: "#a5e3f0",
    hover: "#7fd4e6",
    soft: "rgba(165,227,240,0.26)",
    softHover: "rgba(165,227,240,0.4)",
    accent: "#3a8fa0",
    onSolid: "#0b1f44",
    glow: "rgba(165,227,240,0.55)",
  },
  GEO: {
    solid: "#f7b93e",
    hover: "#dfa028",
    soft: "rgba(247,185,62,0.18)",
    softHover: "rgba(247,185,62,0.3)",
    accent: "#b07a18",
    onSolid: "#0b1f44",
    glow: "rgba(247,185,62,0.45)",
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
