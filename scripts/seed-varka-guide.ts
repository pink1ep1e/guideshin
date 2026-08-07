/**
 * Импорт гайда на Варку.
 *
 *   npx tsx scripts/templates/fetch-guide-sources.ts   # CONFIG: varka / 10000128
 *   npx tsx scripts/seed-varka-guide.ts
 *
 * НЕ трогаем image / splashImage.
 * Таланты/консты — из scripts/_cache/varka/yatta-extracted.json (RU).
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

const SLUG = "varka";
const NAME = "Варка";
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
  const artHunter = a("Охотник Сумеречного двора");
  const artGlad = a("Конец гладиатора");
  const artVV = a("Изумрудная тень");
  const artDar = a("Дар небес");
  const artCrimson = a("Горящая алая ведьма");
  const artThundering = a("Громогласный рёв ярости", "Громогласный рев ярости");
  const artBlizzard = a("Заблудший в метели");
  const artHeart = a("Сердце глубин", "Сердце Глубин");

  const weaponItems: GuideRankedItem[] = [
    rankedWeapon(
      w("Подвиг могучего волка"),
      1,
      "Подвиг могучего волка",
      "Сигна · К/Ш",
      "Скорость атаки + стаки «Гимн четырёх ветров» (урон); при Тайном обряде — ещё К/У со стаков.",
      "Сигна: сильнейший выбор, полностью раскрывается в Ведьминских отрядах.",
      "S",
    ),
    rankedWeapon(
      w("Тысяча ослепительных солнц"),
      2,
      "Тысяча ослепительных солнц",
      "К/Ш · ротация через Е",
      "После Е/Q — К/У и АТК; продлевается элем. уроном НА/заряженной.",
      "Отлично под усиленную Е (3 Е за цикл). Сначала Q, потом стойка.",
      "A",
    ),
    rankedWeapon(
      w("Маяк тростникового моря"),
      3,
      "Маяк тростникового моря",
      "К/Ш · АТК",
      "АТК после попадания Е; АТК при получении урона; HP без щита.",
      "Держит АТК всю ротацию через усиленную Е; лучше с хилером, без щита.",
      "A",
    ),
    rankedWeapon(
      w("Краснорогий камнеруб"),
      4,
      "Краснорогий камнеруб",
      "К/У · заряженные",
      "Защита%; урон НА/заряженной от защиты.",
      "Топ под особые заряженные; сабы на защиту становятся плюсом.",
      "A",
    ),
    rankedWeapon(
      w("Вердикт"),
      5,
      "Вердикт",
      "Временный · К/Ш",
      "АТК%; печати с кристаллов баффают урон Е.",
      "В 2/2 отрядах кристаллов нет — только статы и АТК%. Временное решение.",
      "B",
    ),
    rankedWeapon(
      w("Меч драконьей кости"),
      6,
      "Меч драконьей кости",
      "БП · К/Ш",
      "Стаки урона на поле (сбрасываются при смене).",
      "БП-опция; нужен щит. С сигнатурным сетом — фокус на К/У.",
      "B",
    ),
    rankedWeapon(
      w("Волчья погибель"),
      7,
      "Волчья погибель",
      "Стандарт · АТК%",
      "АТК%; бафф АТК отряду по врагам с низким HP.",
      "Сильная АТК для пассивок; полезно с саб-дд вроде Дурина.",
      "B",
    ),
    rankedWeapon(
      w("Тень волны"),
      8,
      "Тень волны",
      "Крафт · АТК",
      "АТК после лечения (в т.ч. из кармана).",
      "Лучший бесплатный эпик на R5 с хилером.",
      "C",
    ),
    rankedWeapon(
      w("Черногорская бритва"),
      9,
      "Черногорская бритва",
      "К/У · бюджет",
      "АТК за убийства (до 3 стаков).",
      "Затычка ради К/У; пассивка нестабильна.",
      "C",
    ),
  ];

  const artItems: GuideRankedItem[] = [
    rankedArt(
      artDay,
      1,
      "День восходящих ветров",
      "Топ-1 · Ведьмовство",
      "2п +18% АТК; 4п — АТК после ударов; после уроков ведьм — +20% К/Ш.",
      "Сигнатурный сет: АТК до 2500+ и К/Ш после квеста Ведьм.",
      "S",
    ),
    rankedArt(
      artHunter,
      2,
      "Охотник Сумеречного двора",
      "С Фуриной · заряженные",
      "2п урон НА/заряженной; 4п К/Ш при изменении HP.",
      "Гидро-пачки с Фуриной и сильным хилером (Анемо/Гидро).",
      "A",
    ),
    rankedArt(
      artGlad,
      3,
      "Конец гладиатора",
      "Старт · 4п",
      "2п АТК%; 4п урон обычных для клеймора.",
      "Временный 4п: много обычных между Е/заряженной.",
      "B",
    ),
    rankedArt(
      artGlad || artCrimson || artBlizzard || artHeart || artThundering,
      4,
      "2+2 АТК / элем. урон",
      "Временный 2+2",
      "2п АТК% + 2п бонус стихии союзников (не Анемо).",
      "Пока нет 4п Дня ветров — АТК + бонус второй стихии отряда.",
      "B",
    ),
  ];
  if (artItems[3]) artItems[3].name = "2+2 АТК + элем. урон (Пиро/Крио/Гидро/Электро)";

  const matShaft1 = m("Сломанный вал");
  const matShaft2 = m("Усиленный вал");
  const matShaft3 = m("Высокоточный вал");
  const matBook1 = m("Учения о «Свободе»");
  const matBook2 = m("Указания о «Свободе»");
  const matBook3 = m("Философия о «Свободе»");
  const matTurq1 = m("Осколок бирюзы Вайюда");
  const matTurq2 = m("Фрагмент бирюзы Вайюда");
  const matTurq3 = m("Кусок бирюзы Вайюда");
  const matTurq4 = m("Драгоценная бирюза Вайюда");
  const matBoss = m("Призматический отсечённый хвост", "Призматический отсеченный хвост");
  const matLocal = m("Волчий крюк");
  const matWeekly = m("Вознёсшийся образец: Ладья", "Вознесшийся образец: Ладья");
  const matCrown = m("Корона прозрения");

  const roleRows: GuideRoleRow[] = [
    {
      id: uid(),
      name: c("durin")?.name || "Дурин",
      image: c("durin")?.image || "",
      element: "Пиро",
      elementIcon: ELEMENT_SVG.PYRO,
      weapon: "Одноручный меч",
      weaponIcon: "",
      description: "Топ-саппорт: шред Пиро/Анемо, карманный урон, Ведьмовство. Ядро лучших Пиро-пачек.",
      href: c("durin") ? `/wiki/characters/${c("durin")!.slug}` : undefined,
      rarity: 5,
    },
    {
      id: uid(),
      name: c("nikol")?.name || "Николь",
      image: c("nikol")?.image || "",
      element: "Пиро",
      elementIcon: ELEMENT_SVG.PYRO,
      weapon: "Катализатор",
      weaponIcon: "",
      description: "Щит + бафф АТК, Ведьмовство; Дар небес усиливает обе стихии Варки.",
      href: c("nikol") ? `/wiki/characters/${c("nikol")!.slug}` : undefined,
      rarity: 5,
    },
    {
      id: uid(),
      name: c("pryun")?.name || "Прюн",
      image: c("pryun")?.image || "",
      element: "Анемо",
      elementIcon: ELEMENT_SVG.ANEMO,
      weapon: "Катализатор",
      weaponIcon: "",
      description: "Топ-1 Анемо-саппорт под Варку (особенно С6); VV и карманный урон.",
      href: c("pryun") ? `/wiki/characters/${c("pryun")!.slug}` : undefined,
      rarity: 5,
    },
    {
      id: uid(),
      name: c("venti")?.name || "Венти",
      image: c("venti")?.image || "",
      element: "Анемо",
      elementIcon: ELEMENT_SVG.ANEMO,
      weapon: "Лук",
      weaponIcon: "",
      description: "Ведьмовство + стяжка + VV. До С6 Прюн часто сильнее Венти.",
      href: c("venti") ? `/wiki/characters/${c("venti")!.slug}` : undefined,
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
      description: "Хил + АТК для пассивки «Марш утреннего ветра»; обязателен в Пиро-ядрах.",
      href: c("bennett") ? `/wiki/characters/${c("bennett")!.slug}` : undefined,
      rarity: 4,
    },
    {
      id: uid(),
      name: c("furina")?.name || "Фурина",
      image: c("furina")?.image || "",
      element: "Гидро",
      elementIcon: ELEMENT_SVG.HYDRO,
      weapon: "Одноручный меч",
      weaponIcon: "",
      description: "Бонус урона как элем. кубок; нужна с Охотником и Анемо/Гидро хилером.",
      href: c("furina") ? `/wiki/characters/${c("furina")!.slug}` : undefined,
      rarity: 5,
    },
  ];

  const teams: GuideTeamVariant[] = [
    {
      id: uid(),
      badge: "Пиро · топ",
      features:
        "Варка + Дурин + Прюн (VV) + Николь (Дар небес). Все Ведьминские; шред и бафф обеих стихий.",
      members: [
        self("Мейн-дд"),
        member(c("durin"), "Дурин", "Пиро саб"),
        member(c("pryun"), "Прюн", "Анемо сап"),
        member(c("nikol"), "Николь", "Щит / бафф"),
      ],
    },
    {
      id: uid(),
      badge: "Пиро · альт",
      features: "Дурин + Венти/Кадзуха + Беннет С6 или Николь. Пиро-резонанс заливает АТК.",
      members: [
        self("Мейн-дд"),
        member(c("durin"), "Дурин", "Пиро саб"),
        member(c("venti"), "Венти", "Анемо / VV"),
        member(c("bennett"), "Беннет", "Хил / АТК"),
      ],
    },
    {
      id: uid(),
      badge: "Гидро",
      features:
        "Джинн + Фурина + Е Лань — сильный суммарный урон даже без полного Шабаша. С Ведьмовством: Мона + Фурина + Джинн.",
      members: [
        self("Мейн-дд"),
        member(c("jean"), "Джинн", "Хил / Анемо"),
        member(c("furina"), "Фурина", "Гидро саб"),
        member(c("yelan"), "Е Лань", "Гидро саб"),
      ],
    },
    {
      id: uid(),
      badge: "Крио",
      features:
        "Венти/Сахароза + Шэнь Хэ + Эскофье. Крио-резонанс снижает нужду в К/Ш (~15%).",
      members: [
        self("Мейн-дд"),
        member(c("venti"), "Венти", "Анемо / VV"),
        member(c("shenhe", "шэнь хэ", "шень хэ"), "Шэнь Хэ", "Крио бафф"),
        member(c("eskofe"), "Эскофье", "Крио саб / хил"),
      ],
    },
    {
      id: uid(),
      badge: "Электро",
      features: "Фишль + Иансан/Оророн + Венти/Джинн/Лань Янь. Слабее Пиро/Гидро, но закрывает контент.",
      members: [
        self("Мейн-дд"),
        member(c("fischl"), "Фишль", "Электро саб"),
        member(c("iansan", "иансан"), "Иансан", "Бафф"),
        member(c("venti"), "Венти", "Анемо / VV"),
      ],
    },
  ];

  const blocks: GuideBlock[] = [
    {
      id: uid(),
      type: "text",
      eyebrow: "Обзор",
      title: "Кто такой Варка",
      body: `Варка — **Анемо двуручник 5★**, рыцарь Бореалис и магистр **Ордо Фавониус** (Мондштадт). Роль — **мейн-дд**: в стойке бьёт **двумя стихиями** сразу (Анемо + Пиро/Гидро/Электро/Крио от союзников) и вызывает Рассеивание.

Пассивки жёстко просят **2 Анемо + 2 одной второй стихии**. После уроков ведьм — персонаж **Ведьмовства**; с сигнатурой нужен Тайный обряд.

### Кратко
- **Рейтинг** — S
- **Стихия / оружие** — Анемо · двуручник
- **Возвышение** — К/У (**+38.4%** на 90 ур.)
- **База на 90 ур.** — HP **12 613** · АТК **353** · Защита **795** · К/У **38.4%**
- **Добавлен** — патч **6.4**
- **День рождения** — 17 февраля
- **Регион / фракция** — Мондштадт · Ордо Фавониус
- **Созвездие** — Большой Волк / Волк
- **Особое блюдо** — Изысканное наслаждение
- **Именная карточка** — Вожак стаи
- **Сигна** — Подвиг могучего волка`,
    },
    {
      id: uid(),
      type: "prosCons",
      eyebrow: "Анализ",
      title: "Преимущества и недостатки",
      prosTitle: "Преимущества",
      consTitle: "Недостатки",
      pros: [
        "**Уникальный геймплей** — два клинка: Анемо + поглощённая стихия; множители второй стихии выше.",
        "**Ведьмовство** после личного квеста — резонанс Шабаша и усиление стойки.",
        "**Простая сборка** — АТК + криты; высокая база и К/У с возвышения.",
        "Пассивка в открытом мире: Мондштадт-союзники снижают откат долгого Е.",
      ],
      cons: [
        "**Заперт в 2/2** — без второго Анемо и пары одной стихии пассивки не раскрываются.",
        "Использует **только одну** доп. стихию (приоритет Пиро → Гидро → Электро → Крио).",
        "Медленные анимации — без щита/хила легко сбить; идеального щитовика мало.",
        "**Сильно зависит от сигны** — БП/стандарт уступают на 14–27%.",
      ],
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Билд",
      title: "Как собирать Варку",
      body: `Мейн-дд на поле: **АТК** и **криты**. Ульта вторична — ВЭ почти не фармим.

Кубок — **АТК%** (от неё зависят бонусы пассивки к Анемо и второй стихии). Элем. кубок второй стихии возможен при очень высокой базе, но придётся менять под отряд. Корона — К/Ш или К/У.

С сетом **День восходящих ветров** К/Ш с 4п ≈ **20%** — не гонитесь выше **~60%** К/Ш. МС не нужен: урон от второй стихии, не от Рассеивания.`,
    },
    {
      id: uid(),
      type: "statTargets",
      eyebrow: "Билд",
      title: "Рекомендуемые значения характеристик",
      intro: "Цель — 2500+ АТК для полного бонуса пассивки и криты 1:2.",
      targets: [
        {
          id: uid(),
          label: "АТК",
          value: "2500+",
          hint: "Полный бонус «Марш утреннего ветра» (до +25% Анемо / 2-й стихии)",
        },
        {
          id: uid(),
          label: "К/Ш",
          value: "≤60%",
          hint: "С 4п Дня восходящих ветров; в Крио — можно ниже из-за резонанса",
        },
        {
          id: uid(),
          label: "К/У",
          value: "120%+",
          hint: "Соотношение ~1:2 к К/Ш (например 60/120+)",
        },
        {
          id: uid(),
          label: "МС / ВЭ",
          value: "не нужны",
          hint: "Не жертвуйте АТК и критами",
        },
      ],
      slots: [
        { id: uid(), slot: "Пески", main: "АТК%", subs: "К/Ш · К/У · АТК%" },
        { id: uid(), slot: "Кубок", main: "АТК%", subs: "К/Ш · К/У" },
        { id: uid(), slot: "Корона", main: "К/Ш / К/У", subs: "К/Ш · К/У · АТК%" },
      ],
    },
    {
      id: uid(),
      type: "rankedList",
      eyebrow: "Оружие",
      title: "Рейтинг оружия",
      intro:
        "Высокая база и криты. С сетом Ведьмовства чаще берите лук/клеймор на **К/Ш**. Ротация через Е или особую заряженную влияет на выбор пассивки.",
      kind: "weapons",
      items: weaponItems,
    },
    {
      id: uid(),
      type: "rankedList",
      eyebrow: "Артефакты",
      title: "Полезные артефакты",
      intro:
        "Цель — **4п День восходящих ветров**. С Фуриной — **Охотник**; на старте — Гладиатор или **2+2 АТК / элем.**",
      kind: "artifacts",
      items: artItems,
    },
    {
      id: uid(),
      type: "setPlan",
      eyebrow: "Артефакты",
      title: "Как раздать сеты в топ Пиро-отряде",
      intro: "Ориентир: День ветров на Варке, VV на Анемо-саппорте, Дар небес на Николь.",
      groups: [
        {
          id: uid(),
          title: "Пиро · Шабаш",
          rows: [
            {
              id: uid(),
              name: NAME,
              image: IMAGE,
              href: `/wiki/characters/${SLUG}`,
              setName: "День восходящих ветров",
              setImage: artImg(artDay, "День восходящих ветров"),
            },
            planRow(c("durin"), "Дурин", "Дд / саб-сет", artImg(artCrimson || artGlad, "Алая ведьма")),
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
      title: "Отряды 2 Анемо + 2 стихии",
      body: `Состав: **Варка + Анемо-саппорт + два героя одной стихии** (Пиро / Гидро / Электро / Крио). Со сигнатурой нужен **хотя бы один** Ведьминский союзник.

Анемо-саппорт почти всегда на **Изумрудной тени**. Приоритет поглощения стихии: **Пиро → Гидро → Электро → Крио**.

Сильнее всего — **Пиро** (Дурин + Николь/Беннет). Гидро сильны суммарным уроном (Фурина). Крио снижают нужду в К/Ш. Электро обычно слабее.`,
    },
    {
      id: uid(),
      type: "roleTable",
      eyebrow: "Отряды",
      title: "Приоритетные персонажи",
      intro: "Лучшие союзники для Варки:",
      rows: roleRows,
    },
    {
      id: uid(),
      type: "teamGroup",
      eyebrow: "Отряды",
      title: "Примеры сильных команд",
      intro: "Ядро — 2/2 резонансы + Ведьмовство под сигну.",
      variants: teams,
    },
    {
      id: uid(),
      type: "resourceTable",
      title: "Возвышение",
      intro: "Ресурсы для возвышения Варки (бирюза Вайюда + Мондштадт / Нод-Край):",
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
          name: matLocal?.name || "Волчий крюк",
          image: matLocal?.image || "",
          qty: "168",
          where: "Вольфендом",
          href: matLocal ? `/wiki/materials/${matLocal.slug}` : undefined,
        },
        {
          id: uid(),
          name: matBoss?.name || "Призматический отсечённый хвост",
          image: matBoss?.image || "",
          qty: "46",
          where: "Мировой босс: Лучезарный лунный геккон",
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
          name: matBook1?.name || "Учения о «Свободе»",
          image: matBook1?.image || "",
          rarity: 2 as const,
          note: "×3",
          qty: "3",
          href: matBook1 ? `/wiki/materials/${matBook1.slug}` : undefined,
        },
        {
          id: uid(),
          name: matBook2?.name || "Указания о «Свободе»",
          image: matBook2?.image || "",
          rarity: 3 as const,
          note: "×21",
          qty: "21",
          href: matBook2 ? `/wiki/materials/${matBook2.slug}` : undefined,
        },
        {
          id: uid(),
          name: matBook3?.name || "Философия о «Свободе»",
          image: matBook3?.image || "",
          rarity: 4 as const,
          note: "×38",
          qty: "38",
          href: matBook3 ? `/wiki/materials/${matBook3.slug}` : undefined,
        },
        {
          id: uid(),
          name: matWeekly?.name || "Вознёсшийся образец: Ладья",
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
        "Растёт **К/У** (**+38.4%** на 90 ур.). Качайте до **90** — база АТК критична для пассивок; 95/100 через Блуждающую удачу приветствуются.",
      colLabels: [
        "Уровень",
        "Базовое HP",
        "Базовая сила атаки",
        "Базовая защита",
        "Базовый К/Ш",
        "К/У (возвышение)",
      ],
      rows: [
        emptyStatsRow("1", "982", "27", "62", "5%", "0%"),
        emptyStatsRow("20", "3 389", "95", "214", "5%", "0%"),
        emptyStatsRow("40", "5 669", "159", "358", "5%", "9.6%"),
        emptyStatsRow("50", "7 320", "205", "462", "5%", "19.2%"),
        emptyStatsRow("60", "8 780", "246", "554", "5%", "19.2%"),
        emptyStatsRow("70", "10 249", "287", "646", "5%", "28.8%"),
        emptyStatsRow("80", "11 727", "328", "740", "5%", "38.4%"),
        emptyStatsRow("90", "12 613", "353", "795", "5%", "38.4%"),
      ],
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Геймплей",
      title: "Способности",
      body: `Основа — стойка **«Буря и натиск»**: обычные бьют Анемо + второй стихией; доступны особая Е **«Восхождение четырёх ветров»** и особая заряженная **«Лазурное поглощение»** (без стамины).

### Приоритет прокачки
**E > Q > обычные** (обычные почти не качать — множители стойки в Е).

### Активные
- **Фехтовальный стиль Фавония: Танцующее сияние** — до 5 ударов двумя клейморами; заряженная — рывок; падение — урон по площади.
- **Казнь встречных ветров (Е)** — короткое: Анемо по площади → стойка 12 сек. Долгое: прыжок с зарядкой (откат 8 сек.). В стойке при наличии Пиро/Гидро/Электро/Крио — особая Е и особая заряженная. Обычные сокращают откат особой Е.
- **Воплощение северного ветра (Q)** — двойной удар: Анемо + вторая стихия. **60** энергии, откат **15**.

### Пассивки
- **Марш утреннего ветра** — бонус Анемо / 2-й стихии от АТК (макс. 25%); ×1.4 / ×2.2 урона стойки при 2 Анемо и/или 2 одной стихии.
- **Путеводный стяг ветра** — стаки «Клятвы лазурного клыка» с Рассеивания (+7.5% урона ключевых ударов, до 4).
- **Ведьмин ритуал кануна: Возвращение рассвета** — после уроков ведьм: Тайный обряд ускоряет сокращение отката особой Е.
- **Пеан возвращающегося ветра** — −5% отката долгого Е за каждого монштадтца (не в Бездне и т.п.).

### Созвездия
Лучшие — **С1**, **С2**, **С6**: доп. особое Е и ×2 урона, огромный Анемо-хит, комбо особая Е ↔ заряженная + К/У со стаков.`,
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Геймплей",
      title: "Как играть и стоит ли выбивать",
      body: `### Ротация
**Саппорты/саб-дд → короткое Е (стойка) → 2 обычные → особая Е или Лазурное поглощение → повторить 2–3 раза → опционально Q.**

Без **С6** не мешайте особую Е и заряженную в одной ротации — выберите одну концепцию. Особая заряженная обычно сильнее; Е выгоднее с оружием вроде Тысячи солнц.

### Сигна vs С1
Сигна даёт больший прирост, чем С1. С1 имеет смысл, если целитесь в С2 и уже есть топ-3 оружие.

### Итог
Сильный, но **требовательный** Анемо мейн-дд: нужен 2/2 состав, желательно сигма и Ведьминские сапы. Лучшие команды — **Пиро**. Выбивать стоит при нехватке Анемо-дд или личной симпатии; новичкам с узким пулом саппортов будет тяжело.`,
    },
  ];

  const levelMaterials: CharacterMaterial[] = [
    matCard(matLocal, "Волчий крюк", 168, "local", 1),
    matCard(matBoss, "Призматический отсечённый хвост", 46, "boss", 4),
    matCard(matTurq1, "Осколок бирюзы Вайюда", 1, "ascension", 2),
    matCard(matTurq2, "Фрагмент бирюзы Вайюда", 9, "ascension", 3),
    matCard(matTurq3, "Кусок бирюзы Вайюда", 9, "ascension", 4),
    matCard(matTurq4, "Драгоценная бирюза Вайюда", 6, "ascension", 5),
    matCard(matShaft1, "Сломанный вал", 18, "ascension", 1),
    matCard(matShaft2, "Усиленный вал", 30, "ascension", 2),
    matCard(matShaft3, "Высокоточный вал", 36, "ascension", 3),
    matCard(matBook1, "Учения о «Свободе»", 9, "talent", 2),
    matCard(matBook2, "Указания о «Свободе»", 63, "talent", 3),
    matCard(matBook3, "Философия о «Свободе»", 114, "talent", 4),
    matCard(matWeekly, "Вознёсшийся образец: Ладья", 18, "talent", 5),
    matCard(matCrown, "Корона прозрения", 3, "talent", 5),
  ];

  const ex = loadExtracted();
  const iconBase = `/images/talents/${SLUG}`;
  const cIconBase = `/images/constellations/${SLUG}`;
  const lv13 = Array.from({ length: 13 }, (_, i) => String(i + 1));
  const rowsOf = (key: string) =>
    (ex.talents[key]?.rows || []).map((r) => ({ label: r.label, values: r.values }));

  // Пассивки: A1, A4, ведьминский, утилита (ключ 9 / 6 в yatta)
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
      name: ex.talents["9"]?.name || "Ведьмин ритуал кануна: Возвращение рассвета",
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
    "Варка — Анемо мейн-дд Ордо Фавониус: билд, оружие, сеты и отряды 2/2.";

  const minOrder = await prisma.character.aggregate({ _min: { order: true } });
  const order = (minOrder._min.order ?? 1) - 1;

  const data = {
    name: NAME,
    rarity: Rarity.LEGEND,
    element: Element.ANEMO,
    weaponType: "Двуручник",
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
