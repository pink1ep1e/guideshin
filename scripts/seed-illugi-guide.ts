/**
 * Импорт гайда на Иллуги.
 *
 *   npx tsx scripts/templates/fetch-guide-sources.ts   # CONFIG уже под illugi
 *   npx tsx scripts/seed-illugi-guide.ts
 *
 * НЕ трогаем image / splashImage.
 * Таланты/консты — из scripts/_cache/illugi/yatta-extracted.json (RU).
 */
import fs from "fs";
import path from "path";
import { PrismaClient, Rarity, Element } from "@prisma/client";
import {
  type GuideBlock,
  type GuideRankedItem,
  type GuideTeamMember,
  type GuideTeamVariant,
  type GuideRoleRow,
  type GuideSetPlanRow,
  serializeGuide,
  uid,
  emptyStatsRow,
} from "@/lib/guide-builder";
import { ELEMENT_SVG } from "@/lib/genshin";
import type { CharacterMaterial } from "@/lib/character-materials";
import {
  createMissingLog,
  makeRankedHelpers,
  findChar,
  findWeapon,
  findArt,
  findMat,
  elLabel,
  elIcon,
  rarityStars,
  STUB_IMAGE,
  type CharRow,
  type WeaponRow,
  type ArtifactRow,
  type MatRow,
} from "./lib/seed-guide-helpers";

const prisma = new PrismaClient();

const SLUG = "illugi";
const NAME = "Иллуги";
const CACHE = path.join(process.cwd(), "scripts", "_cache", SLUG);

const { missingLog, noteMissing } = createMissingLog();
const { rankedWeapon, rankedArt, teamMember, matCard, artImg } = makeRankedHelpers(noteMissing);

type Extracted = {
  talents: Record<string, { name: string; description: string; rows: { label: string; values: string[] }[] }>;
  constellations: Record<string, { name: string; description: string }>;
};

