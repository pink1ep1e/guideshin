/**
 * Импорт гайда на Коломбину.
 * Источники: wotpack.ru (билды/отряды), wiki.hoyolab.com + Honey Hunter (статы/таланты).
 *
 *   npx tsx scripts/seed-kolombina-guide.ts
 */
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
import { ELEMENT_SVG, type ElementKey } from "@/lib/genshin";
import type { CharacterMaterial } from "@/lib/character-materials";

const prisma = new PrismaClient();

const SLUG = "kolombina";
const NAME = "Коломбина";
const IMAGE = "/uploads/icons/kolombina.png";
const SPLASH = "/uploads/splash/kolombina.jpg";

/** Пустая иконка-заглушка — потом можно заменить в админке / БД. */
const STUB_IMAGE = "";

const missingLog: string[] = [];

function noteMissing(kind: string, name: string) {
  const line = `${kind}: ${name}`;
  if (!missingLog.includes(line)) missingLog.push(line);
}

function rarityStars(r: Rarity): 4 | 5 {
  return r === "LEGEND" ? 5 : 4;
}

function elIcon(element: Element | string): string {
  return ELEMENT_SVG[String(element) as ElementKey] || ELEMENT_SVG.HYDRO;
}

function elLabel(element: Element | string): string {
  const map: Record<string, string> = {
    PYRO: "Пиро",
    HYDRO: "Гидро",
    ANEMO: "Анемо",
    ELECTRO: "Электро",
    DENDRO: "Дендро",
    CRYO: "Крио",
    GEO: "Гео",
  };
  return map[String(element)] || String(element);
}

type CharRow = {
  id: number;
  name: string;
  slug: string;
  image: string;
  element: Element;
  rarity: Rarity;
};
type WeaponRow = { name: string; slug: string; image: string; rarity: Rarity };
type ArtifactRow = { name: string; slug: string; image: string; rarity: Rarity };
type MatRow = {
  name: string;
  slug: string;
  image: string;
  rarityStars: number | null;
  category: string | null;
};

function findChar(bySlug: Map<string, CharRow>, byName: Map<string, CharRow>, ...keys: string[]) {
  for (const k of keys) {
    const hit = bySlug.get(k) || byName.get(k.toLowerCase());
    if (hit) return hit;
  }
  return undefined;
}

function findWeapon(byName: Map<string, WeaponRow>, ...names: string[]) {
  for (const n of names) {
    const hit = byName.get(n.toLowerCase());
    if (hit) return hit;
  }
  for (const [k, w] of byName) {
    for (const n of names) {
      if (k.includes(n.toLowerCase()) || n.toLowerCase().includes(k)) return w;
    }
  }
  return undefined;
}

function findArt(byName: Map<string, ArtifactRow>, ...names: string[]) {
  for (const n of names) {
    const hit = byName.get(n.toLowerCase());
    if (hit) return hit;
  }
  for (const [k, a] of byName) {
    for (const n of names) {
      if (k.includes(n.toLowerCase()) || n.toLowerCase().includes(k)) return a;
    }
  }
  return undefined;
}

function findMat(mats: MatRow[], ...names: string[]) {
  for (const n of names) {
    const hit = mats.find((m) => m.name === n || m.name.includes(n) || n.includes(m.name));
    if (hit) return hit;
  }
  return undefined;
}

function rankedWeapon(
  w: WeaponRow | undefined,
  rank: number,
  fallbackName: string,
  subtitle: string,
  effect: string,
  verdict: string,
  tier?: string,
): GuideRankedItem {
  if (w) {
    return {
      id: uid(),
      rank,
      name: w.name,
      image: w.image || STUB_IMAGE,
      rarity: rarityStars(w.rarity),
      href: `/wiki/weapons/${w.slug}`,
      subtitle,
      effect,
      verdict,
      tier,
    };
  }
  noteMissing("weapon", fallbackName);
  return {
    id: uid(),
    rank,
    name: fallbackName,
    image: STUB_IMAGE,
    rarity: 5,
    subtitle: subtitle ? `${subtitle} · заглушка` : "заглушка",
    effect,
    verdict: `Заглушка — нет в БД. ${verdict}`,
    tier,
  };
}

function rankedArt(
  art: ArtifactRow | undefined,
  rank: number,
  fallbackName: string,
  subtitle: string,
  effect: string,
  verdict: string,
  tier?: string,
): GuideRankedItem {
  if (art) {
    return {
      id: uid(),
      rank,
      name: art.name,
      image: art.image || STUB_IMAGE,
      rarity: rarityStars(art.rarity),
      href: `/wiki/artifacts/${art.slug}`,
      subtitle,
      effect,
      verdict,
      tier,
    };
  }
  noteMissing("artifact", fallbackName);
  return {
    id: uid(),
    rank,
    name: fallbackName,
    image: STUB_IMAGE,
    rarity: 5,
    subtitle: subtitle ? `${subtitle} · заглушка` : "заглушка",
    effect,
    verdict: `Заглушка — нет в БД. ${verdict}`,
    tier,
  };
}

function member(c: CharRow | undefined, fallbackName: string, role?: string): GuideTeamMember {
  if (c) {
    return {
      id: uid(),
      name: c.name,
      image: c.image || STUB_IMAGE,
      elementIcon: elIcon(c.element),
      rarity: rarityStars(c.rarity),
      href: `/wiki/characters/${c.slug}`,
      role,
    };
  }
  noteMissing("character", fallbackName);
  return {
    id: uid(),
    name: fallbackName,
    image: STUB_IMAGE,
    elementIcon: ELEMENT_SVG.HYDRO,
    rarity: 5,
    role: role ? `${role} · заглушка` : "заглушка",
  };
}

function variant(
  features: string,
  members: GuideTeamMember[],
  badge?: string,
): GuideTeamVariant {
  return { id: uid(), features, members, badge };
}

function planRow(
  char: CharRow | undefined,
  fallbackName: string,
  setName: string,
  setImage = "",
): GuideSetPlanRow {
  if (char) {
    return {
      id: uid(),
      name: char.name,
      image: char.image || STUB_IMAGE,
      href: `/wiki/characters/${char.slug}`,
      setName,
      setImage: setImage || STUB_IMAGE,
    };
  }
  noteMissing("character", fallbackName);
  return {
    id: uid(),
    name: fallbackName,
    image: STUB_IMAGE,
    setName: setName.includes("заглушка") ? setName : `${setName} · заглушка`,
    setImage: setImage || STUB_IMAGE,
  };
}

function roleRow(
  c: CharRow | undefined,
  fallbackName: string,
  weapon: string,
  description: string,
): GuideRoleRow {
  if (c) {
    return {
      id: uid(),
      name: c.name,
      image: c.image || STUB_IMAGE,
      element: elLabel(c.element),
      elementIcon: elIcon(c.element),
      weapon,
      weaponIcon: "",
      description,
      href: `/wiki/characters/${c.slug}`,
    };
  }
  noteMissing("character", fallbackName);
  return {
    id: uid(),
    name: fallbackName,
    image: STUB_IMAGE,
    element: "—",
    elementIcon: ELEMENT_SVG.HYDRO,
    weapon,
    weaponIcon: "",
    description: `${description} (заглушка — нет в БД)`,
  };
}

function matCard(
  m: MatRow | undefined,
  name: string,
  qty: number,
  category: CharacterMaterial["category"],
  rarityStars = 1,
): CharacterMaterial {
  if (!m) noteMissing("material", name);
  return {
    id: uid(),
    name: m?.name || name,
    image: m?.image || STUB_IMAGE,
    qty,
    category,
    rarityStars: m?.rarityStars || rarityStars,
  };
}

function artImg(art: ArtifactRow | undefined, fallbackName: string): string {
  if (art?.image) return art.image;
  noteMissing("artifact", fallbackName);
  return STUB_IMAGE;
}

