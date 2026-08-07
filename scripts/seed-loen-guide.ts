/**
 * Импорт гайда на Лоэна.
 *
 *   npx tsx scripts/templates/fetch-guide-sources.ts   # CONFIG: loen / 10000129
 *   npx tsx scripts/seed-loen-guide.ts
 *
 * НЕ трогаем image / splashImage.
 * Таланты/консты — из scripts/_cache/loen/yatta-extracted.json (RU, cleanYattaText).
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

const SLUG = "loen";
const NAME = "Лоэн";
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

  const artDay = a("День восходящих ветров");
  const artHunter = a("Охотник Сумеречного двора");
  const artGlad = a("Конец гладиатора");
  const artBlizzard = a("Заблудший в метели");
  const artVV = a("Изумрудная тень");
  const artDar = a("Дар небес");
  const artScroll = a("Свиток героя сожжённого города", "Свиток героя сожженного города");
  const artGolden = a("Золотая труппа");

  const weaponItems: GuideRankedItem[] = [
    rankedWeapon(
      w("Бедствие и раскаяние"),
      1,
      "Бедствие и раскаяние",
      "Сигна · К/Ш",
      "После Е — бафф урона НА/заряженной и Е/Q; с Тайным обрядом усиление ×1.75.",
      "Сигна: усиливает все кнопки ротации. Лучше всего в Ведьминских отрядах.",
      "S",
    ),
    rankedWeapon(
      w("Очертания алой луны"),
      2,
      "Очертания алой луны",
      "К/Ш · Долг жизни",
      "Заряженная даёт Долг жизни; бонус урона, сильнее при ≥30% Долга.",
      "Сильный критовый вариант; стабильнее без хила. Тайминг стойки ≈ длительности пассивки.",
      "A",
    ),
    rankedWeapon(
      w("Нефритовый коршун"),
      3,
      "Нефритовый коршун",
      "Стандарт · К/Ш",
      "Стаки АТК с попаданий; на 7 стаках — бонус урона.",
      "Лучший временный 5★: те же база/саб, что у сигны — артефакты не пересобирать.",
      "A",
    ),
    rankedWeapon(
      w("Посох Хомы"),
      4,
      "Посох Хомы",
      "К/У · HP→АТК",
      "HP%; АТК от макс. HP; сильнее при HP < 50%.",
      "Много К/У — в артефактах тяните К/Ш. HP в сабах не бесполезен.",
      "A",
    ),
    rankedWeapon(
      w("Усмиритель бед"),
      5,
      "Усмиритель бед",
      "АТК% · элем. урон",
      "Бонус урона всеми стихиями; стаки АТК после Е (вне поля ×2).",
      "Высокая база ужесточает требования к урону саб-дд. Хорош в стойке.",
      "A",
    ),
    rankedWeapon(
      w("Смертельный бой"),
      6,
      "Смертельный бой",
      "БП · К/Ш",
      "АТК% (и защита при 2+ врагах); сильнее против одиночек.",
      "С сетом Дня ветров К/Ш почти закрыт. Удобный эпик из БП.",
      "B",
    ),
    rankedWeapon(
      w("Посох алых песков"),
      7,
      "Посох алых песков",
      "Таяние · К/Ш / МС",
      "АТК от МС; стаки после Е от МС.",
      "Только Таяние: пески на МС, желательно с Сахарозой.",
      "B",
    ),
    rankedWeapon(
      w("Покоритель вихря"),
      8,
      "Покоритель вихря",
      "АТК% · под щит",
      "Прочность щита; стаки АТК; под щитом стаки ×2.",
      "С Николь / Ситлали / Чжун Ли — сопротивление к прерыванию + АТК.",
      "B",
    ),
    rankedWeapon(
      w("Черногорская пика"),
      9,
      "Черногорская пика",
      "К/У · бюджет",
      "АТК за убийства (до 3 стаков).",
      "Затычка ради К/У; пассивка нестабильна, R5 не стоит вложений.",
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
      "Сигнатурный сет Ордо/Шабаша. Учитывайте +20% К/Ш при балансе критов.",
      "S",
    ),
    rankedArt(
      artGlad,
      2,
      "Конец гладиатора",
      "Старт · 4п",
      "2п АТК%; 4п урон обычных для копья.",
      "Второе место: много ударов с руки в стойке, без жёстких требований к отряду.",
      "A",
    ),
    rankedArt(
      artHunter,
      3,
      "Охотник Сумеречного двора",
      "С Фуриной",
      "2п урон НА/заряженной; 4п К/Ш при изменении HP.",
      "Заморозка / Таяние с Фуриной и хилером. МС в сабах не обязателен.",
      "A",
    ),
    rankedArt(
      artBlizzard,
      4,
      "Заблудший в метели",
      "Только Заморозка",
      "2п Крио урон; 4п К/Ш по Крио / Заморозке (до +40%).",
      "Нужен стабильный Гидро. К/Ш в артефактах сильно режьте.",
      "B",
    ),
    rankedArt(
      artBlizzard || artGlad || artDay,
      5,
      "2+2 АТК / Крио",
      "Временный 2+2",
      "2п АТК% + 2п Крио урон (или МС в Таянии).",
      "Пока нет 4п Дня ветров — закрывает ключевые статы.",
      "B",
    ),
  ];
  if (artItems[4]) artItems[4].name = "2+2 АТК% + Крио урон";

  const matArrow1 = m("Старый наконечник стрелы");
  const matArrow2 = m("Острый наконечник стрелы");
  const matArrow3 = m("Прочный наконечник стрелы");
  const matBook1 = m("Учения о «Борьбе»");
  const matBook2 = m("Указания о «Борьбе»");
  const matBook3 = m("Философия о «Борьбе»");
  const matTurq1 = m("Осколок нефрита Шивада");
  const matTurq2 = m("Фрагмент нефрита Шивада");
  const matTurq3 = m("Кусок нефрита Шивада");
  const matTurq4 = m("Драгоценный нефрит Шивада");
  const matBoss = m("Призматический отсечённый хвост", "Призматический отсеченный хвост");
  const matLocal = m("Эфирокрылый мотылёк", "Эфирокрылый мотылек");
  const matWeekly = m("Вознёсшийся образец: Конь", "Вознесшийся образец: Конь");
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
      description: "Топ саб-дд Шабаша: тёмная стойка закрывает Таяние и даёт карманный урон под Жажду победы.",
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
      description: "Щит + бафф АТК, Ведьмовство; проекции бьют стихией активного (часто Крио Лоэна).",
      href: c("nikol") ? `/wiki/characters/${c("nikol")!.slug}` : undefined,
      rarity: 5,
    },
    {
      id: uid(),
      name: c("eskofe")?.name || "Эскофье",
      image: c("eskofe")?.image || "",
      element: "Крио",
      elementIcon: ELEMENT_SVG.CRYO,
      weapon: "Копьё",
      weaponIcon: "",
      description: "Карман + шред Крио/Гидро + хил. Ядро топ-Заморозки.",
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
      description: "Бонус урона отряду + карманный Гидро; нужна с хилером (Эскофье / Шарлотта).",
      href: c("furina") ? `/wiki/characters/${c("furina")!.slug}` : undefined,
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
      description: "Крио-бафф кверами и полем ульты — усиливает личный урон Лоэна.",
      href: c("shen-khe", "shenhe")
        ? `/wiki/characters/${c("shen-khe", "shenhe")!.slug}`
        : undefined,
      rarity: 5,
    },
    {
      id: uid(),
      name: c("sucrose")?.name || "Сахароза",
      image: c("sucrose")?.image || "",
      element: "Анемо",
      elementIcon: ELEMENT_SVG.ANEMO,
      weapon: "Катализатор",
      weaponIcon: "",
      description: "Ведьмовство + МС + VV; стяжка. Особенно ценна в Таянии.",
      href: c("sucrose") ? `/wiki/characters/${c("sucrose")!.slug}` : undefined,
      rarity: 4,
    },
  ];

  const teams: GuideTeamVariant[] = [
    {
      id: uid(),
      badge: "Таяние · топ",
      features:
        "Лоэн + Дурин + Ситлали + Николь. Пиро/Крио резонансы, Шабаш, шред и щит. Дурин в тёмной стойке.",
      members: [
        self("Мейн-дд"),
        member(c("durin"), "Дурин", "Пиро саб"),
        member(c("sitlali"), "Ситлали", "Шред / щит"),
        member(c("nikol"), "Николь", "Щит / бафф"),
      ],
    },
    {
      id: uid(),
      badge: "Заморозка · топ",
      features:
        "Фурина + Мона (С1 желательно) + Эскофье. Два резонанса + Тайный обряд. Мона — на саппорт-сете.",
      members: [
        self("Мейн-дд"),
        member(c("furina"), "Фурина", "Гидро саб"),
        member(c("mona"), "Мона", "Гидро / обряд"),
        member(c("eskofe"), "Эскофье", "Крио саб / хил"),
      ],
    },
    {
      id: uid(),
      badge: "Заморозка · урон",
      features: "Фурина + Шэнь Хэ + Эскофье. Упор на личный урон Лоэна; второй саб тоже качайте.",
      members: [
        self("Мейн-дд"),
        member(c("furina"), "Фурина", "Гидро саб"),
        member(c("shen-khe", "shenhe"), "Шэнь Хэ", "Крио бафф"),
        member(c("eskofe"), "Эскофье", "Крио саб / хил"),
      ],
    },
    {
      id: uid(),
      badge: "Таяние · альт",
      features: "Дурин + Альбедо + Николь/Беннет. Цветки Альбедо копят Жажду; светлая стойка Дурина — шред Гео.",
      members: [
        self("Мейн-дд"),
        member(c("durin"), "Дурин", "Пиро саб"),
        member(c("albedo"), "Альбедо", "Гео саб"),
        member(c("nikol"), "Николь", "Щит / бафф"),
      ],
    },
    {
      id: uid(),
      badge: "Таяние · Анемо",
      features: "Дурин + Сахароза/Прюн/Венти + Ситлали/Николь. VV + Шабаш; при Дурин+Николь можно Кадзуху.",
      members: [
        self("Мейн-дд"),
        member(c("durin"), "Дурин", "Пиро саб"),
        member(c("sucrose"), "Сахароза", "Анемо / VV"),
        member(c("nikol"), "Николь", "Щит / бафф"),
      ],
    },
  ];

  const blocks: GuideBlock[] = [
    {
      id: uid(),
      type: "text",
      eyebrow: "Обзор",
      title: "Кто такой Лоэн",
      body: `Лоэн — **Крио копейщик 5★**, заместитель капитана отряда дальнего боя **Ордо Фавониус** (Мондштадт). Роль — **мейн-дд / драйвер**: в стойке **Мастерский ход** обычные бьют **Крио**, копится **Ликование** (своя Е) и **Жажда победы** (урон союзников из кармана).

Лучше всего — **Заморозка** и **Таяние** с героями **Ведьмовства**. С сигнатурой нужен Тайный обряд.

### Кратко
- **Рейтинг** — S
- **Стихия / оружие** — Крио · копьё
- **Возвышение** — К/У (**+38.4%** на 90 ур.)
- **База на 90 ур.** — HP **12 858** · АТК **344** · Защита **784** · К/У **38.4%**
- **Добавлен** — патч **6.6**
- **День рождения** — 3 апреля
- **Регион / фракция** — Мондштадт · Ордо Фавониус
- **Созвездие** — Хитрый Заяц
- **Особое блюдо** — Жвачка от скуки
- **Именная карточка** — Милосердие
- **Сигна** — Бедствие и раскаяние`,
    },
    {
      id: uid(),
      type: "prosCons",
      eyebrow: "Анализ",
      title: "Преимущества и недостатки",
      prosTitle: "Преимущества",
      consTitle: "Недостатки",
      pros: [
        "**Много Крио-статуса** — удобно с Пиро саб-дд, которые сами закрывают Таяние (Дурин).",
        "**Простая сборка** — АТК и криты; ВЭ и МС почти не нужны (МС — только Таяние в сабах).",
        "**Бафф АТК** отряду при Крио-реакциях; на С2 — ещё +200 МС союзникам.",
        "Две сильные концепции: **Заморозка** и **Таяние**.",
      ],
      cons: [
        "**Зависимость от созвездий** — комфорт с С1–С2; без них тяжелее копить Жажду и бить толпу.",
        "**Нужны сильные саб-дд** — карман ~10–30k за хит, иначе Жажда почти не растёт.",
        "Топ-отряды завязаны на **Шабаш** (пассивки / сигна).",
        "Уровень Е хотя бы одного союзника должен быть **не ниже** Е Лоэна (пассивка «Когда находит настроение»).",
      ],
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Билд",
      title: "Как собирать Лоэна",
      body: `Мейн-дд на поле: **АТК** и **криты**. Ульта продлевает стойку слабо — **ВЭ специально не фармим**.

Кубок — **Крио урон**. Пески — **АТК%**. Корона — **К/Ш** или **К/У**. МС в основном стате почти никогда; в Таянии с Дурином/Сян Лин — ~100–120 в сабах.`,
    },
    {
      id: uid(),
      type: "statTargets",
      eyebrow: "Билд",
      title: "Рекомендуемые значения характеристик",
      intro: "С сетом Дня ветров К/Ш режьте: сет даёт +20% после уроков ведьм. В Заморозке с Метелью — ещё жёстче.",
      targets: [
        {
          id: uid(),
          label: "АТК",
          value: "2000+",
          hint: "Урон стойки, особой Е и ульты",
        },
        {
          id: uid(),
          label: "К/Ш",
          value: "≤60% / ≤50%",
          hint: "День ветров / Метель в Заморозке",
        },
        {
          id: uid(),
          label: "К/У",
          value: "~1:2 к К/Ш",
          hint: "Ориентир 80/160 и выше",
        },
        {
          id: uid(),
          label: "МС",
          value: "0 / 100–120",
          hint: "Только Таяние в сабах",
        },
      ],
      slots: [
        { id: uid(), slot: "Пески", main: "АТК%", subs: "К/Ш · К/У · АТК" },
        { id: uid(), slot: "Кубок", main: "Крио урон%", subs: "К/Ш · К/У · АТК%" },
        { id: uid(), slot: "Корона", main: "К/Ш / К/У", subs: "К/У · К/Ш · АТК%" },
      ],
    },
    {
      id: uid(),
      type: "rankedList",
      eyebrow: "Оружие",
      title: "Рейтинг оружия",
      intro:
        "Универсально — **К/У** или **К/Ш**. В Таянии можно МС-копьё; в Заморозке — АТК. Сигна усиливает все кнопки.",
      kind: "weapons",
      items: weaponItems,
    },
    {
      id: uid(),
      type: "rankedList",
      eyebrow: "Артефакты",
      title: "Полезные артефакты",
      intro:
        "Цель — **4п День восходящих ветров**. Альтернативы: Гладиатор, Охотник с Фуриной, Метель только в Заморозке.",
      kind: "artifacts",
      items: artItems,
    },
    {
      id: uid(),
      type: "setPlan",
      eyebrow: "Артефакты",
      title: "Как раздать сеты в топ-отрядах",
      intro: "Ориентир под Таяние и Заморозку.",
      groups: [
        {
          id: uid(),
          title: "Таяние · Дурин + Николь",
          rows: [
            {
              id: uid(),
              name: NAME,
              image: IMAGE,
              href: `/wiki/characters/${SLUG}`,
              setName: "День восходящих ветров",
              setImage: artImg(artDay, "День восходящих ветров"),
            },
            planRow(c("durin"), "Дурин", "Горящая алая ведьма / дд-сет", ""),
            planRow(
              c("sitlali"),
              "Ситлали",
              "Свиток сожжённого города",
              artImg(artScroll, "Свиток"),
            ),
            planRow(c("nikol"), "Николь", "Дар небес", artImg(artDar, "Дар небес")),
          ],
        },
        {
          id: uid(),
          title: "Заморозка · Фурина + Эскофье",
          rows: [
            {
              id: uid(),
              name: NAME,
              image: IMAGE,
              href: `/wiki/characters/${SLUG}`,
              setName: "День ветров / Охотник / Метель",
              setImage: artImg(artDay || artHunter || artBlizzard, "День восходящих ветров"),
            },
            planRow(c("furina"), "Фурина", "Золотая труппа", artImg(artGolden, "Золотая труппа")),
            planRow(c("mona"), "Мона", "Дар небес / Знать", artImg(artDar, "Дар небес")),
            planRow(c("eskofe"), "Эскофье", "Золотая труппа", artImg(artGolden, "Золотая труппа")),
          ],
        },
      ],
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Отряды",
      title: "Отряды под Заморозку и Таяние",
      body: `Сила Лоэна завязана на **карманный урон** союзников: без сильного саб-дд Жажда победы почти не копится.

С **сигнатурой** обязателен резонанс **Шабаша**. Две рабочие концепции:
- **Заморозка** — против групп и замораживаемых элит.
- **Таяние** — универсальнее; чаще Пиро саб закрывает реакцию по Крио Лоэна.

Прочие реакции слабее или ломаются об несбиваемую инфузию.`,
    },
    {
      id: uid(),
      type: "roleTable",
      eyebrow: "Отряды",
      title: "Приоритетные персонажи",
      intro: "Лучшие компаньоны Шабаша и обычные ядра:",
      rows: roleRows,
    },
    {
      id: uid(),
      type: "teamGroup",
      eyebrow: "Отряды",
      title: "Примеры сильных команд",
      intro: "Топ — Таяние с Дурином и Заморозка с Эскофье/Фуриной.",
      variants: teams,
    },
    {
      id: uid(),
      type: "resourceTable",
      title: "Возвышение",
      intro: "Ресурсы для 90 ур. (нефрит Шивада + материалы Мондштадта / Нод-Края):",
      rows: [
        {
          id: uid(),
          name: matTurq1?.name || "Нефрит Шивада",
          image: matTurq1?.image || "",
          qty: "1→9→9→6",
          where: "Мировые и еженедельные боссы (серия нефрита Шивада)",
          href: matTurq1 ? `/wiki/materials/${matTurq1.slug}` : undefined,
        },
        {
          id: uid(),
          name: matLocal?.name || "Эфирокрылый мотылёк",
          image: matLocal?.image || "",
          qty: "168",
          where: "Диковинка: Пик ветров, Храм пространства",
          href: matLocal ? `/wiki/materials/${matLocal.slug}` : undefined,
        },
        {
          id: uid(),
          name: matBoss?.name || "Призматический отсечённый хвост",
          image: matBoss?.image || "",
          qty: "46",
          where: "Лучезарный лунный геккон",
          href: matBoss ? `/wiki/materials/${matBoss.slug}` : undefined,
        },
        {
          id: uid(),
          name: "Наконечники стрел",
          image: matArrow3?.image || matArrow1?.image || "",
          qty: "18 / 30 / 36",
          where: "Хиличурлы-стрелки",
          href: matArrow1 ? `/wiki/materials/${matArrow1.slug}` : undefined,
        },
      ],
    },
    {
      id: uid(),
      type: "resourceTable",
      title: "Таланты",
      intro: "На одну способность до 10 ур. Книги «Борьба» — Забытый каньон (вт/пт/вс).",
      rows: [
        {
          id: uid(),
          name: matBook3?.name || "Книги о «Борьбе»",
          image: matBook3?.image || "",
          qty: "3 / 21 / 38",
          where: "Забытый каньон — вт, пт, вс",
          href: matBook1 ? `/wiki/materials/${matBook1.slug}` : undefined,
        },
        {
          id: uid(),
          name: "Наконечники стрел",
          image: matArrow3?.image || "",
          qty: "6 / 21 / 31",
          where: "Хиличурлы-стрелки",
          href: matArrow3 ? `/wiki/materials/${matArrow3.slug}` : undefined,
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
      type: "text",
      eyebrow: "Геймплей",
      title: "Способности",
      body: `Основа — стойка **Мастерский ход**: Крио-инфузия, **Ликование** с собственных ударов и **Жажда победы** с урона союзников. Особая Е **Врезано в кость и сердце** тратит оба ресурса; **Q** тратит Жажду и чуть продлевает стойку.

### Приоритет прокачки
**E > Q > обычные** (обычные вне стойки почти не нужны).

### Активные
- **Копьё Фавония: Преданная клятва** — до 5 ударов; заряженная — бросок вперёд; падение — урон по площади.
- **Непредвиденный удар (Е)** — стойка ~13 сек (откат 18). Обычные/заряженные копят Ликование; союзники — Жажду. При макс. Ликовании — особая Е.
- **Вынесение приговора (Q)** — серия Крио-ударов от Жажды; **60** энергии, откат **15**; в стойке +1.65 сек длительности.

### Пассивки
- **Запрет на допросы** — при уроне союзника ≥3000% базы АТК Лоэна — +60 Жажды.
- **Шуточный шедевр** — после Крио-реакции союзника: +15% АТК ему и Лоэну на 8 сек.
- **Ведьмин ритуал кануна: Незаживающий шип** — Тайный обряд: при Жажде ≥50% макс. +40% урона НА/заряженной на 6 сек после особой Е/Q.
- **Когда находит настроение** — после Е: +1 ур. Е на 9 сек (+6 сек, если у союзника талант ≥ уровня Е Лоэна).

### Созвездия
Лучшие — **С1**, **С2**, **С6**: потолок Жажды ×3 и ускорение набора; АоЕ +200 МС; почти безлимитная особая Е и огромный К/У.`,
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Геймплей",
      title: "Как играть и стоит ли выбивать",
      body: `### Ротация (без С6)
**Баффы/саб-дд → Е (стойка) → обычные → особая Е (до 3 раз) → Q в конце → смена.**

Продвинутый вариант: чередуйте обычную + заряженную с особой Е — быстрее Ликование, меньше стамины в стойке.

### Ликование vs Жажда
- **Ликование** — копите сами в стойке (НА 15 / заряд 18, макс. 100) → особая Е.
- **Жажда** — саб-дд: удар ≥1000% базы АТК Лоэна = 20 ед., иначе 1; с A1 при ≥3000% = 60. Усиливает особую Е и Q (~0.4%/стак). С1: макс. 300.

### Сигна vs С1
Есть топ-5 копьё — берите **С1** (особенно со слабыми саб-дд). Только 4★ оружие, но сильные карманы — сначала **сигну**.

### Итог
Сильный, но **требовательный** Крио драйвер: нужен карманный урон и желательно Шабаш. Топ — **Таяние с Дурином** и **Заморозка с Эскофье/Фуриной**. Крутить имеет смысл при симпатии и готовых сапах; как «первый мейн-дд с нуля» — слабоват.`,
    },
  ];

  const levelMaterials: CharacterMaterial[] = [
    matCard(matLocal, "Эфирокрылый мотылёк", 168, "local", 1),
    matCard(matBoss, "Призматический отсечённый хвост", 46, "boss", 4),
    matCard(matTurq1, "Осколок нефрита Шивада", 1, "ascension", 2),
    matCard(matTurq2, "Фрагмент нефрита Шивада", 9, "ascension", 3),
    matCard(matTurq3, "Кусок нефрита Шивада", 9, "ascension", 4),
    matCard(matTurq4, "Драгоценный нефрит Шивада", 6, "ascension", 5),
    matCard(matArrow1, "Старый наконечник стрелы", 18, "ascension", 1),
    matCard(matArrow2, "Острый наконечник стрелы", 30, "ascension", 2),
    matCard(matArrow3, "Прочный наконечник стрелы", 36, "ascension", 3),
    matCard(matBook1, "Учения о «Борьбе»", 9, "talent", 2),
    matCard(matBook2, "Указания о «Борьбе»", 63, "talent", 3),
    matCard(matBook3, "Философия о «Борьбе»", 114, "talent", 4),
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
      name: ex.talents["9"]?.name || "Ведьмин ритуал кануна: Незаживающий шип",
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
    "Лоэн — Крио мейн-дд Ордо Фавониус: билд, оружие, сеты и отряды Заморозка/Таяние.";

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
    weaponType: "Копьё",
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
