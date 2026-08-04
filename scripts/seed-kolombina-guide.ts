/**
 * Импорт гайда на Коломбину (по материалам wotpack.ru).
 * Использует новые блоки GuideBuilder: prosCons, statTargets, rankedList и т.д.
 *
 *   npx tsx scripts/seed-kolombina-guide.ts
 */
import { mkdir, writeFile, stat } from "fs/promises";
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
import { ELEMENT_SVG, type ElementKey } from "@/lib/genshin";
import type { CharacterMaterial } from "@/lib/character-materials";

const prisma = new PrismaClient();

const SLUG = "kolombina";
const NAME = "Коломбина";
const IMAGE = "/uploads/icons/kolombina.png";
const SPLASH = "/uploads/splash/kolombina.jpg";

const STUB_DIR = path.join(process.cwd(), "public", "uploads", "artifacts", "stubs");
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

const ARTIFACT_STUBS = [
  {
    file: "rassvetnaya-pesn.png",
    url: "https://wotpack.ru/wp-content/uploads/2025/12/rassvetnaya-pesn-zvezdy-i-luny-ikonka.png",
  },
  {
    file: "serenada.png",
    url: "https://wotpack.ru/wp-content/uploads/2025/07/set-iz-nod-kraya-na-ve-i-baff-ms-220x220.png",
  },
  {
    file: "noch-otkrytiya-neba.png",
    url: "https://wotpack.ru/wp-content/uploads/2025/09/noch-otkrytiya-neba-220x220.png",
  },
] as const;

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

type ArtStub = { name: string; image: string; rarity: 4 | 5 };

async function ensureArtifactStubs(): Promise<string[]> {
  await mkdir(STUB_DIR, { recursive: true });
  const missing: string[] = [];
  for (const s of ARTIFACT_STUBS) {
    const dest = path.join(STUB_DIR, s.file);
    try {
      const st = await stat(dest);
      if (st.size > 1000) continue;
    } catch {
      /* missing */
    }
    try {
      const res = await fetch(s.url, { headers: { "User-Agent": UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      await writeFile(dest, buf);
      console.log("Downloaded stub:", s.file, `(${buf.length} bytes)`);
    } catch (e) {
      console.warn("Failed stub download:", s.file, e);
      missing.push(s.file);
    }
  }
  return missing;
}

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
      image: w.image,
      rarity: rarityStars(w.rarity),
      href: `/wiki/weapons/${w.slug}`,
      subtitle,
      effect,
      verdict,
      tier,
    };
  }
  return {
    id: uid(),
    rank,
    name: fallbackName,
    image: "",
    rarity: 5,
    subtitle,
    effect,
    verdict: `Нет в базе. ${verdict}`,
    tier,
  };
}

function rankedArt(
  a: ArtifactRow | ArtStub | undefined,
  rank: number,
  fallbackName: string,
  subtitle: string,
  effect: string,
  verdict: string,
  tier?: string,
): GuideRankedItem {
  if (a && "slug" in a) {
    return {
      id: uid(),
      rank,
      name: a.name,
      image: a.image,
      rarity: rarityStars(a.rarity),
      href: `/wiki/artifacts/${a.slug}`,
      subtitle,
      effect,
      verdict,
      tier,
    };
  }
  if (a && "image" in a) {
    return {
      id: uid(),
      rank,
      name: a.name,
      image: a.image,
      rarity: a.rarity,
      subtitle,
      effect,
      verdict,
      tier,
    };
  }
  return {
    id: uid(),
    rank,
    name: fallbackName,
    image: "",
    rarity: 5,
    subtitle,
    effect,
    verdict,
    tier,
  };
}

function member(c: CharRow | undefined, fallbackName: string, role?: string): GuideTeamMember {
  if (c) {
    return {
      id: uid(),
      name: c.name,
      image: c.image,
      elementIcon: elIcon(c.element),
      rarity: rarityStars(c.rarity),
      href: `/wiki/characters/${c.slug}`,
      role,
    };
  }
  return {
    id: uid(),
    name: fallbackName,
    image: "",
    elementIcon: ELEMENT_SVG.HYDRO,
    rarity: 5,
    role,
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
      image: char.image,
      href: `/wiki/characters/${char.slug}`,
      setName,
      setImage,
    };
  }
  return {
    id: uid(),
    name: fallbackName,
    image: "",
    setName,
    setImage,
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
      image: c.image,
      element: elLabel(c.element),
      elementIcon: elIcon(c.element),
      weapon,
      weaponIcon: "",
      description,
      href: `/wiki/characters/${c.slug}`,
    };
  }
  return {
    id: uid(),
    name: fallbackName,
    image: "",
    element: "—",
    elementIcon: ELEMENT_SVG.HYDRO,
    weapon,
    weaponIcon: "",
    description,
  };
}

