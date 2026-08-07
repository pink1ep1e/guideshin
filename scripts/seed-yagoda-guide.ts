/**
 * Импорт гайда на Ягоду.
 *
 *   npx tsx scripts/templates/fetch-guide-sources.ts   # CONFIG: yagoda / 10000124
 *   npx tsx scripts/seed-yagoda-guide.ts
 *
 * НЕ трогаем image / splashImage.
 * Таланты/консты — из scripts/_cache/yagoda/yatta-extracted.json (RU).
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

const SLUG = "yagoda";
const NAME = "Ягода";
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
    elementIcon: ELEMENT_SVG.ANEMO,
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

  const artVV = a("Изумрудная тень");
  const artInstruktor = a("Инструктор");
  const artSerenada = a("Серенада шёлковой луны", "Серенада шелковой луны");
  const artTenacity = a("Стойкость Миллелита", "Стойкость миллелита");
  const artNoblesse = a("Церемония древней знати");
  const artGlad = a("Конец гладиатора");
  const artEmblem = a("Эмблема рассечённой судьбы", "Эмблема рассеченной судьбы");
  const artNoch = a("Ночь открытия неба");
  const artRassvet = a("Рассветная песнь звезды и луны");

  const weaponItems: GuideRankedItem[] = [
    rankedWeapon(
      w("Элегия погибели"),
      1,
      "Элегия погибели",
      "Топ · ВЭ / бафф",
      "МС носителю; после Е/Q — Талисманы → бафф МС и АТК отряду.",
      "Лучший лук: ВЭ, МС и командный бафф под Нод-Край / реакции.",
      "S",
    ),
    rankedWeapon(
      w("Боевой лук Фавония"),
      2,
      "Боевой лук Фавония",
      "Универсал · ВЭ",
      "Крит. попадания создают частицы энергии.",
      "Лучший эпик: закрывает ВЭ, позволяет фармить АТК в артефактах. Нужен К/Ш ~40–60%.",
      "S",
    ),
    rankedWeapon(
      w("Струны дождя радужного змея"),
      3,
      "Струны дождя радужного змея",
      "Ивент · ВЭ / АТК",
      "Атаки из кармана повышают АТК носителя.",
      "Бесплатный лук: ВЭ + стабильный АТК из кармана.",
      "A",
    ),
    rankedWeapon(
      w("Дальномер"),
      4,
      "Дальномер",
      "АТК · хил",
      "Метки за лечение → АТК% и бонус всех элементов при Е/Q.",
      "Сильный АТК для хила; Ягода сама лечит и легко копит метки.",
      "A",
    ),
    rankedWeapon(
      w("Мелодия покоя"),
      5,
      "Мелодия покоя",
      "Крафт · АТК",
      "После получения лечения — бонус урона (в т.ч. из кармана).",
      "Крафт Фонтейна: АТК для хила и личный урон.",
      "B",
    ),
    rankedWeapon(
      w("Алое перо звёздного грифа", "Алое перо звездного грифа"),
      6,
      "Алое перо звёздного грифа",
      "Легендарка · АТК после Рассеивания",
      "После Рассеивания — АТК%; бонус Q при не-Анемо союзниках.",
      "К/У не нужен саппорту, но база и бафф после Рассеивания сильные.",
      "B",
    ),
    rankedWeapon(
      w("Охотник во тьме"),
      7,
      "Охотник во тьме",
      "АТК · карман",
      "Урон из кармана растёт со временем вне поля.",
      "АТК + карманный урон; ВЭ придётся добирать в сабах.",
      "C",
    ),
    rankedWeapon(
      w("Лук Амоса"),
      8,
      "Лук Амоса",
      "Только АТК",
      "Бафф обычных/заряженных почти бесполезен.",
      "Запасной источник высокой АТК ради хила.",
      "C",
    ),
  ];

  const artItems: GuideRankedItem[] = [
    rankedArt(
      artVV,
      1,
      "Изумрудная тень",
      "Топ-1 · 4п",
      "2п Анемо%; 4п — урон Рассеивания и −40% RES к рассеянному элементу.",
      "Лучший Анемо-сет: шред и усиление реакций отряда.",
      "S",
    ),
    rankedArt(
      artInstruktor,
      2,
      "Инструктор",
      "4★ · МС",
      "2п +80 МС; 4п — +120 МС отряду после реакции.",
      "Сильный эпик в реакционных пачках; бафф МС себе и команде.",
      "A",
    ),
    rankedArt(
      artSerenada,
      3,
      "Серенада шёлковой луны",
      "Нод-Край · 4п",
      "2п +20% ВЭ; 4п — МС отряду и усиление Лунных реакций.",
      "В командах с героями Нод-Края / Лунным знамением.",
      "A",
    ),
    rankedArt(
      artTenacity,
      4,
      "Стойкость Миллелита",
      "Бафф АТК · 4п",
      "4п: попадание Е — +20% АТК отряду (в т.ч. из кармана).",
      "Е стабильно бьёт при Высшем сиянии — держит бафф АТК.",
      "B",
    ),
    rankedArt(
      artNoblesse,
      5,
      "Церемония древней знати",
      "Бафф АТК · Q",
      "4п: после ульты +20% АТК отряду на 12 сек.",
      "Если в отряде нет другого носителя Знати.",
      "B",
    ),
    rankedArt(
      artGlad || artEmblem,
      6,
      "2+2 АТК / ВЭ",
      "Временный 2+2",
      "2п АТК% + 2п АТК% или 2п АТК + 2п ВЭ.",
      "Пока нет 4п VV/Серенады — максимум АТК для хила или добор ВЭ.",
      "C",
    ),
  ];
  if (artItems[5]) artItems[5].name = "2+2 АТК (Гладиатор и др.) / АТК+ВЭ";

  const matShaft1 = m("Сломанный вал");
  const matShaft2 = m("Усиленный вал");
  const matShaft3 = m("Высокоточный вал");
  const matBook1 = m("Учения о «Скитании»");
  const matBook2 = m("Указания о «Скитании»");
  const matBook3 = m("Философия о «Скитании»");
  const matTurq1 = m("Осколок бирюзы Вайюда", "Осколок бирюзы");
  const matTurq2 = m("Фрагмент бирюзы Вайюда", "Фрагмент бирюзы");
  const matTurq3 = m("Кусок бирюзы Вайюда", "Кусок бирюзы");
  const matTurq4 = m("Драгоценная бирюза Вайюда", "Драгоценная бирюза");
  const matBoss = m("Светящееся чешуйчатое перо");
  const matLocal = m("Переносной подшипник");
  const matWeekly = m("Вознёсшийся образец: Конь", "Вознесшийся образец: Конь");
  const matCrown = m("Корона прозрения");

  const roleRows: GuideRoleRow[] = [
    {
      id: uid(),
      name: c("flins")?.name || "Флинс",
      image: c("flins")?.image || "",
      element: "Электро",
      elementIcon: ELEMENT_SVG.ELECTRO,
      weapon: "Копьё",
      weaponIcon: "",
      description:
        "Мейн-дд Лунного заряда. Без Инеффы нужен хил; Ягода даёт знамение, VV-шред и лечение.",
      href: c("flins") ? `/wiki/characters/${c("flins")!.slug}` : undefined,
      rarity: 5,
    },
    {
      id: uid(),
      name: c("ineffa")?.name || "Инеффа",
      image: c("ineffa")?.image || "",
      element: "Электро",
      elementIcon: ELEMENT_SVG.ELECTRO,
      weapon: "Копьё",
      weaponIcon: "",
      description: "Лунный заряд + уровень Знамения; вместе с Ягодой открывает хил/МС почти любому дд.",
      href: c("ineffa") ? `/wiki/characters/${c("ineffa")!.slug}` : undefined,
      rarity: 5,
    },
    {
      id: uid(),
      name: c("ajno")?.name || "Айно",
      image: c("ajno")?.image || "",
      element: "Гидро",
      elementIcon: ELEMENT_SVG.HYDRO,
      weapon: "Двуручник",
      weaponIcon: "",
      description: "Гидро-аппликатор Нод-Края; взаимно закрывают Знамение.",
      href: c("ajno") ? `/wiki/characters/${c("ajno")!.slug}` : undefined,
      rarity: 4,
    },
    {
      id: uid(),
      name: c("nefer")?.name || "Нефер",
      image: c("nefer")?.image || "",
      element: "Дендро",
      elementIcon: ELEMENT_SVG.DENDRO,
      weapon: "Катализатор",
      weaponIcon: "",
      description: "Нуждается в хиле и баффе МС; Ягода поглощает Гидро саб-дд под Лунную бутонизацию.",
      href: c("nefer") ? `/wiki/characters/${c("nefer")!.slug}` : undefined,
      rarity: 5,
    },
    {
      id: uid(),
      name: c("lauma")?.name || "Лаума",
      image: c("lauma")?.image || "",
      element: "Дендро",
      elementIcon: ELEMENT_SVG.DENDRO,
      weapon: "Катализатор",
      weaponIcon: "",
      description: "Пара с Нефер / Гидро-дд; Ягода — хил и МС.",
      href: c("lauma") ? `/wiki/characters/${c("lauma")!.slug}` : undefined,
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
      description: "Сильно режет HP — Ягоде нужна сборка в хил и высокий ВЭ, иначе бафф МС не сработает.",
      href: c("furina") ? `/wiki/characters/${c("furina")!.slug}` : undefined,
      rarity: 5,
    },
  ];

  const teams: GuideTeamVariant[] = [
    {
      id: uid(),
      badge: "Лунный заряд",
      features:
        "Флинс без Инеффы: Фишль + Айно (или Син Цю / Е Лань) + Ягода. VV-шред, хил и закрытие Знамения.",
      members: [
        member(c("flins"), "Флинс", "Мейн-дд"),
        member(c("fischl"), "Фишль", "Электро саб"),
        member(c("ajno"), "Айно", "Гидро"),
        self("Хил / Анемо"),
      ],
    },
    {
      id: uid(),
      badge: "Лунная бутонизация",
      features:
        "Нефер + Лаума + Фурина + Ягода. Хил должен перекрывать drain Фурины, иначе бафф МС не держится.",
      members: [
        member(c("nefer"), "Нефер", "Мейн-дд"),
        member(c("lauma"), "Лаума", "Дендро саб"),
        member(c("furina"), "Фурина", "Гидро саб"),
        self("Хил"),
      ],
    },
    {
      id: uid(),
      badge: "Нефер · бюджет",
      features:
        "Без Лаумы: Нахида или Коллеи + Айно + Ягода. Ягода компенсирует статус от Айно (Дендро не поглощает).",
      members: [
        member(c("nefer"), "Нефер", "Мейн-дд"),
        member(c("nahida"), "Нахида", "Дендро"),
        member(c("ajno"), "Айно", "Гидро"),
        self("Хил"),
      ],
    },
    {
      id: uid(),
      badge: "Нёвиллет · ЛЗ",
      features: "Нёвиллет + Фурина + Инеффа + Ягода. Ульта красится в Гидро, Рассеивание даёт доп. взаимодействия.",
      members: [
        member(c("neuvillette"), "Нёвиллет", "Мейн-дд"),
        member(c("furina"), "Фурина", "Гидро саб"),
        member(c("ineffa"), "Инеффа", "Электро / знамение"),
        self("Хил / Анемо"),
      ],
    },
    {
      id: uid(),
      badge: "Пар · Арлекино",
      features: "Арлекино + Е Лань/Син Цю + Айно + Ягода. Хила Слуге мало нужно — ценен бафф МС и доп. Гидро.",
      members: [
        member(c("arlekino"), "Арлекино", "Мейн-дд"),
        member(c("yelan"), "Е Лань", "Гидро саб"),
        member(c("ajno"), "Айно", "Гидро / знамение"),
        self("МС / хил"),
      ],
    },
  ];

  const blocks: GuideBlock[] = [
    {
      id: uid(),
      type: "text",
      eyebrow: "Обзор",
      title: "Кто такая Ягода",
      body: `Ягода — **Анемо лучница 4★**, сотрудница **Куратория тайн** (Нод-Край). Роль — **хилер / саппорт реакций**: Рассеивание, лечение с ульты, **+100 МС** активному (если HP > 70%) и **+1** к **Лунному знамению**. При Высшем сиянии способности поглощают Пиро / Гидро / Электро / Крио и бьют этим элементом из кармана.

### Кратко
- **Рейтинг** — B
- **Стихия / оружие** — Анемо · лук
- **Возвышение** — бонус лечения (**+18.5%** на 90 ур.)
- **База на 90 ур.** — HP **9 646** · АТК **223** · Защита **580** · бонус лечения **18.5%**
- **Добавлена** — патч **6.2**
- **День рождения** — 5 января
- **Регион / фракция** — Нод-Край · Кураторий тайн
- **Созвездие** — Земляника
- **Особое блюдо** — Домашняя работа
- **Именная карточка** — Охотница на ветер и тени

Сборка простая: **АТК** (хил и урон) + **ВЭ** для ульты. Бафф МС не зависит от её статов. Комфортнее всего с ещё одним героем Нод-Края.`,
    },
    {
      id: uid(),
      type: "prosCons",
      eyebrow: "Анализ",
      title: "Преимущества и недостатки",
      prosTitle: "Преимущества",
      consTitle: "Недостатки",
      pros: [
        "**Простая сборка** — АТК и ВЭ; криты только с Фавонием.",
        "**Бафф +100 МС** с ульты (при HP цели > 70%) — редкое усиление реакций.",
        "Носит **Изумрудную тень** или **Серенаду шёлковой луны**.",
        "**+1 к Лунному знамению** — закрывает Высшее сияние для напарников Нод-Края.",
      ],
      cons: [
        "Слабо раскрывается **вне** отрядов Нод-Края / без Высшего сияния.",
        "Сложно сделать сильным саб-дд: урон в основном с Q, откат длиннее длительности.",
        "Бафф МС **не работает**, пока HP активного ≤ 70% (проблема с Фуриной без сильного хила).",
        "Е требует **несколько секунд на поле** для зарядки фляжки.",
      ],
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Билд",
      title: "Как собирать Ягоду",
      body: `Саппорт: Рассеивание, хил и бафф МС. Собирайте в **силу атаки** — от неё зависят урон и лечение. **ВЭ** обязателен: хил только с ульты.

Кубок — **АТК%** (Анемо-урона мало). Пески — **ВЭ%** или **АТК%**. Корона — **бонус лечения** (крит. шанс — только под Фавоний). Криты ради урона обычно не стоят потери хила.`,
    },
    {
      id: uid(),
      type: "statTargets",
      eyebrow: "Билд",
      title: "Рекомендуемые значения характеристик",
      intro: "Приоритет: АТК для хила, ВЭ для ульты по откату.",
      targets: [
        {
          id: uid(),
          label: "АТК",
          value: "1500+",
          hint: "Чем выше — тем сильнее хил и личный урон",
        },
        {
          id: uid(),
          label: "ВЭ",
          value: "180–200%",
          hint: "Зависит от созвездий и Фавония",
        },
        {
          id: uid(),
          label: "МС",
          value: "150–250",
          hint: "Опционально через реакции, не в ущерб АТК/ВЭ",
        },
        {
          id: uid(),
          label: "К/Ш",
          value: "40–60%",
          hint: "Только с Боевым луком Фавония",
        },
      ],
      slots: [
        { id: uid(), slot: "Пески", main: "ВЭ% / АТК%", subs: "АТК% · ВЭ% · К/Ш" },
        { id: uid(), slot: "Кубок", main: "АТК%", subs: "АТК · ВЭ% · К/Ш" },
        { id: uid(), slot: "Корона", main: "Бонус лечения% / К/Ш", subs: "АТК% · ВЭ%" },
      ],
    },
    {
      id: uid(),
      type: "rankedList",
      eyebrow: "Оружие",
      title: "Рейтинг оружия",
      intro: "Нужны **АТК** и **ВЭ** для ульты. МС полезен в реакциях; криты — в основном под Фавоний.",
      kind: "weapons",
      items: weaponItems,
    },
    {
      id: uid(),
      type: "rankedList",
      eyebrow: "Артефакты",
      title: "Полезные артефакты",
      intro:
        "Цель почти всегда — **4п Изумрудная тень**. В Нод-Крае — **Серенада**; на старте — **Инструктор** или **2+2 АТК**.",
      kind: "artifacts",
      items: artItems,
    },
    {
      id: uid(),
      type: "setPlan",
      eyebrow: "Артефакты",
      title: "Как раздать сеты в Лунном заряде",
      intro: "Ориентир: VV на Ягоде, дд-сет на Флинсе, саппортский — на Инеффе/Айно.",
      groups: [
        {
          id: uid(),
          title: "Лунный заряд · Флинс",
          rows: [
            planRow(c("flins"), "Флинс", "Ночь открытия неба", artImg(artNoch, "Ночь открытия неба")),
            planRow(
              c("ineffa"),
              "Инеффа",
              "Рассвет / Серенада",
              artImg(artRassvet || artSerenada, "Рассвет"),
            ),
            {
              id: uid(),
              name: NAME,
              image: IMAGE,
              href: `/wiki/characters/${SLUG}`,
              setName: "Изумрудная тень",
              setImage: artImg(artVV, "Изумрудная тень"),
            },
            planRow(c("ajno"), "Айно", "Серенада шёлковой луны", artImg(artSerenada, "Серенада")),
          ],
        },
      ],
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Отряды",
      title: "Отряды под Нод-Край и реакции",
      body: `Нужен ещё **хотя бы один** герой Нод-Края (или иной источник Высшего сияния), иначе поглощение элементов не работает и Ягода остаётся слабым Анемо-хилером с длинными откатами.

Идеально — Пиро / Гидро / Электро / Крио для зарядки фляжки и котординаторов. Приоритет поглощения: **Пиро → Гидро → Электро → Крио**.`,
    },
    {
      id: uid(),
      type: "roleTable",
      eyebrow: "Отряды",
      title: "Приоритетные персонажи",
      intro: "Лучшие союзники для Ягоды:",
      rows: roleRows,
    },
    {
      id: uid(),
      type: "teamGroup",
      eyebrow: "Отряды",
      title: "Примеры сильных команд",
      intro: "Ядро — Лунный резонанс + хил / шред / МС.",
      variants: teams,
    },
    {
      id: uid(),
      type: "resourceTable",
      title: "Возвышение",
      intro: "Ресурсы для возвышения Ягоды (бирюза Вайюда + материалы Нод-Края):",
      rows: [
        {
          id: uid(),
          name: matTurq1?.name || "Бирюза Вайюда",
          image: matTurq1?.image || "",
          qty: "1→9→9→6",
          where: "Еженедельные и мировые боссы (серия бирюзы Вайюда)",
          href: matTurq1 ? `/wiki/materials/${matTurq1.slug}` : undefined,
        },
        {
          id: uid(),
          name: matLocal?.name || "Переносной подшипник",
          image: matLocal?.image || "",
          qty: "168",
          where: "Диковинка Нод-Края",
          href: matLocal ? `/wiki/materials/${matLocal.slug}` : undefined,
        },
        {
          id: uid(),
          name: matBoss?.name || "Светящееся чешуйчатое перо",
          image: matBoss?.image || "",
          qty: "46",
          where: "Мировой босс: Лучезарный мотылёк-призрак",
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
          name: matBook1?.name || "Учения о «Скитании»",
          image: matBook1?.image || "",
          rarity: 2 as const,
          note: "×3",
          qty: "3",
          href: matBook1 ? `/wiki/materials/${matBook1.slug}` : undefined,
        },
        {
          id: uid(),
          name: matBook2?.name || "Указания о «Скитании»",
          image: matBook2?.image || "",
          rarity: 3 as const,
          note: "×21",
          qty: "21",
          href: matBook2 ? `/wiki/materials/${matBook2.slug}` : undefined,
        },
        {
          id: uid(),
          name: matBook3?.name || "Философия о «Скитании»",
          image: matBook3?.image || "",
          rarity: 4 as const,
          note: "×38",
          qty: "38",
          href: matBook3 ? `/wiki/materials/${matBook3.slug}` : undefined,
        },
        {
          id: uid(),
          name: matWeekly?.name || "Вознёсшийся образец: Конь",
          image: matWeekly?.image || "",
          rarity: 5 as const,
          note: "×6",
          qty: "6",
          href: matWeekly ? `/wiki/materials/${matWeekly.slug}` : undefined,
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
        "Растёт **бонус лечения** (**+18.5%** на 90 ур.). Достаточно **80/90** — до 90 и Блуждающей удачи необязательно.",
      colLabels: [
        "Уровень",
        "Базовое HP",
        "Базовая сила атаки",
        "Базовая защита",
        "Базовый К/Ш",
        "Бонус лечения (возвышение)",
      ],
      rows: [
        emptyStatsRow("1", "809", "19", "49", "5%", "0%"),
        emptyStatsRow("20", "2 682", "62", "161", "5%", "0%"),
        emptyStatsRow("40", "4 446", "103", "267", "5%", "4.6%"),
        emptyStatsRow("50", "5 687", "131", "342", "5%", "9.2%"),
        emptyStatsRow("60", "6 784", "157", "408", "5%", "9.2%"),
        emptyStatsRow("70", "7 881", "182", "474", "5%", "13.9%"),
        emptyStatsRow("80", "8 978", "208", "540", "5%", "18.5%"),
        emptyStatsRow("90", "9 646", "223", "580", "5%", "18.5%"),
      ],
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Геймплей",
      title: "Способности",
      body: `Ягода — **хилер и аппликатор** при Высшем сиянии: фляжка и котординаторы поглощают стихии и бьют ими из кармана.

### Приоритет прокачки
**Q ≥ E > обычные** (обычные не качать).

### Активные
- **Стреляй пока горячо** — 3 выстрела; заряженная — Анемо-стрела; падение — залп по площади.
- **Хитроумный план: Раздел добычи (Е)** — Преследующая тень + **Секретная буль-буль-фляжка** (заряжается Пиро/Гидро/Электро/Крио). В конце / повторном Е — Анемо по площади. При Высшем сиянии полная фляжка стреляет **Пушистыми котошариками** поглощённым элементом и возвращает энергию. Длит. **20** сек., откат **15**.
- **Тузы в рукаве: Семь инструментов охотника (Q)** — два **котординатора**: Анемо-удары + хил активного (и доп. хил самому слабому, если HP активного > 70%). При Высшем сиянии перекрашиваются в элемент врагов (приоритет Пиро→Гидро→Электро→Крио). **70** энергии, откат **18**, длит. **12**.

### Пассивки
- **Остроумный план истребования оплаты** — бонус котординаторам от преобладающей стихии в отряде (Пиро урон / Гидро хил / Электро +1 / Крио скорость).
- **Сладкая ягодная награда** — при хиле активного с HP > 70% даёт ему **+100 МС** на 6 сек.
- **Дар лунного знамения: Бегом по карнизам** — уровень Знамения **+1**.
- **Находчивость переулков** — экспедиции в Нод-Край **−25%** времени.

### Созвездия
Лучшие — **С1**, **С2**, **С6**: отскок котошариков, два элементальных бонуса ульты сразу, крит. масса героям Лунного знамения при полной фляжке.`,
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Геймплей",
      title: "Как играть и стоит ли выбивать",
      body: `### Ротация
**Статус саб-дд → Е Ягоды (подождать заряд фляжки) → Q → мейн-дд.** Обновляйте Е/Q по откату.

### Итог
Удобный **Анемо-хилер Нод-Края** с редким баффом МС и аппликацией при Высшем сиянии. Сильнее всего с Флинсом / Нефер / Инеффой / Айно. Без напарника из региона ценность резко падает.

Имеет смысл, если нужны хил + Знамение + VV в лунных пачках; в «обычном» Анемо-саппорте уступает Сахарозе / другим опциям с короткими откатами.`,
    },
  ];

  const levelMaterials: CharacterMaterial[] = [
    matCard(matLocal, "Переносной подшипник", 168, "local", 1),
    matCard(matBoss, "Светящееся чешуйчатое перо", 46, "boss", 4),
    matCard(matTurq1, "Осколок бирюзы Вайюда", 1, "ascension", 2),
    matCard(matTurq2, "Фрагмент бирюзы Вайюда", 9, "ascension", 3),
    matCard(matTurq3, "Кусок бирюзы Вайюда", 9, "ascension", 4),
    matCard(matTurq4, "Драгоценная бирюза Вайюда", 6, "ascension", 5),
    matCard(matShaft1, "Сломанный вал", 18, "ascension", 1),
    matCard(matShaft2, "Усиленный вал", 30, "ascension", 2),
    matCard(matShaft3, "Высокоточный вал", 36, "ascension", 3),
    matCard(matBook1, "Учения о «Скитании»", 9, "talent", 2),
    matCard(matBook2, "Указания о «Скитании»", 63, "talent", 3),
    matCard(matBook3, "Философия о «Скитании»", 114, "talent", 4),
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
    "Ягода — Анемо хилер и саппорт Лунного знамения: билд, оружие, сеты и отряды.";

  const minOrder = await prisma.character.aggregate({ _min: { order: true } });
  const order = (minOrder._min.order ?? 1) - 1;

  const data = {
    name: NAME,
    rarity: Rarity.EPIC,
    element: Element.ANEMO,
    weaponType: "Лук",
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
