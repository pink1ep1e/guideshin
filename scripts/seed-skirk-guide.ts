/**
 * Импорт гайда на Скирк.
 *
 *   npx tsx scripts/templates/fetch-guide-sources.ts   # CONFIG: skirk / 10000114
 *   npx tsx scripts/seed-skirk-guide.ts
 *
 * НЕ трогаем image / splashImage.
 * Таланты/консты — из scripts/_cache/skirk/yatta-extracted.json (RU, cleanYattaText).
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

const SLUG = "skirk";
const NAME = "Скирк";
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
    elementIcon: ELEMENT_SVG.CRYO,
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

  const artFinale = a("Финал галерей глубин");
  const artBlizzard = a("Заблудший в метели");
  const artHunter = a("Охотник Сумеречного двора");
  const artEchoes = a("Отголоски подношения");
  const artGlad = a("Конец гладиатора");
  const artNoblesse = a("Церемония древней знати");
  const artTenacity = a("Стойкость Миллелита");
  const artScroll = a("Свиток героя сожжённого города", "Свиток героя сожженного города");

  const weaponItems: GuideRankedItem[] = [
    rankedWeapon(
      w("Лазурное сияние"),
      1,
      "Лазурное сияние",
      "Сигна · К/Ш",
      "После Е — АТК%; без энергии — ещё АТК% и К/У (у Скирк энергия всегда 0).",
      "Лучший меч: статы + пассивка идеально под её механику Змеиного коварства.",
      "S",
    ),
    rankedWeapon(
      w("Харан гэппаку фуцу"),
      2,
      "Харан гэппаку фуцу",
      "К/Ш · НА",
      "Элем. урон + усиление обычных после стаков Волн-шипа.",
      "Сильнейшая альтернатива сигне: К/Ш и бафф обычных в стойке.",
      "S",
    ),
    rankedWeapon(
      w("Драгоценный омут"),
      3,
      "Драгоценный омут",
      "К/Ш · HP→АТК",
      "Много К/Ш; конвертирует HP в АТК.",
      "Удобный баланс критов; чуть слабее Харана по личному урону.",
      "A",
    ),
    rankedWeapon(
      w("Рассекающий туман"),
      4,
      "Рассекающий туман",
      "К/У · элем.",
      "До трёх стаков бонуса элементального урона (НА / Q / энергия <100%).",
      "Высокая база и К/У; в артефактах упор на К/Ш. Стаки легко набрать в ротации.",
      "A",
    ),
    rankedWeapon(
      w("Блеск тихих вод"),
      5,
      "Блеск тихих вод",
      "К/У · HP",
      "Крит. урон и бонусы от изменения HP.",
      "Хорош с Фуриной; криты нужно балансировать под К/Ш.",
      "A",
    ),
    rankedWeapon(
      w("Грандиозный финал глубин"),
      6,
      "Грандиозный финал глубин",
      "4★ крафт · АТК%",
      "После Е — АТК% + Долг жизни; после снятия Долга — ещё АТК.",
      "Лучший эпик на R5. Нужен хилер в отряде (Эскофье / Кокоми).",
      "A",
    ),
    rankedWeapon(
      w("Бедствие Эшу"),
      7,
      "Бедствие Эшу",
      "Ивент · АТК%",
      "Урон НА/заряж.; под щитом — ещё К/Ш на эти атаки.",
      "Силён со щитом (Диона / Лайла / Далия / Ситлали).",
      "B",
    ),
    rankedWeapon(
      w("Кромсатель пиков"),
      8,
      "Кромсатель пиков",
      "АТК% · щит",
      "Стаки АТК с попаданий; ×2 под щитом.",
      "Много АТК, но криты целиком из артефактов. Только со щитовиком.",
      "B",
    ),
    rankedWeapon(
      w("Чёрный меч", "Черный меч"),
      9,
      "Чёрный меч",
      "БП · К/Ш",
      "Урон НА/заряж. + лёгкий хил с критов.",
      "Хорош на R5; дорого качать из боевого пропуска.",
      "B",
    ),
    rankedWeapon(
      w("Черногорский длинный меч"),
      10,
      "Черногорский длинный меч",
      "Лавка · К/У",
      "АТК за убийства (до 3 стаков).",
      "Ок на зачистке; на боссах пассивка почти не работает.",
      "C",
    ),
  ];

  const artItems: GuideRankedItem[] = [
    rankedArt(
      artFinale,
      1,
      "Финал галерей глубин",
      "Топ-1 · сигна-сет",
      "2п АТК%; 4п усиливает обычные/заряж./падение и ульту при нулевой энергии и вне поля.",
      "Лучший сет: механика энергии = 0 и урон из стойки / ульты совпадают идеально.",
      "S",
    ),
    rankedArt(
      artBlizzard,
      2,
      "Заблудший в метели",
      "Заморозка · К/Ш",
      "2п Крио урон; 4п К/Ш по замороженным / с Крио-статусом.",
      "Сильнее на стабильной Заморозке; слабее против боссов без статуса.",
      "A",
    ),
    rankedArt(
      artHunter,
      3,
      "Охотник Сумеречного двора",
      "С Фуриной",
      "2п обычные; 4п К/Ш и К/У при изменении HP.",
      "Имеет смысл, если Фурина уже на Охотнике не нужна / делится сетом.",
      "A",
    ),
    rankedArt(
      artEchoes,
      4,
      "Отголоски подношения",
      "НА · криты",
      "2п АТК%; 4п усиливает обычные после критов.",
      "Рабочий сет на обычные в стойке, пока нет Финала галерей.",
      "B",
    ),
    rankedArt(
      artGlad,
      5,
      "2+2 АТК% / Крио",
      "Переходный",
      "2п Гладиатор / Отголоски / Симэнава + 2п Метели или Финала.",
      "Пока фармите 4п Финала — закрывает АТК и Крио урон.",
      "B",
    ),
  ];
  if (artItems[4]) artItems[4].name = "2+2 АТК% / Крио";

  const matLocal = m("Заоблачный камнелист");
  const matBoss = m("Сковывающий взгляд");
  const matGear1 = m("Сцепляющаяся шестерня");
  const matGear2 = m("Шестерня механизма");
  const matGear3 = m("Изощрённая динамическая шестерня", "Изощренная динамическая шестерня");
  const matJade1 = m("Осколок нефрита Шивада");
  const matJade2 = m("Фрагмент нефрита Шивада");
  const matJade3 = m("Кусок нефрита Шивада");
  const matJade4 = m("Драгоценный нефрит Шивада");
  const matBook1 = m("Учения о «Соперничестве»");
  const matBook2 = m("Указания о «Соперничестве»");
  const matBook3 = m("Философия о «Соперничестве»");
  const matWeekly = m("Вознёсшийся образец: Конь", "Вознесшийся образец: Конь");
  const matCrown = m("Корона прозрения");

  const roleRows: GuideRoleRow[] = [
    {
      id: uid(),
      name: c("eskofe")?.name || "Эскофье",
      image: c("eskofe")?.image || "",
      element: "Крио",
      elementIcon: ELEMENT_SVG.CRYO,
      weapon: "Копьё",
      weaponIcon: "",
      description:
        "Сигнатурный саппорт: карман + хил + шред Крио/Гидро в чистой Заморозке. Без неё урон пачки заметно падает.",
      href: c("eskofe") ? `/wiki/characters/${c("eskofe")!.slug}` : undefined,
      rarity: 5,
    },
    {
      id: uid(),
      name: c("furina")?.name || "Фурина",
      image: c("furina")?.image || "",
      element: "Гидро",
      elementIcon: ELEMENT_SVG.HYDRO,
      weapon: "Одноручный меч",
      weaponIcon: "",
      description: "Фанфары + карманный Гидро. Нужен хилер (лучше Эскофье).",
      href: c("furina") ? `/wiki/characters/${c("furina")!.slug}` : undefined,
      rarity: 5,
    },
    {
      id: uid(),
      name: c("yelan", "e-lan")?.name || "Е Лань",
      image: c("yelan", "e-lan")?.image || "",
      element: "Гидро",
      elementIcon: ELEMENT_SVG.HYDRO,
      weapon: "Лук",
      weaponIcon: "",
      description: "Сильный Гидро саб под обычные + бафф урона активному во время ульты.",
      href: c("yelan", "e-lan") ? `/wiki/characters/${c("yelan", "e-lan")!.slug}` : undefined,
      rarity: 5,
    },
    {
      id: uid(),
      name: c("shen-khe", "shenhe")?.name || "Шэнь Хэ",
      image: c("shen-khe", "shenhe")?.image || "",
      element: "Крио",
      elementIcon: ELEMENT_SVG.CRYO,
      weapon: "Копьё",
      weaponIcon: "",
      description: "Крио-кверы и поле ульты — топ на личный урон Скирк.",
      href: c("shen-khe", "shenhe")
        ? `/wiki/characters/${c("shen-khe", "shenhe")!.slug}`
        : undefined,
      rarity: 5,
    },
    {
      id: uid(),
      name: c("sitlali")?.name || "Ситлали",
      image: c("sitlali")?.image || "",
      element: "Крио",
      elementIcon: ELEMENT_SVG.CRYO,
      weapon: "Катализатор",
      weaponIcon: "",
      description: "Щит + шред Гидро; лучшая замена Эскофье в чистой Заморозке.",
      href: c("sitlali") ? `/wiki/characters/${c("sitlali")!.slug}` : undefined,
      rarity: 5,
    },
    {
      id: uid(),
      name: c("daliya", "dahlia")?.name || "Далия",
      image: c("daliya", "dahlia")?.image || "",
      element: "Гидро",
      elementIcon: ELEMENT_SVG.HYDRO,
      weapon: "Одноручный меч",
      weaponIcon: "",
      description: "Щит + бафф скорости обычных — больше хитов в окне стойки.",
      href: c("daliya", "dahlia")
        ? `/wiki/characters/${c("daliya", "dahlia")!.slug}`
        : undefined,
      rarity: 4,
    },
  ];

  const teams: GuideTeamVariant[] = [
    {
      id: uid(),
      badge: "Заморозка · топ",
      features:
        "Фурина + Эскофье + Е Лань. Два резонанса, шред, хил и два сильных Гидро саба. Лучший гипер-керри от обычных.",
      members: [
        self("Мейн-дд"),
        member(c("furina"), "Фурина", "Гидро саб"),
        member(c("eskofe"), "Эскофье", "Крио / хил"),
        member(c("yelan"), "Е Лань", "Гидро саб"),
      ],
    },
    {
      id: uid(),
      badge: "Заморозка · урон",
      features: "Фурина + Эскофье + Шэнь Хэ. Максимум личного урона Скирк; все трое баффят керри.",
      members: [
        self("Мейн-дд"),
        member(c("furina"), "Фурина", "Гидро саб"),
        member(c("eskofe"), "Эскофье", "Крио / хил"),
        member(c("shen-khe", "shenhe"), "Шэнь Хэ", "Крио бафф"),
      ],
    },
    {
      id: uid(),
      badge: "Заморозка · Шэнь Хэ",
      features: "Шэнь Хэ + Эскофье + Е Лань/Син Цю. Шред от Эскофье + Крио-кверы на весь лёд отряда.",
      members: [
        self("Мейн-дд"),
        member(c("shen-khe", "shenhe"), "Шэнь Хэ", "Крио бафф"),
        member(c("eskofe"), "Эскофье", "Крио / хил"),
        member(c("yelan") || c("xingqiu"), "Е Лань / Син Цю", "Гидро саб"),
      ],
    },
    {
      id: uid(),
      badge: "Без Эскофье",
      features: "Фурина + Ситлали + Е Лань. Лучший вариант без шеф-повара: шред Гидро и два сильных саба.",
      members: [
        self("Мейн-дд"),
        member(c("furina"), "Фурина", "Гидро саб"),
        member(c("sitlali"), "Ситлали", "Щит / шред"),
        member(c("yelan"), "Е Лань", "Гидро саб"),
      ],
    },
    {
      id: uid(),
      badge: "Револьвер",
      features:
        "Нёвиллет / Тарталья + Фурина + Эскофье. Скирк на холд-Е и ульте как второй дамагер (нужна Эскофье).",
      members: [
        member(c("neuvillette") || c("tartaglia"), "Нёвиллет / Тарталья", "Гидро мейн"),
        member(c("furina"), "Фурина", "Гидро саб"),
        self("Ульта / саб"),
        member(c("eskofe"), "Эскофье", "Крио / хил"),
      ],
    },
    {
      id: uid(),
      badge: "Бюджет",
      features: "Розария/Кэйа + Ситлали/Диона/Лайла + Син Цю/Кандакия. Рабочая Заморозка на 4★.",
      members: [
        self("Мейн-дд"),
        member(c("rosaria") || c("kaeya"), "Розария / Кэйа", "Крио саб"),
        member(c("sitlali") || c("diona") || c("layla"), "Ситлали / щит", "Щит"),
        member(c("xingqiu") || c("candace"), "Син Цю / Кандакия", "Гидро"),
      ],
    },
  ];

  const blocks: GuideBlock[] = [
    {
      id: uid(),
      type: "text",
      eyebrow: "Обзор",
      title: "Кто такая Скирк",
      body: `Скирк — **Крио мечница 5★**, ученица Грешника и наставница Тартальи. Роль — **мейн-дд** (стойка **Семифазной вспышки**) или короткий **саб от ульты** в револьвере. Ульта тратит **Змеиное коварство**, а не энергию.

Сигнатурная реакция — **Заморозка** в отряде **только из Крио и Гидро** (пассивка Переправы смерти). Анемо-шред почти не нужен: его закрывает **Эскофье**.

### Кратко
- **Рейтинг** — S+ с Эскофье, S без неё
- **Стихия / оружие** — Крио · одноручный меч
- **Возвышение** — К/У (**+38.4%** на 90 ур., итого ~**88.4%**)
- **База на 90 ур.** — HP **15 307** · АТК **244** · Защита **696**
- **Добавлена** — патч **5.7** (18 июня 2025)
- **День рождения** — 5 ноября
- **Регион / фракция** — Исчезнувшая планета · Космический катаклизм
- **Созвездие** — Кристаллина
- **Особое блюдо** — Сокровище бездны
- **Сигна** — Лазурное сияние`,
    },
    {
      id: uid(),
      type: "prosCons",
      eyebrow: "Анализ",
      title: "Преимущества и недостатки",
      prosTitle: "Преимущества",
      consTitle: "Недостатки",
      pros: [
        "**Не нужна ВЭ** — ульта от Змеиного коварства; сборка только на АТК и критах.",
        "**Простой геймплей** в стойке: обычные под баффом ульты после саппортов.",
        "Гибкость: гипер-керри от НА или короткий **револьвер** через холд-Е + Q.",
        "Удобный мир: холд-Е даёт быстрый полёт над землёй и водой.",
      ],
      cons: [
        "**Только Крио + Гидро** для полного раскрытия пассивок; Таяние — вынужденный костыль.",
        "**Сильно зависит от Эскофье** (~−30% без неё); мало равноценных саппортов.",
        "Сигна и консты дают большой прирост; без них дольше собирать криты в артефактах.",
      ],
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Билд",
      title: "Как собирать Скирк",
      body: `Приоритет — **АТК%** и **криты**. МС и ВЭ не фармим.

- **Пески** — АТК%.
- **Кубок** — **Крио** (с Фуриной + Е Лань допустим АТК% из‑за их аффиксов).
- **Корона** — К/Ш или К/У до баланса ~1:2.

Натив К/У с возвышения упрощает баланс. В Заморозке учитывайте **+15% К/Ш** от Крио-резонанса (и бафф Розарии, если она в пачке).`,
    },
    {
      id: uid(),
      type: "statTargets",
      eyebrow: "Билд",
      title: "Рекомендуемые значения характеристик",
      intro:
        "Цель — высокий АТК и стабильные криты. ВЭ не требуется. МС не нужно в Заморозке.",
      targets: [
        {
          id: uid(),
          label: "АТК",
          value: "2000+",
          hint: "Выше с бафферами (Шэнь Хэ, Беннет в Таянии)",
        },
        {
          id: uid(),
          label: "К/Ш",
          value: "75–80%",
          hint: "+15% от Крио-резонанса в Заморозке → ~90–95%",
        },
        {
          id: uid(),
          label: "К/У",
          value: "160%+",
          hint: "Соотношение ~1:2 к К/Ш; верх не ограничен",
        },
        {
          id: uid(),
          label: "ВЭ",
          value: "не нужно",
          hint: "Ульта от Змеиного коварства",
        },
      ],
      slots: [
        { id: uid(), slot: "Пески", main: "АТК%", subs: "К/Ш · К/У · АТК" },
        { id: uid(), slot: "Кубок", main: "Крио / АТК%", subs: "К/Ш · К/У · АТК%" },
        { id: uid(), slot: "Корона", main: "К/Ш / К/У", subs: "К/У · К/Ш · АТК%" },
      ],
    },
    {
      id: uid(),
      type: "rankedList",
      eyebrow: "Оружие",
      title: "Рейтинг оружия",
      intro:
        "Лучше мечи на **К/Ш**, **К/У** или **АТК%** с баффом обычных. Оружие с ВЭ% почти бесполезно.",
      kind: "weapons",
      items: weaponItems,
    },
    {
      id: uid(),
      type: "rankedList",
      eyebrow: "Артефакты",
      title: "Полезные артефакты",
      intro:
        "Цель — **4п Финал галерей глубин**. Метели / Охотник — ситуативные; 2+2 — на переходный период.",
      kind: "artifacts",
      items: artItems,
    },
    {
      id: uid(),
      type: "setPlan",
      eyebrow: "Артефакты",
      title: "Как раздать сеты в топ-отряде",
      intro: "Ориентир премиум-Заморозки с Эскофье.",
      groups: [
        {
          id: uid(),
          title: "Скирк + Фурина + Эскофье + Е Лань",
          rows: [
            {
              id: uid(),
              name: NAME,
              image: IMAGE,
              href: `/wiki/characters/${SLUG}`,
              setName: "Финал галерей глубин",
              setImage: artImg(artFinale, "Финал галерей"),
            },
            planRow(c("furina"), "Фурина", "Охотник Сумеречного двора", artImg(artHunter, "Охотник")),
            planRow(c("eskofe"), "Эскофье", "Заблудший в метели", artImg(artBlizzard, "Метель")),
            planRow(c("yelan"), "Е Лань", "Эмблема / Знать", artImg(artNoblesse, "Знать")),
          ],
        },
      ],
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Отряды",
      title: "Отряды под Заморозку",
      body: `Идеал — **только Крио и Гидро**, иначе пассивка Переправы смерти и утилити-бафф уровней Е не работают полностью.

Приоритет: чистая **Заморозка** с Эскофье → то же без неё (Ситлали) → револьвер с Гидро мейном → моно-Крио/Кадзуха/Шилонен → Таяние только как крайний случай.

Саппорты с **долгими** карманами важнее: в стойке не хочется часто свапаться.`,
    },
    {
      id: uid(),
      type: "roleTable",
      eyebrow: "Отряды",
      title: "Приоритетные персонажи",
      intro: "Ядро — Эскофье + Фурина + Е Лань / Шэнь Хэ. Без Эскофье — Ситлали.",
      rows: roleRows,
    },
    {
      id: uid(),
      type: "teamGroup",
      eyebrow: "Отряды",
      title: "Примеры сильных команд",
      intro: "Топ — Заморозка с Эскофье; также револьвер и бюджетные 4★.",
      variants: teams,
    },
    {
      id: uid(),
      type: "resourceTable",
      title: "Возвышение",
      intro: "Нефрит Шивада + диковинка Натлана и материалы Фонтейна:",
      rows: [
        {
          id: uid(),
          name: matJade1?.name || "Нефрит Шивада",
          image: matJade1?.image || "",
          qty: "1→9→9→6",
          where: "Мировые и еженедельные боссы (серия нефрита Шивада)",
          href: matJade1 ? `/wiki/materials/${matJade1.slug}` : undefined,
        },
        {
          id: uid(),
          name: matLocal?.name || "Заоблачный камнелист",
          image: matLocal?.image || "",
          qty: "168",
          where: "Диковинка Атокпана (Натлан)",
          href: matLocal ? `/wiki/materials/${matLocal.slug}` : undefined,
        },
        {
          id: uid(),
          name: matBoss?.name || "Сковывающий взгляд",
          image: matBoss?.image || "",
          qty: "46",
          where: "Сумрачная папилла",
          href: matBoss ? `/wiki/materials/${matBoss.slug}` : undefined,
        },
        {
          id: uid(),
          name: "Шестерни меков",
          image: matGear3?.image || matGear1?.image || "",
          qty: "18 / 30 / 36",
          where: "Меки Фонтейна",
          href: matGear1 ? `/wiki/materials/${matGear1.slug}` : undefined,
        },
      ],
    },
    {
      id: uid(),
      type: "resourceTable",
      title: "Таланты",
      intro: "На одну способность до 10 ур. Книги «Соперничество» — Огненные руины (пн/чт/вс).",
      rows: [
        {
          id: uid(),
          name: matBook3?.name || "Книги о «Соперничестве»",
          image: matBook3?.image || "",
          qty: "3 / 21 / 38",
          where: "Огненные руины — пн, чт, вс",
          href: matBook1 ? `/wiki/materials/${matBook1.slug}` : undefined,
        },
        {
          id: uid(),
          name: "Шестерни меков",
          image: matGear3?.image || "",
          qty: "6 / 21 / 31",
          where: "Меки Фонтейна",
          href: matGear3 ? `/wiki/materials/${matGear3.slug}` : undefined,
        },
        {
          id: uid(),
          name: matWeekly?.name || "Вознёсшийся образец: Конь",
          image: matWeekly?.image || "",
          qty: "6",
          where: "Еженедельный босс «Игра пред вратами»",
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
        "Растёт **крит. урон** (**+38.4%** на 90 ур., итого ~**88.4%** с базовыми 50%). Качайте до **90** — основной урон пачки от неё.",
      colLabels: ["Уровень", "HP", "АТК", "Защита", "Базовый К/У", "Бонус К/У"],
      rows: [
        emptyStatsRow("1", "1192", "19", "54", "50%", "0%"),
        emptyStatsRow("20", "3092", "50", "140", "50%", "0%"),
        emptyStatsRow("40", "6127", "98", "278", "50%", "0%"),
        emptyStatsRow("50", "7896", "127", "359", "50%", "9.6%"),
        emptyStatsRow("60", "9925", "159", "451", "50%", "19.2%"),
        emptyStatsRow("70", "11724", "188", "532", "50%", "19.2%"),
        emptyStatsRow("80", "13532", "217", "615", "50%", "28.8%"),
        emptyStatsRow("90", "15307", "244", "696", "50%", "38.4%"),
      ],
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Геймплей",
      title: "Способности",
      body: `Суть — войти в **Семифазную вспышку**, копить/тратить **Змеиное коварство**, поглощать **Разрывы пустоты** и бить обычными под баффом ульты (или сбрасывать Q в револьвере).

### Приоритет прокачки
**E = Q > обычные** (обычные можно не качать — проценты в стойке идут от Е).

### Активные
- **Хаос: Раскол (NA)** — до 5 ударов; заряженная — кристальное копьё; падение — AoE.
- **Хаос: Искажение (E)** — тап: 45 ед. коварства + стойка ~12.5 сек. Холд: быстрый полёт (можно по воде) и тоже 45 ед.
- **Хаос: Разрушение (Q)** — рубящие удары за стаки коварства; в стойке особый режим **Хаос: Опустошение** поглощает Разрывы и баффает обычные (до ~10 применений).

### Пассивки
- **Разум за гранью разума** — Крио-реакции создают Разрывы пустоты; поглощение (заряж. / ульта / холд-Е) даёт коварство.
- **Возвращение в небытие** — Гидро/Крио союзники дают уровни Переправы смерти → множители НА и Q (нужны оба элемента в пачке).
- **Взаимное наставничество по оружию** — в чистом Крио+Гидро отряде +1 ур. Е всем.

### Созвездия
Сильнее всего **С1** (клинок при поглощении Разрывов) и **С2** (больше коварства + АТК после Опустошения). **С6** — Хаос: Отсечение с доп. атаками и снижением входящего урона.`,
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Геймплей",
      title: "Как играть и стоит ли выбивать",
      body: `### Ротация от обычных (мейн-дд)
**Саппорты → тап-Е → Q (поглотить Разрывы) → заряженная при необходимости → ~10 обычных → свап.**

Перед окном НА желательно поглотить до **трёх** Разрывов. Бафф Опустошения покрывает ограниченное число ударов — не держите стойку «впустую».

### Ротация от ульты (револьвер)
**Саппорты → холд-Е → Q → уход.** Нужна **Эскофье**; иначе такие пачки слабые.

### С1 или сигна?
Если уже есть **Харан / Рассекающий туман / Омут** — берите **С1**. Иначе **Лазурное сияние** сильнее по статам и комфорту баланса.

### Без Эскофье?
Играбельна с Шэнь Хэ и сильными Гидро сабами (Фурина + Е Лань + Ситлали), но заметно слабее. Если Крио/Гидро ростер пустой — лучше подождать.

### Итог
Топ **Крио мейн** при наличии Эскофье и чистой Заморозки. Сборка простая, отряды узкие, зависимость от шеф-повара высокая.`,
    },
  ];

  const levelMaterials: CharacterMaterial[] = [
    matCard(matLocal, "Заоблачный камнелист", 168, "local", 1),
    matCard(matBoss, "Сковывающий взгляд", 46, "boss", 4),
    matCard(matJade1, "Осколок нефрита Шивада", 1, "ascension", 2),
    matCard(matJade2, "Фрагмент нефрита Шивада", 9, "ascension", 3),
    matCard(matJade3, "Кусок нефрита Шивада", 9, "ascension", 4),
    matCard(matJade4, "Драгоценный нефрит Шивада", 6, "ascension", 5),
    matCard(matGear1, "Сцепляющаяся шестерня", 18, "ascension", 1),
    matCard(matGear2, "Шестерня механизма", 30, "ascension", 2),
    matCard(matGear3, "Изощрённая динамическая шестерня", 36, "ascension", 3),
    matCard(matBook1, "Учения о «Соперничестве»", 9, "talent", 2),
    matCard(matBook2, "Указания о «Соперничестве»", 63, "talent", 3),
    matCard(matBook3, "Философия о «Соперничестве»", 114, "talent", 4),
    matCard(matWeekly, "Вознёсшийся образец: Конь", 18, "talent", 5),
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
      name: ex.talents["6"].name,
      icon: `${iconBase}/utility.png`,
      description: ex.talents["6"].description,
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
    "Скирк — Крио мейн от стойки: Заморозка, Финал галерей, Лазурное сияние и отряды с Эскофье.";

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
    element: Element.CRYO,
    weaponType: "Меч",
    region: "Исчезнувшая планета",
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