function matCard(
  m: MatRow | undefined,
  name: string,
  qty: number,
  category: CharacterMaterial["category"],
  rarityStars = 1,
): CharacterMaterial {
  return {
    id: uid(),
    name: m?.name || name,
    image: m?.image || "",
    qty,
    category,
    rarityStars: m?.rarityStars || rarityStars,
  };
}

async function main() {
  const failedStubs = await ensureArtifactStubs();

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

  const stub = (file: string, name: string): ArtStub => ({
    name,
    image: `/uploads/artifacts/stubs/${file}`,
    rarity: 5,
  });

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
    rankedWeapon(w("Прототип: Янтарь", "Прототип: Янтарь"), 6, "Прототип: Янтарь", "Хил · крафт", "Энергия и лечение отряда после ульты.", "Когда в команде нет хилера или щита.", "B"),
    rankedWeapon(w("Зеркало прядильщицы ночи"), 7, "Зеркало прядильщицы ночи", "Бафф ЛБ", "Усиливает Бутонизацию отряда из кармана.", "Под Дендро-отряды.", "B"),
    rankedWeapon(w("Кодекс Фавония"), 8, "Кодекс Фавония", "Энергия отряду", "Частицы энергии всей группе при критах.", "С Флинсом или если она единственный Гидро.", "B"),
    rankedWeapon(w("Вихрь на волнах"), 9, "Вихрь на волнах", "HP + ВЭ", "ВЭ и HP после Е, сильнее с Гидро-резонансом.", "Если не хватает ульты.", "B"),
    rankedWeapon(w("Фонарь чёрной сердцевины", "Фонарь черной сердцевины"), 10, "Фонарь чёрной сердцевины", "Бутонизация", "Бонус дамага Бутонизации/ЛБ из кармана.", "Только если уже есть и играете в ЛБ.", "C"),
    rankedWeapon(w("Великолепие лазурного свода"), 11, "Великолепие лазурного свода", "HP + энергия", "HP и энергия; бонус элементального урона почти не нужен.", "Средний приоритет среди 5★.", "C"),
    rankedWeapon(w("Эпос о драконоборцах"), 12, "Эпос о драконоборцах", "Бюджет", "HP и бафф АТК следующему персонажу.", "Временно перед мейн-дд.", "C"),
  ];

  const artItems: GuideRankedItem[] = [
    rankedArt(stub("rassvetnaya-pesn.png", "Рассветная песнь звезды и луны"), 1, "Рассветная песнь звезды и луны", "Лучший 4п", "+МС и урон Лунных реакций из кармана (сильнее при Высшем сиянии).", "Основной сет в большинстве отрядов Нод-Края.", "S"),
    rankedArt(stub("serenada.png", "Серенада шёлковой луны"), 2, "Серенада шёлковой луны", "ВЭ + МС отряду", "ВЭ и бафф МС/урона реакций союзникам.", "Если в команде нет другого носителя Серенады.", "S"),
    rankedArt(stub("noch-otkrytiya-neba.png", "Ночь открытия неба"), 3, "Ночь открытия неба", "Драйвер", "Сильный сет на поле.", "Не для классического кармана.", "A"),
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
- **Стихия / оружие** — Гидро · катализатор
- **Возвышение** — крит. шанс
- **В игре с** — 14 января 2026 (обновление 6.3)
- **Получение** — молитва события
- **Реран** — 2-я фаза 6.7, 21 июля – 11 августа 2026
- **Регион** — Нод-Край
- **Созвездие** — Коломбина Гипоселениа`,
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
            planRow(c("flins", "флинс"), "Флинс", "Ночь открытия неба", stub("noch-otkrytiya-neba.png", "Ночь открытия неба").image),
            planRow(c("ineffa", "инеффа"), "Инеффа", "Серенада или Рассвет", stub("serenada.png", "Серенада").image),
            {
              id: uid(),
              name: NAME,
              image: IMAGE,
              href: `/wiki/characters/${SLUG}`,
              setName: "Рассвет или Серенада",
              setImage: stub("rassvetnaya-pesn.png", "Рассвет").image,
            },
            planRow(c("sucrose", "сахароза"), "Сахароза / Ягода", "Изумрудная тень", a("Изумрудная тень")?.image || ""),
          ],
        },
        {
          id: uid(),
          title: "Лунная бутонизация",
          rows: [
            planRow(c("nefer", "нефер"), "Нефер", "Ночь открытия неба", stub("noch-otkrytiya-neba.png", "Ночь").image),
            planRow(c("lauma", "лаума"), "Лаума", "Серенада", stub("serenada.png", "Серенада").image),
            {
              id: uid(),
              name: NAME,
              image: IMAGE,
              href: `/wiki/characters/${SLUG}`,
              setName: "Рассвет",
              setImage: stub("rassvetnaya-pesn.png", "Рассвет").image,
            },
            planRow(c("nahida", "нахида"), "Гидро / Дендро саппорт", "Воспоминания дремучего леса", a("Воспоминания дремучего леса")?.image || ""),
          ],
        },
        {
          id: uid(),
          title: "Лунный кристалл",
          rows: [
            planRow(c("czy-baj", "цзы бай"), "Цзы Бай", "Ночь открытия неба", stub("noch-otkrytiya-neba.png", "Ночь").image),
            planRow(c("illugi", "иллуги"), "Иллуги", "Инструктор", a("Инструктор")?.image || ""),
            {
              id: uid(),
              name: NAME,
              image: IMAGE,
              href: `/wiki/characters/${SLUG}`,
              setName: "Серенада или Рассвет",
              setImage: stub("serenada.png", "Серенада").image,
            },
            planRow(c("linneya", "линнея"), "Линнея", "Рассвет или Серенада", stub("rassvetnaya-pesn.png", "Рассвет").image),
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
            member(c("kuki", "куки", "синобу"), "Куки", "Хил"),
            member(c("aino", "айно"), "Айно", "Гидро"),
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
            member(c("chiori", "тиори"), "Тиори", "Саб-дд"),
          ],
          "Альтернатива",
        ),
        variant(
          "С Айно: желателен её С6 под ЛК. Без поддержки и без С1 Куутар на щит — Прототип: Янтарь на Коломбину.",
          [
            member(c("czy-baj", "цзы бай"), "Цзы Бай", "Мейн-дд"),
            self("Саппорт"),
            member(c("aino", "айно"), "Айно", "Гидро"),
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
            member(c("alhaitham", "аль-хайтам", "аль хайтам"), "Аль-Хайтам", "Мейн-дд"),
            self("Саппорт"),
            member(c("lauma", "лаума"), "Лаума", "Саб-дд"),
            member(c("kuki", "куки", "синобу"), "Куки", "Хил"),
          ],
        ),
        variant(
          "Арлекино / Мавуика через смесь Пара, Перегрузки и Заряда. На поддержку — Ягода или Сахароза; хил менее критичен из-за щита Инеффы.",
          [
            member(c("arlecchino", "арлекино"), "Арлекино", "Мейн-дд"),
            self("Саппорт"),
            member(c("ineffa", "инеффа"), "Инеффа", "Саб-дд"),
            member(c("sucrose", "сахароза"), "Сахароза", "Флекс"),
          ],
        ),
        variant(
          "Классический Пар: Кадзуха раздувает Пиро/Гидро, Беннет баффает АТК и хилит.",
          [
            member(c("arlecchino", "арлекино"), "Арлекино", "Мейн-дд"),
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
            member(c("escoffier", "эскофье"), "Эскофье", "Саб-дд"),
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
          where: "Острова Нод-Края",
          href: m("Шпороцветник")
            ? `/wiki/materials/${m("Шпороцветник")!.slug}`
            : undefined,
        },
        {
          id: uid(),
          name: m("Мора")?.name || "Мора",
          image: m("Мора")?.image || "",
          qty: "1 653 000",
          where: "Любые активности",
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
        "Растёт крит. шанс. На 90 уровне без экипировки — 24.2% К/Ш. Качайте до 90; уровни 95/100 через Блуждающую удачу желательны, но не критичны.",
      colLabels: [
        "Уровень",
        "Базовое HP",
        "Базовая сила атаки",
        "Базовая защита",
        "Базовый крит. шанс",
        "Крит. шанс с возвышения",
      ],
      rows: [
        emptyStatsRow("1", "1192", "19", "54", "5%", "0%"),
        emptyStatsRow("20", "3092", "50", "140", "5%", "0%"),
        emptyStatsRow("40", "6127", "98", "278", "5%", "4.8%"),
        emptyStatsRow("50", "7896", "127", "359", "5%", "9.6%"),
        emptyStatsRow("60", "9925", "159", "451", "5%", "9.6%"),
        emptyStatsRow("70", "11724", "188", "532", "5%", "14.4%"),
        emptyStatsRow("80", "13532", "217", "615", "5%", "19.2%"),
        emptyStatsRow("90", "15307", "244", "696", "5%", "24.2%"),
      ],
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Геймплей",
      title: "Способности",
      body: `Субретка усиливает союзников Нод-Края: бафф, Гидро-статус и собственный урон. Способности подстраиваются под элементы союзников и открывают Лунные реакции старым героям.

### Приоритет прокачки
**Е ≥ Q > обычные** (обычные — только драйвер).

После 6 уровня сильнее качайте **Е** (дамаг и статус); ульта в основном бафф.

### Активные навыки
- **Ливень лунных рос** — обычные/заряженная/падение. Очищение лунной росой тратит Зелёную росу и бьёт Дендро как Лунная бутонизация.
- **Вечные приливы (Е)** — Зыбь тяготения на 25 сек. (откат 17). Копит Силу тяготения от Лунных реакций и бьёт Вмешательством (Заряд / Бутонизация / Кристалл).
- **Тоска во свете луны (Q)** — Владения луны на 20 сек. (60 энергии, откат 15): повышает урон Лунных реакций активного персонажа внутри зоны.

### Пассивки (кратко)
- **Зов лунного безумия** — К/Ш стаками после Вмешательства.
- **Закон новолуния** — бонусы Лунным реакциям во Владениях + особая Роса.
- **Дар лунного знамения** — конвертация Заряда/Бутонизации/Гидро-кристалла + до +7% урона от HP; +1 к уровню Знамения.
- **Бдение луны** — воскрешение в Нод-Крае раз в 100 сек.`,
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Геймплей",
      title: "Созвездия",
      body: `Лучшие консты — **С1, С2 и С6**.

- **С1** — авто-Вмешательство раз в 15 сек. и полезные баффы отряду (энергия Флинсу, сопротивление прерыванию Нефер, щит Цзы Бай).
- **С2** — быстрее копит Силу тяготения, +40% HP и стат-баффы под тип реакции; заметный комфорт.
- **С6** — +80% К/У элементам, участвующим в реакциях внутри ульты (не стакается на один элемент).

### С1 или сигна?
- **С1** — если хотите комфорт мейн-дд (Цзы Бай без хила, ульта Флинса, Нефер).
- **Сигна** — когда команде не нужны эти удобства, а нужны статы и энергия самой Коломбины.`,
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Геймплей",
      title: "Как играть и стоит ли выбивать",
      body: `### Ротация
1. Начните с Коломбины: **Е → Q** (если ульта не готова — вернитесь к ней после отката).
2. Саппорты и саб-дд — баффы и статусы. Пока действует Зыбь, копится Сила тяготения; Вмешательство бьёт примерно каждые 6 сек. (быстрее с С1–С2).
3. Мейн-дд полностью под **Зыбью** и **Владениями луны**.
4. Повторяйте по откату.

### Стоит ли выбивать?
Коломбина дешёвая в сборке и простая в геймплее, но **сильно ограничена отрядами**: усиливает в основном героев Лунных реакций. Обычным элементальным ДД достаётся в основном Гидро-статус без полноценных баффов.

Берите её, если качаете готовые отряды Нод-Края. Без них польза часто уступает другим Гидро саб-дд.`,
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
    matCard(m("Мора"), "Мора", 1653000, "exp", 3),
  ];

  const contentHtml = serializeGuide(blocks);
  const shortDesc =
    "Коломбина — Гидро-саппорт Нод-Края: билд, оружие, сеты и лучшие отряды.";

  const iconBase = "/images/talents/kolombina";
  const pct = (vals: string[]) => vals;
  const talents = [
    {
      id: "t_na",
      name: "Ливень лунных рос",
      icon: `${iconBase}/na.png`,
      description:
        "Обычные, заряженная и атака в падении. **Очищение лунной росой** тратит Зелёную росу и наносит Дендро-урон в виде **Лунной бутонизации**.",
      loreText: "Капли лунного света отвечают на каждый взмах катализатора.",
      order: 0,
    },
    {
      id: "t_skill",
      name: "Вечные приливы",
      icon: `${iconBase}/skill.png`,
      description:
        "Создаёт **Зыбь тяготения** на 25 сек. (откат 17). Копит **Силу тяготения** от Лунных реакций и периодически бьёт **Вмешательством** (Заряд / Бутонизация / Кристалл).",
      loreText: "Прилив не спрашивает разрешения — он просто приходит.",
      levelLabels: ["Ур. 1", "Ур. 2", "Ур. 3", "Ур. 4", "Ур. 5", "Ур. 6", "Ур. 7", "Ур. 8"],
      stats: [
        {
          label: "Урон Вмешательства",
          values: pct([
            "18,4% макс. HP",
            "19,8% макс. HP",
            "21,2% макс. HP",
            "23% макс. HP",
            "24,4% макс. HP",
            "25,8% макс. HP",
            "27,6% макс. HP",
            "29,4% макс. HP",
          ]),
        },
        {
          label: "Длительность Зыби",
          values: Array(8).fill("25 сек."),
        },
        {
          label: "Время отката",
          values: Array(8).fill("17 сек."),
        },
      ],
      order: 1,
    },
    {
      id: "t_burst",
      name: "Тоска во свете луны",
      icon: `${iconBase}/burst.png`,
      description:
        "Создаёт **Владения луны** на 20 сек.: повышает урон **Лунных реакций** активного персонажа внутри зоны и наносит **Гидро урон**.\n\n**Владения луны**\nПока действует зона, союзники получают бонус к урону Лунных реакций.",
      loreText: "Даже тоска может стать светом, если смотреть на луну достаточно долго.",
      levelLabels: ["Ур. 1", "Ур. 2", "Ур. 3", "Ур. 4", "Ур. 5", "Ур. 6", "Ур. 7", "Ур. 8"],
      stats: [
        {
          label: "Урон навыка",
          values: pct([
            "32,2% макс. HP",
            "34,6% макс. HP",
            "37% макс. HP",
            "40,2% макс. HP",
            "42,6% макс. HP",
            "45% макс. HP",
            "48,2% макс. HP",
            "51,5% макс. HP",
          ]),
        },
        {
          label: "Повышение урона Лунных реакций",
          values: ["13%", "14%", "15%", "16%", "17%", "18%", "19%", "20%"],
        },
        {
          label: "Длительность Владений луны",
          values: Array(8).fill("20 сек."),
        },
        {
          label: "Время отката",
          values: Array(8).fill("15 сек."),
        },
        {
          label: "Потребление энергии",
          values: Array(8).fill("60"),
        },
      ],
      order: 2,
    },
    {
      id: "t_p1",
      name: "Зов лунного безумия",
      icon: `${iconBase}/passive1.png`,
      description:
        "После **Вмешательства** Коломбина получает стаки **крит. шанса**. Пассивка усиливает личный урон из кармана.",
      order: 3,
    },
    {
      id: "t_p2",
      name: "Закон новолуния",
      icon: `${iconBase}/passive2.png`,
      description:
        "Во **Владениях луны** усиливает **Лунные реакции** и даёт особую **Росу** под механику Нод-Края.",
      order: 4,
    },
    {
      id: "t_p3",
      name: "Дар лунного знамения",
      icon: `${iconBase}/passive3.png`,
      description:
        "Конвертирует обычные реакции в нод-краевские аналоги и даёт до **+7% урона** от HP; +1 к уровню **Знамения**.",
      order: 5,
    },
    {
      id: "t_util",
      name: "Бдение луны",
      icon: `${iconBase}/utility.png`,
      description:
        "В Нод-Крае может **воскресить** союзника раз в 100 сек. Утилитарная пассивка для исследования.",
      order: 6,
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
      region: "Нод-края",
      sticker: "Новый",
      shortDesc,
      contentHtml,
      levelMaterials,
      talents,
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
      region: "Нод-края",
      sticker: "Новый",
      shortDesc,
      contentHtml,
      levelMaterials,
      talents,
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
    weaponItems.map((i) => `${i.rank}. ${i.name}`).join("; "),
  );
  console.log(
    "Artifacts:",
    artItems.map((i) => `${i.rank}. ${i.name}${i.href ? "" : " [stub]"}`).join("; "),
  );
  console.log("Missing stub downloads:", failedStubs.join(", ") || "(none)");
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
