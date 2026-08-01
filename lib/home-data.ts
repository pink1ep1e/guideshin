import { withPrisma } from "@/prisma/prisma-client";
import {
  DEFAULT_DAILY_TIPS,
  PROMO_CODES as FALLBACK_PROMOS,
} from "@/lib/home-content";
import { ELEMENT_SVG } from "@/lib/genshin";

export type HomeBannerItem = {
  image: string;
  icon: string;
  name: string;
  element: string;
  elementImg: string;
  slug: string;
  role: string;
  text: string;
  rarity: 4 | 5;
  half: "first" | "second";
};

export type HomePromo = {
  id?: number;
  code: string;
  reward: string;
  expiresAt: string | null;
};

export type HomeTip = {
  title: string;
  body: string;
};

const DEFAULT_BANNERS: HomeBannerItem[] = [
  {
    half: "first",
    image: "/characters-splash/Odetta.webp",
    icon: "/images/mini-characters/Odette.webp",
    name: "Одетта",
    element: "cryo",
    elementImg: ELEMENT_SVG.CRYO,
    slug: "odetta",
    role: "ДПС · Крио",
    text: "Новая крио-героиня. Сильный урон и контроль поля — достойный фокус текущей молитвы.",
    rarity: 5,
  },
  {
    half: "first",
    image: "/images/home/chars/bennett.webp",
    icon: "/images/mini-characters/bennett.webp",
    name: "Беннет",
    element: "pyro",
    elementImg: ELEMENT_SVG.PYRO,
    slug: "bennett",
    role: "Саппорт · Пиро",
    text: "Король баффов. Ульта поднимает атаку всей пачке — мастхэв почти для любой команды.",
    rarity: 4,
  },
  {
    half: "second",
    image: "/images/home/chars/klee.webp",
    icon: "/images/mini-characters/klee.webp",
    name: "Кли",
    element: "pyro",
    elementImg: ELEMENT_SVG.PYRO,
    slug: "klee",
    role: "ДПС · Пиро",
    text: "Искорка Мондштадта. Взрывной пиро-дамагер с уникальным геймплеем и огромным потенциалом.",
    rarity: 5,
  },
  {
    half: "second",
    image: "/images/home/chars/candace.webp",
    icon: "/images/mini-characters/Candace.webp",
    name: "Кандакия",
    element: "hydro",
    elementImg: ELEMENT_SVG.HYDRO,
    slug: "candace",
    role: "Саппорт · Гидро",
    text: "Страж Аару. Даёт гидро-инфузию и бафф урона — отличный саппорт для драйверов.",
    rarity: 4,
  },
];

function elementImg(el: string) {
  return ELEMENT_SVG[el.toUpperCase()] || ELEMENT_SVG.PYRO;
}

export async function loadHomeBanners(): Promise<{
  first: HomeBannerItem[];
  second: HomeBannerItem[];
}> {
  try {
    const rows = await withPrisma((prisma) =>
      prisma.homeBannerSlide.findMany({
        where: { published: true },
        orderBy: [{ half: "asc" }, { order: "asc" }, { id: "asc" }],
      }),
    );
    if (rows.length === 0) {
      return {
        first: DEFAULT_BANNERS.filter((b) => b.half === "first"),
        second: DEFAULT_BANNERS.filter((b) => b.half === "second"),
      };
    }
    const mapped: HomeBannerItem[] = rows.map((r) => ({
      half: r.half === "second" ? "second" : "first",
      name: r.name,
      slug: r.slug,
      role: r.role,
      element: r.element.toLowerCase(),
      elementImg: elementImg(r.element),
      rarity: (r.rarity >= 5 ? 5 : 4) as 4 | 5,
      text: r.text,
      image: r.image,
      icon: r.icon,
    }));
    return {
      first: mapped.filter((b) => b.half === "first"),
      second: mapped.filter((b) => b.half === "second"),
    };
  } catch {
    return {
      first: DEFAULT_BANNERS.filter((b) => b.half === "first"),
      second: DEFAULT_BANNERS.filter((b) => b.half === "second"),
    };
  }
}

export async function loadPromoCodes(): Promise<HomePromo[]> {
  try {
    const rows = await withPrisma((prisma) =>
      prisma.promoCode.findMany({
        where: { published: true },
        orderBy: [{ order: "asc" }, { id: "asc" }],
      }),
    );
    if (rows.length === 0) {
      return FALLBACK_PROMOS.map((p) => ({
        code: p.code,
        reward: p.reward,
        expiresAt: p.expiresAt,
      }));
    }
    return rows.map((r) => ({
      id: r.id,
      code: r.code,
      reward: r.reward,
      expiresAt: r.expiresAt ? r.expiresAt.toISOString() : null,
    }));
  } catch {
    return FALLBACK_PROMOS.map((p) => ({
      code: p.code,
      reward: p.reward,
      expiresAt: p.expiresAt,
    }));
  }
}

/** Совет дня: по дню года из опубликованных, иначе из дефолтного списка. */
export async function loadDailyTip(): Promise<HomeTip> {
  const dayIndex = Math.floor(Date.now() / 86_400_000);
  try {
    const rows = await withPrisma((prisma) =>
      prisma.dailyTip.findMany({
        where: { published: true },
        orderBy: [{ order: "asc" }, { id: "asc" }],
      }),
    );
    if (rows.length > 0) {
      const tip = rows[dayIndex % rows.length];
      return { title: tip.title, body: tip.body };
    }
  } catch {
    /* fallback */
  }
  const tip = DEFAULT_DAILY_TIPS[dayIndex % DEFAULT_DAILY_TIPS.length];
  return { title: tip.title, body: tip.body };
}

export { DEFAULT_BANNERS };
