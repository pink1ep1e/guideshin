/**
 * Импорт гайда на Цзы Бай.
 *
 *   npx tsx scripts/templates/fetch-guide-sources.ts   # CONFIG: czy-baj / 10000126
 *   npx tsx scripts/seed-czy-baj-guide.ts
 *
 * НЕ трогаем image / splashImage.
 * Таланты/консты — из scripts/_cache/czy-baj/yatta-extracted.json (RU, cleanYattaText).
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

const SLUG = "czy-baj";
const NAME = "Цзы Бай";
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
    elementIcon: ELEMENT_SVG.GEO,
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

  const artNoch = a("Ночь открытия неба");
  const artKokon = a("Кокон сладких грёз", "Кокон сладких грез");
  const artHunter = a("Охотник Сумеречного двора");
  const artSerenada = a("Серенада шёлковой луны", "Серенада шелковой луны");
  const artRassvet = a("Рассветная песнь звезды и луны");
  const artInstructor = a("Инструктор");
  const artWanderer = a("Странствующий ансамбль");
  const artGilded = a("Позолоченные сны");

  const weaponItems: GuideRankedItem[] = [
    rankedWeapon(
      w("Светоносный осколок луны"),
      1,
      "Светоносный осколок луны",
      "Сигна · К/У",
      "Защита%; после Е — большой бонус урона Лунного кристалла (до 128%).",
      "Сигна: защита + прямой буст ключевой реакции. Часто сдаёт Е — пассивка почти всегда активна.",
      "S",
    ),
    rankedWeapon(
      w("Ураку мисугири"),
      2,
      "Ураку мисугири",
      "К/У · защита",
      "Урон НА/Е; после Гео-урона союзника бонусы ×2; +защита%.",
      "Сильный К/У и защита. МС добирайте из других источников.",
      "A",
    ),
    rankedWeapon(
      w("Свет лиственного разреза"),
      3,
      "Свет лиственного разреза",
      "К/У · МС",
      "К/Ш; бонус урона НА/Е от МС после элем. обычных.",
      "С двумя Гидро + сетом Ночи легко набрать МС под пассивку клинка.",
      "A",
    ),
    rankedWeapon(
      w("Предвестник зари"),
      4,
      "Предвестник зари",
      "F2P · К/У",
      "+К/Ш при HP > 90%.",
      "Лучший бесплатный вариант с щитом/хилом (Чжун Ли, Кокоми).",
      "A",
    ),
    rankedWeapon(
      w("Песнь патруля пиков"),
      5,
      "Песнь патруля пиков",
      "Защита% · бафф",
      "Стаки защиты и элем. урона; бафф отряду от защиты носителя.",
      "Защита полезна; элем. урон самой Цзы Бай почти не нужен.",
      "B",
    ),
    rankedWeapon(
      w("Флейта Эспицаль"),
      6,
      "Флейта Эспицаль",
      "Защита%",
      "После Е — защита% на 15 сек.",
      "Много защиты и удобная пассивка под её ротацию.",
      "B",
    ),
    rankedWeapon(
      w("Волчий клык"),
      7,
      "Волчий клык",
      "БП · К/Ш",
      "Урон Е/Q + стаки К/Ш на Е/Q.",
      "К/Ш с пассивки не на реакцию/НА — баланс критов без оглядки на неё.",
      "B",
    ),
    rankedWeapon(
      w("Киноварное веретено"),
      8,
      "Киноварное веретено",
      "Ивент · защита%",
      "Урон Е от защиты (короткое окно).",
      "Затычка: откат Е длиннее окна пассивки.",
      "C",
    ),
    rankedWeapon(
      w("Чёрный меч", "Черный меч"),
      9,
      "Чёрный меч",
      "БП · К/Ш",
      "Урон обычных; хил с критов НА.",
      "Дорогой БП; хил слабый из‑за низкой АТК. Низкий приоритет.",
      "C",
    ),
  ];

  const artItems: GuideRankedItem[] = [
    rankedArt(
      artNoch,
      1,
      "Ночь открытия неба",
      "Топ-1 · Лунные реакции",
      "2п +80 МС; 4п К/Ш при Лунных реакциях + урон Лунных реакций отряду.",
      "Лучший сет: МС, К/Ш и буст реакции. С Иллуги С6 К/Ш можно снизить до ~50%.",
      "S",
    ),
    rankedArt(
      artKokon,
      2,
      "Кокон сладких грёз",
      "Старт · защита",
      "2п +30% защиты; 4п стаки защиты/Гео с Гео-ударов.",
      "Временный 4п: много защиты, Гео-бонус почти не нужен.",
      "A",
    ),
    rankedArt(
      artHunter,
      3,
      "Охотник Сумеречного двора",
      "С Фуриной",
      "2п урон НА/заряженной; 4п К/Ш при изменении HP.",
      "Только для баланса статов с Фуриной — не финал.",
      "B",
    ),
    rankedArt(
      artKokon || artNoch || artWanderer || artGilded,
      4,
      "2+2 защита / МС",
      "Временный 2+2",
      "2п защита% + 2п МС (Ансамбль / Позолота / Ночь).",
      "Пока нет 4п Ночи — закрывает защиту и МС.",
      "B",
    ),
  ];
  if (artItems[3]) artItems[3].name = "2+2 защита% + МС";

  const matWarrant1 = m("Потрёпанный мандат", "Потрепанный мандат");
  const matWarrant2 = m("Безупречный мандат");
  const matWarrant3 = m("Заиндевевший мандат");
  const matBook1 = m("Учения о «Золоте»");
  const matBook2 = m("Указания о «Золоте»");
  const matBook3 = m("Философия о «Золоте»");
  const matTurq1 = m("Осколок топаза Притхива");
  const matTurq2 = m("Фрагмент топаза Притхива");
  const matTurq3 = m("Кусок топаза Притхива");
  const matTurq4 = m("Драгоценный топаз Притхива");
  const matBoss = m("Останки крыла ужаса");
  const matLocal = m("Глазурная лилия");
  const matWeekly = m("Вознёсшийся образец: Ферзь", "Вознесшийся образец: Ферзь");
  const matCrown = m("Корона прозрения");

  const roleRows: GuideRoleRow[] = [
    {
      id: uid(),
      name: c("kolombina")?.name || "Коломбина",
      image: c("kolombina")?.image || "",
      element: "Гидро",
      elementIcon: ELEMENT_SVG.HYDRO,
      weapon: "Катализатор",
      weaponIcon: "",
      description:
        "Топ саппорт Лунных реакций: статус, бафф реакции, знамение. Без неё отряд слабее ~30%.",
      href: c("kolombina") ? `/wiki/characters/${c("kolombina")!.slug}` : undefined,
      rarity: 5,
    },
    {
      id: uid(),
      name: c("illugi")?.name || "Иллуги",
      image: c("illugi")?.image || "",
      element: "Гео",
      elementIcon: ELEMENT_SVG.GEO,
      weapon: "Копьё",
      weaponIcon: "",
      description: "Сигнатурный 4★ баффер: урон Лунного кристалла, К/Ш, К/У и МС.",
      href: c("illugi") ? `/wiki/characters/${c("illugi")!.slug}` : undefined,
      rarity: 4,
    },
    {
      id: uid(),
      name: c("linneya")?.name || "Линнея",
      image: c("linneya")?.image || "",
      element: "Гео",
      elementIcon: ELEMENT_SVG.GEO,
      weapon: "Лук",
      weaponIcon: "",
      description: "Саппорт/саб + хил; с сигнатурным луком баффает урон реакции.",
      href: c("linneya") ? `/wiki/characters/${c("linneya")!.slug}` : undefined,
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
      description: "На С6 — прямой буст Лунного кристалла; закрывает второго героя Нод-Края.",
      href: c("ajno") ? `/wiki/characters/${c("ajno")!.slug}` : undefined,
      rarity: 4,
    },
    {
      id: uid(),
      name: c("albedo")?.name || "Альбедо",
      image: c("albedo")?.image || "",
      element: "Гео",
      elementIcon: ELEMENT_SVG.GEO,
      weapon: "Одноручный меч",
      weaponIcon: "",
      description: "Карманный Гео + заливка МС с ульты. Сильнее с Моной С1 / Ведьмовством.",
      href: c("albedo") ? `/wiki/characters/${c("albedo")!.slug}` : undefined,
      rarity: 5,
    },
    {
      id: uid(),
      name: c("zhongli")?.name || "Чжун Ли",
      image: c("zhongli")?.image || "",
      element: "Гео",
      elementIcon: ELEMENT_SVG.GEO,
      weapon: "Копьё",
      weaponIcon: "",
      description: "Щит и шред — комфорт на поле; закрывает Гео-резонанс.",
      href: c("zhongli") ? `/wiki/characters/${c("zhongli")!.slug}` : undefined,
      rarity: 5,
    },
  ];

  const teams: GuideTeamVariant[] = [
    {
      id: uid(),
      badge: "Премиум",
      features:
        "Коломбина + Иллуги С6 + Линнея. Рассвет на Линнее/Коломбине; Серенада на Иллуги (без конст — лучше на Коломбину).",
      members: [
        self("Мейн-дд"),
        member(c("kolombina"), "Коломбина", "Гидро / знамение"),
        member(c("illugi"), "Иллуги", "Гео бафф"),
        member(c("linneya"), "Линнея", "Гео / хил"),
      ],
    },
    {
      id: uid(),
      badge: "Классика",
      features: "Коломбина + Иллуги + Горо С6 / Чжун Ли. Горо приоритетнее с С6 (хил с С4).",
      members: [
        self("Мейн-дд"),
        member(c("kolombina"), "Коломбина", "Гидро / знамение"),
        member(c("illugi"), "Иллуги", "Гео бафф"),
        member(c("gorou"), "Горо", "Гео / хил"),
      ],
    },
    {
      id: uid(),
      badge: "Без Иллуги",
      features: "Коломбина + Айно С6 / Фурина / Е Лань + Чжун Ли / Шилонен / Горо С4. Два резонанса.",
      members: [
        self("Мейн-дд"),
        member(c("kolombina"), "Коломбина", "Гидро / знамение"),
        member(c("ajno"), "Айно", "Гидро / знамение"),
        member(c("zhongli"), "Чжун Ли", "Щит"),
      ],
    },
    {
      id: uid(),
      badge: "Гео саб",
      features: "Коломбина + Тиори/Альбедо + Чжун Ли/Горо С4. Тиори сильнее вне Ведьмовства.",
      members: [
        self("Мейн-дд"),
        member(c("kolombina"), "Коломбина", "Гидро / знамение"),
        member(c("tiori"), "Тиори", "Гео саб"),
        member(c("zhongli"), "Чжун Ли", "Щит"),
      ],
    },
    {
      id: uid(),
      badge: "Без Коломбины",
      features:
        "Фурина/Е Лань/Син Цю + Иллуги + Чжун Ли / Шилонен С2 / Горо С4. Иллуги обязателен для знамения.",
      members: [
        self("Мейн-дд"),
        member(c("furina"), "Фурина", "Гидро саб"),
        member(c("illugi"), "Иллуги", "Гео бафф"),
        member(c("zhongli"), "Чжун Ли", "Щит"),
      ],
    },
  ];

  const blocks: GuideBlock[] = [
    {
      id: uid(),
      type: "text",
      eyebrow: "Обзор",
      title: "Кто такая Цзы Бай",
      body: `Цзы Бай — **Гео мечница 5★**, адепт **Белая Лошадь** из **Ли Юэ**. Роль — **мейн-дд Лунного кристалла**: в стойке **Сдвиг лунных фаз** обычные бьют **Гео от защиты**, копится **Сияние сдвига фаз** для особой Е **Поступь проворной кобылицы**.

Нужны **Гео + Гидро** и второй герой с **Лунным знамением** (идеально **Коломбина**). Элем. бонус Гео почти бесполезен — важны защита, криты и МС.

### Кратко
- **Рейтинг** — S+
- **Стихия / оружие** — Гео · одноручный меч
- **Возвышение** — К/У (**+38.4%** на 90 ур.)
- **База на 90 ур.** — HP **12 919** · АТК **225** · Защита **957** · К/У **38.4%**
- **Добавлена** — патч **6.3**
- **День рождения** — 15 мая
- **Регион / фракция** — Ли Юэ · Адепты
- **Созвездие** — Белая Лошадь
- **Особое блюдо** — Вкус весны
- **Именная карточка** — Дымка
- **Сигна** — Светоносный осколок луны`,
    },
    {
      id: uid(),
      type: "prosCons",
      eyebrow: "Анализ",
      title: "Преимущества и недостатки",
      prosTitle: "Преимущества",
      consTitle: "Недостатки",
      pros: [
        "**Простая сборка** — защита + криты; ВЭ почти не нужен.",
        "**Лунный кристалл** закрывает механики и часть элитного контента.",
        "Пассивка в открытом мире: ночью восстанавливает энергию из кармана.",
        "Сильный гипер-керри при готовом ядре Нод-Края.",
      ],
      cons: [
        "**Узкие команды** — только Гео/Гидро под Лунный кристалл.",
        "Слабо синергирует со «старыми» баффами элем. урона (Фурина/Е Лань как бафф).",
        "**Дорогое оружие** — мало F2P-опций (по сути Предвестник зари).",
        "Однотипная стойка на поле без револьвера.",
      ],
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Билд",
      title: "Как собирать Цзы Бай",
      body: `Гипер-керри: **защита** и **криты**. Ульта вторична — ВЭ специально не фармим.

Пески и кубок — **защита%**. Корона — **К/Ш** или **К/У** под оружие. МС ~200+ в бою проще с союзников/сета (пассивка: +60 МС за каждого Гидро).`,
    },
    {
      id: uid(),
      type: "statTargets",
      eyebrow: "Билд",
      title: "Рекомендуемые значения характеристик",
      intro:
        "С сетом Ночи К/Ш режьте (сет даёт до +30% при Высшем сиянии). С Иллуги С6 можно целиться в ~50% К/Ш.",
      targets: [
        {
          id: uid(),
          label: "Защита",
          value: "2000+",
          hint: "Потолок пассивки Лунного кристалла от защиты",
        },
        {
          id: uid(),
          label: "К/Ш",
          value: "≤60% / ~50%",
          hint: "Ночь / с Иллуги С6",
        },
        {
          id: uid(),
          label: "К/У",
          value: "150%+",
          hint: "Приоритет при К/Ш с сета",
        },
        {
          id: uid(),
          label: "МС",
          value: "200+",
          hint: "В бою; +60 за каждого Гидро",
        },
      ],
      slots: [
        { id: uid(), slot: "Пески", main: "Защита%", subs: "К/Ш · К/У · МС · защита%" },
        { id: uid(), slot: "Кубок", main: "Защита%", subs: "К/Ш · К/У · МС" },
        { id: uid(), slot: "Корона", main: "К/Ш / К/У", subs: "К/У · К/Ш · защита% · МС" },
      ],
    },
    {
      id: uid(),
      type: "rankedList",
      eyebrow: "Оружие",
      title: "Рейтинг оружия",
      intro:
        "Лучше **криты** или **защита**. С сетом Ночи предпочтителен **К/У**. Основной урон — реакция, не одна кнопка.",
      kind: "weapons",
      items: weaponItems,
    },
    {
      id: uid(),
      type: "rankedList",
      eyebrow: "Артефакты",
      title: "Полезные артефакты",
      intro:
        "Цель — **4п Ночь открытия неба**. Временно — Кокон или 2+2 защита/МС. Гладиатор / Золотая труппа почти бесполезны.",
      kind: "artifacts",
      items: artItems,
    },
    {
      id: uid(),
      type: "setPlan",
      eyebrow: "Артефакты",
      title: "Как раздать сеты в топ-отряде",
      intro: "Ориентир премиум-пачки с Коломбиной.",
      groups: [
        {
          id: uid(),
          title: "Премиум · Коломбина + Иллуги + Линнея",
          rows: [
            {
              id: uid(),
              name: NAME,
              image: IMAGE,
              href: `/wiki/characters/${SLUG}`,
              setName: "Ночь открытия неба",
              setImage: artImg(artNoch, "Ночь открытия неба"),
            },
            planRow(
              c("kolombina"),
              "Коломбина",
              "Рассветная песнь звезды и луны",
              artImg(artRassvet, "Рассвет"),
            ),
            planRow(
              c("illugi"),
              "Иллуги",
              "Серенада шёлковой луны",
              artImg(artSerenada, "Серенада"),
            ),
            planRow(
              c("linneya"),
              "Линнея",
              "Рассветная песнь звезды и луны",
              artImg(artRassvet, "Рассвет"),
            ),
          ],
        },
        {
          id: uid(),
          title: "С Фуриной · Шилонен",
          rows: [
            {
              id: uid(),
              name: NAME,
              image: IMAGE,
              href: `/wiki/characters/${SLUG}`,
              setName: "Ночь открытия неба",
              setImage: artImg(artNoch, "Ночь открытия неба"),
            },
            planRow(c("kolombina"), "Коломбина", "Рассвет / саппорт", artImg(artRassvet, "Рассвет")),
            planRow(c("furina"), "Фурина", "Золотая труппа / дд", ""),
            planRow(
              c("shilonen"),
              "Шилонен",
              "Инструктор",
              artImg(artInstructor, "Инструктор"),
            ),
          ],
        },
      ],
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Отряды",
      title: "Отряды под Лунный кристалл",
      body: `Нужны **Гео + Гидро** для Лунного кристалла и второй носитель **Лунного знамения**.

Ценны **МС**, **защита** и прямой буст урона реакции. Баффы элем. урона (Свиток, ульта Фурины) почти не работают на её дамаг.

Больше Гео в отряде → упор на МС в сборке; больше Гидро → упор на защиту (пассивка: +15% защиты за Гео, +60 МС за Гидро). Обязателен щит/хил — она долго на поле.`,
    },
    {
      id: uid(),
      type: "roleTable",
      eyebrow: "Отряды",
      title: "Приоритетные персонажи",
      intro: "Ядро — Коломбина; без неё берите Иллуги + сильный Гидро.",
      rows: roleRows,
    },
    {
      id: uid(),
      type: "teamGroup",
      eyebrow: "Отряды",
      title: "Примеры сильных команд",
      intro: "Топ — Коломбина + Иллуги; без Субретки отряд слабее примерно на 30%.",
      variants: teams,
    },
    {
      id: uid(),
      type: "resourceTable",
      title: "Возвышение",
      intro: "Топаз Притхива + глазурные лилии (Ли Юэ) + мандаты / останки крыла (Нод-Край):",
      rows: [
        {
          id: uid(),
          name: matTurq1?.name || "Топаз Притхива",
          image: matTurq1?.image || "",
          qty: "1→9→9→6",
          where: "Мировые и еженедельные боссы (серия топаза Притхива)",
          href: matTurq1 ? `/wiki/materials/${matTurq1.slug}` : undefined,
        },
        {
          id: uid(),
          name: matLocal?.name || "Глазурная лилия",
          image: matLocal?.image || "",
          qty: "168",
          where: "Диковинка Ли Юэ",
          href: matLocal ? `/wiki/materials/${matLocal.slug}` : undefined,
        },
        {
          id: uid(),
          name: matBoss?.name || "Останки крыла ужаса",
          image: matBoss?.image || "",
          qty: "46",
          where: "Повелитель скрытых глубин: Шёпот кошмаров",
          href: matBoss ? `/wiki/materials/${matBoss.slug}` : undefined,
        },
        {
          id: uid(),
          name: "Мандаты Опричников",
          image: matWarrant3?.image || matWarrant1?.image || "",
          qty: "18 / 30 / 36",
          where: "Опричники Фатуи (Нод-Край)",
          href: matWarrant1 ? `/wiki/materials/${matWarrant1.slug}` : undefined,
        },
      ],
    },
    {
      id: uid(),
      type: "resourceTable",
      title: "Таланты",
      intro: "На одну способность до 10 ур. Книги «Золото» — Тайшаньфу.",
      rows: [
        {
          id: uid(),
          name: matBook3?.name || "Книги о «Золоте»",
          image: matBook3?.image || "",
          qty: "3 / 21 / 38",
          where: "Тайшаньфу (Ли Юэ)",
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
          name: matWeekly?.name || "Вознёсшийся образец: Ферзь",
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
      type: "text",
      eyebrow: "Геймплей",
      title: "Способности",
      body: `Основа — стойка **Сдвиг лунных фаз**: Гео-инфузия от защиты и **Сияние сдвига фаз** для особой Е **Поступь проворной кобылицы**. Лунный кристалл ставит вокруг врага три «полумесяца», которые бьют зону.

### Приоритет прокачки
**E > Q > обычные** (обычные вне стойки не качать).

### Активные
- **Лепестковое прикосновение золотого клинка** — до 4 ударов; заряженная — два удара вперёд; падение — урон по площади.
- **Когда небо и земля стали единым (Е)** — стойка ~15 сек (откат 18). Обычные/заряженные → Гео от защиты + Сияние. Особая Е тратит Сияние. При Высшем сиянии 4-й удар даёт доп. урон как Лунный кристалл.
- **Величие трёх сфер (Q)** — два Гео-удара (второй — Лунный кристалл). **60** энергии, откат **15**.

### Пассивки
- **Нисхождение лунного Адепта** — после Е / Гармонии: +60% защиты ко 2-му удару Поступи (4 сек).
- **Гряды вершин над облаками** — +15% защиты за каждого другого Гео; +60 МС за каждого Гидро.
- **Дар лунного знамения: Ход солнца и луны** — Гидро кристалл → Лунный; +0.7% базового урона реакции за 100 защиты (макс. 14%); +1 к знамению.
- **Лунный лес цветов** — ночью вне боя: +1 энергия / 2 сек (не в Бездне и т.п.).

### Созвездия
Лучшие — **С1**, **С2**, **С6**: мгновенное Сияние и 5 Поступей; +30% урона реакции отряду; ускорение набора и буст за «перерасход» Сияния.`,
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Геймплей",
      title: "Как играть и стоит ли выбивать",
      body: `### Ротация
**Баффы/саб-дд → Е (стойка) → 4 обычные (не срывать) → особая Е (3–4 раза) → опционально Q → смена.**

При полном знамении 4-й удар важен для доп. урона реакции. Полумесяцам нужно **три** попадания реакции по цели.

### Сияние сдвига фаз
Особая Е с **70** ед. После 4 Поступей инфузия заканчивается.
- +10/сек в стойке (~150 за 15 сек)
- +5 с обычных раз в 0.5 сек
- +35 с Лунного кристалла раз в 4 сек

### Сигна vs С1
Сигна ≈ **+7%** сильнее С1. Есть топ 2–3 меч и путь к С2 — берите **С2**. Только F2P/БП — сначала **сигну**.

### Коломбина
Без неё пачка слабее ~**30%**: Гидро, бафф реакции и знамение. Замена — Иллуги + констовые Гео/Гидро, но дороже и слабее.

### Итог
Сильный мейн-дд Нод-Края под **Лунный кристалл**. Имеет смысл с **Коломбиной** и без Кирилла/Нефер. Без Субретки и с другими Лунными мейн-дд — часто выгоднее вложиться в них.`,
    },
  ];

  const levelMaterials: CharacterMaterial[] = [
    matCard(matLocal, "Глазурная лилия", 168, "local", 1),
    matCard(matBoss, "Останки крыла ужаса", 46, "boss", 4),
    matCard(matTurq1, "Осколок топаза Притхива", 1, "ascension", 2),
    matCard(matTurq2, "Фрагмент топаза Притхива", 9, "ascension", 3),
    matCard(matTurq3, "Кусок топаза Притхива", 9, "ascension", 4),
    matCard(matTurq4, "Драгоценный топаз Притхива", 6, "ascension", 5),
    matCard(matWarrant1, "Потрёпанный мандат", 18, "ascension", 1),
    matCard(matWarrant2, "Безупречный мандат", 30, "ascension", 2),
    matCard(matWarrant3, "Заиндевевший мандат", 36, "ascension", 3),
    matCard(matBook1, "Учения о «Золоте»", 9, "talent", 2),
    matCard(matBook2, "Указания о «Золоте»", 63, "talent", 3),
    matCard(matBook3, "Философия о «Золоте»", 114, "talent", 4),
    matCard(matWeekly, "Вознёсшийся образец: Ферзь", 18, "talent", 5),
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
    "Цзы Бай — Гео мейн-дд Лунного кристалла: билд на защиту, оружие, сеты и отряды с Коломбиной.";

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
    element: Element.GEO,
    weaponType: "Одноручный меч",
    region: "Ли Юэ",
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
