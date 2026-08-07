/**
 * Импорт гайда на Прюн.
 *
 *   npx tsx scripts/templates/fetch-guide-sources.ts   # CONFIG: pryun / 10000132
 *   npx tsx scripts/seed-pryun-guide.ts
 *
 * НЕ трогаем image / splashImage.
 * Таланты/консты — из scripts/_cache/pryun/yatta-extracted.json (RU, cleanYattaText).
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

const SLUG = "pryun";
const NAME = "Прюн";
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
  const artDar = a("Дар небес");
  const artNoblesse = a("Церемония древней знати");
  const artDay = a("День восходящих ветров");
  const artGlad = a("Конец гладиатора");

  const weaponItems: GuideRankedItem[] = [
    rankedWeapon(
      w("Кодекс Фавония"),
      1,
      "Кодекс Фавония",
      "Топ-1 · ВЭ%",
      "Крит → частицы энергии (R5 чаще).",
      "Лучший выбор почти везде. Нужна корона на К/Ш; пески — АТК%.",
      "S",
    ),
    rankedWeapon(
      w("Око клятвы"),
      2,
      "Око клятвы",
      "Ивент · АТК%",
      "После Е — большой бонус ВЭ% на 10 сек.",
      "На R5 закрывает ВЭ без Фавония; слабее командный батарей.",
      "A",
    ),
    rankedWeapon(
      w("Небесный атлас"),
      3,
      "Небесный атлас",
      "Стандарт · АТК%",
      "Элем. урон + облака с обычных.",
      "Топ для критовой сборки на С6 с песками на ВЭ%.",
      "A",
    ),
    rankedWeapon(
      w("Память о пыли"),
      4,
      "Память о пыли",
      "АТК% · щит",
      "Стаки АТК с попаданий; ×2 под щитом.",
      "Две Е + ульта дают почти полный набор стаков. Хорошо с Николь.",
      "A",
    ),
    rankedWeapon(
      w("Эпос о драконоборцах"),
      5,
      "Эпос о драконоборцах",
      "3★ · бафф АТК",
      "При смене — +АТК вошедшему на поле.",
      "Низкая база; сильный бафф мейн-дд на С0–С1.",
      "B",
    ),
    rankedWeapon(
      w("Кольцо Хакусин"),
      6,
      "Кольцо Хакусин",
      "ВЭ% · Электро",
      "После Электро-реакции — бонус урона Электро союзникам.",
      "Моно-Электро / Перегрузка с коротким взрывным мейн-дд (Райдэн).",
      "B",
    ),
    rankedWeapon(
      w("Сверкание чистых вод"),
      7,
      "Сверкание чистых вод",
      "F2P · АТК%",
      "После Е — элем. бонус; сильнее после снятия Долга жизни.",
      "Критовый F2P на С6 с хилером (не Николь). Нужно лечение.",
      "B",
    ),
  ];

  const artItems: GuideRankedItem[] = [
    rankedArt(
      artVV,
      1,
      "Изумрудная тень",
      "Топ-1 · шред",
      "2п Анемо урон; 4п урон Рассеивания + −40% резиста к поглощённой стихии.",
      "Лучший сет почти всегда: в её пачках VV часто некому отдать.",
      "S",
    ),
    rankedArt(
      artDar,
      2,
      "Дар небес",
      "Анемо мейн-дд",
      "2п ВЭ%; 4п элем. бонус союзникам после Е (сильнее с Тайным обрядом).",
      "Ситуативно под Варку/Венти/Странника, если саб-дд слабые.",
      "A",
    ),
    rankedArt(
      artNoblesse,
      3,
      "Церемония древней знати",
      "Старт",
      "2п урон Q; 4п +20% АТК отряду после ульты.",
      "Временный вариант, пока нет VV / Дара.",
      "B",
    ),
    rankedArt(
      artGlad || artDay,
      4,
      "2+2 АТК%",
      "Добор АТК",
      "2п АТК% + 2п АТК%.",
      "Пока не собрали 4п — добить порог АТК для баффов.",
      "B",
    ),
  ];
  if (artItems[3]) artItems[3].name = "2+2 АТК%";

  const matSeal1 = m("Печать Похитителей сокровищ", "Печать похитителей сокровищ");
  const matSeal2 = m("Печать серебряного ворона");
  const matSeal3 = m("Печать золотого ворона");
  const matBook1 = m("Учения о «Борьбе»");
  const matBook2 = m("Указания о «Борьбе»");
  const matBook3 = m("Философия о «Борьбе»");
  const matTurq1 = m("Осколок бирюзы Вайюда");
  const matTurq2 = m("Фрагмент бирюзы Вайюда");
  const matTurq3 = m("Кусок бирюзы Вайюда");
  const matTurq4 = m("Драгоценная бирюза Вайюда");
  const matBoss = m("Сияющие рога");
  const matLocal = m("Шпороцветник");
  const matWeekly = m("Маска мудрого лекаря");
  const matCrown = m("Корона прозрения");

  const roleRows: GuideRoleRow[] = [
    {
      id: uid(),
      name: c("varka")?.name || "Варка",
      image: c("varka")?.image || "",
      element: "Анемо",
      elementIcon: ELEMENT_SVG.ANEMO,
      weapon: "Двуручник",
      weaponIcon: "",
      description: "Сигнатурный мейн-дд: АТК-скейл, Рассеивание, Шабаш. Прюн сильнее Венти ~10–15%.",
      href: c("varka") ? `/wiki/characters/${c("varka")!.slug}` : undefined,
      rarity: 5,
    },
    {
      id: uid(),
      name: c("durin")?.name || "Дурин",
      image: c("durin")?.image || "",
      element: "Пиро",
      elementIcon: ELEMENT_SVG.PYRO,
      weapon: "Одноручный меч",
      weaponIcon: "",
      description: "Стабильный Пиро для раздувки/поглощения молотом; Шабаш.",
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
      description: "Щит + бафф АТК + Шабаш; часто ядро премиум-пачек.",
      href: c("nikol") ? `/wiki/characters/${c("nikol")!.slug}` : undefined,
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
      description: "Как саб-дд взаимозаменяемы; как мейн-дд — Прюн топ-саппорт под него.",
      href: c("venti") ? `/wiki/characters/${c("venti")!.slug}` : undefined,
      rarity: 5,
    },
    {
      id: uid(),
      name: c("fischl")?.name || "Фишль",
      image: c("fischl")?.image || "",
      element: "Электро",
      elementIcon: ELEMENT_SVG.ELECTRO,
      weapon: "Лук",
      weaponIcon: "",
      description: "Электро-карман + Шабаш; ядро Перегрузки и бюджетных пачек.",
      href: c("fischl") ? `/wiki/characters/${c("fischl")!.slug}` : undefined,
      rarity: 4,
    },
    {
      id: uid(),
      name: c("loen")?.name || "Лоэн",
      image: c("loen")?.image || "",
      element: "Крио",
      elementIcon: ELEMENT_SVG.CRYO,
      weapon: "Копьё",
      weaponIcon: "",
      description: "Крио мейн-дд Шабаша под Таяние с Дурином/Николь.",
      href: c("loen") ? `/wiki/characters/${c("loen")!.slug}` : undefined,
      rarity: 5,
    },
  ];

  const teams: GuideTeamVariant[] = [
    {
      id: uid(),
      badge: "Варка · топ",
      features:
        "Варка + Прюн + Дурин + Николь. Анемо-резонанс, Шабаш, стабильный Пиро для раздувки.",
      members: [
        member(c("varka"), "Варка", "Мейн-дд"),
        self("Анемо сап"),
        member(c("durin"), "Дурин", "Пиро саб"),
        member(c("nikol"), "Николь", "Щит / бафф"),
      ],
    },
    {
      id: uid(),
      badge: "Варка · бюджет",
      features: "Варка + Прюн + Сян Лин/Мавуика + Беннет. Одного Варки хватает на Тайный обряд.",
      members: [
        member(c("varka"), "Варка", "Мейн-дд"),
        self("Анемо сап"),
        member(c("xiangling"), "Сян Лин", "Пиро саб"),
        member(c("bennett"), "Беннет", "Хил / АТК"),
      ],
    },
    {
      id: uid(),
      badge: "Странник",
      features: "Странник + Прюн + Дурин/Мавуика + Николь/Тома. Конкурирует с Фарузан С6.",
      members: [
        member(c("wanderer", "strannik", "странник"), "Странник", "Мейн-дд"),
        self("Анемо сап"),
        member(c("durin"), "Дурин", "Пиро саб"),
        member(c("nikol"), "Николь", "Щит / бафф"),
      ],
    },
    {
      id: uid(),
      badge: "Перегрузка",
      features: "Клоринда/Вареса/Райдэн + Фишль/Дурин + Прюн + Николь/Беннет/Иансан.",
      members: [
        member(c("clorinde", "klorinda"), "Клоринда", "Мейн-дд"),
        member(c("fischl"), "Фишль", "Электро саб"),
        self("Анемо сап"),
        member(c("nikol"), "Николь", "Щит / бафф"),
      ],
    },
    {
      id: uid(),
      badge: "Таяние · Лоэн",
      features: "Лоэн + Прюн + Дурин + Николь/Беннет. Дурин в тёмной стойке закрывает Таяние.",
      members: [
        member(c("loen"), "Лоэн", "Мейн-дд"),
        self("Анемо сап"),
        member(c("durin"), "Дурин", "Пиро саб"),
        member(c("nikol"), "Николь", "Щит / бафф"),
      ],
    },
  ];

  const blocks: GuideBlock[] = [
    {
      id: uid(),
      type: "text",
      eyebrow: "Обзор",
      title: "Кто такая Прюн",
      body: `Прюн — **Анемо катализатор 4★**, «охотница на ведьм» из **Ведьминого шабаша**. Роль — **саппорт / саб-дд**: две Е (Анемо + поглощённая стихия), ульта-колокол следует за активным и через Рассеивание раздаёт **бафф урона от АТК**.

Сильнее всего с **Анемо мейн-дд Шабаша** (особенно **Варка**): там она обходит Венти примерно на **10–15%** урона пачки. Полный потенциал — на **С6**, но баффы работают уже с 70 ур. без прокачки кнопок.

### Кратко
- **Рейтинг** — A
- **Стихия / оружие** — Анемо · катализатор
- **Возвышение** — АТК% (**+24%** на 90 ур.)
- **База на 90 ур.** — HP **9 679** · АТК **221** · Защита **580** · АТК% **24%**
- **Добавлена** — патч **6.6** (затем стандарт)
- **День рождения** — 20 ноября
- **Регион / фракция** — Нод-Край / Мондштадт · Ведьмин шабаш
- **Созвездие** — Магическая Башня
- **Особое блюдо** — Суперкрутилка
- **Именная карточка** — Наказание`,
    },
    {
      id: uid(),
      type: "prosCons",
      eyebrow: "Анализ",
      title: "Преимущества и недостатки",
      prosTitle: "Преимущества",
      consTitle: "Недостатки",
      pros: [
        "**Сигнатурный саппорт под Варку** — сильнее Венти в его ядре.",
        "АТК 3000+ в бою достижима: баффы талантов/конст (+60% / С2 / С6).",
        "Только **баффы** — можно не качать таланты (хватит 70 ур. пассивок).",
        "Топ-сет — **Изумрудная тень**, есть почти у всех.",
        "Пассивка крафта: 10% шанс доп. материала оружия.",
      ],
      cons: [
        "Жёстко завязана на **Шабаш** для полного АТК-баффа себе/мейн-дд.",
        "Часть АТК — в **констах** (С2, С6); ульта стоит **70** энергии.",
        "Без конст тяжелее набрать АТК и ВЭ одновременно.",
      ],
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Билд",
      title: "Как собирать Прюн",
      body: `Сначала **ВЭ** (ульта по откату — без неё баффы не работают), затем **АТК**.

- **С0–С1**: корона на **АТК%**, личный урон вторичен.
- **С2+**: можно корону на **К/Ш** (особенно с Фавонием).
- Корона на **К/У** почти никогда — натив АТК%, криты балансировать тяжело.

Пески — **ВЭ%** или **АТК%**. Кубок — **АТК%**. МС не фармим.`,
    },
    {
      id: uid(),
      type: "statTargets",
      eyebrow: "Билд",
      title: "Рекомендуемые значения характеристик",
      intro:
        "В профиле ~2200+ АТК; в бою под баффами цель ~3000–4000 (макс. усиление). ВЭ сильно зависит от конст и Фавония.",
      targets: [
        {
          id: uid(),
          label: "АТК (профиль)",
          value: "2200+",
          hint: "В бою 3000–4000 под баффами",
        },
        {
          id: uid(),
          label: "ВЭ (С0)",
          value: "170–210%",
          hint: "Без Фавония ~205%; с Фавонием на ней ~170–180%",
        },
        {
          id: uid(),
          label: "ВЭ (С1 / С6)",
          value: "140–175% / 130–165%",
          hint: "С1 и С6 заметно режут порог",
        },
        {
          id: uid(),
          label: "К/Ш",
          value: "под Фавоний",
          hint: "Корона К/Ш, если берёте Кодекс",
        },
      ],
      slots: [
        { id: uid(), slot: "Пески", main: "ВЭ% / АТК%", subs: "АТК% · ВЭ% · К/Ш" },
        { id: uid(), slot: "Кубок", main: "АТК%", subs: "ВЭ% · К/Ш · АТК" },
        { id: uid(), slot: "Корона", main: "АТК% / К/Ш", subs: "АТК% · ВЭ% · К/Ш" },
      ],
    },
    {
      id: uid(),
      type: "rankedList",
      eyebrow: "Оружие",
      title: "Рейтинг оружия",
      intro:
        "Закройте **ВЭ** или **АТК** — чего не хватает в артефактах. Эпики часто удобнее легендарок по балансу.",
      kind: "weapons",
      items: weaponItems,
    },
    {
      id: uid(),
      type: "rankedList",
      eyebrow: "Артефакты",
      title: "Полезные артефакты",
      intro:
        "Цель — **4п Изумрудная тень**. Дар небес — только если выгоднее баффнуть Анемо мейн-дд, чем шредить саб-дд.",
      kind: "artifacts",
      items: artItems,
    },
    {
      id: uid(),
      type: "setPlan",
      eyebrow: "Артефакты",
      title: "Как раздать сеты в топ-отряде",
      intro: "Ориентир премиум-пачки с Варкой.",
      groups: [
        {
          id: uid(),
          title: "Варка + Дурин + Николь",
          rows: [
            planRow(c("varka"), "Варка", "День восходящих ветров", artImg(artDay, "День ветров")),
            {
              id: uid(),
              name: NAME,
              image: IMAGE,
              href: `/wiki/characters/${SLUG}`,
              setName: "Изумрудная тень",
              setImage: artImg(artVV, "Изумрудная тень"),
            },
            planRow(c("durin"), "Дурин", "День ветров / Знать", artImg(artDay || artNoblesse, "День")),
            planRow(c("nikol"), "Николь", "Дар небес", artImg(artDar, "Дар небес")),
          ],
        },
      ],
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Отряды",
      title: "Отряды под Шабаш и Рассеивание",
      body: `Нужен **хотя бы один** герой Шабаша и союзники **Пиро / Гидро / Крио / Электро** для Рассеивания. **Дендро и Гео** почти не подходят.

Идеал — **Анемо мейн-дд** (Варка, Венти-мейн, Странник). Стиль ударов мейн-дд не важен: баффы покрывают НА / заряд / падение / Е / Q.

Без Анемо-ядра можно ставить её в Пиро/Электро пачки с Дурином или Фишль.`,
    },
    {
      id: uid(),
      type: "roleTable",
      eyebrow: "Отряды",
      title: "Приоритетные персонажи",
      intro: "Ядро — Варка + Дурин/Николь; альтернативы — Венти-мейн, Фишль, Лоэн.",
      rows: roleRows,
    },
    {
      id: uid(),
      type: "teamGroup",
      eyebrow: "Отряды",
      title: "Примеры сильных команд",
      intro: "Топ — Варка; также Перегрузка, Таяние с Лоэном, Странник.",
      variants: teams,
    },
    {
      id: uid(),
      type: "resourceTable",
      title: "Возвышение",
      intro: "Бирюза Вайюда + шпороцветник и материалы Нод-Края:",
      rows: [
        {
          id: uid(),
          name: matTurq1?.name || "Бирюза Вайюда",
          image: matTurq1?.image || "",
          qty: "1→9→9→6",
          where: "Мировые и еженедельные боссы (серия бирюзы Вайюда)",
          href: matTurq1 ? `/wiki/materials/${matTurq1.slug}` : undefined,
        },
        {
          id: uid(),
          name: matLocal?.name || "Шпороцветник",
          image: matLocal?.image || "",
          qty: "168",
          where: "Диковинка Нод-Края",
          href: matLocal ? `/wiki/materials/${matLocal.slug}` : undefined,
        },
        {
          id: uid(),
          name: matBoss?.name || "Сияющие рога",
          image: matBoss?.image || "",
          qty: "46",
          where: "Повелитель морозной ночи",
          href: matBoss ? `/wiki/materials/${matBoss.slug}` : undefined,
        },
        {
          id: uid(),
          name: "Печати Похитителей",
          image: matSeal3?.image || matSeal1?.image || "",
          qty: "18 / 30 / 36",
          where: "Похитители сокровищ",
          href: matSeal1 ? `/wiki/materials/${matSeal1.slug}` : undefined,
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
          name: "Печати Похитителей",
          image: matSeal3?.image || "",
          qty: "6 / 21 / 31",
          where: "Похитители сокровищ",
          href: matSeal3 ? `/wiki/materials/${matSeal3.slug}` : undefined,
        },
        {
          id: uid(),
          name: matWeekly?.name || "Маска мудрого лекаря",
          image: matWeekly?.image || "",
          qty: "6",
          where: "Еженедельный босс «Еретик ложной луны»",
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
      body: `Суть — **две Е** (раздувка + поглощённый удар) и **Q-колокол**, который бьёт из кармана и через Рассеивание вызывает молот и баффы.

### Приоритет прокачки
**Q > E > обычные.** Только ради баффов таланты можно **не качать** (пассивки с 70 ур.).

### Активные
- **Трам-бам-бам: Молот-ведьмобой** — до 3 ударов; заряженная — замах; падение — AoE.
- **Динь-дилинь: Звон охоты на ведьм (Е)** — Анемо-удар. При Рассеивании Пиро/Гидро/Крио/Электро Е обновляется → **Бом-цзынь-цзынь** бьёт поглощённой стихией и включает «Звонкое единодушие».
- **Грянул звон, началась охота (Q)** — **70** энергии, откат 18, длительность **12** сек (**16** на С6). Колокол следует за активным.

### Пассивки
- **Вердикт и наказание** — Рассеивание с колокола → молот 150% АТК поглощённой стихией (урон Q).
- **Звонкое единодушие** — после молота: бафф урона отряду от АТК Прюн свыше 2000 (до +50%).
- **Ведьмин ритуал кануна: Клятва искателя ведьм** — Тайный обряд: +60% АТК Прюн при реакциях Шабаша; +30% АТК мейн-дд при Рассеивании.
- **Цзыньк-цзыньк… Переделываем!** — 10% шанс доп. материала при крафте материалов оружия.

### Созвездия
Лучшие — **С1**, **С2**, **С6**: энергия с молота; до +40% АТК в ульте; +4 сек ульты и +350 АТК активному.`,
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Геймплей",
      title: "Как играть и стоит ли выбивать",
      body: `### Ротация
**Статус на враге → Е (раздувка) → Е (поглощённый удар) → Q → мейн-дд / саб-дд → повтор.**

Без статуса на цели молот не окрасится — пачка останется без ключевых баффов.

### Прюн vs Венти
В ядре **Варки** Прюн обычно **сильнее**. Как общий Анемо-саб вне Шабаша Венти гибче (стяжка). Вместе как два саба почти не ставят.

### Итог
Сильный **4★ Анемо-саппорт Шабаша**, обязателен под **Варку**. Имеет смысл при наличии Ведьминских союзников и желании С6; на С0 играбельна, но требовательна к ВЭ/АТК.`,
    },
  ];

  const levelMaterials: CharacterMaterial[] = [
    matCard(matLocal, "Шпороцветник", 168, "local", 1),
    matCard(matBoss, "Сияющие рога", 46, "boss", 4),
    matCard(matTurq1, "Осколок бирюзы Вайюда", 1, "ascension", 2),
    matCard(matTurq2, "Фрагмент бирюзы Вайюда", 9, "ascension", 3),
    matCard(matTurq3, "Кусок бирюзы Вайюда", 9, "ascension", 4),
    matCard(matTurq4, "Драгоценная бирюза Вайюда", 6, "ascension", 5),
    matCard(matSeal1, "Печать Похитителей сокровищ", 18, "ascension", 1),
    matCard(matSeal2, "Печать серебряного ворона", 30, "ascension", 2),
    matCard(matSeal3, "Печать золотого ворона", 36, "ascension", 3),
    matCard(matBook1, "Учения о «Борьбе»", 9, "talent", 2),
    matCard(matBook2, "Указания о «Борьбе»", 63, "talent", 3),
    matCard(matBook3, "Философия о «Борьбе»", 114, "talent", 4),
    matCard(matWeekly, "Маска мудрого лекаря", 18, "talent", 5),
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
      name: ex.talents["9"]?.name || "Ведьмин ритуал кануна: Клятва искателя ведьм",
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
    "Прюн — Анемо саппорт Шабаша: билд на АТК/ВЭ, VV, оружие и отряды под Варку.";

  let order: number;
  if (existing?.order != null) {
    order = existing.order;
  } else {
    const minOrder = await prisma.character.aggregate({ _min: { order: true } });
    order = (minOrder._min.order ?? 1) - 1;
  }

  const data = {
    name: NAME,
    rarity: Rarity.EPIC,
    element: Element.ANEMO,
    weaponType: "Катализатор",
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
