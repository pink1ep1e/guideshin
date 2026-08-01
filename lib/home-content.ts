/**
 * Контент и пути ассетов главной.
 * Файлы скопированы из public/genshin assets → public/images/home/
 */
export const HOME_ASSETS = {
  heroBg: "/images/home/hero-bg.jpg",
  featureWide: "/images/home/feature-wide.jpg",
  featureSide: "/images/home/feature-side.jpg",
  ctaBanner: "/images/home/cta-banner.jpg",
  sidebarBanner: "/images/home/sidebar-banner.jpg",
  offerArt: "/images/home/offer-art.jpg",
  mascot: "/images/home/chars/mualani-chibi.webp",
  mascotAlt: "/images/home/chars/chibi-2.webp",
  duoChibi: "/images/home/chars/chibi-3.webp",
  regions: {
    mondstadt: "/images/home/regions/mondstadt.jpg",
    liyue: "/images/home/regions/liyue.jpg",
    inazuma: "/images/home/regions/inazuma.jpg",
    sumeru: "/images/home/regions/sumeru.jpg",
    fontaine: "/images/home/regions/fontaine.jpg",
    natlan: "/images/home/offer-art.jpg",
    nodkrai: "/images/home/hero-bg.jpg",
    snezhnaya: "/images/home/feature-side.jpg",
  },
  chars: {
    fischl: "/images/home/chars/fischl.webp",
    bennett: "/images/home/chars/bennett.webp",
    klee: "/images/home/chars/klee.webp",
    candace: "/images/home/chars/candace.webp",
    dahlia: "/images/home/chars/dahlia.webp",
    aino: "/images/home/chars/aino.webp",
    lauma: "/images/home/chars/lauma.webp",
    ineffa: "/images/home/chars/ineffa.webp",
  },
} as const;

export const OFFERS = [
  {
    tag: "Молитвы",
    title: "Актуальный баннер",
    text: "Кого крутить сейчас и стоит ли жать гарант",
    href: "/wiki/characters",
    accent: "from-[#0a4cff] to-[#3d8bff]",
    art: HOME_ASSETS.offerArt,
  },
  {
    tag: "Прокачка",
    title: "Материалы Ascension",
    text: "Куда бежать за книгами, боссами и цветами",
    href: "#",
    accent: "from-[#0d8f7a] to-[#2bc4a8]",
    art: HOME_ASSETS.regions.sumeru,
  },
  {
    tag: "Бездна",
    title: "Спиральная бездна",
    text: "Команды и ротации под текущий цикл",
    href: "#",
    accent: "from-[#1a3a8f] to-[#6a5cff]",
    art: HOME_ASSETS.sidebarBanner,
  },
  {
    tag: "Ивенты",
    title: "События версии",
    text: "Награды, дедлайны и что не пропустить",
    href: "#",
    accent: "from-[#0b1f44] to-[#1e5fd6]",
    art: HOME_ASSETS.regions.fontaine,
  },
] as const;

export const REGIONS = [
  {
    name: "Мондштадт",
    desc: "Анемо, свобода и ранний прогресс",
    href: "/wiki/characters",
    asset: HOME_ASSETS.regions.mondstadt,
  },
  {
    name: "Ли Юэ",
    desc: "Гео, контракты и сильные саппорты",
    href: "/wiki/characters",
    asset: HOME_ASSETS.regions.liyue,
  },
  {
    name: "Инадзума",
    desc: "Электро, острова и сложный мир",
    href: "/wiki/characters",
    asset: HOME_ASSETS.regions.inazuma,
  },
  {
    name: "Сумеру",
    desc: "Дендро, реакции и Академия",
    href: "/wiki/characters",
    asset: HOME_ASSETS.regions.sumeru,
  },
  {
    name: "Фонтейн",
    desc: "Гидро, механика и суд",
    href: "/wiki/characters",
    asset: HOME_ASSETS.regions.fontaine,
  },
  {
    name: "Натлан",
    desc: "Пиро, племена и война",
    href: "/wiki/characters",
    asset: HOME_ASSETS.regions.natlan,
  },
  {
    name: "Нодкрай",
    desc: "Новый регион на севере",
    href: "/wiki/characters",
    asset: HOME_ASSETS.regions.nodkrai,
  },
  {
    name: "Снежная",
    desc: "Крио, Царица и Фатуи",
    href: "/wiki/characters",
    asset: HOME_ASSETS.regions.snezhnaya,
  },
] as const;