function loadExtracted(): Extracted {
  const p = path.join(CACHE, "yatta-extracted.json");
  if (!fs.existsSync(p)) throw new Error(`Нет ${p}`);
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

async function main() {
  const existing = await prisma.character.findUnique({
    where: { slug: SLUG },
    select: { id: true, slug: true, name: true, image: true },
  });
  const IMAGE = existing?.image || "";

  const [chars, weapons, artifacts, materials] = await Promise.all([
    prisma.character.findMany({
      select: { id: true, name: true, slug: true, image: true, element: true, rarity: true },
    }),
    prisma.weapon.findMany({ select: { name: true, slug: true, image: true, rarity: true } }),
    prisma.artifact.findMany({ select: { name: true, slug: true, image: true, rarity: true } }),
    prisma.material.findMany({
      select: { name: true, slug: true, image: true, rarityStars: true, category: true },
    }),
  ]);

  const charBySlug = new Map(chars.map((c) => [c.slug, c as CharRow]));
  const charByName = new Map(chars.map((c) => [c.name.toLowerCase(), c as CharRow]));
  const weaponByName = new Map(weapons.map((w) => [w.name.toLowerCase(), w as WeaponRow]));
  const artByName = new Map(artifacts.map((a) => [a.name.toLowerCase(), a as ArtifactRow]));
  const mats = materials as MatRow[];

  const c = (...keys: string[]) => findChar(charBySlug, charByName, ...keys);
  const w = (...names: string[]) => findWeapon(weaponByName, ...names);
  const a = (...names: string[]) => findArt(artByName, ...names);
  const m = (...names: string[]) => findMat(mats, ...names);

  const member = (ch: CharRow | undefined, fallback: string, role?: string) =>
    teamMember(ch, fallback, role);

  const self = (role?: string): GuideTeamMember => ({
    id: uid(),
    name: NAME,
    image: IMAGE,
    elementIcon: ELEMENT_SVG.GEO,
    rarity: 4,
    href: `/wiki/characters/${SLUG}`,
    role,
  });

  const planRow = (
    ch: CharRow | undefined,
    fallback: string,
    setName: string,
    setImage: string,
  ): GuideSetPlanRow => ({
    id: uid(),
    name: ch?.name || fallback,
    image: ch?.image || "",
    href: ch ? `/wiki/characters/${ch.slug}` : undefined,
    setName,
    setImage,
  });

  const artSerenada = a("Серенада шёлковой луны", "Серенада шелковой луны");
  const artInstruktor = a("Инструктор");
  const artIzgnannik = a("Изгнанник");
  const artStranstv = a("Странствующий ансамбль");
  const artPozol = a("Позолоченные сны");
  const artCvetok = a("Цветок потерянного рая");
  const artNoch = a("Ночь открытия неба");
  const artRassvet = a("Рассветная песнь звезды и луны");
  const artEmblem = a("Эмблема рассечённой судьбы", "Эмблема рассеченной судьбы");

  const weaponItems: GuideRankedItem[] = [
    rankedWeapon(
      w("Копьё Фавония", "Копье Фавония"),
      1,
      "Копьё Фавония",
      "Универсал · ВЭ",
      "Крит. попадания с шансом создают частицы энергии (откат по рангу).",
      "Лучший универсал: чаще ульта самому и подпитывает союзников. Ищите К/Ш в сабах (~50%+).",
      "S",
    ),
    rankedWeapon(
      w("Баллада фьордов", "Баллада фьердов"),
      2,
      "Баллада фьордов",
      "МС · 3 стихии",
      "При ≥3 разных элементах в отряде даёт большой бонус МС.",
      "Сильный МС на R4–R5, если третий слот — не Гидро/Гео (Ягода, Сахароза и т.п.).",
      "A",
    ),
    rankedWeapon(
      w("Гроза драконов"),
      3,
      "Гроза драконов",
      "МС",
      "Бонус урона по врагам под Гидро/Пиро.",
      "Берём ради МС: личный урон Иллуги слабый, пассивка почти не важна.",
      "A",
    ),
    rankedWeapon(
      w("Крест-копьё Китаин", "Крест-копье Китаин"),
      4,
      "Крест-копьё Китаин",
      "Бюджет · МС / ВЭ",
      "Бафф Е и возврат энергии после её попадания (в т.ч. из кармана).",
      "Крафт для новичков: МС + снижение требований к ВЭ. Сначала Q, потом E.",
      "B",
    ),
    rankedWeapon(
      w("Небесная ось"),
      5,
      "Небесная ось",
      "ВЭ · легендарка",
      "Много ВЭ и К/Ш; пассивка на обычные почти бесполезна.",
      "Только если остро не хватает ВЭ и нет Фавония.",
      "C",
    ),
  ];

  const artItems: GuideRankedItem[] = [
    rankedArt(
      artSerenada,
      1,
      "Серенада шёлковой луны",
      "Топ-1 · 4п",
      "2п +20% ВЭ; 4п — МС отряду и усиление Лунных реакций при знамении.",
      "Лучший сет: ВЭ + бафф МС команде. Часы на МС, ВЭ добирается 2п и сабами.",
      "S",
    ),
    rankedArt(
      artInstruktor,
      2,
      "Инструктор",
      "4★ · 4п",
      "2п +80 МС; 4п — +120 МС отряду на 8 сек. после реакции.",
      "Лучший эпик. Нужен Гидро-статус на враге, чтобы триггерить сет.",
      "A",
    ),
    rankedArt(
      artIzgnannik,
      3,
      "Изгнанник",
      "Старт · ВЭ",
      "2п +20% ВЭ; 4п — энергия союзникам после ульты.",
      "На низких рангах, пока не хватает ВЭ себе и команде.",
      "B",
    ),
    rankedArt(
      artStranstv || artPozol || artCvetok || artNoch || artRassvet,
      4,
      "2+2 МС",
      "Временный 2+2",
      "Каждые 2 части: +80 МС.",
      "Максимум МС для размера баффа, пока нет 4п Серенады.",
      "B",
    ),
  ];
  if (artItems[3]) artItems[3].name = "2+2 МС (Странствующий / Позолоченные / Цветок / Ночь / Рассвет)";

  const matShaft1 = m("Сломанный вал");
  const matShaft2 = m("Усиленный вал");
  const matShaft3 = m("Высокоточный вал");
  const matBook1 = m("Учения о «Рае»");
  const matBook2 = m("Указания о «Рае»");
  const matBook3 = m("Философия о «Рае»");
  const matTop1 = m("Осколок топаза Притхива", "Осколок топаза");
  const matTop2 = m("Фрагмент топаза Притхива", "Фрагмент топаза");
  const matTop3 = m("Кусок топаза Притхива", "Кусок топаза");
  const matTop4 = m("Драгоценный топаз Притхива", "Драгоценный топаз");
  const matBoss = m("Циклическое военное ядро куувяки");
  const matAmber = m("Сосновый янтарь");
  const matHorn = m("Истлевший рог");
  const matCrown = m("Корона прозрения");

  const roleRows: GuideRoleRow[] = [
    {
      id: uid(),
      name: c("czy-baj")?.name || "Цзы Бай",
      image: c("czy-baj")?.image || "",
      element: "Гео",
      elementIcon: ELEMENT_SVG.GEO,
      weapon: "Одноручный меч",
      weaponIcon: "",
      description: "Сигнатурный мейн-дд Лунного кристалла: полный бафф Соловьиной трели и столбы-конструкции.",
      href: c("czy-baj") ? `/wiki/characters/${c("czy-baj")!.slug}` : undefined,
      rarity: 5,
    },
    {
      id: uid(),
      name: c("kolombina")?.name || "Коломбина",
      image: c("kolombina")?.image || "",
      element: "Гидро",
      elementIcon: ELEMENT_SVG.HYDRO,
      weapon: "Катализатор",
      weaponIcon: "",
      description: "Конвертирует кристаллизацию в Лунный кристалл — открывает Иллуги для других Гео/Гидро дд.",
      href: c("kolombina") ? `/wiki/characters/${c("kolombina")!.slug}` : undefined,
      rarity: 5,
    },
    {
      id: uid(),
      name: c("albedo")?.name || "Альбедо",
      image: c("albedo")?.image || "",
      element: "Гео",
      elementIcon: ELEMENT_SVG.GEO,
      weapon: "Одноручный меч",
      weaponIcon: "",
      description: "Карманный урон + бафф МС; полезен в отрядах Цзы Бай без Коломбины.",
      href: c("albedo") ? `/wiki/characters/${c("albedo")!.slug}` : undefined,
      rarity: 5,
    },
    {
      id: uid(),
      name: c("gorou")?.name || "Горо",
      image: c("gorou")?.image || "",
      element: "Гео",
      elementIcon: ELEMENT_SVG.GEO,
      weapon: "Лук",
      weaponIcon: "",
      description: "Защита и Гео-баффы; С4 сильнее синергирует с баффом защиты Иллуги.",
      href: c("gorou") ? `/wiki/characters/${c("gorou")!.slug}` : undefined,
      rarity: 4,
    },
    {
      id: uid(),
      name: c("zhongli")?.name || "Чжун Ли",
      image: c("zhongli")?.image || "",
      element: "Гео",
      elementIcon: ELEMENT_SVG.GEO,
      weapon: "Копьё",
      weaponIcon: "",
      description: "Универсальный щит и резист-шред в премиум-пачках с Цзы Бай.",
      href: c("zhongli") ? `/wiki/characters/${c("zhongli")!.slug}` : undefined,
      rarity: 5,
    },
    {
      id: uid(),
      name: c("yagoda")?.name || "Ягода",
      image: c("yagoda")?.image || "",
      element: "Анемо",
      elementIcon: ELEMENT_SVG.ANEMO,
      weapon: "Лук",
      weaponIcon: "",
      description: "Закрывает условие Баллады фьордов и даёт полезный саппорт-слот.",
      href: c("yagoda") ? `/wiki/characters/${c("yagoda")!.slug}` : undefined,
      rarity: 4,
    },
  ];

  const teams: GuideTeamVariant[] = [
    {
      id: uid(),
      badge: "Премиум",
      features:
        "Цзы Бай + Иллуги + Коломбина + щит/flex. Шилонен желательно С2; иначе Горо С4 / Чжун Ли / Гидро-хил.",
      members: [
        member(c("czy-baj"), "Цзы Бай", "Мейн-дд"),
        self("Саппорт"),
        member(c("kolombina"), "Коломбина", "Гидро саб"),
        member(c("zhongli"), "Чжун Ли", "Щит / flex"),
      ],
    },
    {
      id: uid(),
      badge: "Гео саб",
      features:
        "Цзы Бай без Коломбины: Альбедо на МС + Кокоми (или Мона С1) на Гидро-статус.",
      members: [
        member(c("czy-baj"), "Цзы Бай", "Мейн-дд"),
        self("Саппорт"),
        member(c("albedo"), "Альбедо", "Гео саб"),
        member(c("kokomi", "кокоми"), "Кокоми", "Хил / Гидро"),
      ],
    },
    {
      id: uid(),
      badge: "Классика",
      features:
        "Итто / Гео-дд с Коломбиной: она конвертирует кристаллизацию — иначе Иллуги слабее профильных Гео-саппортов.",
      members: [
        member(c("itto", "итто"), "Итто", "Мейн-дд"),
        self("Саппорт"),
        member(c("gorou"), "Горо", "Бафф"),
        member(c("kolombina"), "Коломбина", "Гидро / конверт"),
      ],
    },
    {
      id: uid(),
      badge: "Гидро дд",
      features:
        "Нёвиллет + Иллуги + Альбедо + Коломбина. Самохил Нёвиллета закрывает хил-слот.",
      members: [
        member(c("neuvillette", "нёвиллет", "невиллет"), "Нёвиллет", "Мейн-дд"),
        self("Саппорт"),
        member(c("albedo"), "Альбедо", "Гео саб"),
        member(c("kolombina"), "Коломбина", "Гидро саб"),
      ],
    },
  ];

  const blocks: GuideBlock[] = [
    {
      id: uid(),
      type: "text",
      eyebrow: "Обзор",
      title: "Кто такой Иллуги",
      body: `Иллуги — **Гео копейщик 4★**, светоносец из **Нод-Края**. Роль — **карманный саппорт Лунного кристалла**: бафф Гео / ЛК через ульту, частицы с Е и **+1** к уровню **Лунного знамения**.

### Кратко
- **Рейтинг** — A
- **Стихия / оружие** — Гео · копьё
- **Возвышение** — мастерство стихий (**+96** на 90 ур.)
- **База на 90 ур.** — HP **11 962** · АТК **191** · Защита **814** · МС **96**
- **Добавлен** — патч **6.3** (баннер с Цзы Бай)
- **День рождения** — 23 декабря
- **Регион / фракция** — Нод-Край · Светоносцы
- **Созвездие** — Золотой Соловей
- **Особое блюдо** — Суп ночного дозора
- **Именная карточка** — Иллуги: Кошмарная певчая птица

С **Коломбиной** список команд шире: она конвертирует кристаллизацию в Лунный кристалл. Без неё ядро почти всегда — **Цзы Бай**.`,
    },
    {
      id: uid(),
      type: "prosCons",
      eyebrow: "Анализ",
      title: "Преимущества и недостатки",
      prosTitle: "Преимущества",
      consTitle: "Недостатки",
      pros: [
        "**Сигнатурный саппорт Лунного кристалла** — бафф защиты/МС-связки и усиление Гео через Соловьиную трель.",
        "**+1 к Знамению** — критично для большинства героев Лунного знака.",
        "Гибкие сеты: топ **Серенада** и сильный 4★ **Инструктор**.",
        "Мобильность: бафф не привязан к зоне; короткая ротация E → Q.",
        "Простые статы: в приоритете **МС** и **ВЭ%**, защита вторична.",
      ],
      cons: [
        "**Сам не создаёт** Лунную реакцию — только +1 к знамению и баффы.",
        "Узкий пул команд: сильнее всего с **Цзы Бай** и/или **Коломбиной**.",
        "Слабый личный урон; откаты Е и Q по **15** сек.",
      ],
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Билд",
      title: "Как собирать Иллуги",
      body: `Карманный баффер: быстрый прокаст перед мейн-дд. Фокус на **мастерстве стихий** (размер баффа) и **восстановлении энергии** (ульта по откату). Защиту можно не фармить специально — она чуть поднимает личный урон Е/Q, но почти не окупается.

Даже с **С1** держите запас ВЭ: стаки Соловьиной трели быстро тают в толпе, ульта должна быть готова снова.`,
    },
    {
      id: uid(),
      type: "statTargets",
      eyebrow: "Билд",
      title: "Рекомендуемые значения характеристик",
      intro: "Закройте МС и ВЭ — от них зависят бафф ульты и комфорт ротации.",
      targets: [
        {
          id: uid(),
          label: "МС",
          value: "650+",
          hint: "Размер баффа Соловьиной трели и пассивок",
        },
        {
          id: uid(),
          label: "ВЭ",
          value: "180%+ / 210%+",
          hint: "≈180% с двумя Гео; от 210%, если один Гео",
        },
        {
          id: uid(),
          label: "Защита",
          value: "~1000",
          hint: "Не в ущерб МС/ВЭ; можно игнорировать",
        },
        {
          id: uid(),
          label: "Криты",
          value: "не нужны",
          hint: "С Фавонием — К/Ш 50%+ в сабах",
        },
      ],
      slots: [
        { id: uid(), slot: "Пески", main: "МС / ВЭ%", subs: "ВЭ% · МС · Защита%" },
        { id: uid(), slot: "Кубок", main: "МС", subs: "ВЭ% · Защита%" },
        { id: uid(), slot: "Корона", main: "МС", subs: "ВЭ% · Защита%" },
      ],
    },
    {
      id: uid(),
      type: "rankedList",
      eyebrow: "Оружие",
      title: "Рейтинг оружия",
      intro: "Копья на **МС** или **ВЭ**. Личный урон почти не собираем.",
      kind: "weapons",
      items: weaponItems,
    },
    {
      id: uid(),
      type: "rankedList",
      eyebrow: "Артефакты",
      title: "Полезные артефакты",
      intro:
        "Цель — **4п Серенада шёлковой луны**. На старте — **Инструктор** или **2+2 МС**.",
      kind: "artifacts",
      items: artItems,
    },
    {
      id: uid(),
      type: "setPlan",
      eyebrow: "Артефакты",
      title: "Как раздать сеты в отряде Цзы Бай",
      intro: "Ориентир для Лунного кристалла с Иллуги как баффером.",
      groups: [
        {
          id: uid(),
          title: "Лунный кристалл · Цзы Бай",
          rows: [
            planRow(c("czy-baj"), "Цзы Бай", "Рассвет / Ночь (дд-сет)", artImg(artRassvet || artNoch, "Рассвет")),
            {
              id: uid(),
              name: NAME,
              image: IMAGE,
              href: `/wiki/characters/${SLUG}`,
              setName: "Серенада шёлковой луны",
              setImage: artImg(artSerenada, "Серенада шёлковой луны"),
            },
            planRow(c("kolombina"), "Коломбина", "Серенада / Рассвет", artImg(artSerenada || artRassvet, "Серенада")),
            planRow(c("zhongli"), "Чжун Ли", "Стойкость миллелита / Tenacity", artImg(a("Стойкость Миллелита", "Стойкость миллелита"), "Миллелит")),
          ],
        },
      ],
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Отряды",
      title: "Отряды под Лунный кристалл",
      body: `Нужны **≥3 Гидро или Гео** в отряде (включая Иллуги), чтобы раскрыть пассивку Соловьиной трели. Лучший мейн-дд — **Цзы Бай**; с **Коломбиной** можно ставить и классических Гео/Гидро дамагеров.

В «обычных» Гео-пачках без конверта реакции потенциал баффера сильно падает.`,
    },
    {
      id: uid(),
      type: "roleTable",
      eyebrow: "Отряды",
      title: "Приоритетные персонажи",
      intro: "Лучшие союзники для Иллуги:",
      rows: roleRows,
    },
    {
      id: uid(),
      type: "teamGroup",
      eyebrow: "Отряды",
      title: "Примеры сильных команд",
      intro: "Чаще всего ядро — Цзы Бай ± Коломбина.",
      variants: teams,
    },
    {
      id: uid(),
      type: "resourceTable",
      title: "Возвышение",
      intro: "Ресурсы для возвышения Иллуги (топаз Притхива + материалы Нод-Края):",
      rows: [
        {
          id: uid(),
          name: matTop1?.name || "Топаз Притхива",
          image: matTop1?.image || "",
          qty: "1→9→9→6",
          where: "Еженедельные и мировые боссы (серия топаза Притхива)",
          href: matTop1 ? `/wiki/materials/${matTop1.slug}` : undefined,
        },
        {
          id: uid(),
          name: matAmber?.name || "Сосновый янтарь",
          image: matAmber?.image || "",
          qty: "168",
          where: "Море Пустоты, Равнина Волногона",
          href: matAmber ? `/wiki/materials/${matAmber.slug}` : undefined,
        },
        {
          id: uid(),
          name: matBoss?.name || "Циклическое военное ядро куувяки",
          image: matBoss?.image || "",
          qty: "46",
          where: "Мировой босс: Сверхтяжелый сухопутный крейсер",
          href: matBoss ? `/wiki/materials/${matBoss.slug}` : undefined,
        },
        {
          id: uid(),
          name: "Валы сухопутных крейсеров",
          image: matShaft1?.image || "",
          qty: "18 / 30 / 36",
          where: "Сухопутные крейсеры Нод-Края",
          href: matShaft1 ? `/wiki/materials/${matShaft1.slug}` : undefined,
        },
      ],
    },
    {
      id: uid(),
      type: "materials",
      title: "Материалы прокачки",
      items: [
        {
          id: uid(),
          name: matBook1?.name || "Учения о «Рае»",
          image: matBook1?.image || "",
          rarity: 2 as const,
          note: "×3",
          qty: "3",
          href: matBook1 ? `/wiki/materials/${matBook1.slug}` : undefined,
        },
        {
          id: uid(),
          name: matBook2?.name || "Указания о «Рае»",
          image: matBook2?.image || "",
          rarity: 3 as const,
          note: "×21",
          qty: "21",
          href: matBook2 ? `/wiki/materials/${matBook2.slug}` : undefined,
        },
        {
          id: uid(),
          name: matBook3?.name || "Философия о «Рае»",
          image: matBook3?.image || "",
          rarity: 4 as const,
          note: "×38",
          qty: "38",
          href: matBook3 ? `/wiki/materials/${matBook3.slug}` : undefined,
        },
        {
          id: uid(),
          name: matHorn?.name || "Истлевший рог",
          image: matHorn?.image || "",
          rarity: 5 as const,
          note: "×6",
          qty: "6",
          href: matHorn ? `/wiki/materials/${matHorn.slug}` : undefined,
        },
        {
          id: uid(),
          name: matCrown?.name || "Корона прозрения",
          image: matCrown?.image || "",
          rarity: 5 as const,
          note: "×1",
          qty: "1",
          href: matCrown ? `/wiki/materials/${matCrown.slug}` : undefined,
        },
      ],
    },
    {
      id: uid(),
      type: "statsTable",
      title: "Характеристики при возвышении",
      intro:
        "Растёт **МС** (**+96** на 90 ур.). Добейте хотя бы **80/90** — от МС зависит качество баффа; до 90 и 95/100 не обязательно.",
      colLabels: [
        "Уровень",
        "Базовое HP",
        "Базовая сила атаки",
        "Базовая защита",
        "Базовый К/Ш",
        "МС (возвышение)",
      ],
      rows: [
        emptyStatsRow("1", "1 003", "16", "68", "5%", "0"),
        emptyStatsRow("20", "2 577", "41", "175", "5%", "0"),
        emptyStatsRow("40", "4 982", "80", "339", "5%", "0"),
        emptyStatsRow("50", "6 343", "101", "431", "5%", "24"),
        emptyStatsRow("60", "7 881", "126", "536", "5%", "48"),
        emptyStatsRow("70", "9 241", "148", "628", "5%", "48"),
        emptyStatsRow("80", "10 602", "169", "721", "5%", "72"),
        emptyStatsRow("90", "11 962", "191", "814", "5%", "96"),
      ],
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Геймплей",
      title: "Способности",
      body: `Главный навык — **ульта**: Соловьиная трель усиливает Гео и особенно урон **Лунного кристалла**. Е нужна в основном для частиц и редкого Гео-хита.

### Приоритет прокачки
**Q > E ≥ обычные** (обычные не качать; Е часто хватает 6 ур.).

### Активные
- **Копьё хранителя клятвы** — 4 удара копьём; заряженная — выпад; падение — урон по площади.
- **Рассветное пение иволги (Е)** — птица Аэдон: тап / удержание (прицел). Урон от **МС + защиты**. Откат **15** сек. В бою достаточно короткого нажатия.
- **Отражение без тени (Q)** — Гео по площади, **21** уровень Соловьиной трели (до **+15** от Гео-конструкций, макс. **36**). Бафф Гео / ЛК от **МС** на **20** сек. Энергия **60**, откат **15**. Столбы Лунного кристалла считаются конструкциями.

### Пассивки
- **Завет Литейщика факелов** — после Е/Q союзники: К/Ш Гео **+5%**, К/У Гео **+10%** на 20 сек.; при Высшем сиянии ещё **+50 МС**.
- **Сумерки охотника на демонов** — усиление Соловьиной трели от числа Гидро/Гео в отряде (сильнее на урон Лунного кристалла).
- **Дар лунного знамения: Не увядая зимой** — уровень Знамения **+1**.
- **Стремительность ночного дозорного** — ночью **+10%** скорости вне подземелий/Бездны.

### Созвездия
Лучшие — **С1**, **С4**, **С6**: энергия после Гео-реакций, **+200** защиты активному под ультой, усиление крит. массы Гео и МС от Клятвы светоносца.`,
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Геймплей",
      title: "Как играть и стоит ли выбивать",
      body: `### Ротация
**Статус саб-дд → Е Иллуги → Q → мейн-дд.** Через ~15 сек. снова Е для энергии и повтор Q.

### Итог
Узкий, но сильный саппорт **Лунного кристалла**. Без Цзы Бай / Коломбины ценность падает. Созвездия приятные, но не обязательные; сборка простая (эпик-копья + Серенада / Инструктор).

Имеет смысл мейнерам **Цзы Бай** и тем, кто уже собрал **Коломбину** под Гео/Гидро ядра.`,
    },
  ];

  const levelMaterials: CharacterMaterial[] = [
    matCard(matAmber, "Сосновый янтарь", 168, "local", 1),
    matCard(matBoss, "Циклическое военное ядро куувяки", 46, "boss", 4),
    matCard(matTop1, "Осколок топаза Притхива", 1, "ascension", 2),
    matCard(matTop2, "Фрагмент топаза Притхива", 9, "ascension", 3),
    matCard(matTop3, "Кусок топаза Притхива", 9, "ascension", 4),
    matCard(matTop4, "Драгоценный топаз Притхива", 6, "ascension", 5),
    matCard(matShaft1, "Сломанный вал", 18, "ascension", 1),
    matCard(matShaft2, "Усиленный вал", 30, "ascension", 2),
    matCard(matShaft3, "Высокоточный вал", 36, "ascension", 3),
    matCard(matBook1, "Учения о «Рае»", 9, "talent", 2),
    matCard(matBook2, "Указания о «Рае»", 63, "talent", 3),
    matCard(matBook3, "Философия о «Рае»", 114, "talent", 4),
    matCard(matHorn, "Истлевший рог", 18, "talent", 5),
    matCard(matCrown, "Корона прозрения", 3, "talent", 5),
  ];

  const ex = loadExtracted();
  const iconBase = `/images/talents/${SLUG}`;
  const cIconBase = `/images/constellations/${SLUG}`;
  const lv13 = Array.from({ length: 13 }, (_, i) => String(i + 1));
  const rowsOf = (key: string) =>
    (ex.talents[key]?.rows || []).map((r) => ({ label: r.label, values: r.values }));

  const talents = [
    {
      id: "t_na",
      name: ex.talents["0"].name,
      icon: `${iconBase}/na.png`,
      description: ex.talents["0"].description,
      levelLabels: lv13,
      stats: rowsOf("0"),
      order: 0,
    },
    {
      id: "t_skill",
      name: ex.talents["1"].name,
      icon: `${iconBase}/skill.png`,
      description: ex.talents["1"].description,
      levelLabels: lv13,
      stats: rowsOf("1"),
      order: 1,
    },
    {
      id: "t_burst",
      name: ex.talents["3"].name,
      icon: `${iconBase}/burst.png`,
      description: ex.talents["3"].description,
      levelLabels: lv13,
      stats: rowsOf("3"),
      order: 2,
    },
    {
      id: "t_p1",
      name: ex.talents["4"].name,
      icon: `${iconBase}/passive1.png`,
      description: ex.talents["4"].description,
      order: 3,
    },
    {
      id: "t_p2",
      name: ex.talents["5"].name,
      icon: `${iconBase}/passive2.png`,
      description: ex.talents["5"].description,
      order: 4,
    },
    {
      id: "t_p3",
      name: ex.talents["6"].name,
      icon: `${iconBase}/passive3.png`,
      description: ex.talents["6"].description,
      order: 5,
    },
    {
      id: "t_util",
      name: ex.talents["8"].name,
      icon: `${iconBase}/utility.png`,
      description: ex.talents["8"].description,
      order: 6,
    },
  ];

  const constellations = Object.entries(ex.constellations)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([k, cst], i) => ({
      id: `c${Number(k) + 1}`,
      level: Number(k) + 1,
      name: cst.name,
      icon: `${cIconBase}/c${Number(k) + 1}.png`,
      description: cst.description,
      order: i,
    }));

  const contentHtml = serializeGuide(blocks);
  const shortDesc =
    "Иллуги — Гео саппорт Лунного кристалла: билд, оружие, сеты и отряды.";

  const minOrder = await prisma.character.aggregate({ _min: { order: true } });
  const order = (minOrder._min.order ?? 1) - 1;

  const data = {
    name: NAME,
    rarity: Rarity.EPIC,
    element: Element.GEO,
    weaponType: "Копьё",
    region: "Нод-Край",
    sticker: null as null,
    shortDesc,
    contentHtml,
    levelMaterials,
    talents,
    constellations,
    published: true,
    order,
  };

  let row;
  if (existing) {
    row = await prisma.character.update({ where: { slug: SLUG }, data });
  } else {
    console.warn(`WARNING: slug="${SLUG}" not found — creating empty icons`);
    row = await prisma.character.create({
      data: { slug: SLUG, image: "", splashImage: "", ...data },
    });
  }

  const typeCounts = blocks.reduce<Record<string, number>>((acc, b) => {
    acc[b.type] = (acc[b.type] || 0) + 1;
    return acc;
  }, {});

  console.log("Upserted", row.id, row.slug, row.name);
  console.log("IMAGE used for guide display:", IMAGE || "(empty)");
  console.log("Block types:", typeCounts);
  console.log(
    "Weapons:",
    weaponItems.map((i) => `${i.rank}. ${i.name}${i.href ? "" : " [stub]"}`).join("; "),
  );
  console.log(
    "Artifacts:",
    artItems.map((i) => `${i.rank}. ${i.name}${i.href ? "" : " [stub]"}`).join("; "),
  );
  console.log("Missing from DB (stubs):", missingLog.length ? missingLog.join("; ") : "(none)");
  console.log("Guide URL: /wiki/characters/" + SLUG);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
