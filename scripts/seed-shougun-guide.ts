/**
 * Импорт гайда на Райдэн (Сёгун Райдэн).
 *
 *   npx tsx scripts/templates/fetch-guide-sources.ts   # CONFIG: shougun / 10000052
 *   npx tsx scripts/seed-shougun-guide.ts
 *
 * НЕ трогаем image / splashImage.
 * Таланты/консты — из scripts/_cache/shougun/yatta-extracted.json (RU, cleanYattaText).
 * Слаг в БД: shougun.
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
  type CharRow,
  type WeaponRow,
  type ArtifactRow,
  type MatRow,
} from "./lib/seed-guide-helpers";

const prisma = new PrismaClient();

const SLUG = "shougun";
const NAME = "Райдэн";
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
    select: { id: true, slug: true, name: true, image: true, order: true },
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
    elementIcon: ELEMENT_SVG.ELECTRO,
    rarity: 5,
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

  const artEmblem = a("Эмблема рассечённой судьбы", "Эмблема рассеченной судьбы");
  const artThundering = a("Громогласный рёв ярости", "Громогласный рев ярости");
  const artCalm = a("Усмиряющий гром");
  const artParadise = a("Цветок потерянного рая");
  const artGilded = a("Позолоченные сны");
  const artExile = a("Изгнанник");
  const artNoblesse = a("Церемония древней знати");
  const artVV = a("Изумрудная тень");

  const weaponItems: GuideRankedItem[] = [
    rankedWeapon(
      w("Сияющая жатва"),
      1,
      "Сияющая жатва",
      "Сигна · ВЭ%",
      "АТК от ВЭ сверх 100% (до 80%); после Q — ещё +ВЭ% на 12 сек.",
      "Лучший меч: много ВЭ и АТК, упрощает баланс под Эмблему.",
      "S",
    ),
    rankedWeapon(
      w("Посох жертвующей", "Посох жертвующего"),
      2,
      "Посох жертвующей",
      "Сигна Инеффы · К/Ш",
      "Стаки АТК% и ВЭ% с попаданий Е (работает из кармана).",
      "На R5 почти уровень сигны (−3–5%). Кубок лучше на Электро.",
      "S",
    ),
    rankedWeapon(
      w("«Улов»", "Улов"),
      3,
      "«Улов»",
      "F2P · ВЭ%",
      "+урон Q и +К/Ш ульты.",
      "На R5 с Беннетом/Сарой/Шеврёз соперничает с сигной. Добывается рыбалкой.",
      "S",
    ),
    rankedWeapon(
      w("Режущий волны плавник"),
      4,
      "Режущий волны плавник",
      "Баннер · АТК%",
      "Урон Q от суммарной энергии отряда (кап бонуса).",
      "Сильно зависит от R и стоимости ульт пачки; на высоком R — топ.",
      "A",
    ),
    rankedWeapon(
      w("Посох Хомы"),
      5,
      "Посох Хомы",
      "К/У · HP→АТК",
      "Много К/У и АТК от HP (вторая часть пассивки почти не нужна).",
      "В артефактах упор на ВЭ%.",
      "A",
    ),
    rankedWeapon(
      w("Нефритовый коршун"),
      6,
      "Нефритовый коршун",
      "К/Ш · АТК",
      "Стаки АТК с попаданий; на 7 — ещё урон.",
      "Перед Q наберите стаки обычными. Высокая база и К/Ш.",
      "A",
    ),
    rankedWeapon(
      w("Небесная ось"),
      7,
      "Небесная ось",
      "Стандарт · ВЭ%",
      "К/Ш + скорость НА; клинок с НА/заряж. в стойке не работает.",
      "Лучше Улова по базе, хуже по пассивке под ульту.",
      "A",
    ),
    rankedWeapon(
      w("Усмиритель бед"),
      8,
      "Усмиритель бед",
      "АТК% · элем.",
      "Элем. бонус + стаки АТК (вне поля ×2).",
      "Огромный АТК-бафф; личный урон Е небольшой, но стаки копятся.",
      "B",
    ),
    rankedWeapon(
      w("Посох алых песков"),
      9,
      "Посох алых песков",
      "К/Ш · МС→АТК",
      "АТК от МС; стаки с Е.",
      "Для Разрастания / гибрида с МС 200–300. Е по откату.",
      "B",
    ),
    rankedWeapon(
      w("Тамаюратэй но оханаси"),
      10,
      "Тамаюратэй но оханаси",
      "4★ · ВЭ%",
      "После Е — АТК% и скорость передвижения.",
      "Обновляйте Е, чтобы держать бафф (круг Е долгий).",
      "B",
    ),
    rankedWeapon(
      w("Прототип: Звёздный блеск", "Прототип: Звездный блеск"),
      11,
      "Прототип: Звёздный блеск",
      "Крафт · ВЭ%",
      "Бафф НА/заряж. с Е — в стойке не работает.",
      "Крайний F2P ради ВЭ%, если нет Улова.",
      "C",
    ),
    rankedWeapon(
      w("Гроза драконов"),
      12,
      "Гроза драконов",
      "Вегетация · МС",
      "МС + урон по целям с Гидро/Пиро.",
      "Топ для сборки на взрыв ядер (полный МС-билд).",
      "A",
    ),
  ];

  const artItems: GuideRankedItem[] = [
    rankedArt(
      artEmblem,
      1,
      "Эмблема рассечённой судьбы",
      "Топ-1 · ВЭ / Q",
      "2п +20% ВЭ; 4п урон Q = 25% от ВЭ (кап 75% при 300% ВЭ).",
      "Лучший сет почти всегда. С сигной цель ВЭ ~270%, без — до 300%.",
      "S",
    ),
    rankedArt(
      artThundering,
      2,
      "Громогласный рёв ярости",
      "Реакции",
      "2п Электро; 4п бафф Перегрузки / Заряжен / Вегетации / Обострения.",
      "Временный вариант в Дендро-пачках, если уже есть ВЭ в статах.",
      "A",
    ),
    rankedArt(
      artCalm,
      3,
      "Усмиряющий гром",
      "Моно-Электро",
      "4п +35% урона по целям под Электро.",
      "Только полный сет при стабильном Электро-статусе.",
      "B",
    ),
    rankedArt(
      artParadise,
      4,
      "Цветок потерянного рая",
      "Вегетация · МС",
      "МС + урон Бутонизации / Вегетации / Цветения.",
      "Узкий сет под полный МС-билд на взрыв ядер.",
      "A",
    ),
    rankedArt(
      artGilded,
      5,
      "Позолоченные сны",
      "МС / гибрид",
      "МС + бафф АТК/МС после реакции от состава пачки.",
      "Вегетация или крит-билд с Дендро; в крит-сборке всё равно нужна ВЭ.",
      "B",
    ),
    rankedArt(
      artExile,
      6,
      "Изгнанник",
      "Новичок · ВЭ",
      "2п ВЭ%; 4п заливка энергии союзникам после Q.",
      "Переходный сет на старте аккаунта.",
      "C",
    ),
  ];
  if (artItems[0]) artItems[0].name = "Эмблема рассечённой судьбы";
  if (artItems[1]) artItems[1].name = "Громогласный рёв ярости";

  const matLocal = m("Плод облачной травы");
  const matBoss = m("Штормовой жемчуг");
  const matGuard1 = m("Старая гарда");
  const matGuard2 = m("Гарда кагэути");
  const matGuard3 = m("Прославленная гарда");
  const matGem1 = m("Осколок аметиста Ваджрада");
  const matGem2 = m("Фрагмент аметиста Ваджрада");
  const matGem3 = m("Кусок аметиста Ваджрада");
  const matGem4 = m("Драгоценный аметист Ваджрада");
  const matBook1 = m("Учения о «Свете»");
  const matBook2 = m("Указания о «Свете»");
  const matBook3 = m("Философия о «Свете»");
  const matWeekly = m("Расплавленный миг");
  const matCrown = m("Корона прозрения");

  const roleRows: GuideRoleRow[] = [
    {
      id: uid(),
      name: c("xiangling")?.name || "Сян Лин",
      image: c("xiangling")?.image || "",
      element: "Пиро",
      elementIcon: ELEMENT_SVG.PYRO,
      weapon: "Копьё",
      weaponIcon: "",
      description: "Дорогая ульта + карман. Ядро националки: Райдэн заряжает и усиливает Q.",
      href: c("xiangling") ? `/wiki/characters/${c("xiangling")!.slug}` : undefined,
      rarity: 4,
    },
    {
      id: uid(),
      name: c("bennett")?.name || "Беннет",
      image: c("bennett")?.image || "",
      element: "Пиро",
      elementIcon: ELEMENT_SVG.PYRO,
      weapon: "Одноручный меч",
      weaponIcon: "",
      description: "АТК-бафф + хил. Топ для гипер-керри и националки (замена — Николь).",
      href: c("bennett") ? `/wiki/characters/${c("bennett")!.slug}` : undefined,
      rarity: 4,
    },
    {
      id: uid(),
      name: c("sara")?.name || "Сара",
      image: c("sara")?.image || "",
      element: "Электро",
      elementIcon: ELEMENT_SVG.ELECTRO,
      weapon: "Лук",
      weaponIcon: "",
      description: "Бафф АТК; на С6 — К/У Электро. Желательно С2+ для комфорта.",
      href: c("sara") ? `/wiki/characters/${c("sara")!.slug}` : undefined,
      rarity: 4,
    },
    {
      id: uid(),
      name: c("yae-miko")?.name || "Яэ Мико",
      image: c("yae-miko")?.image || "",
      element: "Электро",
      elementIcon: ELEMENT_SVG.ELECTRO,
      weapon: "Катализатор",
      weaponIcon: "",
      description: "Дорогая Q — много Решимости и частиц. Сильный саб в моно-Электро / Обострении.",
      href: c("yae-miko") ? `/wiki/characters/${c("yae-miko")!.slug}` : undefined,
      rarity: 5,
    },
    {
      id: uid(),
      name: c("kazuha")?.name || "Кадзуха",
      image: c("kazuha")?.image || "",
      element: "Анемо",
      elementIcon: ELEMENT_SVG.ANEMO,
      weapon: "Одноручный меч",
      weaponIcon: "",
      description: "VV + элем. бонус + стяжка. Альтернатива — Шилонен.",
      href: c("kazuha") ? `/wiki/characters/${c("kazuha")!.slug}` : undefined,
      rarity: 5,
    },
    {
      id: uid(),
      name: c("nahida")?.name || "Нахида",
      image: c("nahida")?.image || "",
      element: "Дендро",
      elementIcon: ELEMENT_SVG.DENDRO,
      weapon: "Катализатор",
      weaponIcon: "",
      description: "Статус + МС для гипер-керри / Обострения / Вегетации.",
      href: c("nahida") ? `/wiki/characters/${c("nahida")!.slug}` : undefined,
      rarity: 5,
    },
  ];

  const teams: GuideTeamVariant[] = [
    {
      id: uid(),
      badge: "Националка · топ",
      features:
        "Сян Лин + Син Цю/Е Лань + Беннет/Николь. Классика: карманные Q → стойка Райдэн, Перегрузка/Пар/Заряжен + заливка энергии.",
      members: [
        self("Драйвер / Q"),
        member(c("xiangling"), "Сян Лин", "Пиро саб"),
        member(c("xingqiu") || c("yelan"), "Син Цю / Е Лань", "Гидро саб"),
        member(c("bennett") || c("nikol"), "Беннет / Николь", "Бафф / хил"),
      ],
    },
    {
      id: uid(),
      badge: "Перегрузка",
      features: "Сара + Шеврёз + Беннет/Николь. Шред Электро/Пиро, двойной АТК-бафф. Сильно по боссам.",
      members: [
        self("Мейн-дд"),
        member(c("sara"), "Сара", "АТК бафф"),
        member(c("shevryez", "chevreuse", "шеврёз", "шеврез"), "Шеврёз", "Шред / стяжка"),
        member(c("bennett") || c("nikol"), "Беннет / Николь", "Бафф / хил"),
      ],
    },
    {
      id: uid(),
      badge: "Гипер-керри",
      features: "Сара + Кадзуха/Шилонен + Беннет. Личный урон стойки; желательна С2.",
      members: [
        self("Мейн-дд"),
        member(c("sara"), "Сара", "АТК бафф"),
        member(c("kazuha") || c("shilonen"), "Кадзуха / Шилонен", "Шред / бафф"),
        member(c("bennett"), "Беннет", "АТК / хил"),
      ],
    },
    {
      id: uid(),
      badge: "Моно-Электро",
      features: "Яэ + Сара + Джинн/Шилонен. Дорогие ульты = много Решимости; Райдэн батарейка и керри.",
      members: [
        self("Мейн-дд"),
        member(c("yae-miko"), "Яэ Мико", "Электро саб"),
        member(c("sara"), "Сара", "АТК бафф"),
        member(c("shilonen") || c("jean", "джинн"), "Шилонен / Джинн", "Хил / шред"),
      ],
    },
    {
      id: uid(),
      badge: "Лунный заряд",
      features: "Инеффа/Фишль + Коломбина/Айно + Ягода/Сахароза. Лунные реакции с Электро ядром.",
      members: [
        self("Электро / Q"),
        member(c("ineffa") || c("fischl"), "Инеффа / Фишль", "Электро саб"),
        member(c("kolombina") || c("ajno"), "Коломбина / Айно", "Гидро / луна"),
        member(c("yagoda") || c("sucrose"), "Ягода / Сахароза", "Хил / VV"),
      ],
    },
    {
      id: uid(),
      badge: "Обострение",
      features: "Нахида + Яэ/Фишль + Бай Чжу/Яо Яо. Крит-билд; МС даёт Нахида и резонанс.",
      members: [
        self("Мейн-дд"),
        member(c("nahida"), "Нахида", "Дендро"),
        member(c("yae-miko") || c("fischl"), "Яэ / Фишль", "Электро саб"),
        member(c("baizhu", "бай чжу") || c("yaoyao", "яо яо"), "Бай Чжу / Яо Яо", "Хил"),
      ],
    },
    {
      id: uid(),
      badge: "Вегетация · МС",
      features: "Нахида/Лаума + Е Лань + Кокоми. Райдэн на полном МС взрывает ядра тиками Е (Q почти не жмём).",
      members: [
        self("Взрыв ядер"),
        member(c("nahida") || c("lauma"), "Нахида / Лаума", "Дендро"),
        member(c("yelan"), "Е Лань", "Гидро саб"),
        member(c("kokomi"), "Кокоми", "Хил / Гидро"),
      ],
    },
  ];

  const blocks: GuideBlock[] = [
    {
      id: uid(),
      type: "text",
      eyebrow: "Обзор",
      title: "Кто такая Райдэн",
      body: `Райдэн (Сёгун Райдэн, Эи) — **Электро архонт 5★** Инадзумы. Роли: **драйвер / гипер-керри**, **батарейка** (заливка энергии в стойке) и **саб на взрыв ядер** в Вегетации.

Е ставит **Глаз грозового наказания** (карманный Электро + бафф Q союзникам). Q переводит в **Мусо иссин**: удары считаются уроном ульты, копят/тратят **Решимость**, заливают энергию пачке.

### Кратко
- **Рейтинг** — S (желательна **С2** для конкуренции в эндгейме)
- **Стихия / оружие** — Электро · копьё
- **Возвышение** — ВЭ% (**+32%** на 90 ур., итого **132%** без артефактов)
- **База на 90 ур.** — HP **12 907** · АТК **337** · Защита **789**
- **Добавлена** — патч **2.1** (1 сентября 2021)
- **День рождения** — 26 июня
- **Регион / фракция** — Инадзума · Архонты
- **Созвездие** — Бренный мир
- **Сигна** — Сияющая жатва`,
    },
    {
      id: uid(),
      type: "prosCons",
      eyebrow: "Анализ",
      title: "Преимущества и недостатки",
      prosTitle: "Преимущества",
      consTitle: "Недостатки",
      pros: [
        "**Универсальная батарейка** — заливка энергии в Мусо иссин снижает ВЭ-требования союзников.",
        "Высокий личный урон за короткое окно даже на **С0**.",
        "Гибкость: драйвер, гипер-керри, саб Вегетации, второй дамагер в револьверах.",
        "Сильный F2P-вариант оружия — **«Улов»**; ключевые консты ранние (**С1–С2**).",
        "Пассивка: −50% моры на возвышение мечей и древкового оружия.",
      ],
      cons: [
        "Решимость зависит от **стоимости ульт** союзников — слабые/дешёвые Q хуже заряжают стойку.",
        "Плохо синергирует с частью героев (напр. Бэй Доу, Юнь Цзинь).",
        "Карманный Электро с Е может **сбивать** чужие реакции.",
        "В актуальном мете желательна **С2**, иначе сложнее тягаться с новыми Электро-керри.",
      ],
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Билд",
      title: "Как собирать Райдэн",
      body: `Классика — **ВЭ + АТК + криты**. Удары в стойке = **урон Q**, поэтому копья на бафф обычных почти бесполезны.

- **Пески** — ВЭ% (или АТК%, если ВЭ уже с оружия/сигны).
- **Кубок** — **Электро**, если есть АТК-бафф (Беннет/Сара) или много АТК с оружия; иначе **АТК%** (тогда пески строго ВЭ%).
- **Корона** — К/Ш или К/У.

С **Эмблемой** не лезьте выше **300% ВЭ** (с сигной комфорт ~**270%**). МС нужно только в реакционных сборках (Вегетация 600–700+, Обострение 100–200).`,
    },
    {
      id: uid(),
      type: "statTargets",
      eyebrow: "Билд",
      title: "Рекомендуемые значения характеристик",
      intro:
        "Цель — закрыть ВЭ под Эмблему и баланс критов 1:2. Точная ВЭ зависит от стоимости ульт пачки.",
      targets: [
        { id: uid(), label: "АТК", value: "1600+", hint: "Выше с Беннетом / Сарой" },
        { id: uid(), label: "К/Ш : К/У", value: "~1:2", hint: "Напр. 60 / 120 и выше" },
        {
          id: uid(),
          label: "ВЭ",
          value: "250–270%",
          hint: "Минимум ~210%; кап Эмблемы 300% (с сигной ~270%)",
        },
        {
          id: uid(),
          label: "МС (Вегетация)",
          value: "600–700+",
          hint: "Полный МС-билд; иначе МС почти не нужно",
        },
      ],
      slots: [
        { id: uid(), slot: "Пески", main: "ВЭ% / АТК%", subs: "К/Ш · К/У · АТК% · ВЭ%" },
        { id: uid(), slot: "Кубок", main: "Электро / АТК%", subs: "К/Ш · К/У · ВЭ% · АТК%" },
        { id: uid(), slot: "Корона", main: "К/Ш / К/У", subs: "К/У · К/Ш · ВЭ% · АТК%" },
      ],
    },
    {
      id: uid(),
      type: "rankedList",
      eyebrow: "Оружие",
      title: "Рейтинг оружия",
      intro:
        "Приоритет — **ВЭ%**, **К/Ш/К/У** или АТК. F2P-топ — **«Улов»**. Для Вегетации — копья на **МС** (Гроза драконов).",
      kind: "weapons",
      items: weaponItems,
    },
    {
      id: uid(),
      type: "rankedList",
      eyebrow: "Артефакты",
      title: "Полезные артефакты",
      intro: "Цель — **4п Эмблема рассечённой судьбы**. Остальное — ситуатив или переходный период.",
      kind: "artifacts",
      items: artItems,
    },
    {
      id: uid(),
      type: "setPlan",
      eyebrow: "Артефакты",
      title: "Как раздать сеты в топ-отряде",
      intro: "Ориентир классической националки.",
      groups: [
        {
          id: uid(),
          title: "Райдэн + Сян Лин + Син Цю + Беннет",
          rows: [
            {
              id: uid(),
              name: NAME,
              image: IMAGE,
              href: `/wiki/characters/${SLUG}`,
              setName: "Эмблема рассечённой судьбы",
              setImage: artImg(artEmblem, "Эмблема"),
            },
            planRow(c("xiangling"), "Сян Лин", "Эмблема", artImg(artEmblem, "Эмблема")),
            planRow(c("xingqiu"), "Син Цю", "Эмблема", artImg(artEmblem, "Эмблема")),
            planRow(c("bennett"), "Беннет", "Церемония древней знати", artImg(artNoblesse, "Знать")),
          ],
        },
      ],
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Отряды",
      title: "Отряды и роли",
      body: `Лучше союзники с **сильными и дорогими ультами** — так копится Решимость и раскрывается батарейка.

**Крио** почти не берут (Сверхпроводник бесполезен для неё). Исключение — саппорт под физ. керри вроде Эолы.

Роли: **драйвер** (националка), **гипер-керри** (Сара + баффы), **Вегетация** (полный МС, урон с Е), **Лунный заряд** с Инеффой/Коломбиной.`,
    },
    {
      id: uid(),
      type: "roleTable",
      eyebrow: "Отряды",
      title: "Приоритетные персонажи",
      intro: "Ядро — Сян Лин / Беннет / Сара / Яэ / Кадзуха / Нахида.",
      rows: roleRows,
    },
    {
      id: uid(),
      type: "teamGroup",
      eyebrow: "Отряды",
      title: "Примеры сильных команд",
      intro: "Националка и Перегрузка — основа; также гипер-керри, Луна и Дендро.",
      variants: teams,
    },
    {
      id: uid(),
      type: "resourceTable",
      title: "Возвышение",
      intro: "Аметист Ваджрада + материалы Инадзумы:",
      rows: [
        {
          id: uid(),
          name: matGem1?.name || "Аметист Ваджрада",
          image: matGem1?.image || "",
          qty: "1→9→9→6",
          where: "Мировые и еженедельные боссы (серия аметиста Ваджрада)",
          href: matGem1 ? `/wiki/materials/${matGem1.slug}` : undefined,
        },
        {
          id: uid(),
          name: matLocal?.name || "Плод облачной травы",
          image: matLocal?.image || "",
          qty: "168",
          where: "Диковинка Инадзумы",
          href: matLocal ? `/wiki/materials/${matLocal.slug}` : undefined,
        },
        {
          id: uid(),
          name: matBoss?.name || "Штормовой жемчуг",
          image: matBoss?.image || "",
          qty: "46",
          where: "Манифестация грома",
          href: matBoss ? `/wiki/materials/${matBoss.slug}` : undefined,
        },
        {
          id: uid(),
          name: "Гарды",
          image: matGuard3?.image || matGuard1?.image || "",
          qty: "18 / 30 / 36",
          where: "Кайраги и нобуси",
          href: matGuard1 ? `/wiki/materials/${matGuard1.slug}` : undefined,
        },
      ],
    },
    {
      id: uid(),
      type: "resourceTable",
      title: "Таланты",
      intro: "На одну способность до 10 ур. Книги «Свет» — Фиалковый зал (ср/сб/вс).",
      rows: [
        {
          id: uid(),
          name: matBook3?.name || "Книги о «Свете»",
          image: matBook3?.image || "",
          qty: "3 / 21 / 38",
          where: "Фиалковый зал — ср, сб, вс",
          href: matBook1 ? `/wiki/materials/${matBook1.slug}` : undefined,
        },
        {
          id: uid(),
          name: "Гарды",
          image: matGuard3?.image || "",
          qty: "6 / 21 / 31",
          where: "Кайраги и нобуси",
          href: matGuard3 ? `/wiki/materials/${matGuard3.slug}` : undefined,
        },
        {
          id: uid(),
          name: matWeekly?.name || "Расплавленный миг",
          image: matWeekly?.image || "",
          qty: "6",
          where: "Еженедельный босс Синьора",
          href: matWeekly ? `/wiki/materials/${matWeekly.slug}` : undefined,
        },
        {
          id: uid(),
          name: matCrown?.name || "Корона прозрения",
          image: matCrown?.image || "",
          qty: "1",
          where: "Ивенты и подношения",
          href: matCrown ? `/wiki/materials/${matCrown.slug}` : undefined,
        },
      ],
    },
    {
      id: uid(),
      type: "statsTable",
      title: "Характеристики при возвышении",
      intro:
        "Растёт **восстановление энергии** (**+32%** на 90 ур., итого **132%** с базовыми 100%). Как дамагеру 95/100 обычно не нужно (исключение — МС Вегетация).",
      colLabels: ["Уровень", "HP", "АТК", "Защита", "Базовая ВЭ", "Бонус ВЭ"],
      rows: [
        emptyStatsRow("1", "1005", "26", "61", "100%", "0%"),
        emptyStatsRow("20", "2606", "68", "159", "100%", "0%"),
        emptyStatsRow("40", "5191", "136", "317", "100%", "0%"),
        emptyStatsRow("50", "6669", "174", "407", "100%", "8%"),
        emptyStatsRow("60", "8373", "219", "511", "100%", "16%"),
        emptyStatsRow("70", "9862", "258", "602", "100%", "16%"),
        emptyStatsRow("80", "11359", "297", "693", "100%", "24%"),
        emptyStatsRow("90", "12907", "337", "789", "100%", "32%"),
      ],
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Геймплей",
      title: "Способности",
      body: `Суть — повесить **Глаз** (Е), дать союзникам сбросить **Q** (Решимость), затем **своя Q** и окно **Мусо иссин**.

### Приоритет прокачки
**Q > E > обычные** (обычные почти не качают).

### Активные
- **Исток (NA)** — до 5 ударов копьём; заряженная и падение — физ.
- **Превосходство: Зловещее знамение (E)** — Электро-удар + Глаз на 25 сек.: совместные атаки из кармана и бафф урона Q союзников от стоимости их ульт. Откат 10 сек.
- **Тайное искусство: Мусо синсэцу (Q)** — **90** энергии, откат 18. AoE + стойка ~7 сек. (урон = Q). Попадания заливают энергию пачке (до 5 раз). Решимость копится с чужих Q (макс. 60).

### Пассивки
- **Бесчисленные мечты** — часть ВЭ сверх 100% конвертируется в бонус урона Электро и Q.
- **Просветлённая** — при Q союзников рядом даёт Решимость Райдэн.
- **Хранитель всего сущего** — −50% моры на возвышение мечей и древкового оружия.

### Созвездия
Главное — **С2** (игнор части защиты в стойке / огромный прирост урона). **С1** ускоряет набор Решимости. Дальше С2 крутить обычно не нужно.`,
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Геймплей",
      title: "Как играть и стоит ли выбивать",
      body: `### Ротация (общая)
1. **Е** в начале ротации (Глаз на всё окно).
2. Саппорты и саб-дд — **ульты** (Решимость + баффы).
3. **Q Райдэн** → удары в Мусо иссин до конца стойки.
4. Повтор с обновлением Е.

В Вегетации часто **не жмут Q**: стоят на поле / тикают Е по ядрам в МС-билде.

### Стоит ли выбивать?
Да, если нужна гибкая Электро-единица и батарейка. Сборка дешёвая (**Улов** + Эмблема). Для комфортного эндгейма как гипер-керри сильно помогает **С2**; как драйвер националки сильна и на С0.

### С2 или оружие?
Сигна удобна, но **«Улов» R5** закрывает почти всё. При выборе конст vs сигна приоритетнее **С2**.`,
    },
  ];

  const levelMaterials: CharacterMaterial[] = [
    matCard(matLocal, "Плод облачной травы", 168, "local", 1),
    matCard(matBoss, "Штормовой жемчуг", 46, "boss", 4),
    matCard(matGem1, "Осколок аметиста Ваджрада", 1, "ascension", 2),
    matCard(matGem2, "Фрагмент аметиста Ваджрада", 9, "ascension", 3),
    matCard(matGem3, "Кусок аметиста Ваджрада", 9, "ascension", 4),
    matCard(matGem4, "Драгоценный аметист Ваджрада", 6, "ascension", 5),
    matCard(matGuard1, "Старая гарда", 18, "ascension", 1),
    matCard(matGuard2, "Гарда кагэути", 30, "ascension", 2),
    matCard(matGuard3, "Прославленная гарда", 36, "ascension", 3),
    matCard(matBook1, "Учения о «Свете»", 9, "talent", 2),
    matCard(matBook2, "Указания о «Свете»", 63, "talent", 3),
    matCard(matBook3, "Философия о «Свете»", 114, "talent", 4),
    matCard(matWeekly, "Расплавленный миг", 18, "talent", 5),
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
      id: "t_util",
      name: ex.talents["8"]?.name || "Хранитель всего сущего",
      icon: `${iconBase}/utility.png`,
      description: ex.talents["8"]?.description || "",
      order: 5,
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
    "Райдэн — Электро архонт: Эмблема, Улов/Жатва, националка, Перегрузка и заливка энергии.";

  let order: number;
  if (existing?.order != null) {
    order = existing.order;
  } else {
    const minOrder = await prisma.character.aggregate({ _min: { order: true } });
    order = (minOrder._min.order ?? 1) - 1;
  }

  const data = {
    name: NAME,
    rarity: Rarity.LEGEND,
    element: Element.ELECTRO,
    weaponType: "Копьё",
    region: "Инадзума",
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

  const c1 = String((constellations[0] as { description?: string })?.description || "");
  console.log("Upserted", row.id, row.slug, row.name);
  console.log("IMAGE used for guide display:", IMAGE || "(empty)");
  console.log("Block types:", typeCounts);
  console.log("C1 sample:", c1.slice(0, 120).replace(/\n/g, "↵"));
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