export const QUICK_GUIDES = [
  {
    title: "С чего начать новичку",
    text: "Первые 20 часов: кого качать, куда тратить смолу и как не ошибиться с ресурсами.",
    href: "#",
    meta: "Гайд · 8 мин",
  },
  {
    title: "Как собирать артефакты",
    text: "Домены, приоритет статов и когда пора остановиться, а не фармить вечно.",
    href: "/wiki/artifacts",
    meta: "Гайд · 6 мин",
  },
  {
    title: "Ротации и энергия",
    text: "Простая схема: кто ставит бафф, кто бьёт, как не терять урон между ультами.",
    href: "#",
    meta: "Гайд · 5 мин",
  },
] as const;

export const PROMO_CODES = [
  { code: "GENSHINGIFT", reward: "Примогемы и ресурсы", expiresAt: null as string | null },
  { code: "GS6P4L8Q9M", reward: "Камни истока", expiresAt: null as string | null },
  { code: "TT7N2K5X1R", reward: "Опыт героя", expiresAt: null as string | null },
];

export const DEFAULT_DAILY_TIPS = [
  {
    title: "Не тратьте смолу впустую",
    body: "Сначала таланты и оружие ключевых DPS, артефакты — когда состав команды уже ясен.",
  },
  {
    title: "Книги талантов по дням",
    body: "Планируйте домены талантов заранее: каждый набор книг доступен только в определённые дни недели.",
  },
  {
    title: "Гарант и 50/50",
    body: "Перед круткой проверьте гарант: если прошлый 5★ был стандартный — следующий ивентовый почти наверняка ваш.",
  },
  {
    title: "Еда и зелья",
    body: "Перед сложным контентом используйте еду на атаку/крит и зелья стихии — это бесплатный прирост урона.",
  },
  {
    title: "Смола и боссы",
    body: "Если не хватает материалов возвышения, приоритет — еженедельные и обычные боссы, а не бесконечный фарм артефактов.",
  },
  {
    title: "Сигнатура не всегда must-have",
    body: "Часто хороший 4★ или оружие из ивента закрывает 80–90% силы сигнатурки — не разоряйтесь без нужды.",
  },
  {
    title: "Энергия в ротации",
    body: "Следите за восстановлением энергии саппортов: без ульт команда теряет половину урона, даже с идеальными артефактами.",
  },
  {
    title: "Исследование региона",
    body: "Открывайте статуи и телепорты в новом регионе сразу — экономите часы на фармах и заданиях Архонтов.",
  },
] as const;

export const ELEMENTS = [
  { key: "pyro", label: "Пиро", icon: "/images/elements/mini-pyro.png", color: "bg-el-pyro/15 text-el-pyro ring-el-pyro/30" },
  { key: "hydro", label: "Гидро", icon: "/images/elements/mini-hydro.png", color: "bg-el-hydro/15 text-[#1a7aa8] ring-el-hydro/40" },
  { key: "anemo", label: "Анемо", icon: "/images/elements/mini-anemo.png", color: "bg-el-anemo/15 text-[#2a8f74] ring-el-anemo/40" },
  { key: "electro", label: "Электро", icon: "/images/elements/mini-electro.png", color: "bg-el-electro/15 text-[#8a4aa8] ring-el-electro/40" },
  { key: "dendro", label: "Дендро", icon: "/images/elements/mini-dendro.png", color: "bg-el-dendro/20 text-[#5f7a1a] ring-el-dendro/40" },
  { key: "cryo", label: "Крио", icon: "/images/elements/mini-cryo.png", color: "bg-el-cryo/20 text-[#3a8fa0] ring-el-cryo/40" },
  { key: "geo", label: "Гео", icon: "/images/elements/mini-geo.png", color: "bg-el-geo/20 text-[#b07a18] ring-el-geo/40" },
] as const;

export const PRODUCTS = [
  {
    href: "/wiki/characters",
    title: "Персонажи",
    text: "Билды, таланты и материалы",
    className: "from-[#0a4cff] to-[#2f7bff]",
    art: HOME_ASSETS.chars.fischl,
  },
  {
    href: "#",
    title: "Тир-листы",
    text: "Рейтинги под актуальный мету",
    className: "from-[#0d8f7a] to-[#1db8a0]",
    art: HOME_ASSETS.chars.bennett,
  },
  {
    href: "/map",
    title: "Карта мира",
    text: "Сундуки, боссы и секреты",
    className: "from-[#0b1f44] to-[#1e5fd6]",
    art: HOME_ASSETS.chars.candace,
  },
  {
    href: "/wiki/artifacts",
    title: "Артефакты",
    text: "Сеты и рекомендации по ролям",
    className: "from-[#1a3a8f] to-[#4b6fff]",
    art: "/images/mini-artifacts/Zolotaya-truppa.webp",
  },
] as const;