async function main() {
  const [chars, weapons, artifacts, materials] = await Promise.all([
    prisma.character.findMany({
      select: { id: true, name: true, slug: true, image: true, element: true, rarity: true },
    }),
    prisma.weapon.findMany({
      select: { name: true, slug: true, image: true, rarity: true },
    }),
    prisma.artifact.findMany({
      select: { name: true, slug: true, image: true, rarity: true },
    }),
    prisma.material.findMany({
      select: { name: true, slug: true, image: true, rarityStars: true, category: true },
    }),
  ]);

  const charBySlug = new Map(chars.map((c) => [c.slug, c]));
  const charByName = new Map(chars.map((c) => [c.name.toLowerCase(), c]));
  const weaponByName = new Map(weapons.map((w) => [w.name.toLowerCase(), w]));
  const artByName = new Map(artifacts.map((a) => [a.name.toLowerCase(), a]));

  const c = (...keys: string[]) => findChar(charBySlug, charByName, ...keys);
  const w = (...names: string[]) => findWeapon(weaponByName, ...names);
  const a = (...names: string[]) => findArt(artByName, ...names);
  const m = (...names: string[]) => findMat(materials, ...names);

  const artRassvet = a("Рассветная песнь звезды и луны");
  const artSerenada = a("Серенада шёлковой луны", "Серенада шелковой луны");
  const artNoch = a("Ночь открытия неба");

  const self = (role?: string): GuideTeamMember => ({
    id: uid(),
    name: NAME,
    image: IMAGE,
    elementIcon: ELEMENT_SVG.HYDRO,
    rarity: 5,
    href: `/wiki/characters/${SLUG}`,
    role,
  });

  const weaponItems: GuideRankedItem[] = [
    rankedWeapon(w("Вызов ноктюрна"), 1, "Вызов ноктюрна", "Сигна", "HP, энергия из кармана и большой К/У Лунных реакций.", "Лучший выбор. В артефактах добивайте К/Ш; ВЭ нужна меньше.", "S"),
    rankedWeapon(w("Лови волну"), 2, "Лови волну", "HP + К/У", "Много HP и крит. урона. Пассивка на Пар почти не нужна в кармане.", "Сильная альтернатива сигне, если уже есть.", "S"),
    rankedWeapon(w("Шкатулка истин"), 3, "Шкатулка истин", "Бутонизация", "Криты и бонусы под Лунную бутонизацию.", "Берите под Нефер/Лауму. В Заряде и Кристалле слабее.", "A"),
    rankedWeapon(w("Обряд вечного течения"), 4, "Обряд вечного течения", "Драйвер", "HP и К/У; пассивка для игры на поле.", "Только для редкого драйвер-билда.", "A"),
    rankedWeapon(w("Жертвенный нефрит"), 5, "Жертвенный нефрит", "Лучший 4★", "К/Ш, HP и МС из кармана после 5 сек. вне поля.", "Лучший 4★ из БП без сильных 5★.", "A"),
    rankedWeapon(w("Прототип: Янтарь"), 6, "Прототип: Янтарь", "Хил · крафт", "Энергия и лечение отряда после ульты.", "Когда в команде нет хилера или щита.", "B"),
    rankedWeapon(w("Зеркало прядильщицы ночи"), 7, "Зеркало прядильщицы ночи", "Бафф ЛБ", "Усиливает Бутонизацию отряда из кармана.", "Под Дендро-отряды.", "B"),
    rankedWeapon(w("Кодекс Фавония"), 8, "Кодекс Фавония", "Энергия отряду", "Частицы энергии всей группе при критах.", "С Флинсом или если она единственный Гидро.", "B"),
    rankedWeapon(w("Вихрь на волнах"), 9, "Вихрь на волнах", "HP + ВЭ", "ВЭ и HP после Е, сильнее с Гидро-резонансом.", "Если не хватает ульты.", "B"),
    rankedWeapon(w("Фонарь чёрной сердцевины", "Фонарь черной сердцевины"), 10, "Фонарь чёрной сердцевины", "Бутонизация", "Бонус дамага Бутонизации/ЛБ из кармана.", "Только если уже есть и играете в ЛБ.", "C"),
    rankedWeapon(w("Великолепие лазурного свода"), 11, "Великолепие лазурного свода", "HP + энергия", "HP и энергия; бонус элементального урона почти не нужен.", "Средний приоритет среди 5★.", "C"),
    rankedWeapon(w("Эпос о драконоборцах"), 12, "Эпос о драконоборцах", "Бюджет", "HP и бафф АТК следующему персонажу.", "Временно перед мейн-дд.", "C"),
  ];

  const artItems: GuideRankedItem[] = [
    rankedArt(artRassvet, 1, "Рассветная песнь звезды и луны", "Лучший 4п", "+МС и урон Лунных реакций из кармана (сильнее при Высшем сиянии).", "Основной сет в большинстве отрядов Нод-Края.", "S"),
    rankedArt(artSerenada, 2, "Серенада шёлковой луны", "ВЭ + МС отряду", "ВЭ и бафф МС/урона реакций союзникам.", "Если в команде нет другого носителя Серенады.", "S"),
    rankedArt(artNoch, 3, "Ночь открытия неба", "Драйвер", "Сильный сет на поле.", "Не для классического кармана.", "A"),
    rankedArt(a("Стойкость Миллелита"), 4, "Стойкость Миллелита", "Временно", "2п HP; 4п — бафф АТК при Е.", "Не фармить специально.", "B"),
    rankedArt(a("Сияние Вурукаши", "Сияние сладкой росы"), 5, "Сияние Вурукаши", "2п HP", "2п на здоровье.", "Временный 2+2 с Миллелитом.", "B"),
    rankedArt(a("Эмблема рассечённой судьбы", "Эмблема рассеченной судьбы"), 6, "Эмблема рассечённой судьбы", "2п ВЭ", "2п восстановления энергии.", "Точечно, если критично добрать ульту.", "C"),
  ];

  const blocks: GuideBlock[] = [
    {
      id: uid(),
      type: "text",
      eyebrow: "Обзор",
      title: "Кто такая Коломбина",
      body: `Лунная дева Коломбина — **Гидро-катализатор 5★** из Нод-Края. Роль — саппорт и карманный дамагер с усилениями: накладывает Гидро, баффает и **конвертирует обычные реакции в Лунные**, подстраиваясь под элементы союзников.

В отрядах с героями Нод-Края раскрывается лучше всего, в остальных заметно слабее. Без конст почти не лечит (кроме воскрешения в открытом мире). В сложном контенте нужен хилер или щитовик; полный потенциал — с **С2**.

### Кратко
- **Рейтинг** — S+
- **Титул** — Возвращение полой луны · «Субретка» / Куутар
- **Стихия / оружие** — Гидро · катализатор
- **Возвышение** — крит. шанс (+**19.2%** к 90 ур., итого **~24.2%** без экипировки)
- **База на 90 ур.** — HP **14 695** · АТК **96** · Защита **515** ([HoYoWiki](https://wiki.hoyolab.com/pc/genshin/entry/9121))
- **В игре с** — 14 января 2026 (обновление 6.3 «Песня полой луны»)
- **День рождения** — 14 января
- **Получение** — молитва события; **реран** — 2-я фаза 6.7, **21 июля – 11 августа 2026**
- **Регион / фракция** — Нод-Край · Чертог серебряной Луны (ранее: Дети Морозной Луны, Предвестники Фатуи)
- **Созвездие** — Коломбина Гипоселениа
- **Особое блюдо** — **Лунный мираж** (+30% макс. HP отряду на 300 сек.)
- **Визитка** — Коломбина: Когда-нибудь
- **Озвучка** — EN Emi Lo · JP Lynn · CN Ян Мэнлу · KR Yu Yeong`,
    },
    {
      id: uid(),
      type: "prosCons",
      eyebrow: "Анализ",
      title: "Преимущества и недостатки",
      prosTitle: "Преимущества",
      consTitle: "Недостатки",
      pros: [
        "Лучший саб-дд и саппорт под реакции Нод-Края (Лунные Бутонизация, Заряд и Кристалл). Дамагерам региона даёт около +30% урона и закрывает потребность в комфортном Гидро-компаньоне.",
        "Сборка относительно простая: нужны в основном криты и HP. Можно удешевить, максимизируя здоровье.",
        "Конвертирует обычные реакции в нод-краевские аналоги — можно собирать уникальные команды из старых персонажей.",
        "Упрощает исследование Нод-Края: комфортный спринт, воскрешение союзников и взаимодействие с мелкими животными силой куувяки.",
      ],
      cons: [
        "Практически не взаимодействует с компаньонами из других регионов как универсальный саппорт. Пиро/Крио/Анемо ДД почти не получают пользы от её баффов.",
        "На С0 играбельна, но в полную силу раскрывается с созвездиями — особенно С1 и С2 (комфорт, дамаг и выживаемость команды).",
        "Мало вариантов эффективного оружия: нужны HP, криты и бонусы к реакциям региона. Баффы элементального урона почти бесполезны.",
      ],
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Билд",
      title: "Как собирать Коломбину",
      body: `Сборка зависит от позиции в команде. Хотя она саппорт-баффер, **криты ей нужны**: личный урон достаточно сильный. Способности скейлятся от **HP** — фокусируйтесь на нём, а баланс добивайте второстепенными статами.

Главный параметр — **HP** (личный дамаг и исходящий бафф). Для урона из кармана важны **К/Ш и К/У**. Ульта должна быть активна постоянно — нужен запас **восстановления энергии**.`,
    },
    {
      id: uid(),
      type: "statTargets",
      eyebrow: "Билд",
      title: "Рекомендуемые значения характеристик",
      intro:
        "Приоритет: HP → криты → восстановление энергии. Бонус Гидро-урона почти не нужен.",
      targets: [
        {
          id: uid(),
          label: "HP",
          value: "35 000+",
          hint: "Минимум для пассивки и максимума баффа (+7%)",
        },
        {
          id: uid(),
          label: "ВЭ",
          value: "160–240%",
          hint: "С сигной, резонансом и Фавониями — 160–180%. Единственный Гидро без сигны — до 220–240%",
        },
        {
          id: uid(),
          label: "К/Ш",
          value: "70–80%",
          hint: "С пассивкой база уже ~39.2%",
        },
        {
          id: uid(),
          label: "К/У",
          value: "150%+",
          hint: "Чем выше — тем сильнее урон из кармана",
        },
      ],
      slots: [
        { id: uid(), slot: "Пески", main: "HP% или ВЭ%", subs: "ВЭ% · К/У · К/Ш · HP" },
        { id: uid(), slot: "Кубок", main: "HP%", subs: "ВЭ% · К/У · К/Ш · HP" },
        { id: uid(), slot: "Корона", main: "К/У или К/Ш", subs: "HP% · ВЭ% · К/У или К/Ш" },
      ],
    },
    {
      id: uid(),
      type: "rankedList",
      eyebrow: "Оружие",
      title: "Рейтинг оружия",
      intro:
        "Ищите криты и HP. Варианты на МС или ВЭ допустимы, если пассивка или артефакты компенсируют недостающие статы.",
      kind: "weapons",
      items: weaponItems,
    },
    {
      id: uid(),
      type: "rankedList",
      eyebrow: "Артефакты",
      title: "Полезные артефакты",
      intro:
        "Сеты должны усиливать урон от реакций Нод-Края. При необходимости временно ставьте саппортские наборы.",
      kind: "artifacts",
      items: artItems,
    },
    {
      id: uid(),
      type: "setPlan",
      eyebrow: "Артефакты",
      title: "Как раздать сеты в топ-отрядах",
      intro: "Ориентир по распределению сетов между союзниками в основных нод-краевских отрядах.",
      groups: [
        {
          id: uid(),
          title: "Лунный заряд",
          rows: [
            planRow(c("flins", "флинс"), "Флинс", "Ночь открытия неба", artImg(artNoch, "Ночь открытия неба")),
            planRow(c("ineffa", "инеффа"), "Инеффа", "Серенада или Рассвет", artImg(artSerenada, "Серенада шёлковой луны")),
            {
              id: uid(),
              name: NAME,
              image: IMAGE,
              href: `/wiki/characters/${SLUG}`,
              setName: "Рассвет или Серенада",
              setImage: artImg(artRassvet, "Рассветная песнь звезды и луны"),
            },
            planRow(c("sucrose", "сахароза"), "Сахароза / Ягода", "Изумрудная тень", a("Изумрудная тень")?.image || STUB_IMAGE),
          ],
        },
        {
          id: uid(),
          title: "Лунная бутонизация",
          rows: [
            planRow(c("nefer", "нефер"), "Нефер", "Ночь открытия неба", artImg(artNoch, "Ночь открытия неба")),
            planRow(c("lauma", "лаума"), "Лаума", "Серенада", artImg(artSerenada, "Серенада шёлковой луны")),
            {
              id: uid(),
              name: NAME,
              image: IMAGE,
              href: `/wiki/characters/${SLUG}`,
              setName: "Рассвет",
              setImage: artImg(artRassvet, "Рассветная песнь звезды и луны"),
            },
            planRow(c("nahida", "нахида"), "Гидро / Дендро саппорт", "Воспоминания дремучего леса", a("Воспоминания дремучего леса")?.image || STUB_IMAGE),
          ],
        },
        {
          id: uid(),
          title: "Лунный кристалл",
          rows: [
            planRow(c("czy-baj", "цзы бай"), "Цзы Бай", "Ночь открытия неба", artImg(artNoch, "Ночь открытия неба")),
            planRow(c("illugi", "иллуги"), "Иллуги", "Инструктор", a("Инструктор")?.image || STUB_IMAGE),
            {
              id: uid(),
              name: NAME,
              image: IMAGE,
              href: `/wiki/characters/${SLUG}`,
              setName: "Серенада или Рассвет",
              setImage: artImg(artSerenada, "Серенада шёлковой луны"),
            },
            planRow(c("linneya", "линнея"), "Линнея", "Рассвет или Серенада", artImg(artRassvet, "Рассветная песнь звезды и луны")),
          ],
        },
      ],
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Отряды",
      title: "Отряды с Лунными героями",
      body: `Лучшие команды строятся вокруг героев Нод-Края: они дают **Высшее сияние** и сами получают огромную выгоду. Набирайте **2–3** таких персонажа для уровня Знамения и держите минимум одного «внешнего» спутника для баффов.

Реакции Коломбины работают с **Электро, Дендро и Гео** — с другими элементами синергии как у Лунного саппорта нет.`,
    },
    {
      id: uid(),
      type: "roleTable",
      eyebrow: "Отряды",
      title: "Приоритетные персонажи",
      intro: "Лучшие союзники для героини:",
      rows: [
        roleRow(
          c("flins", "флинс", "кирилл"),
          "Флинс",
          "Копьё",
          "Грозовые тучи бьют чаще (раз в 1,5 сек.) — примерно +30% DPS. С С1 Коломбины ВЭ Флинса можно снизить на 10%.",
        ),
        roleRow(
          c("ineffa", "инеффа"),
          "Инеффа",
          "Копьё",
          "Те же бонусы Заряда. После замены Айно может носить Рассвет, а Субретке отдать Серенаду.",
        ),
        roleRow(
          c("nefer", "нефер"),
          "Нефер",
          "Катализатор",
          "Сильно нуждается в Куутар: статус, бафф и +3 Росы для стабильной реакции.",
        ),
        roleRow(
          c("lauma", "лаума"),
          "Лаума",
          "Катализатор",
          "С Нефер без Субретки почти не прожимает заряженный навык из-за Росы. С1 Лаумы важнее С1 Коломбины в тройке без хилера.",
        ),
        roleRow(
          c("czy-baj", "цзы бай"),
          "Цзы Бай",
          "Меч",
          "Гео ДД от стойки — нужен стабильный Гидро из кармана до конца стойки.",
        ),
        roleRow(
          c("linneya", "линнея"),
          "Линнея",
          "Лук",
          "Саб-дд и хил из кармана через помощника с Е.",
        ),
      ],
    },
    {
      id: uid(),
      type: "teamGroup",
      eyebrow: "Отряды",
      title: "Лунная бутонизация",
      intro: "Примеры команд с Дендро-героями:",
      variants: [
        variant(
          "Сильнейшая команда с Нефер. Лауме обычно Серенаду, Куутар — Рассвет. Без С1 Лаумы на Нахиду поставьте Прототип: Янтарь для подхила.",
          [
            member(c("nefer", "нефер"), "Нефер", "Мейн-дд"),
            self("Саппорт"),
            member(c("lauma", "лаума"), "Лаума", "Саб-дд"),
            member(c("nahida", "нахида"), "Нахида", "Флекс"),
          ],
          "Топ",
        ),
        variant(
          "Альтернатива: Сахароза в Инструкторе поглощает Гидро для статуса и баффает МС, даже не будучи Дендро.",
          [
            member(c("nefer", "нефер"), "Нефер", "Мейн-дд"),
            self("Саппорт"),
            member(c("lauma", "лаума"), "Лаума", "Саб-дд"),
            member(c("sucrose", "сахароза"), "Сахароза", "Флекс"),
          ],
          "Альтернатива",
        ),
        variant(
          "Бюджет без Лаумы: Нахида или Бай Чжу + Кокоми. В двух хилерах смысла мало — вместо Кокоми можно Айно в Серенаде.",
          [
            member(c("nefer", "нефер"), "Нефер", "Мейн-дд"),
            self("Саппорт"),
            member(c("nahida", "нахида"), "Нахида", "Саб-дд"),
            member(c("kokomi", "кокоми"), "Кокоми", "Хил"),
          ],
          "Бюджет",
        ),
      ],
    },
    {
      id: uid(),
      type: "teamGroup",
      eyebrow: "Отряды",
      title: "Лунный заряд",
      intro: "Группы через Электро:",
      variants: [
        variant(
          "Стандарт с Флинсом: Субретка вместо Айно баффает светоносца и Инеффу. Сахароза — МС и помощь элементам.",
          [
            member(c("flins", "флинс"), "Флинс", "Мейн-дд"),
            self("Саппорт"),
            member(c("ineffa", "инеффа"), "Инеффа", "Саб-дд"),
            member(c("sucrose", "сахароза"), "Сахароза", "Флекс"),
          ],
          "Топ",
        ),
        variant(
          "Без Инеффы: Оророн предпочтительнее Фишль (энергия для Флинса). Ягода выгоднее Сахарозы хилом, особенно с С6.",
          [
            member(c("flins", "флинс"), "Флинс", "Мейн-дд"),
            self("Саппорт"),
            member(c("ororon", "оророн"), "Оророн", "Саб-дд"),
            member(c("sucrose", "сахароза"), "Сахароза", "Флекс"),
          ],
          "Бюджет",
        ),
        variant(
          "Если Электро саб-дд заняты: Куки в Инструкторе + Айно как второй Гидро и носитель Серенады.",
          [
            member(c("flins", "флинс"), "Флинс", "Мейн-дд"),
            self("Саппорт"),
            member(c("kuki", "куки", "синобу"), "Синобу", "Хил"),
            member(c("ajno", "aino", "айно"), "Айно", "Гидро"),
          ],
          "Гибко",
        ),
      ],
    },
    {
      id: uid(),
      type: "teamGroup",
      eyebrow: "Отряды",
      title: "Лунный кристалл",
      intro: "Отряды с Гео-героями:",
      variants: [
        variant(
          "Сигнатурный отряд Цзы Бай. Линнея уже лечит — Коломбине сигна или Кодекс Фавония (она единственный Гидро).",
          [
            member(c("czy-baj", "цзы бай"), "Цзы Бай", "Мейн-дд"),
            self("Саппорт"),
            member(c("illugi", "иллуги"), "Иллуги", "Саб-дд"),
            member(c("linneya", "линнея"), "Линнея", "Хил"),
          ],
          "Сигнатурный",
        ),
        variant(
          "Без Линнеи: все бафферы на Цзы Бай. Шилонен желательно С2; иначе Горо с С4 на подхил. Иллуги — сигнатурный саппорт реакции.",
          [
            member(c("czy-baj", "цзы бай"), "Цзы Бай", "Мейн-дд"),
            self("Саппорт"),
            member(c("illugi", "иллуги"), "Иллуги", "Саб-дд"),
            member(c("gorou", "горо"), "Горо", "Бафф"),
          ],
          "Сильный",
        ),
        variant(
          "С Тиори: тотемы ЛК считаются Гео-конструкциями. Коломбине лучше Прототип: Янтарь. Альтернатива слоту — Чжун Ли на срез резистов.",
          [
            member(c("czy-baj", "цзы бай"), "Цзы Бай", "Мейн-дд"),
            self("Саппорт"),
            member(c("illugi", "иллуги"), "Иллуги", "Саб-дд"),
            member(c("tiori", "chiori", "тиори"), "Тиори", "Саб-дд"),
          ],
          "Альтернатива",
        ),
        variant(
          "С Айно: желателен её С6 под ЛК. Без поддержки и без С1 Куутар на щит — Прототип: Янтарь на Коломбину.",
          [
            member(c("czy-baj", "цзы бай"), "Цзы Бай", "Мейн-дд"),
            self("Саппорт"),
            member(c("ajno", "aino", "айно"), "Айно", "Гидро"),
            member(c("illugi", "иллуги"), "Иллуги", "Саб-дд"),
          ],
          "Вариант",
        ),
      ],
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Отряды",
      title: "Отряды с «обычными» персонажами",
      body: `Хотя Коломбина сама конвертирует реакции в Лунные, **брать её ради обычных ДД не стоит**: без собственных множителей на Лунные реакции их урон будет ниже, чем у нод-краевских оригиналов. Допустимо, но без ожидания того же результата.

### Синергия вне региона
- **Ягода** — займёт слот поддержки и поднимет Сияние, если Нод-Края мало.
- **Иллуги** — без Куутар сам не конвертирует реакции; вместе открывает Лунный кристалл с обычными героями.
- **Айно** — Гидро-резонанс и Высшее сияние; на С6 усиливает конвертированные реакции.`,
    },
    {
      id: uid(),
      type: "teamGroup",
      eyebrow: "Отряды",
      title: "Эффективные команды вне Нод-Края",
      intro: "Группы с обычными мейн-дд через конвертацию реакций и Высшее сияние:",
      variants: [
        variant(
          "Нёвиллет под щитом Инеффы. Куутар даёт Гидро-резонанс на HP. Сахароза/Ягода/Лаума — на выбор слота поддержки.",
          [
            member(c("neuvillette", "невиллет", "нёвиллет"), "Нёвиллет", "Мейн-дд"),
            self("Саппорт"),
            member(c("ineffa", "инеффа"), "Инеффа", "Саб-дд"),
            member(c("sucrose", "сахароза"), "Сахароза", "Флекс"),
          ],
        ),
        variant(
          "Субретка как драйвер заряженными с Лаумой и вторым Дендро. Нилу — статус и усиления (лучше с С2).",
          [
            member(c("nilou", "нилу"), "Нилу", "Мейн-дд"),
            self("Драйвер"),
            member(c("lauma", "лаума"), "Лаума", "Саб-дд"),
            member(c("nahida", "нахида"), "Нахида", "Саб-дд"),
          ],
        ),
        variant(
          "Аль-Хайтам + Лаума на Дендро-статус, Субретка на ядра. Куки на хил и взрыв бутонов (или Кокоми).",
          [
            member(c("al-khaytam", "alhaitham", "аль-хайтам", "аль хайтам"), "Аль-Хайтам", "Мейн-дд"),
            self("Саппорт"),
            member(c("lauma", "лаума"), "Лаума", "Саб-дд"),
            member(c("kuki", "куки", "синобу"), "Синобу", "Хил"),
          ],
        ),
        variant(
          "Арлекино / Мавуика через смесь Пара, Перегрузки и Заряда. На поддержку — Ягода или Сахароза; хил менее критичен из-за щита Инеффы.",
          [
            member(c("arlekino", "arlecchino", "арлекино"), "Арлекино", "Мейн-дд"),
            self("Саппорт"),
            member(c("ineffa", "инеффа"), "Инеффа", "Саб-дд"),
            member(c("sucrose", "сахароза"), "Сахароза", "Флекс"),
          ],
        ),
        variant(
          "Классический Пар: Кадзуха раздувает Пиро/Гидро, Беннет баффает АТК и хилит.",
          [
            member(c("arlekino", "arlecchino", "арлекино"), "Арлекино", "Мейн-дд"),
            self("Саппорт"),
            member(c("bennett", "беннет"), "Беннет", "Бафф"),
            member(c("kazuha", "кадзуха"), "Кадзуха", "Раздув"),
          ],
          "Пар",
        ),
        variant(
          "Заморозка со Скирк, если совсем нет Нод-Края: статус + HP-резонанс для Фурины, освобождает других саб-дд для других команд.",
          [
            member(c("skirk", "скирк"), "Скирк", "Мейн-дд"),
            self("Саппорт"),
            member(c("eskofe", "escoffier", "эскофье"), "Эскофье", "Саб-дд"),
            member(c("furina", "фурина"), "Фурина", "Саб-дд"),
          ],
          "Заморозка",
        ),
      ],
    },
    {
      id: uid(),
      type: "resourceTable",
      title: "Возвышение",
      intro: "Все ресурсы для возвышения Коломбины:",
      rows: [
        {
          id: uid(),
          name: m("Осколок лазурита Варунада")?.name || "Лазурит Варунада",
          image: m("Осколок лазурита Варунада")?.image || "",
          qty: "1→9→9→6",
          where: "Еженедельные и мировые боссы (серия лазурита Варунада)",
          href: m("Осколок лазурита Варунада")
            ? `/wiki/materials/${m("Осколок лазурита Варунада")!.slug}`
            : undefined,
        },
        {
          id: uid(),
          name: "Слаймы",
          image: m("Слизь слайма")?.image || "",
          qty: "18 / 30 / 36",
          where: "Слаймы по Тейвату",
          href: m("Слизь слайма")
            ? `/wiki/materials/${m("Слизь слайма")!.slug}`
            : undefined,
        },
        {
          id: uid(),
          name: m("Сияющие рога")?.name || "Сияющие рога",
          image: m("Сияющие рога")?.image || "",
          qty: "46",
          where: "Мировой босс «Повелитель морозной ночи»",
          href: m("Сияющие рога")
            ? `/wiki/materials/${m("Сияющие рога")!.slug}`
            : undefined,
        },
        {
          id: uid(),
          name: m("Шпороцветник")?.name || "Шпороцветник",
          image: m("Шпороцветник")?.image || "",
          qty: "168",
          where: "Острова Нод-Края (Winter Icelea / локальная диковинка)",
          href: m("Шпороцветник")
            ? `/wiki/materials/${m("Шпороцветник")!.slug}`
            : undefined,
        },
        {
          id: uid(),
          name: (() => {
            const row = m("Опыт героя");
            if (!row) noteMissing("material", "Опыт героя");
            return row?.name || "Опыт героя (заглушка)";
          })(),
          image: m("Опыт героя")?.image || STUB_IMAGE,
          qty: "421",
          where: m("Опыт героя")
            ? "Ивенты, задания, артерии земли"
            : "Заглушка — добавьте материал «Опыт героя» в БД",
          href: m("Опыт героя")
            ? `/wiki/materials/${m("Опыт героя")!.slug}`
            : undefined,
        },
        {
          id: uid(),
          name: m("Мора")?.name || "Мора",
          image: m("Мора")?.image || "",
          qty: "1 653 000",
          where: "Любые активности (прокачка + возвышение)",
          href: m("Мора") ? `/wiki/materials/${m("Мора")!.slug}` : undefined,
        },
      ],
    },
    {
      id: uid(),
      type: "materials",
      title: "Таланты (на 1 способность)",
      items: [
        {
          id: uid(),
          name: m("Учения о «Лунном свете»")?.name || "Учения о «Лунном свете»",
          image: m("Учения о «Лунном свете»")?.image || "",
          rarity: 4 as const,
          note: "×3",
          qty: "3",
          href: m("Учения о «Лунном свете»")
            ? `/wiki/materials/${m("Учения о «Лунном свете»")!.slug}`
            : undefined,
        },
        {
          id: uid(),
          name: m("Указания о «Лунном свете»")?.name || "Указания о «Лунном свете»",
          image: m("Указания о «Лунном свете»")?.image || "",
          rarity: 4 as const,
          note: "×21",
          qty: "21",
          href: m("Указания о «Лунном свете»")
            ? `/wiki/materials/${m("Указания о «Лунном свете»")!.slug}`
            : undefined,
        },
        {
          id: uid(),
          name: m("Философия о «Лунном свете»")?.name || "Философия о «Лунном свете»",
          image: m("Философия о «Лунном свете»")?.image || "",
          rarity: 4 as const,
          note: "×38",
          qty: "38",
          href: m("Философия о «Лунном свете»")
            ? `/wiki/materials/${m("Философия о «Лунном свете»")!.slug}`
            : undefined,
        },
        {
          id: uid(),
          name: m("Маска мудрого лекаря")?.name || "Маска мудрого лекаря",
          image: m("Маска мудрого лекаря")?.image || "",
          rarity: 5 as const,
          note: "×6",
          qty: "6",
          href: m("Маска мудрого лекаря")
            ? `/wiki/materials/${m("Маска мудрого лекаря")!.slug}`
            : undefined,
        },
        {
          id: uid(),
          name: m("Корона прозрения")?.name || "Корона прозрения",
          image: m("Корона прозрения")?.image || "",
          rarity: 5 as const,
          note: "×1",
          qty: "1",
          href: m("Корона прозрения")
            ? `/wiki/materials/${m("Корона прозрения")!.slug}`
            : undefined,
        },
      ],
    },
    {
      id: uid(),
      type: "statsTable",
      title: "Характеристики при возвышении",
      intro:
        "Растёт крит. шанс (+19.2% к базе на 90 ур.). Итого без экипировки ~**24.2% К/Ш**. Качайте до 90; уровни 95/100 через Блуждающую удачу желательны, но не критичны. Источник: HoYoWiki / wotpack.",
      colLabels: [
        "Уровень",
        "Базовое HP",
        "Базовая сила атаки",
        "Базовая защита",
        "Базовый К/Ш",
        "Бонус К/Ш (возвышение)",
      ],
      rows: [
        emptyStatsRow("1", "1 144", "7", "40", "5%", "0%"),
        emptyStatsRow("20", "3 948", "26", "138", "5%", "0%"),
        emptyStatsRow("40", "6 605", "43", "231", "5%", "4.8%"),
        emptyStatsRow("50", "8 528", "56", "299", "5%", "9.6%"),
        emptyStatsRow("60", "10 230", "67", "358", "5%", "9.6%"),
        emptyStatsRow("70", "11 940", "78", "418", "5%", "14.4%"),
        emptyStatsRow("80", "13 662", "89", "479", "5%", "19.2%"),
        emptyStatsRow("90", "14 695", "96", "515", "5%", "19.2%"),
      ],
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Геймплей",
      title: "Способности",
      body: `Субретка усиливает союзников Нод-Края: бафф, Гидро-статус и собственный урон. Способности подстраиваются под элементы союзников и открывают Лунные реакции старым героям. Подробные таблицы — во вкладке **Билд → Таланты**.

### Приоритет прокачки
**Е ≥ Q > обычные** (обычные — только если играете драйвером через заряженные).

После 6 уровня сильнее качайте **Е** (дамаг и статус); ульта в основном бафф.

### Активные навыки
- **Ливень лунных рос** — до 3 обычных ударов, заряженная по площади, падение. При наличии **Зелёной росы** заряженная сменяется на **Очищение лунной росой** (3× Дендро по площади = урон **Лунной бутонизации**, без расхода выносливости).
- **Вечные приливы (Е)** — **Зыбь тяготения** на **25 сек.** (откат **17**). Следует за активным персонажем, бьёт Гидро по площади, копит **Силу тяготения** (до 60, по 20 / 2 сек. при Лунных реакциях) и при максимуме вызывает **Вмешательство**: Лунный заряд / бутонизация (5 печатей) / кристалл. При **Высшем сиянии** — большая площадь Гидро.
- **Тоска во свете луны (Q)** — **Владения луны** на **20 сек.** (60 энергии, откат **15**): Гидро по площади + повышение урона **Лунных реакций** (на 10 ур. таланта — **+40%**).

### Пассивки
- **Зов лунного безумия** — при Вмешательстве: +**5% К/Ш** на 10 сек., до **3** стаков.
- **Закон новолуния** — во Владениях: доп. удар Лунного заряда (33%), **Роса лунных кряжей** от ЛБ (до 3 / 18 сек.), доп. атака Лунного кристалла (33%).
- **Дар лунного знамения** — конвертирует Заряд / Бутонизацию / Гидро-кристалл в Лунные; +**0,2%** урона реакций за **1000 HP** (макс. **7%**); +1 к уровню **Знамения**.
- **Бдение луны** — воскрешение союзника в Нод-Крае / на Морозной Луне раз в **100 сек.** (не в подземельях / Бездне).`,
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Геймплей",
      title: "Как играть и стоит ли выбивать",
      body: `### Ротация
1. Начните с Коломбины: **Е → Q** (если ульта не готова — вернитесь к ней после отката).
2. Саппорты и саб-дд — баффы и статусы. Пока действует Зыбь, копится Сила тяготения; Вмешательство бьёт примерно каждые **6 сек.** на С0 (быстрее с **С1–С2**).
3. Мейн-дд полностью под **Зыбью** и **Владениями луны**.
4. Повторяйте по откату.

> Порядок: **Е → Q → саб-дд → мейн-дд**.

### Стоит ли выбивать?
Коломбина относительно дешёвая в сборке и простая в геймплее, но **сильно ограничена отрядами**: полноценно усиливает героев **Лунных реакций**. Обычным элементальным ДД достаётся в основном Гидро-статус без её ключевых баффов.

Берите её, если качаете готовые отряды Нод-Края. Без них польза часто уступает другим Гидро саб-дд.

### С1 или сигна?
- **С1** — комфорт команды (энергия Флинсу, сопротивление прерыванию Нефер, щит Цзы Бай) и чаще Вмешательство.
- **Сигна** — личный дамаг, HP, К/У и энергия; берите, если команде уже комфортно, а хотите усилить её карман.

> В типичной ротации на С0 Вмешательство срабатывает около **3** раз; с С1 — около **4** (сразу при Е). С **С2** набор Силы тяготения ~**4 сек.** вместо **~6** на С0.`,
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Лор",
      title: "Биография",
      body: `Коломбина — **Дева Луны**, рождённая в Нод-Крае более **500 лет** назад. С древности Дети Морозной Луны почитают её как **Куутар**. После долгого пребывания на острове **Хийси** она покинула регион, вступила в ряды Предвестников Фатуи и получила титул **«Субретка»**.

Несмотря на важность для Царицы, ей почти не давали поручений: она либо бездействовала, либо проводила время с **Сандроне**, **Арлекино** и **Синьорой** (до её гибели). Осознав, что жизнь с Фатуи мало отличается от поклонения племени, девушка вернулась на Хийси и поселилась в **Чертоге Серебряной Луны**. Дальнейшая история раскрывается в задании Нод-Края **«Песнь полой луны»**.

В игре её описывают так: *«Дева Луны, рождённая в Нод-Крае, она же небесная луна, что вернулась домой»*.`,
    },
  ];

  const levelMaterials: CharacterMaterial[] = [
    matCard(m("Шпороцветник"), "Шпороцветник", 168, "local", 1),
    matCard(m("Сияющие рога"), "Сияющие рога", 46, "boss", 4),
    matCard(m("Осколок лазурита Варунада"), "Осколок лазурита Варунада", 1, "ascension", 2),
    matCard(m("Фрагмент лазурита Варунада"), "Фрагмент лазурита Варунада", 9, "ascension", 3),
    matCard(m("Кусок лазурита Варунада"), "Кусок лазурита Варунада", 9, "ascension", 4),
    matCard(m("Драгоценный лазурит Варунада"), "Драгоценный лазурит Варунада", 6, "ascension", 5),
    matCard(m("Слизь слайма"), "Слизь слайма", 18, "ascension", 1),
    matCard(m("Выделения слайма"), "Выделения слайма", 30, "ascension", 2),
    matCard(m("Концентрат слайма"), "Концентрат слайма", 36, "ascension", 3),
    matCard(m("Учения о «Лунном свете»"), "Учения о «Лунном свете»", 9, "talent", 2),
    matCard(m("Указания о «Лунном свете»"), "Указания о «Лунном свете»", 63, "talent", 3),
    matCard(m("Философия о «Лунном свете»"), "Философия о «Лунном свете»", 114, "talent", 4),
    matCard(m("Маска мудрого лекаря"), "Маска мудрого лекаря", 18, "talent", 5),
    matCard(m("Корона прозрения"), "Корона прозрения", 3, "talent", 5),
    matCard(m("Опыт героя"), "Опыт героя", 421, "exp", 4),
    matCard(m("Мора"), "Мора", 1653000, "exp", 3),
  ];

  const contentHtml = serializeGuide(blocks);
  const shortDesc =
    "Коломбина — Гидро-саппорт Нод-Края: конвертация в Лунные реакции, билд, оружие, сеты и отряды.";

  const iconBase = "/images/talents/kolombina";
  const cIconBase = "/images/constellations/kolombina";
  const lv13 = Array.from({ length: 13 }, (_, i) => String(i + 1));
  const pad13 = (vals: string[], fill = "—") => {
    const next = [...vals];
    while (next.length < 13) next.push(fill);
    return next.slice(0, 13);
  };

  const talents = [
    {
      id: "t_na",
      name: "Ливень лунных рос",
      icon: `${iconBase}/na.png`,
      description:
        "**Обычная атака:** до трёх ударов волнами лунного сияния — **Гидро урон**.\n\n**Заряженная:** краткое заклинание (расход выносливости) — **Гидро урон** по площади.\n\nЕсли есть хотя бы **1 Зелёная роса**, заряженная сменяется на **Очищение лунной росой**: тратит 1 росу (без выносливости) и **3 раза** наносит **Дендро урон** по площади впереди. Этот урон считается уроном **Лунной бутонизации**.\n\n**Удар в падении:** стремительное падение, затем **Гидро урон** по площади.",
      loreText: "Капли лунного света отвечают на каждый взмах катализатора.",
      levelLabels: lv13,
      stats: [
        {
          label: "Урон 1 удара",
          values: pad13([
            "46.8%",
            "50.3%",
            "53.8%",
            "58.5%",
            "62.0%",
            "65.5%",
            "70.2%",
            "74.9%",
            "79.5%",
            "84.2%",
            "88.9%",
            "93.6%",
          ]),
        },
        {
          label: "Урон 2 удара",
          values: pad13([
            "36.6%",
            "39.4%",
            "42.1%",
            "45.8%",
            "48.5%",
            "51.3%",
            "54.9%",
            "58.6%",
            "62.3%",
            "65.9%",
            "69.6%",
            "73.3%",
          ]),
        },
        {
          label: "Урон 3 удара",
          values: pad13([
            "58.5%",
            "62.9%",
            "67.3%",
            "73.1%",
            "77.5%",
            "81.9%",
            "87.7%",
            "93.6%",
            "99.4%",
            "105.3%",
            "111.1%",
            "117.0%",
          ]),
        },
        {
          label: "Урон заряженной",
          values: pad13([
            "116.1%",
            "124.8%",
            "133.5%",
            "145.1%",
            "153.8%",
            "162.5%",
            "174.1%",
            "185.7%",
            "197.3%",
            "208.9%",
            "220.6%",
            "232.2%",
          ]),
        },
        {
          label: "Расход выносливости",
          values: pad13(Array(12).fill("50"), "50"),
        },
        {
          label: "Очищение лунной росой",
          values: pad13([
            "1.51% макс. HP ×3",
            "1.62% макс. HP ×3",
            "1.74% макс. HP ×3",
            "1.89% макс. HP ×3",
            "2.00% макс. HP ×3",
            "2.12% макс. HP ×3",
            "2.27% макс. HP ×3",
            "2.42% макс. HP ×3",
            "2.57% макс. HP ×3",
            "2.72% макс. HP ×3",
            "2.87% макс. HP ×3",
            "3.02% макс. HP ×3",
          ]),
        },
        {
          label: "Урон в падении",
          values: pad13([
            "56.8%",
            "61.5%",
            "66.1%",
            "72.7%",
            "77.3%",
            "82.6%",
            "89.9%",
            "97.1%",
            "104.4%",
            "112.3%",
            "120.3%",
            "128.2%",
          ]),
        },
        {
          label: "Низкий / высокий удар",
          values: pad13([
            "114% / 142%",
            "123% / 153%",
            "132% / 165%",
            "145% / 182%",
            "155% / 193%",
            "165% / 206%",
            "180% / 224%",
            "194% / 243%",
            "209% / 261%",
            "225% / 281%",
            "240% / 300%",
            "256% / 320%",
          ]),
        },
      ],
      order: 0,
    },
    {
      id: "t_skill",
      name: "Вечные приливы",
      icon: `${iconBase}/skill.png`,
      description:
        "Призывает прилив лунного моря: **Гидро урон** по площади и **Зыбь тяготения**.\n\n**Зыбь тяготения** следует за активным персонажем и периодически наносит **Гидро урон** по площади. Пока она активна, Лунные реакции союзников дают Коломбине **Силу тяготения** (эффект **Знамения новой луны** на 2 сек.: +**20** силы / 2 сек., макс. **60**). При максимуме срабатывает **Вмешательство тяготения** по доминирующей реакции:\n— **Лунный заряд** — Электро урон по площади (урон Лунного заряда).\n— **Лунная бутонизация** — **5 Печатей лунной росы** (Дендро = урон ЛБ).\n— **Лунный кристалл** — Гео урон по площади (урон ЛК).\n\n**Лунное знамение — Высшее сияние:** Зыбь бьёт Гидро по большей площади.\n\nДлительность **25 сек.**, откат **17 сек.** Источник урона Вмешательства — **HP**.",
      loreText: "Прилив не спрашивает разрешения — он просто приходит.",
      levelLabels: lv13,
      stats: [
        {
          label: "Урон навыка",
          values: pad13([
            "16,72% макс. HP",
            "17,97% макс. HP",
            "19,23% макс. HP",
            "20,9% макс. HP",
            "22,15% макс. HP",
            "23,41% макс. HP",
            "25,08% макс. HP",
            "26,75% макс. HP",
            "28,42% макс. HP",
            "30,1% макс. HP",
            "31,77% макс. HP",
            "33,44% макс. HP",
            "35,53% макс. HP",
          ]),
        },
        {
          label: "Зыбь тяготения: периодический урон",
          values: pad13([
            "9,36% макс. HP",
            "10,06% макс. HP",
            "10,76% макс. HP",
            "11,7% макс. HP",
            "12,4% макс. HP",
            "13,1% макс. HP",
            "14,04% макс. HP",
            "14,98% макс. HP",
            "15,91% макс. HP",
            "16,85% макс. HP",
            "17,78% макс. HP",
            "18,72% макс. HP",
            "19,89% макс. HP",
          ]),
        },
        {
          label: "Вмешательство: Лунный заряд",
          values: pad13([
            "4,7% макс. HP",
            "5,06% макс. HP",
            "5,41% макс. HP",
            "5,88% макс. HP",
            "6,23% макс. HP",
            "6,59% макс. HP",
            "7,06% макс. HP",
            "7,53% макс. HP",
            "8% макс. HP",
            "8,47% макс. HP",
            "8,94% макс. HP",
            "9,41% макс. HP",
            "10% макс. HP",
          ]),
        },
        {
          label: "Вмешательство: Лунная бутонизация",
          values: pad13([
            "1,41% макс. HP ×5",
            "1,51% макс. HP ×5",
            "1,62% макс. HP ×5",
            "1,76% макс. HP ×5",
            "1,87% макс. HP ×5",
            "1,97% макс. HP ×5",
            "2,11% макс. HP ×5",
            "2,25% макс. HP ×5",
            "2,39% макс. HP ×5",
            "2,53% макс. HP ×5",
            "2,68% макс. HP ×5",
            "2,82% макс. HP ×5",
            "2,99% макс. HP ×5",
          ]),
        },
        {
          label: "Вмешательство: Лунный кристалл",
          values: pad13([
            "8,82% макс. HP",
            "9,49% макс. HP",
            "10,15% макс. HP",
            "11,03% макс. HP",
            "11,69% макс. HP",
            "12,35% макс. HP",
            "13,24% макс. HP",
            "14,12% макс. HP",
            "15% макс. HP",
            "15,88% макс. HP",
            "16,77% макс. HP",
            "17,65% макс. HP",
            "18,75% макс. HP",
          ]),
        },
        {
          label: "Максимум Силы тяготения",
          values: pad13(Array(13).fill("60"), "60"),
        },
        {
          label: "Длительность Зыби",
          values: pad13(Array(13).fill("25 сек."), "25 сек."),
        },
        {
          label: "Время отката",
          values: pad13(Array(13).fill("17 сек."), "17 сек."),
        },
      ],
      order: 1,
    },
    {
      id: "t_burst",
      name: "Тоска во свете луны",
      icon: `${iconBase}/burst.png`,
      description:
        "Горы и моря сливаются под непорочным светом молодого месяца: местность становится **Владениями луны**, нанося **Гидро урон** по площади.\n\n**Владения луны:** пока активный персонаж в зоне, урон **Лунных реакций** всех персонажей отряда повышается.\n\nИсточник урона — **HP**. Энергия **60**, длительность **20 сек.**, откат **15 сек.** На 10 ур. таланта бафф реакций — **+40%**.",
      loreText: "Даже тоска может стать светом, если смотреть на луну достаточно долго.",
      levelLabels: lv13,
      stats: [
        {
          label: "Урон навыка",
          values: pad13([
            "32,24% макс. HP",
            "34,66% макс. HP",
            "37,08% макс. HP",
            "40,3% макс. HP",
            "42,72% макс. HP",
            "45,14% макс. HP",
            "48,36% макс. HP",
            "51,58% макс. HP",
            "54,81% макс. HP",
            "58,03% макс. HP",
            "61,26% макс. HP",
            "64,48% макс. HP",
            "68,51% макс. HP",
          ]),
        },
        {
          label: "Повышение урона Лунных реакций",
          values: pad13([
            "13%",
            "16%",
            "19%",
            "22%",
            "25%",
            "28%",
            "31%",
            "34%",
            "37%",
            "40%",
            "43%",
            "46%",
            "49%",
          ]),
        },
        {
          label: "Длительность Владений луны",
          values: pad13(Array(13).fill("20 сек."), "20 сек."),
        },
        {
          label: "Время отката",
          values: pad13(Array(13).fill("15 сек."), "15 сек."),
        },
        {
          label: "Потребление энергии",
          values: pad13(Array(13).fill("60"), "60"),
        },
      ],
      order: 2,
    },
    {
      id: "t_p1",
      name: "Зов лунного безумия",
      icon: `${iconBase}/passive1.png`,
      description:
        "При активации **Вмешательства тяготения** Коломбина получает **Лунное безумие**: +**5%** к шансу крит. попадания на **10 сек.** Эффект складывается до **3** раз.",
      order: 3,
    },
    {
      id: "t_p2",
      name: "Закон новолуния",
      icon: `${iconBase}/passive2.png`,
      description:
        "Персонажи во **Владениях луны**, вызывая Лунные реакции, получают:\n— **Лунный заряд:** при ударе грозовой тучи по подходящей цели с шансом **33%** — дополнительный удар молнии.\n— **Лунная бутонизация:** отряд получает **Росу лунных кряжей** (особая Зелёная роса; до **3** раз за **18 сек.**, макс. **3** росы, считаются отдельно).\n— **Лунный кристалл:** при **Гармонии Лунной пелены** каждая пелена с шансом **33%** наносит дополнительную атаку.\n\nКогда обычная Зелёная роса кончается, тратится **Роса лунных кряжей**.",
      order: 4,
    },
    {
      id: "t_p3",
      name: "Дар лунного знамения: Одолженный тебе лунный свет",
      icon: `${iconBase}/passive3.png`,
      description:
        "Когда союзник вызывает **Заряжен**, **Бутонизацию** или **Гидро Кристаллизацию**, реакция конвертируется в нод-краевский аналог (**Лунный заряд / бутонизация / кристалл**).\n\nУрон этих реакций растёт от макс. HP Коломбины: **+0.2%** за каждые **1000 HP**, максимум **+7%**.\n\nПока она в отряде, уровень **Лунного знамения** отряда повышается на **1**.",
      order: 5,
    },
    {
      id: "t_util",
      name: "Бдение луны",
      icon: `${iconBase}/utility.png`,
      description:
        "Если союзник теряет сознание в **Нод-Крае** или на **Морозной Луне**, воскрешает его и восстанавливает HP в зависимости от уровня дружбы с Коломбиной. Раз в **100 сек.** Не срабатывает в подземельях, Витой Бездне и Подземельях наказания. Также помогает взаимодействовать с мелкими животными силой куувяки.",
      order: 6,
    },
  ];

  const constellations = [
    {
      id: "c1",
      level: 1,
      name: "Сияние над цветами и вершинами",
      icon: `${cIconBase}/c1.png`,
      description:
        "При применении **Вечных приливов** сразу активируется эффект, эквивалентный **Вмешательству тяготения**. Не чаще **1** раза в **15 сек.**\n\n**Лунное знамение — Высшее сияние:** при Вмешательстве, если доминирующая реакция:\n— **Лунный заряд** — активный персонаж восстанавливает **6** ед. энергии.\n— **Лунная бутонизация** — сопротивление прерыванию активного героя на **8 сек.**\n— **Лунный кристалл** — **Щит моря дождей** на **12%** макс. HP Коломбины на **8 сек.** (Гидро поглощается на **250%** эффективнее).\n\nУрон Лунных реакций союзников поблизости **возвышается на 1,5%** (считается отдельно от других баффов).",
      order: 0,
    },
    {
      id: "c2",
      level: 2,
      name: "Сопровождая в ночном пути",
      icon: `${cIconBase}/c2.png`,
      description:
        "Сила тяготения копится на **34%** быстрее. При Вмешательстве Коломбина получает **Бледное сияние** на **8 сек.**: +**40%** макс. HP.\n\n**Лунное знамение — Высшее сияние:** пока действует Бледное сияние, при Вмешательстве:\n— **Лунный заряд** — АТК активного персонажа +**1%** от макс. HP Коломбины.\n— **Лунная бутонизация** — МС активного персонажа +**0,35%** от макс. HP.\n— **Лунный кристалл** — защита активного персонажа +**1%** от макс. HP.\n\nУрон Лунных реакций союзников поблизости **возвышается на 7%** (отдельно от других баффов).\n\nЛучшая точка остановки среди ранних конст.",
      order: 1,
    },
    {
      id: "c3",
      level: 3,
      name: "Призрачный свет и рябь на озере грёз",
      icon: `${cIconBase}/c3.png`,
      description:
        "Уровень навыка **Вечные приливы** +**3** (макс. **15**).\n\nУрон Лунных реакций союзников поблизости **возвышается на 1,5%** (отдельно от других баффов).",
      order: 2,
    },
    {
      id: "c4",
      level: 4,
      name: "Вершины в цветочной дымке",
      icon: `${cIconBase}/c4.png`,
      description:
        "При каждом **Вмешательстве тяготения** Коломбина восстанавливает **4** ед. энергии.\n\nТакже раз в **15 сек.** повышает урон этой реакции Вмешательства от макс. HP:\n— **Лунный заряд** — на **12,5%** макс. HP.\n— **Лунная бутонизация** — на **2,5%** макс. HP.\n— **Лунный кристалл** — на **12,5%** макс. HP.\n\nУрон Лунных реакций союзников поблизости **возвышается на 1,5%** (отдельно от других баффов).",
      order: 3,
    },
    {
      id: "c5",
      level: 5,
      name: "Одинокая песнь в тишине",
      icon: `${cIconBase}/c5.png`,
      description:
        "Уровень навыка **Тоска во свете луны** +**3** (макс. **15**).\n\nУрон Лунных реакций союзников поблизости **возвышается на 1,5%** (отдельно от других баффов).",
      order: 4,
    },
    {
      id: "c6",
      level: 6,
      name: "Сквозь тьму за лунным светом",
      icon: `${cIconBase}/c6.png`,
      description:
        "На **8 сек.** после того, как персонажи во **Владениях луны** активируют Лунные реакции, крит. урон урона соответствующих элементов реакции для всех членов отряда повышается на **80%**. Бонус одного элемента не складывается.\n\nУрон Лунных реакций союзников поблизости **возвышается на 7%** (отдельно от других баффов).\n\nСильнейший дамаг-спайк вместе с **С2**.",
      order: 5,
    },
  ];

  const minOrder = await prisma.character.aggregate({ _min: { order: true } });
  const order = (minOrder._min.order ?? 1) - 1;

  const row = await prisma.character.upsert({
    where: { slug: SLUG },
    create: {
      slug: SLUG,
      name: NAME,
      image: IMAGE,
      splashImage: SPLASH,
      rarity: Rarity.LEGEND,
      element: Element.HYDRO,
      weaponType: "Катализатор",
      region: "Нод-Край",
      sticker: null,
      shortDesc,
      contentHtml,
      levelMaterials,
      talents,
      constellations,
      published: true,
      order,
    },
    update: {
      name: NAME,
      image: IMAGE,
      splashImage: SPLASH,
      rarity: Rarity.LEGEND,
      element: Element.HYDRO,
      weaponType: "Катализатор",
      region: "Нод-Край",
      sticker: null,
      shortDesc,
      contentHtml,
      levelMaterials,
      talents,
      constellations,
      published: true,
      order,
    },
  });

  const typeCounts = blocks.reduce<Record<string, number>>((acc, b) => {
    acc[b.type] = (acc[b.type] || 0) + 1;
    return acc;
  }, {});

  console.log("Upserted", row.id, row.slug, row.name);
  console.log("Block types:", typeCounts);
  console.log(
    "Weapons:",
    weaponItems.map((i) => `${i.rank}. ${i.name}${i.href ? "" : " [stub]"}`).join("; "),
  );
  console.log(
    "Artifacts:",
    artItems.map((i) => `${i.rank}. ${i.name}${i.href ? "" : " [stub]"}`).join("; "),
  );
  console.log(
    "Missing from DB (stubs):",
    missingLog.length ? missingLog.join("; ") : "(none)",
  );
  console.log("Guide URL: /wiki/characters/" + SLUG);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
