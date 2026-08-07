/**
 * Импорт гайда на Дурина.
 *
 *   npx tsx scripts/templates/fetch-guide-sources.ts   # CONFIG: durin / 10000123
 *   npx tsx scripts/seed-durin-guide.ts
 *
 * НЕ трогаем image / splashImage.
 * Таланты/консты — из scripts/_cache/durin/yatta-extracted.json (RU, cleanYattaText).
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

const SLUG = "durin";
const NAME = "Дурин";
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
    elementIcon: ELEMENT_SVG.PYRO,
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

  const artDay = a("День восходящих ветров");
  const artNoblesse = a("Церемония древней знати");
  const artDar = a("Дар небес");
  const artHunter = a("Охотник Сумеречного двора");
  const artCrimson = a("Горящая алая ведьма");
  const artParadise = a("Цветок потерянного рая");
  const artVV = a("Изумрудная тень");
  const artGlad = a("Конец гладиатора");

  const weaponItems: GuideRankedItem[] = [
    rankedWeapon(
      w("Атаме артис"),
      1,
      "Атаме артис",
      "Сигна · К/Ш",
      "К/У ульты; после Q — АТК себе и отряду; с Тайным обрядом бафф ×1.75.",
      "Сигна под обе формы. Полностью раскрывается в Шабаше.",
      "S",
    ),
    rankedWeapon(
      w("Драгоценный омут"),
      2,
      "Драгоценный омут",
      "К/Ш · HP→АТК",
      "HP%; АТК от макс. HP.",
      "Универсальный 5★ на обе стойки: криты и АТК без жёстких условий.",
      "A",
    ),
    rankedWeapon(
      w("Рассекающий туман"),
      3,
      "Рассекающий туман",
      "К/У · элем. урон",
      "Бонус элем. урона + стаки Эмблемы рассекателя тумана.",
      "Лучше в тёмной стойке ради личного урона.",
      "A",
    ),
    rankedWeapon(
      w("Волчий клык"),
      4,
      "Волчий клык",
      "БП · К/Ш",
      "Урон Е/Q + стаки К/Ш на Е/Q.",
      "Топ эпик; на высоких R конкурирует с легендарками (кроме сигны).",
      "A",
    ),
    rankedWeapon(
      w("Драконий рык"),
      5,
      "Драконий рык",
      "АТК% · Перегрузка",
      "Урон по врагам с Пиро/Электро.",
      "Силён на R5 в Перегрузке/прожарке; только светлая форма.",
      "B",
    ),
    rankedWeapon(
      w("Грандиозный финал глубин"),
      6,
      "Грандиозный финал глубин",
      "F2P · АТК%",
      "После Е — АТК% и Долг жизни; после снятия Долга — ещё АТК.",
      "Бесплатный R5 с хилером. Чуть слабее Драконьего рыка, но универсальнее.",
      "B",
    ),
    rankedWeapon(
      w("Клятва свободы"),
      7,
      "Клятва свободы",
      "МС · бафф отряду",
      "Урон%; симфония — урон НА и АТК отряду.",
      "Саппортский меч под АТК-мейн-дд; МС удобен в тёмной стойке.",
      "B",
    ),
    rankedWeapon(
      w("Предвестник зари"),
      8,
      "Предвестник зари",
      "F2P · К/У",
      "+К/Ш при HP > 90%.",
      "Доступные криты; низкая база. Плохо с Фуриной.",
      "C",
    ),
    rankedWeapon(
      w("Рассвет прядильщицы луны"),
      9,
      "Рассвет прядильщицы луны",
      "АТК% · ульта",
      "Урон Q; доп. бонус при макс. энергии ≤60/40.",
      "Условие по энергии Дурин почти не закрывает. R5 — второй эпик.",
      "C",
    ),
  ];

  const artItems: GuideRankedItem[] = [
    rankedArt(
      artDay,
      1,
      "День восходящих ветров",
      "Топ-1 · Ведьмовство",
      "2п АТК%; 4п АТК после ударов; после уроков ведьм — +20% К/Ш.",
      "Сигнатурный сет: легче добрать 2500 АТК и криты. Работает из кармана.",
      "S",
    ),
    rankedArt(
      artNoblesse,
      2,
      "Церемония древней знати",
      "Саппорт · АТК-пачки",
      "2п урон Q; 4п +20% АТК отряду после ульты.",
      "Личный урон Q + бафф мейн-дд от АТК. В HP-парках Знать слабее.",
      "A",
    ),
    rankedArt(
      artDar,
      3,
      "Дар небес",
      "Моно-Пиро / без Николь",
      "2п ВЭ%; 4п элем. бонус союзникам после Е (сильнее с Тайным обрядом).",
      "Не баффает личный урон Дурина — только мейн-дд.",
      "A",
    ),
    rankedArt(
      artHunter,
      4,
      "Охотник Сумеречного двора",
      "Мейн-дд с Фуриной",
      "2п урон НА; 4п К/Ш при изменении HP.",
      "Только гипер-керри с инфузией Беннета С6 + Фурина.",
      "B",
    ),
    rankedArt(
      artNoblesse || artCrimson,
      5,
      "2+2 Знать / Алая ведьма",
      "Личный урон",
      "2п урон Q + 2п Пиро урон.",
      "Сильнее большинства 2+2 АТК, пока нет 4п Дня ветров.",
      "B",
    ),
  ];
  if (artItems[4]) artItems[4].name = "2+2 Знать + Алая ведьма";

  const matWarrant1 = m("Потрёпанный мандат", "Потрепанный мандат");
  const matWarrant2 = m("Безупречный мандат");
  const matWarrant3 = m("Заиндевевший мандат");
  const matBook1 = m("Учения о «Поэзии»");
  const matBook2 = m("Указания о «Поэзии»");
  const matBook3 = m("Философия о «Поэзии»");
  const matTurq1 = m("Осколок агата Агнидус");
  const matTurq2 = m("Фрагмент агата Агнидус");
  const matTurq3 = m("Кусок агата Агнидус");
  const matTurq4 = m("Драгоценный агат Агнидус");
  const matBoss = m("Циклическое военное ядро куувяки", "Циклическое военное ядро куувахки");
  const matLocal = m("Инеевый цветок");
  const matWeekly = m("Истлевшее солнечное пламя");
  const matCrown = m("Корона прозрения");

  const roleRows: GuideRoleRow[] = [
    {
      id: uid(),
      name: c("nikol")?.name || "Николь",
      image: c("nikol")?.image || "",
      element: "Пиро",
      elementIcon: ELEMENT_SVG.PYRO,
      weapon: "Катализатор",
      weaponIcon: "",
      description: "Топ союзник обеих форм: резонанс, Дар небес, щит, Шабаш.",
      href: c("nikol") ? `/wiki/characters/${c("nikol")!.slug}` : undefined,
      rarity: 5,
    },
    {
      id: uid(),
      name: c("loen")?.name || "Лоэн",
      image: c("loen")?.image || "",
      element: "Крио",
      elementIcon: ELEMENT_SVG.CRYO,
      weapon: "Копьё",
      weaponIcon: "",
      description: "Крио мейн-дд Шабаша под тёмную стойку / Таяние; нужен сильный карман Дурина.",
      href: c("loen") ? `/wiki/characters/${c("loen")!.slug}` : undefined,
      rarity: 5,
    },
    {
      id: uid(),
      name: c("varka")?.name || "Варка",
      image: c("varka")?.image || "",
      element: "Анемо",
      elementIcon: ELEMENT_SVG.ANEMO,
      weapon: "Двуручник",
      weaponIcon: "",
      description: "Анемо мейн-дд: светлая стойка режет Анемо+Пиро резисты.",
      href: c("varka") ? `/wiki/characters/${c("varka")!.slug}` : undefined,
      rarity: 5,
    },
    {
      id: uid(),
      name: c("mona")?.name || "Мона",
      image: c("mona")?.image || "",
      element: "Гидро",
      elementIcon: ELEMENT_SVG.HYDRO,
      weapon: "Катализатор",
      weaponIcon: "",
      description: "Шабаш + Гидро; С1 сильна в Паре/Таянии.",
      href: c("mona") ? `/wiki/characters/${c("mona")!.slug}` : undefined,
      rarity: 5,
    },
    {
      id: uid(),
      name: c("bennett")?.name || "Беннет",
      image: c("bennett")?.image || "",
      element: "Пиро",
      elementIcon: ELEMENT_SVG.PYRO,
      weapon: "Одноручный меч",
      weaponIcon: "",
      description: "АТК-бафф и хил; С6 — инфузия для гипер-керри Дурина.",
      href: c("bennett") ? `/wiki/characters/${c("bennett")!.slug}` : undefined,
      rarity: 4,
    },
    {
      id: uid(),
      name: c("sucrose")?.name || "Сахароза",
      image: c("sucrose")?.image || "",
      element: "Анемо",
      elementIcon: ELEMENT_SVG.ANEMO,
      weapon: "Катализатор",
      weaponIcon: "",
      description: "Ведьмовство + МС + VV; стяжка. Универсальный Анемо-сап.",
      href: c("sucrose") ? `/wiki/characters/${c("sucrose")!.slug}` : undefined,
      rarity: 4,
    },
  ];

  const teams: GuideTeamVariant[] = [
    {
      id: uid(),
      badge: "Таяние · тёмная",
      features:
        "Лоэн + Дурин + Николь/Беннет + Ситлали/Эмилия/Альбедо. Тёмная стойка; Шабаш; сильный карман под Жажду Лоэна.",
      members: [
        member(c("loen"), "Лоэн", "Мейн-дд"),
        self("Пиро саб"),
        member(c("nikol"), "Николь", "Щит / бафф"),
        member(c("sitlali"), "Ситлали", "Шред"),
      ],
    },
    {
      id: uid(),
      badge: "Пар · тёмная",
      features: "Нёвиллет + Дурин + Фурина/Мона С1 + Шилонен/Джинн. Дурин закрывает Пар; пески на МС ок.",
      members: [
        member(c("neuvillette"), "Нёвиллет", "Мейн-дд"),
        self("Пиро саб"),
        member(c("furina"), "Фурина", "Гидро саб"),
        member(c("shilonen"), "Шилонен", "Шред / хил"),
      ],
    },
    {
      id: uid(),
      badge: "Варка · светлая",
      features: "Варка + Прюн/Венти + Дурин + Николь/Беннет. Светлая стойка режет Анемо и Пиро.",
      members: [
        member(c("varka"), "Варка", "Мейн-дд"),
        member(c("pryun"), "Прюн", "Анемо сап"),
        self("Пиро саб / шред"),
        member(c("nikol"), "Николь", "Щит / бафф"),
      ],
    },
    {
      id: uid(),
      badge: "Горение · светлая",
      features: "Кинич + Дурин + Эмилия/Иансан + Николь. Топ под Кинича; Дурин следует за активным.",
      members: [
        member(c("kinich"), "Кинич", "Мейн-дд"),
        self("Пиро саб / шред"),
        member(c("emiliya"), "Эмилия", "Дендро саб"),
        member(c("nikol"), "Николь", "Щит / бафф"),
      ],
    },
    {
      id: uid(),
      badge: "Перегрузка · светлая",
      features: "Клоринда/Вареса/Райдэн + Дурин + Фишль + Шеврёз/Николь/Беннет.",
      members: [
        member(c("clorinde", "klorinda"), "Клоринда", "Мейн-дд"),
        self("Пиро саб / шред"),
        member(c("fischl"), "Фишль", "Электро саб"),
        member(c("chevreuse", "shevrez", "шеврёз"), "Шеврёз", "Бафф"),
      ],
    },
  ];

  const blocks: GuideBlock[] = [
    {
      id: uid(),
      type: "text",
      eyebrow: "Обзор",
      title: "Кто такой Дурин",
      body: `Дурин — **Пиро мечник 5★**, дракон ведьмы М. из **Ведьминого шабаша** (Мондштадт). Роль — **гибкий саб-дд / саппорт**: две стойки после Е.

- **Светлая (Утверждение чистоты)** — дракон бьёт по площади и **режет резисты** Пиро / Анемо / Электро / Дендро / Гео при соответствующих реакциях.
- **Тёмная (Отрицание тьмы)** — бьёт одну цель сильнее; **+40%** к Пару и Таянию, которые закрывает сам Дурин.

Ульта (**70** энергии) ставит дракона на ~20 сек; Е заливает до **~33** энергии — ВЭ нужно меньше, чем у типичных саб-дд.

### Кратко
- **Рейтинг** — S+
- **Стихия / оружие** — Пиро · одноручный меч
- **Возвышение** — К/У (**+38.4%** на 90 ур.)
- **База на 90 ур.** — HP **12 430** · АТК **347** · Защита **822** · К/У **38.4%**
- **Добавлен** — патч **6.2**
- **День рождения** — 14 марта
- **Регион / фракция** — Мондштадт · Ведьмин шабаш
- **Созвездие** — Алый Дракон
- **Особое блюдо** — Тушёная свинина с яблоками (первая попытка)
- **Именная карточка** — Сияющее сердце
- **Сигна** — Атаме артис`,
    },
    {
      id: uid(),
      type: "prosCons",
      eyebrow: "Анализ",
      title: "Преимущества и недостатки",
      prosTitle: "Преимущества",
      consTitle: "Недостатки",
      pros: [
        "**Сильный карман** в обеих формах; тёмная — выше личный урон.",
        "**Мало ВЭ** — Е покрывает ~половину стоимости ульты (~33 ед.).",
        "Светлая стойка **режет резисты** к Пиро и второй стихии реакции.",
        "**Две стойки** — саб-дд (Пар/Таяние) или саппорт-шред (Горение, Перегрузка, Рассеивание, Кристалл).",
      ],
      cons: [
        "В **Паре/Таянии** не режет резисты — только тёмная стойка как саб-дд.",
        "Завязан на **Шабаш** (пассивки / сигна).",
        "**Мало статуса** — ульта бьёт редко (~2.5 сек), но с большой площадью/силой.",
      ],
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Билд",
      title: "Как собирать Дурина",
      body: `Саппорт/саб-дд: **АТК 2500+** (потолок пассивки), **криты**, умеренный **ВЭ**.

- Гидро/Крио пачки → упор на **личный урон** (тёмная стойка).
- Гео/Анемо/Электро/Дендро → сет под мейн-дд (Знать, Дар небес, День ветров).

Пески — **АТК%**. Кубок — **Пиро** (или АТК%, если АТК < 1800). Корона — **К/Ш** / **К/У**. МС 100–300 только в тёмной стойке (сабы); часы на МС почти никогда.`,
    },
    {
      id: uid(),
      type: "statTargets",
      eyebrow: "Билд",
      title: "Рекомендуемые значения характеристик",
      intro: "С Днём ветров после уроков ведьм К/Ш легче; упор в экипировке на К/Ш из‑за К/У с возвышения.",
      targets: [
        {
          id: uid(),
          label: "АТК",
          value: "2500+",
          hint: "Потолок пассивки «Первозданное слияние»",
        },
        {
          id: uid(),
          label: "ВЭ",
          value: "120–150%",
          hint: "120–130% с Пиро-резонансом; 140–150% соло-Пиро",
        },
        {
          id: uid(),
          label: "К/Ш : К/У",
          value: "~1:2",
          hint: "В артефактах больше К/Ш",
        },
        {
          id: uid(),
          label: "МС",
          value: "0 / 100–300",
          hint: "Только тёмная (Пар/Таяние) в сабах",
        },
      ],
      slots: [
        { id: uid(), slot: "Пески", main: "АТК%", subs: "К/Ш · К/У · ВЭ% · АТК" },
        { id: uid(), slot: "Кубок", main: "Пиро урон% / АТК%", subs: "К/Ш · К/У · ВЭ%" },
        { id: uid(), slot: "Корона", main: "К/Ш / К/У", subs: "К/У · К/Ш · АТК% · ВЭ%" },
      ],
    },
    {
      id: uid(),
      type: "rankedList",
      eyebrow: "Оружие",
      title: "Рейтинг оружия",
      intro:
        "Топ — криты и база. Светлая стойка допускает саппортские клинки (Клятва свободы). Сигна сильнее всего в Шабаше.",
      kind: "weapons",
      items: weaponItems,
    },
    {
      id: uid(),
      type: "rankedList",
      eyebrow: "Артефакты",
      title: "Полезные артефакты",
      intro:
        "Цель — **4п День восходящих ветров**. АТК-пачки — Знать; моно-Пиро без Николь — Дар небес; Цветение — Цветок рая (МС).",
      kind: "artifacts",
      items: artItems,
    },
    {
      id: uid(),
      type: "setPlan",
      eyebrow: "Артефакты",
      title: "Как раздать сеты в типовых пачках",
      intro: "Ориентир под тёмную и светлую стойки.",
      groups: [
        {
          id: uid(),
          title: "Таяние · Лоэн",
          rows: [
            planRow(c("loen"), "Лоэн", "День восходящих ветров", artImg(artDay, "День ветров")),
            {
              id: uid(),
              name: NAME,
              image: IMAGE,
              href: `/wiki/characters/${SLUG}`,
              setName: "День ветров / 2+2 Пиро",
              setImage: artImg(artDay || artCrimson, "День восходящих ветров"),
            },
            planRow(c("nikol"), "Николь", "Дар небес", artImg(artDar, "Дар небес")),
            planRow(c("sitlali"), "Ситлали", "Свиток / саппорт", ""),
          ],
        },
        {
          id: uid(),
          title: "Варка · светлая",
          rows: [
            planRow(c("varka"), "Варка", "День восходящих ветров", artImg(artDay, "День ветров")),
            {
              id: uid(),
              name: NAME,
              image: IMAGE,
              href: `/wiki/characters/${SLUG}`,
              setName: "День ветров / Знать",
              setImage: artImg(artDay || artNoblesse, "День восходящих ветров"),
            },
            planRow(c("pryun"), "Прюн", "Изумрудная тень", artImg(artVV, "Изумрудная тень")),
            planRow(c("nikol"), "Николь", "Дар небес", artImg(artDar, "Дар небес")),
          ],
        },
      ],
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Отряды",
      title: "Отряды: тёмная и светлая",
      body: `Дурин **дополняет** готовое ядро, а не собирает пачку вокруг себя.

**Тёмная** — Пар и Таяние (Гидро/Крио мейн-дд). Резисты не режет; бьёт сильнее в одну цель.

**Светлая** — Горение, Перегрузка, Пиро Рассеивание, Кристалл: шред Пиро + второй стихии. Личный урон чуть ниже.

Всегда полезны **Николь** / второй Шабаш и Пиро-резонанс (Беннет).`,
    },
    {
      id: uid(),
      type: "roleTable",
      eyebrow: "Отряды",
      title: "Приоритетные персонажи",
      intro: "Лучшие компаньоны под обе стойки:",
      rows: roleRows,
    },
    {
      id: uid(),
      type: "teamGroup",
      eyebrow: "Отряды",
      title: "Примеры сильных команд",
      intro: "Тёмная — Лоэн/Нёвиллет; светлая — Варка/Кинич/Перегрузка.",
      variants: teams,
    },
    {
      id: uid(),
      type: "resourceTable",
      title: "Возвышение",
      intro: "Агат Агнидус + инеевый цветок и материалы Нод-Края:",
      rows: [
        {
          id: uid(),
          name: matTurq1?.name || "Агат Агнидус",
          image: matTurq1?.image || "",
          qty: "1→9→9→6",
          where: "Мировые и еженедельные боссы (серия агата Агнидус)",
          href: matTurq1 ? `/wiki/materials/${matTurq1.slug}` : undefined,
        },
        {
          id: uid(),
          name: matLocal?.name || "Инеевый цветок",
          image: matLocal?.image || "",
          qty: "168",
          where: "Диковинка Нод-Края (Кладбище Ночи)",
          href: matLocal ? `/wiki/materials/${matLocal.slug}` : undefined,
        },
        {
          id: uid(),
          name: matBoss?.name || "Циклическое военное ядро куувяки",
          image: matBoss?.image || "",
          qty: "46",
          where: "Сверхтяжелый сухопутный крейсер",
          href: matBoss ? `/wiki/materials/${matBoss.slug}` : undefined,
        },
        {
          id: uid(),
          name: "Мандаты Опричников",
          image: matWarrant3?.image || matWarrant1?.image || "",
          qty: "18 / 30 / 36",
          where: "Опричники Фатуи",
          href: matWarrant1 ? `/wiki/materials/${matWarrant1.slug}` : undefined,
        },
      ],
    },
    {
      id: uid(),
      type: "resourceTable",
      title: "Таланты",
      intro: "На одну способность до 10 ур. Книги «Поэзия» — Забытый каньон.",
      rows: [
        {
          id: uid(),
          name: matBook3?.name || "Книги о «Поэзии»",
          image: matBook3?.image || "",
          qty: "3 / 21 / 38",
          where: "Забытый каньон (Мондштадт)",
          href: matBook1 ? `/wiki/materials/${matBook1.slug}` : undefined,
        },
        {
          id: uid(),
          name: "Мандаты Опричников",
          image: matWarrant3?.image || "",
          qty: "6 / 21 / 31",
          where: "Опричники Фатуи",
          href: matWarrant3 ? `/wiki/materials/${matWarrant3.slug}` : undefined,
        },
        {
          id: uid(),
          name: matWeekly?.name || "Истлевшее солнечное пламя",
          image: matWeekly?.image || "",
          qty: "6",
          where: "Владыка истлевшего первобытного пламени (Натлан)",
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
      type: "text",
      eyebrow: "Геймплей",
      title: "Способности",
      body: `Е вводит **Трансмутацию**: короткое → светлая стойка, обычная → тёмная. Затем **Q** ставит белого или чёрного дракона на 20 сек.

### Приоритет прокачки
**Q ≥ E > обычные** (обычные — только гипер-керри с Беннетом С6). Если не хватает энергии — Е до 9–10 раньше Q.

### Активные
- **Пламенный удар крыльев** — до 4 ударов; заряженная — рубка; падение — AoE.
- **Дуализм: Слияние и разделение (Е)** — откат 12 сек. Особая Е / особая обычная выбирают стойку на 30 сек и чинят энергию (до ~33, раз в 6 сек).
- **Принцип чистоты / Принцип тьмы (Q)** — **70** энергии, откат 18. Белый дракон — AoE; чёрный — одна цель. Без стойки по умолчанию светлая ульта.

### Пассивки
- **Светлое явление божественного расчёта** — светлая: −20% резистов при Горении/Перегрузке/Пиро Рассеивании/Кристалле; тёмная: +40% к Пару/Таянию Дурина.
- **Возведённый как ночь хаос** — после Q: стаки; урон дракона +3% за 100 АТК (макс. +75%).
- **Ведьмин ритуал кануна: Ода восхождения** — Тайный обряд усиливает A1 на 75%.
- **Эхо клокочущей земли** — +25% к награде экспедиций Мондштадта (20 ч).

### Созвездия
Лучшие — **С1**, **С2**, **С6**: Цикл просветления (бафф урона от АТК Дурина); +50% Пиро/реакций отряду; игнор защиты / шред защиты.`,
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Геймплей",
      title: "Как играть и стоит ли выбивать",
      body: `### Смена стойки
В бою после Е: **короткое нажатие** → светлая, **обычная атака** → тёмная. Стойка держится ~30 сек.

### Ротация
**Саппорты → Е (выбор стойки) → Q → мейн-дд / остальной карман → повтор.**

Дракон следует за активным — удобно подвижным мейн-дд (Кинич и др.).

### Сигна vs С1
Сигна сильнее для личного урона и АТК-отряда в Шабаше. С1 — сильный бафф союзникам (светлая) / себе (тёмная). Есть топ-мечи и путь к С2 — можно взять консты; иначе сначала сигну.

### Итог
Один из самых **гибких** Пиро саб-дд/саппортов. Раскрывается с Шабашем (Николь, Варка, Лоэн, Мона…). Имеет смысл почти любому аккаунту с Пиро/Анемо/Крио ядрами; без Ведьминских союзников сигна и часть пассивок слабее.`,
    },
  ];

  const levelMaterials: CharacterMaterial[] = [
    matCard(matLocal, "Инеевый цветок", 168, "local", 1),
    matCard(matBoss, "Циклическое военное ядро куувяки", 46, "boss", 4),
    matCard(matTurq1, "Осколок агата Агнидус", 1, "ascension", 2),
    matCard(matTurq2, "Фрагмент агата Агнидус", 9, "ascension", 3),
    matCard(matTurq3, "Кусок агата Агнидус", 9, "ascension", 4),
    matCard(matTurq4, "Драгоценный агат Агнидус", 6, "ascension", 5),
    matCard(matWarrant1, "Потрёпанный мандат", 18, "ascension", 1),
    matCard(matWarrant2, "Безупречный мандат", 30, "ascension", 2),
    matCard(matWarrant3, "Заиндевевший мандат", 36, "ascension", 3),
    matCard(matBook1, "Учения о «Поэзии»", 9, "talent", 2),
    matCard(matBook2, "Указания о «Поэзии»", 63, "talent", 3),
    matCard(matBook3, "Философия о «Поэзии»", 114, "talent", 4),
    matCard(matWeekly, "Истлевшее солнечное пламя", 18, "talent", 5),
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
      name: ex.talents["9"]?.name || "Ведьмин ритуал кануна: Ода восхождения",
      icon: `${iconBase}/passive3.png`,
      description: ex.talents["9"]?.description || "",
      order: 5,
    },
    {
      id: "t_util",
      name: ex.talents["6"].name,
      icon: `${iconBase}/utility.png`,
      description: ex.talents["6"].description,
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
    "Дурин — Пиро саб-дд Шабаша: светлая и тёмная стойки, билд, оружие, сеты и отряды.";

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
    element: Element.PYRO,
    weaponType: "Одноручный меч",
    region: "Мондштадт",
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
