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
  type GuideRoleRow,
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
  };
}

function rankedArt(
  a: ArtifactRow | ArtStub | undefined,
  rank: number,
  fallbackName: string,
  subtitle: string,
  effect: string,
  verdict: string,
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
    rankedWeapon(
      w("Вызов ноктюрна"),
      1,
      "Вызов ноктюрна",
      "Сигна · топ-1",
      "HP, энергия и огромный К/У Лунных реакций. Пассивка работает из кармана: после Лунных реакций восстанавливает энергию и даёт Священное вино.",
      "Лучший выбор. Требования к ВЭ падают ~на 25%; в артефактах сильнее добивайте К/Ш. Дорогое вложение, но максимизирует личный урон и баффы.",
    ),
    rankedWeapon(
      w("Лови волну"),
      2,
      "Лови волну",
      "Сильный HP + К/У",
      "Много HP и крит. урона. Пассивка на обычные/Пар почти не нужна Субретке, но сырые статы отличные для карманного дамага.",
      "Отличная альтернатива сигне, если уже есть на аккаунте. Хорошо закрывает HP и криты без сложной сборки.",
    ),
    rankedWeapon(
      w("Шкатулка истин"),
      3,
      "Шкатулка истин",
      "Под Лунную бутонизацию",
      "Сильна в отрядах Бутонизации: криты и бонусы под реакцию. В командах Флинса/Цзы Бай даёт в основном крит. статы.",
      "Берите под Нефер/Лауму. В Заряде и Кристалле уступает вариантам с HP и ВЭ.",
    ),
    rankedWeapon(
      w("Обряд вечного течения"),
      4,
      "Обряд вечного течения",
      "HP + К/У · драйвер",
      "HP и К/У; пассивка раскрывается при игре на поле. Подходит редкому драйвер-билду с Лунной бутонизацией и Фуриной.",
      "Не для классического кармана. Имеет смысл только если сознательно катите Коломбину как драйвера.",
    ),
    rankedWeapon(
      w("Жертвенный нефрит"),
      5,
      "Жертвенный нефрит",
      "Лучший 4★",
      "К/Ш, HP и МС из кармана (после 5 сек вне поля). Существенно удешевляет крит. сборку.",
      "Лучший 4★ из БП. Ставьте, если нет сильных 5★ и нужно стабильно закрыть К/Ш + HP.",
    ),
    rankedWeapon(
      w("Прототип: Янтарь", "Прототип: Янтарь"),
      6,
      "Прототип: Янтарь",
      "Хил + энергия",
      "Восстановление энергии и лечение союзников от ульты. Крафтовый F2P-вариант.",
      "Когда нет хилера/щитовика или бой очень тяжёлый. Особенно удобен без С1 Лаумы на Нахиде.",
    ),
    rankedWeapon(
      w("Зеркало прядильщицы ночи"),
      7,
      "Зеркало прядильщицы ночи",
      "Бафф Бутонизации",
      "Бафферский катализатор под Дендро-реакции. Усиливает Бутонизацию отряда.",
      "Под Нефер/Лауму. Без Лаумы — ситуативно; в Заряде/Кристалле обычно слабее HP-вариантов.",
    ),
    rankedWeapon(
      w("Кодекс Фавония"),
      8,
      "Кодекс Фавония",
      "Частицы энергии",
      "Крит. шанс и частицы энергии всей группе при критах. Классика саппортов.",
      "Особенно полезен с Флинсом и когда Коломбина — единственный Гидро. Жертвуем личным уроном ради ВЭ отряда.",
    ),
    rankedWeapon(
      w("Вихрь на волнах"),
      9,
      "Вихрь на волнах",
      "HP + ВЭ",
      "HP и восстановление энергии; хорошо держится от Е-шки. Сильнее с Гидро-резонансом.",
      "Комфортный вариант, если не хватает ульты. Уступает нефриту по критам, но проще закрывает ВЭ.",
    ),
    rankedWeapon(
      w("Фонарь чёрной сердцевины", "Фонарь черной сердцевины"),
      10,
      "Фонарь чёрной сердцевины",
      "Под Лунную бутонизацию",
      "Заточен под Дендро/Лунную бутонизацию. Баланс статов на Коломбине сложнее, чем у HP-катализаторов.",
      "Имеет смысл в ЛБ-отрядах, если оружие уже есть. Не универсальный выбор.",
    ),
    rankedWeapon(
      w("Великолепие лазурного свода"),
      11,
      "Великолепие лазурного свода",
      "HP + энергия",
      "Полезны HP и энергия; бонус элементального урона почти не нужен Субретке.",
      "Хорошо с С1 и Гео-командами (щит). Средний приоритет среди 5★.",
    ),
    rankedWeapon(
      w("Эпос о драконоборцах"),
      12,
      "Эпос о драконоборцах",
      "Бюджетный бафф АТК",
      "3★: HP Коломбине и бафф АТК активному персонажу после Е.",
      "Бюджет перед мейн-дд (например, Флинсом). Временно, пока нет 4★/5★.",
    ),
  ];

  const artItems: GuideRankedItem[] = [
    rankedArt(
      stub("rassvetnaya-pesn.png", "Рассветная песнь звезды и луны"),
      1,
      "Рассветная песнь звезды и луны",
      "Лучший 4 части",
      "2п — +80 МС. 4п — из кармана +20% урона Лунных реакций; при Высшем сиянии ещё +40% (сброс через 3 сек. на поле).",
      "Топ личного урона Субретки. Основной сет в большинстве нод-краевских отрядов.",
    ),
    rankedArt(
      stub("serenada.png", "Серенада шёлковой луны"),
      2,
      "Серенада шёлковой луны",
      "ВЭ + бафф МС",
      "2п — +20% ВЭ. 4п — Сияющая луна: Доверие (МС союзникам 60/120) и +10% урона реакций за каждый разный эффект Сияющей луны.",
      "Ставьте, если в команде нет другого носителя Серенады / когда Коломбина заменяет Айно.",
    ),
    rankedArt(
      stub("noch-otkrytiya-neba.png", "Ночь открытия неба"),
      3,
      "Ночь открытия неба",
      "Для драйвера",
      "Сильный сет для игры на поле. Из кармана заметно слабее Рассветной песни и Серенады.",
      "Ситуативно: драйвер с Инеффой. Не фармить специально под классический саппорт-карман.",
    ),
    rankedArt(
      a("Стойкость Миллелита"),
      4,
      "Стойкость Миллелита",
      "Временный / АТК-бафф",
      "2п HP; 4п — бафф АТК/щита при попадании Е. Не для Нефер/Цзы Бай.",
      "Не фармить специально. Временно как 2п HP или если нужен АТК-бафф мейн-дд.",
    ),
    rankedArt(
      a("Сияние Вурукаши", "Сияние сладкой росы"),
      5,
      "Сияние Вурукаши",
      "2 части HP",
      "2п — бонус HP. Удобно для 2+2 на здоровье, пока нет полного Рассветного набора.",
      "Временный 2+2 с Миллелитом. Полный 4п сет не приоритет.",
    ),
    rankedArt(
      a("Эмблема рассечённой судьбы", "Эмблема рассеченной судьбы"),
      6,
      "Эмблема рассечённой судьбы",
      "2 части ВЭ",
      "2п — +20% ВЭ. Пара с Серенадой, если критично добрать ульту.",
      "Обычно проще добрать ВЭ сабами, чем жертвовать HP. Используйте точечно.",
    ),
  ];

  const blocks: GuideBlock[] = [
    {
      id: uid(),
      type: "text",
      eyebrow: "Обзор",
      title: "Кто такая Коломбина",
      body: `Гидро-катализатор 5★ из Нод-Края. Роль — **саппорт + карманный дамагер** под Лунные реакции.

### Что делает
- Накладывает Гидро и усиливает Лунные Бутонизацию / Заряд / Кристалл
- Конвертирует обычные реакции в нод-краевские
- Лучше всего с героями Нод-Края (Флинс, Инеффа, Нефер, Лаума, Цзы Бай)

### Коротко
- Рейтинг **S+** · возвышение: крит. шанс
- Без хилера/щита в сложном контенте тяжело (на С0 почти не лечит)
- Полный потенциал с **С2**
- Получение: ивент-баннер (реран 6.7, 2-я фаза)`,
    },
    {
      id: uid(),
      type: "prosCons",
      eyebrow: "Анализ",
      title: "Плюсы и минусы",
      prosTitle: "Плюсы",
      consTitle: "Минусы",
      pros: [
        "Лучший Гидро-саппорт под Лунные реакции — дамагерам Нод-Края даёт ощутимый прирост урона.",
        "Простая сборка: в основном HP и криты, без гонки за бонусом элементального урона.",
        "Уникальная конвертация реакций — можно собирать команды со старыми героями.",
        "Удобна в исследовании Нод-Края (спринт, утилита, воскрешение).",
      ],
      cons: [
        "Слабо работает вне отрядов Нод-Края: Пиро/Крио/Анемо ДД почти не получают её баффов.",
        "На С0 играбельна, но С1–С2 сильно поднимают комфорт и силу.",
        "Мало подходящего оружия — нужны HP, криты и бонусы к реакциям региона.",
      ],
    },
    {
      id: uid(),
      type: "statTargets",
      eyebrow: "Билд",
      title: "Какие статы качать",
      intro:
        "Приоритет: HP → криты → восстановление энергии. Бонус Гидро-урона почти не нужен.",
      targets: [
        {
          id: uid(),
          label: "HP",
          value: "35 000+",
          hint: "Нужно для пассивки и баффа реакций (до 7%)",
        },
        {
          id: uid(),
          label: "ВЭ",
          value: "160–180%",
          hint: "С сигной и Гидро-резонансом. Без сигны — до 220–240%",
        },
        {
          id: uid(),
          label: "К/Ш",
          value: "70–80%",
          hint: "С пассивкой база уже ~39%",
        },
        {
          id: uid(),
          label: "К/У",
          value: "150%+",
          hint: "Чем выше — тем сильнее урон из кармана",
        },
      ],
      slots: [
        { id: uid(), slot: "Цветок", main: "HP", subs: "HP% · ВЭ% · К/У · К/Ш" },
        { id: uid(), slot: "Перо", main: "Сила атаки", subs: "HP% · ВЭ% · К/У · К/Ш" },
        { id: uid(), slot: "Пески", main: "HP% или ВЭ%", subs: "Криты · HP% · ВЭ%" },
        { id: uid(), slot: "Кубок", main: "HP%", subs: "Криты · ВЭ% · HP%" },
        { id: uid(), slot: "Корона", main: "К/У или К/Ш", subs: "Крит · HP% · ВЭ%" },
      ],
    },
    {
      id: uid(),
      type: "rankedList",
      eyebrow: "Оружие",
      title: "Что надеть",
      intro: "Ищите HP и криты. Элементальный урон почти бесполезен.",
      kind: "weapons",
      items: weaponItems,
    },
    {
      id: uid(),
      type: "rankedList",
      eyebrow: "Артефакты",
      title: "Какой сет ставить",
      intro:
        "Топ — полный «Рассвет». Серенада — если в команде нет другого носителя. Временно: 2+2 на HP.",
      kind: "artifacts",
      items: artItems,
    },
    {
      id: uid(),
      type: "roleTable",
      eyebrow: "Команда",
      title: "С кем лучше всего",
      intro: "Берите 2–3 героя Нод-Края + одного внешнего баффера/хилера.",
      rows: [
        roleRow(
          c("flins", "флинс"),
          "Флинс",
          "Копьё",
          "Тучи бьют чаще (~+30% DPS). С С1 Коломбины ВЭ Флинса −10%.",
        ),
        roleRow(
          c("ineffa", "инеффа"),
          "Инеффа",
          "Копьё",
          "Те же бонусы Заряда. Можно отдать ей Рассвет, а Субретке — Серенаду.",
        ),
        roleRow(
          c("nefer", "нефер"),
          "Нефер",
          "Катализатор",
          "Нужен статус, бафф и доп. Роса — без Куутар сильно теряет комфорт.",
        ),
        roleRow(
          c("lauma", "лаума"),
          "Лаума",
          "Катализатор",
          "С Нефер экономит Росу на заряженном навыке.",
        ),
        roleRow(
          c("czy-baj", "цзы бай"),
          "Цзы Бай",
          "Меч",
          "Гео ДД от стойки — нужен стабильный Гидро из кармана.",
        ),
        roleRow(
          c("linneya", "линнея"),
          "Линнея",
          "Лук",
          "Саб-дд и хил из кармана.",
        ),
      ],
    },
    {
      id: uid(),
      type: "team",
      title: "Лунная бутонизация",
      badge: "Топ",
      note: "Лауму — в Серенаду, Коломбину — в Рассвет. Без С1 Лаумы на Нахиду можно дать Прототип: Янтарь.",
      members: [
        member(c("nefer", "нефер"), "Нефер", "Мейн-дд"),
        self("Саппорт"),
        member(c("lauma", "лаума"), "Лаума", "Саб-дд"),
        member(c("nahida", "нахида"), "Нахида", "Флекс"),
      ],
    },
    {
      id: uid(),
      type: "team",
      title: "Лунный заряд",
      badge: "Топ",
      note: "Коломбина вместо Айно. Сахароза — на МС и раздув элементов.",
      members: [
        member(c("flins", "флинс"), "Флинс", "Мейн-дд"),
        self("Саппорт"),
        member(c("ineffa", "инеффа"), "Инеффа", "Саб-дд"),
        member(c("sucrose", "сахароза"), "Сахароза", "Флекс"),
      ],
    },
    {
      id: uid(),
      type: "team",
      title: "Лунный кристалл",
      badge: "Сигнатурный",
      note: "Линнея закрывает хил. Коломбине — сигна или Кодекс Фавония (она единственный Гидро).",
      members: [
        member(c("czy-baj", "цзы бай"), "Цзы Бай", "Мейн-дд"),
        self("Саппорт"),
        member(c("illugi", "иллуги"), "Иллуги", "Саб-дд"),
        member(c("linneya", "линнея"), "Линнея", "Хил"),
      ],
    },
    {
      id: uid(),
      type: "team",
      title: "Бюджетный вариант",
      badge: "Гибко",
      note: "Без Лаумы: Нахида/Бай Чжу + Кокоми или Айно (Айно — носитель Серенады).",
      members: [
        member(c("nefer", "нефер"), "Нефер", "Мейн-дд"),
        self("Саппорт"),
        member(c("nahida", "нахида"), "Нахида", "Саб-дд"),
        member(c("kokomi", "кокоми"), "Кокоми", "Хил"),
      ],
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Команды",
      title: "Другие рабочие составы",
      body: `### Заряд
- Флинс / Коломбина / Оророн или Фишль / Ягода или Сахароза
- Флинс / Коломбина / Синобу / Айно

### Кристалл
- Цзы Бай / Коломбина / Иллуги / Горо или Шилонен
- Цзы Бай / Коломбина / Иллуги / Тиори или Чжун Ли

### Без Нод-Края (слабее, но можно)
- Нёвиллет / Коломбина / Инеффа / Сахароза или Ягода
- Нилу / Коломбина / Лаума / Нахида
- Арлекино / Коломбина / Беннет / Кадзуха`,
    },
    {
      id: uid(),
      type: "statsTable",
      title: "Статы при возвышении",
      intro: "Растёт крит. шанс. На 90 уровне без экипировки — 24.2% К/Ш. Качайте до 90.",
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
      type: "resourceTable",
      title: "Возвышение",
      intro: "Основные ресурсы на уровни персонажа:",
      rows: [
        {
          id: uid(),
          name: m("Осколок лазурита Варунада")?.name || "Лазурит Варунада",
          image: m("Осколок лазурита Варунада")?.image || "",
          qty: "1→9→9→6",
          where: "Боссы (серия лазурита Варунада)",
          href: m("Осколок лазурита Варунада")
            ? `/wiki/materials/${m("Осколок лазурита Варунада")!.slug}`
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
      type: "text",
      eyebrow: "Таланты",
      title: "Способности и приоритет",
      body: `### Приоритет прокачки
**Е ≥ Q > обычные** (обычные — только если играете драйвером).

### Коротко по скиллам
- **Е «Вечные приливы»** — основной урон и статус. Зыбь следует за активным и бьёт Вмешательством под доминирующую Лунную реакцию.
- **Q «Тоска во свете луны»** — Владения луны усиливают урон Лунных реакций. Держите ульту в каждой ротации.
- **Пассивки** — крит. стаки, бонусы реакциям, конвертация Заряда/Бутонизации/Кристалла, +1 к Знамению.`,
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Созвездия",
      title: "Какие консты важны",
      body: `Лучшие: **С1 → С2 → С6**.

- **С1** — комфорт команды: энергия / сопротивление прерыванию / щит в зависимости от реакции. Часто важнее сигны.
- **С2** — быстрее стаки + большой бафф HP и статов активного героя.
- **С6** — +80% К/У элементам в реакциях во Владениях (не стакается на один элемент).

### С1 или сигнатурка?
- Берите **С1**, если мейн-дд нужен комфорт (Флинс / Нефер / Цзы Бай).
- Берите **сигну**, если команда уже комфортна и хотите статы самой Коломбине.`,
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Геймплей",
      title: "Ротация и вердикт",
      body: `### Ротация
1. Коломбина: **Е → Q**
2. Саппорты и саб-дд
3. Мейн-дд под Зыбью и Владениями
4. Повторить по откату

### Стоит ли выбивать?
Да — если качаете отряды Нод-Края.  
Нет / позже — если таких дамагеров нет: обычные Гидро саб-дд часто выгоднее.`,
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
