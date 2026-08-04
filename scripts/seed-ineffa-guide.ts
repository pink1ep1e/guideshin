/**
 * Импорт гайда на Инеффу.
 *
 *   npx tsx scripts/seed-ineffa-guide.ts
 *
 * Важно: НЕ трогаем image / splashImage — у Инеффы уже корректные иконки в БД.
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

const NAME = "Инеффа";
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
  return ELEMENT_SVG[String(element) as ElementKey] || ELEMENT_SVG.ELECTRO;
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
    elementIcon: ELEMENT_SVG.ELECTRO,
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
      rarity: rarityStars(c.rarity),
    };
  }
  noteMissing("character", fallbackName);
  return {
    id: uid(),
    name: fallbackName,
    image: STUB_IMAGE,
    element: "—",
    elementIcon: ELEMENT_SVG.ELECTRO,
    weapon,
    weaponIcon: "",
    description: `${description} (заглушка — нет в БД)`,
    rarity: 5,
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

function shield(atk: string, flat: string): string {
  return `${atk}% силы атаки + ${flat}`;
}

async function main() {
  const existing = await prisma.character.findFirst({
    where: {
      OR: [
        { slug: "ineffa" },
        { name: "Инеффа" },
        { name: { contains: "Инефф" } },
        { name: { contains: "инефф" } },
      ],
    },
    select: {
      id: true,
      slug: true,
      name: true,
      image: true,
      splashImage: true,
      weaponType: true,
      element: true,
      region: true,
      rarity: true,
    },
  });

  const SLUG = existing?.slug || "ineffa";
  /** Только для отображения в блоках гайда (self / setPlan) — не пишем в upsert. */
  const IMAGE = existing?.image || "";

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
  const artPozol = a("Позолоченные сны");
  const artMille = a("Стойкость Миллелита");
  const artGrom = a("Громогласный рёв ярости", "Громогласный рев ярости");
  const artVV = a("Изумрудная тень");

  const self = (role?: string): GuideTeamMember => ({
    id: uid(),
    name: NAME,
    image: IMAGE,
    elementIcon: ELEMENT_SVG.ELECTRO,
    rarity: 5,
    href: `/wiki/characters/${SLUG}`,
    role,
  });

  const weaponItems: GuideRankedItem[] = [
    rankedWeapon(
      w("Расколотый ореол"),
      1,
      "Расколотый ореол",
      "Сигна",
      "После Е/Q — +АТК на 20 сек.; при создании щита — Электризующий эдикт: урон Лунного заряда отряда +40–80%.",
      "Лучший выбор: К/У, АТК и прямой бафф Лунного заряда.",
      "S",
    ),
    rankedWeapon(
      w("Посох алых песков"),
      2,
      "Посох алых песков",
      "К/Ш · МС→АТК",
      "Бонус АТК от МС; стаки Сна алых песков после Е (из кармана).",
      "Сильная альтернатива: много К/Ш, пассивка работает с конвертацией АТК→МС.",
      "A",
    ),
    rankedWeapon(
      w("Усмиритель бед"),
      3,
      "Усмиритель бед",
      "Высокая база · АТК",
      "Бонус стихийного урона; стаки АТК от Е, в кармане удваиваются.",
      "Мощно, но сложнее балансировать криты и ВЭ.",
      "A",
    ),
    rankedWeapon(
      w("Симфонист ароматов"),
      4,
      "Симфонист ароматов",
      "К/У · АТК",
      "+АТК; доп. АТК в кармане; сильный бафф после лечения (сама не лечит).",
      "Хороший К/У и АТК; без хилера в отряде — только базовые части пассивки.",
      "A",
    ),
    rankedWeapon(
      w("Покоритель вихря"),
      5,
      "Покоритель вихря",
      "Щит · АТК",
      "Прочность щита + стаки АТК; под щитом стаки удваиваются.",
      "Синергия со щитом Инеффы — бонус почти всегда активен.",
      "A",
    ),
    rankedWeapon(
      w("Окровавленные руины"),
      6,
      "Окровавленные руины",
      "Сигна Флинса",
      "Краткий бафф Лунного заряда после Q + К/У и энергия при реакции.",
      "Окно баффа короткое; личные статы ок, но слабее топа.",
      "B",
    ),
    rankedWeapon(
      w("Посох жертвующей"),
      7,
      "Посох жертвующей",
      "Лучший 4★",
      "После Е из кармана — стаки АТК и ВЭ (до 3).",
      "На высоких пробуждениях почти догоняет легендарки (кроме сигны).",
      "A",
    ),
    rankedWeapon(
      w("Баллада фьордов"),
      8,
      "Баллада фьордов",
      "К/Ш · МС",
      "При 3 разных стихиях в отряде — большой МС.",
      "Удобно в миксах с Анемо/Гео/Дендро слотом.",
      "B",
    ),
    rankedWeapon(
      w("Копьё Фавония", "Копье Фавония"),
      9,
      "Копьё Фавония",
      "ВЭ · частицы",
      "Крит. попадания генерируют частицы энергии.",
      "Нужно ~50% К/Ш. Полезно для ульты и батареи отряду.",
      "B",
    ),
    rankedWeapon(
      w("Крест-копьё Китаин", "Крест-копье Китаин"),
      10,
      "Крест-копьё Китаин",
      "Крафт · МС",
      "МС, урон Е и помощь с энергией после попадания навыком.",
      "Бесплатный крафт из Инадзумы на первое время.",
      "C",
    ),
  ];

  const artItems: GuideRankedItem[] = [
    rankedArt(
      artRassvet,
      1,
      "Рассветная песнь звезды и луны",
      "Лучший 4п",
      "2п +80 МС; 4п — урон Лунных реакций из кармана (+20%, при Высшем сиянии ещё +40%).",
      "Сигнатурный сет почти во всех отрядах Лунного заряда.",
      "S",
    ),
    rankedArt(
      artSerenada,
      2,
      "Серенада шёлковой луны",
      "Когда Рассвет у Коломбины",
      "2п ВЭ; 4п — МС отряду и усиление Лунных реакций при знамении.",
      "Берите, если Рассвет отдаёте Коломбине (или другому носителю).",
      "A",
    ),
    rankedArt(
      artPozol,
      3,
      "Позолоченные сны",
      "АТК + МС",
      "2п МС; 4п — АТК/МС по составу отряда после реакции (из кармана).",
      "Закрывает оба нужных стата; удобно с Айно на Серенаде.",
      "A",
    ),
    rankedArt(
      artMille,
      4,
      "Стойкость Миллелита",
      "Саппорт",
      "4п — +АТК и прочность щитов союзникам при попаданиях Е.",
      "Биргитта бьёт часто — бафф держится стабильно.",
      "B",
    ),
    rankedArt(
      artGrom,
      5,
      "Громогласный рёв ярости",
      "Реакции",
      "2п Электро; 4п усиливает Заряжен / Лунный заряд и др. электро-реакции.",
      "Ок для личного урона реакций, если нет Рассвета/Серенады.",
      "B",
    ),
  ];

  const matWhistle1 = m("Деревянный свисток дозорного");
  const matWhistle2 = m("Металлический свисток воина");
  const matWhistle3 = m(
    "Золотой свисток коронованного заврианами воина",
    "Золотой свисток",
  );
  const matBook1 = m("Учения о «Раздоре»", "Учения о «Раздор»");
  const matBook2 = m("Указания о «Раздоре»", "Указания о «Раздор»");
  const matBook3 = m("Философия о «Раздоре»", "Философия о «Раздор»");

  const blocks: GuideBlock[] = [
    {
      id: uid(),
      type: "text",
      eyebrow: "Обзор",
      title: "Кто такая Инеффа",
      body: `Инеффа — **Электро-копьё 5★**, робот-горничная из **Мастерской крумкаке «Дзынь-Клац»** (Нод-Край). Роль — **саб-дд / саппорт / щитовик** под **Лунный заряд**: призывает **Биргитту**, конвертирует Заряжен → Лунный заряд, переливает АТК в МС и даёт щит.

### Кратко
- **Рейтинг** — S+
- **Стихия / оружие** — Электро · копьё
- **Возвышение** — крит. шанс (**+19.2%**, итого ~**24.2%** на 90 ур.)
- **База на 90 ур.** — HP **12 613** · АТК **330** · Защита **828** · К/Ш **5% + 19.2%**
- **Добавлена** — патч **5.8** (реран в ротации баннеров); сигна — **Расколотый ореол**
- **День рождения** — 2 апреля
- **Получение** — молитва события
- **Регион / фракция** — Нод-Край · Мастерская крумкаке «Дзынь-Клац»
- **Созвездие** — Ваниль
- **Особое блюдо** — **«Удар грома!»**
- **Лунное знамение** — +1, пока она в отряде`,
    },
    {
      id: uid(),
      type: "prosCons",
      eyebrow: "Анализ",
      title: "Преимущества и недостатки",
      prosTitle: "Преимущества",
      consTitle: "Недостатки",
      pros: [
        "Вводит и усиливает **Лунный заряд** (критующая альтернатива Заряжен) — редкий баффер этой реакции.",
        "Стабильный Электро-апп из кармана через **Биргитту** без окон в покрытии.",
        "Щит + бафф МС от АТК (после Q) — саб-дд и поддержка в одном слоте.",
        "Конвертация АТК→МС упрощает сборку: один стат тянет и урон, и реакции.",
      ],
      cons: [
        "Сильно раскрывается на **С1 / С2 / С6**; без конст щит слабее, бафф ЛЗ уже.",
        "Нужен баланс **АТК + ВЭ + критов**; щит сам по себе не танковый.",
        "Лунный заряд слабее по AoE, чем классический Заряжен — важны саб-дд, бьющие часто.",
        "Узкий профиль: без Гидро-аппа теряет большую часть ценности.",
      ],
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Билд",
      title: "Как собирать Инеффу",
      body: `Сборка под **карманный урон**, **щит** и **бафф Лунного заряда**. Скейлы Е/Q/Биргитты и плотность щита — от **АТК**; цифры реакции — от **МС** (часть АТК конвертируется пассивками).

Приоритет: **АТК → криты → ВЭ → немного МС**. Пески — **АТК%**; кубок — **АТК%** или **Электро**; корона — **К/Ш** или **К/У** (с сигной чаще К/Ш). В сабах: **АТК% · ВЭ% · МС · криты**.`,
    },
    {
      id: uid(),
      type: "statTargets",
      eyebrow: "Билд",
      title: "Рекомендуемые значения характеристик",
      intro: "Порог **2000 АТК** нужен для полной отдачи пассивок / С1; ВЭ — под комфортную ульту.",
      targets: [
        {
          id: uid(),
          label: "АТК",
          value: "2000+",
          hint: "Порог для полного А1 / баффа С1; можно выше ради МС союзникам",
        },
        {
          id: uid(),
          label: "ВЭ",
          value: "130–180%",
          hint: "Ниже с Электро-резонансом и Фавониями; выше в соло-Электро",
        },
        {
          id: uid(),
          label: "МС",
          value: "100–200",
          hint: "Достаточно; остальное добирается конвертацией АТК",
        },
        {
          id: uid(),
          label: "К/Ш",
          value: "60–70%",
          hint: "С учётом возвышения и оружия",
        },
        {
          id: uid(),
          label: "К/У",
          value: "150%+",
          hint: "Ориентир 1:2 к К/Ш",
        },
      ],
      slots: [
        { id: uid(), slot: "Пески", main: "АТК%", subs: "АТК% · ВЭ% · МС · криты" },
        { id: uid(), slot: "Кубок", main: "АТК% / Электро", subs: "АТК% · ВЭ% · МС · криты" },
        { id: uid(), slot: "Корона", main: "К/Ш / К/У", subs: "АТК% · ВЭ% · МС · криты" },
        {
          id: uid(),
          slot: "Цветок / Перо",
          main: "HP / АТК",
          subs: "АТК% · ВЭ% · МС · криты",
        },
      ],
    },
    {
      id: uid(),
      type: "rankedList",
      eyebrow: "Оружие",
      title: "Рейтинг оружия",
      intro:
        "Ищите **АТК**, **криты** и баффы под Лунный заряд. Копья с **ВЭ** помогают держать ульту.",
      kind: "weapons",
      items: weaponItems,
    },
    {
      id: uid(),
      type: "rankedList",
      eyebrow: "Артефакты",
      title: "Полезные артефакты",
      intro:
        "Почти всегда цель — **Рассветная песнь звезды и луны**. Если Рассвет забирает Коломбина — **Серенада**. **Ночь открытия неба не рекомендуется**: бонус требует активного персонажа на поле, а Инеффа играет из кармана.",
      kind: "artifacts",
      items: artItems,
    },
    {
      id: uid(),
      type: "setPlan",
      eyebrow: "Артефакты",
      title: "Как раздать сеты в Лунном заряде",
      intro: "Ориентир для команд с Флинсом / Коломбиной / Айно.",
      groups: [
        {
          id: uid(),
          title: "Лунный заряд (Флинс)",
          rows: [
            planRow(c("flins", "флинс"), "Флинс", "Ночь открытия неба", artImg(artNoch, "Ночь открытия неба")),
            {
              id: uid(),
              name: NAME,
              image: IMAGE,
              href: `/wiki/characters/${SLUG}`,
              setName: "Рассвет / Серенада",
              setImage: artImg(artRassvet, "Рассветная песнь звезды и луны"),
            },
            planRow(
              c("kolombina", "коломбина") || c("ajno", "айно"),
              "Коломбина / Айно",
              "Серенада / Рассвет / другой",
              artImg(artSerenada, "Серенада шёлковой луны"),
            ),
            planRow(
              c("sucrose", "сахароза"),
              "Сахароза",
              "Изумрудная тень",
              artImg(artVV, "Изумрудная тень"),
            ),
          ],
        },
      ],
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Отряды",
      title: "Отряды под Лунный заряд",
      body: `Ядро — **Гидро-аппликатор + Электро**. Лучшие команды — с **Флинсом** (сигнатурный мейн-дд Лунного заряда). Также хорошо смотрится с **Нёвиллетом**, **Клориндой**, **Райдэн**.

Дендро обычно **мешает** (Стимуляция перебивает статусы). Нужен хотя бы один герой **Нод-Края** для **Высшего сияния**, если хотите максимум пассивок сетов и знамения.`,
    },
    {
      id: uid(),
      type: "roleTable",
      eyebrow: "Отряды",
      title: "Приоритетные персонажи",
      intro: "Лучшие союзники для Инеффы:",
      rows: [
        roleRow(
          c("flins", "флинс"),
          "Флинс",
          "Копьё",
          "Сигнатурный мейн-дд Лунного заряда. Вместе закрывают ядро Нод-Края и реакцию.",
        ),
        roleRow(
          c("ajno", "айно"),
          "Айно",
          "Двуручный меч",
          "Гидро + знамение Нод-Края. Аптаймы хорошо стыкуются с Флинсом и Биргиттой.",
        ),
        roleRow(
          c("furina", "фурина"),
          "Фурина",
          "Меч",
          "Универсальный Гидро-статус и бафф урона. Нужен хилер под Фанфары.",
        ),
        roleRow(
          c("yelan", "е лань", "e-lan"),
          "Е Лань",
          "Лук",
          "Карманный Гидро и бафф урона — если мейн-дд жмёт обычные атаки.",
        ),
        roleRow(
          c("xingqiu", "син цю", "sin-cyu"),
          "Син Цю",
          "Меч",
          "Бюджетный аппликатор из кармана + батарея; лёгкий подхил.",
        ),
        roleRow(
          c("neuvillette", "нёвиллет", "невиллет"),
          "Нёвиллет",
          "Катализатор",
          "Сильный Гидро-мейн; Лунный заряд кормит его бафф от реакций.",
        ),
        roleRow(
          c("yagoda", "ягода"),
          "Ягода",
          "Лук",
          "Слот Нод-Края + хил/бафф и Изумрудная тень. Удобна с Флинсом без Айно/Сахарозы.",
        ),
        roleRow(
          c("sucrose", "сахароза"),
          "Сахароза",
          "Катализатор",
          "МС отряду, Рассеивание и срез резистов через Изумрудную тень.",
        ),
        roleRow(
          c("kolombina", "коломбина"),
          "Коломбина",
          "Катализатор",
          "Сильный Гидро-саппорт Нод-Края: статус, баффы, конкуренция за Рассвет/Серенаду.",
        ),
      ],
    },
    {
      id: uid(),
      type: "teamGroup",
      eyebrow: "Отряды",
      title: "Примеры сильных команд",
      intro: "Варианты от топа к бюджету (без Путешественника):",
      variants: [
        variant(
          "Сигнатурный Лунный заряд: Айно на статус и знамение, Сахароза на МС и срез резистов.",
          [
            member(c("flins", "флинс"), "Флинс", "Мейн-дд"),
            self("Саб-дд / щит"),
            member(c("ajno", "айно"), "Айно", "Гидро"),
            member(c("sucrose", "сахароза"), "Сахароза", "Анемо"),
          ],
          "Топ",
        ),
        variant(
          "Без Айно/Сахарозы: Фурина на статус и бафф, Ягода закрывает хил и Нод-Край.",
          [
            member(c("flins", "флинс"), "Флинс", "Мейн-дд"),
            self("Саб-дд / щит"),
            member(c("furina", "фурина"), "Фурина", "Гидро"),
            member(c("yagoda", "ягода"), "Ягода", "Хил"),
          ],
          "Топ",
        ),
        variant(
          "Нёвиллет под Фуриной; четвёртый слот — Кадзуха или Чжун Ли на комфорт/срез.",
          [
            member(c("neuvillette", "нёвиллет", "невиллет"), "Нёвиллет", "Мейн-дд"),
            self("Саб-дд / щит"),
            member(c("furina", "фурина"), "Фурина", "Гидро"),
            member(c("kazuha", "кадзуха") || c("zhongli", "чжун ли"), "Кадзуха / Чжун Ли", "Флекс"),
          ],
          "Альтернатива",
        ),
        variant(
          "Клоринда бьёт с руки под Гидро-сабами; Шилонен — срез резистов и хил.",
          [
            member(c("klorinda", "клоринда"), "Клоринда", "Мейн-дд"),
            self("Саб-дд / щит"),
            member(c("furina", "фурина"), "Фурина", "Гидро"),
            member(c("shilonen", "шилонен", "xilonen"), "Шилонен", "Бафф"),
          ],
          "Альтернатива",
        ),
        variant(
          "Райдэн ускоряет ульты отряда; Син Цю даёт статус, Чжун Ли — щит и комфорт.",
          [
            member(c("shougun", "райдэн", "raiden"), "Райдэн", "Мейн-дд"),
            self("Саб-дд / щит"),
            member(c("xingqiu", "син цю"), "Син Цю", "Гидро"),
            member(c("zhongli", "чжун ли"), "Чжун Ли", "Щит"),
          ],
          "Альтернатива",
        ),
        variant(
          "Бюджет: Фишль и Син Цю на статусы, Барбара или Сахароза на выживаемость/бафф.",
          [
            self("Саб-дд / щит"),
            member(c("fischl", "фишль"), "Фишль", "Электро"),
            member(c("xingqiu", "син цю"), "Син Цю", "Гидро"),
            member(c("barbara", "барбара") || c("sucrose", "сахароза"), "Барбара / Сахароза", "Хил / Анемо"),
          ],
          "Бюджет",
        ),
      ],
    },
    {
      id: uid(),
      type: "resourceTable",
      title: "Возвышение",
      intro: "Ресурсы для возвышения Инеффы (материалы Натлана + аметист Ваджрада):",
      rows: [
        {
          id: uid(),
          name: m("Осколок аметиста Ваджрада")?.name || "Аметист Ваджрада",
          image: m("Осколок аметиста Ваджрада")?.image || "",
          qty: "1→9→9→6",
          where: "Еженедельные и мировые боссы (серия аметиста Ваджрада)",
          href: m("Осколок аметиста Ваджрада")
            ? `/wiki/materials/${m("Осколок аметиста Ваджрада")!.slug}`
            : undefined,
        },
        {
          id: uid(),
          name: (() => {
            if (!matWhistle1) noteMissing("material", "Деревянный свисток дозорного");
            if (!matWhistle2) noteMissing("material", "Металлический свисток воина");
            return matWhistle3?.name || "Свистки заврианов";
          })(),
          image: matWhistle3?.image || "",
          qty: "18 / 30 / 36",
          where: "Заврианоподобные воины племени (Натлан)",
          href: matWhistle3 ? `/wiki/materials/${matWhistle3.slug}` : undefined,
        },
        {
          id: uid(),
          name:
            m("Аккумулятор воздушного потока таинственного источника")?.name ||
            "Аккумулятор воздушного потока таинственного источника",
          image: m("Аккумулятор воздушного потока таинственного источника")?.image || "",
          qty: "46",
          where: "Мировой босс «Автоматон таинственного источника: Надсмотрщик»",
          href: m("Аккумулятор воздушного потока таинственного источника")
            ? `/wiki/materials/${m("Аккумулятор воздушного потока таинственного источника")!.slug}`
            : undefined,
        },
        {
          id: uid(),
          name: m("Мерцающий рогатый гриб")?.name || "Мерцающий рогатый гриб",
          image: m("Мерцающий рогатый гриб")?.image || "",
          qty: "168",
          where: "Диковинка Натлана (Кряж Тецкатепетонко и окрестности)",
          href: m("Мерцающий рогатый гриб")
            ? `/wiki/materials/${m("Мерцающий рогатый гриб")!.slug}`
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
          href: m("Опыт героя") ? `/wiki/materials/${m("Опыт героя")!.slug}` : undefined,
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
          name: matBook1?.name || "Учения о «Раздоре»",
          image: matBook1?.image || "",
          rarity: 4 as const,
          note: "×3",
          qty: "3",
          href: matBook1 ? `/wiki/materials/${matBook1.slug}` : undefined,
        },
        {
          id: uid(),
          name: matBook2?.name || "Указания о «Раздоре»",
          image: matBook2?.image || "",
          rarity: 4 as const,
          note: "×21",
          qty: "21",
          href: matBook2 ? `/wiki/materials/${matBook2.slug}` : undefined,
        },
        {
          id: uid(),
          name: matBook3?.name || "Философия о «Раздоре»",
          image: matBook3?.image || "",
          rarity: 4 as const,
          note: "×38",
          qty: "38",
          href: matBook3 ? `/wiki/materials/${matBook3.slug}` : undefined,
        },
        {
          id: uid(),
          name: m("Истлевшее солнечное пламя")?.name || "Истлевшее солнечное пламя",
          image: m("Истлевшее солнечное пламя")?.image || "",
          rarity: 5 as const,
          note: "×4",
          qty: "4",
          href: m("Истлевшее солнечное пламя")
            ? `/wiki/materials/${m("Истлевшее солнечное пламя")!.slug}`
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
        "Растёт **крит. шанс** (**+19.2%** на 90 ур., итого ~**24.2%** с базовыми 5%). Качайте хотя бы до **80/90**.",
      colLabels: [
        "Уровень",
        "Базовое HP",
        "Базовая сила атаки",
        "Базовая защита",
        "Базовый К/Ш",
        "Бонус К/Ш (возвышение)",
      ],
      rows: [
        emptyStatsRow("1", "982", "26", "64", "5%", "0%"),
        emptyStatsRow("20", "2 547", "67", "167", "5%", "0%"),
        emptyStatsRow("40", "5 070", "133", "333", "5%", "0%"),
        emptyStatsRow("50", "6 523", "171", "428", "5%", "4.8%"),
        emptyStatsRow("60", "8 182", "214", "537", "5%", "9.6%"),
        emptyStatsRow("70", "9 650", "253", "633", "5%", "9.6%"),
        emptyStatsRow("80", "11 128", "291", "730", "5%", "14.4%"),
        emptyStatsRow("90", "12 613", "330", "828", "5%", "19.2%"),
      ],
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Геймплей",
      title: "Способности",
      body: `Инеффа — карманный Электро-саб через **Биргитту** и щит **Барьер оптического потока**. Е ставит щит и помощницу; Q бьёт по площади Ракетными кулаками и обновляет длительность Биргитты, параллельно давая **Параметрическое преобразование** (МС от АТК). Пассивка конвертирует **Заряжен → Лунный заряд** и усиливает базовый урон реакции от АТК.

### Приоритет прокачки
**Е > Q > обычные** (обычные почти не нужны).

### Активные навыки
- **Вихревой пылеочиститель** — до 4 ударов копьём; заряженная — вращение; падение — урон по площади.
- **Режим очистки: Несущая частота (Е)** — Электро по площади, щит (АТК, 250% vs Электро) и **Биргитта** (разряды раз в ~2 сек.). Длительность **20** сек., откат **16**.
- **Высшая команда: Циклонический истребитель (Q)** — Ракетные кулаки Биргитты, обновление длительности. **60** энергии, откат **15**.

### Пассивки
- **Контур превышения чистоты** — доп. удар Биргитты (65% АТК, считается Лунным зарядом) рядом с грозовыми тучами.
- **Протокол панорамного преобразования** — после Q: МС Инеффы и активного героя = **6%** от её АТК на 20 сек.
- **Дар лунного знамения: Узел сборки** — Заряжен → Лунный заряд; +0.7% базового урона ЛЗ за 100 АТК (макс. **14%**); **+1** к уровню Знамения.
- **Модуль синтезирования вкусов** — шанс приправы от еды; смена облика Биргитты в Нод-Крае.`,
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Геймплей",
      title: "Как играть и стоит ли выбивать",
      body: `### Ротация
1. **Е** — щит + Биргитта.
2. Саппорты / саб-дд — статусы и баффы под Лунный заряд.
3. **Q** Инеффы — удар, обновление Биргитты и бафф МС.
4. Ротация мейн-дд; обновляйте **Е** по откату.

> Порядок: **Е → баффы/статусы → Q → дамагер**.

### Стоит ли выбивать?
Сильный **S+** саб-дд/щитовик под **Лунный заряд**. Раскрывается с Гидро-аппом и желательно с Флинсом / готовой командой. Сборка понятная, но требует баланса статов.

### С1 или сигна?
- **Сигна (Расколотый ореол)** — в приоритете: +АТК и ~**40%** к Лунному заряду после Е/Q + щита.
- **С1** — докручивайте после сигны: до **+50%** урона ЛЗ при **2000 АТК** после каждого щита.`,
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Лор",
      title: "Биография",
      body: `Инеффа — универсальный человекоподобный робот из мастерской **«Дзынь-Клац»**, собранный из компонентов разных стран. Ядро источника в груди пережило тысячи лет и лишь недавно снова активировалось.

Она исполняет роль горничной и компаньона; ей помогает маленький модуль **Биргитта**. Созвездие **Ваниль** и особое блюдо **«Удар грома!»** подчёркивают её электро-образ и характер «домашнего» боевого робота Нод-Края.`,
    },
  ];

  if (!matBook1) noteMissing("material", "Учения о «Раздоре»");
  if (!matBook2) noteMissing("material", "Указания о «Раздоре»");
  if (!matBook3) noteMissing("material", "Философия о «Раздоре»");

  const levelMaterials: CharacterMaterial[] = [
    matCard(m("Мерцающий рогатый гриб"), "Мерцающий рогатый гриб", 168, "local", 1),
    matCard(
      m("Аккумулятор воздушного потока таинственного источника"),
      "Аккумулятор воздушного потока таинственного источника",
      46,
      "boss",
      4,
    ),
    matCard(m("Осколок аметиста Ваджрада"), "Осколок аметиста Ваджрада", 1, "ascension", 2),
    matCard(m("Фрагмент аметиста Ваджрада"), "Фрагмент аметиста Ваджрада", 9, "ascension", 3),
    matCard(m("Кусок аметиста Ваджрада"), "Кусок аметиста Ваджрада", 9, "ascension", 4),
    matCard(m("Драгоценный аметист Ваджрада"), "Драгоценный аметист Ваджрада", 6, "ascension", 5),
    matCard(matWhistle1, "Деревянный свисток дозорного", 18, "ascension", 1),
    matCard(matWhistle2, "Металлический свисток воина", 30, "ascension", 2),
    matCard(matWhistle3, "Золотой свисток коронованного заврианами воина", 36, "ascension", 3),
    matCard(matBook1, "Учения о «Раздоре»", 9, "talent", 2),
    matCard(matBook2, "Указания о «Раздоре»", 63, "talent", 3),
    matCard(matBook3, "Философия о «Раздоре»", 114, "talent", 4),
    matCard(m("Истлевшее солнечное пламя"), "Истлевшее солнечное пламя", 12, "talent", 5),
    matCard(m("Корона прозрения"), "Корона прозрения", 3, "talent", 5),
    matCard(m("Опыт героя"), "Опыт героя", 421, "exp", 4),
    matCard(m("Мора"), "Мора", 1653000, "exp", 3),
  ];

  const contentHtml = serializeGuide(blocks);
  const shortDesc =
    "Инеффа — Электро саб-дд и щитовик Лунного заряда: билд, оружие, сеты и отряды.";

  const iconBase = "/images/talents/ineffa";
  const cIconBase = "/images/constellations/ineffa";
  const lv13 = Array.from({ length: 13 }, (_, i) => String(i + 1));

  const talents = [
    {
      id: "t_na",
      name: "Вихревой пылеочиститель",
      icon: `${iconBase}/na.png`,
      description:
        "**Обычная атака:** до четырёх последовательных ударов копьём.\n\n**Заряженная:** тратит выносливость и выполняет вращающуюся атаку.\n\n**Удар в падении:** стремительное падение, затем урон по площади.",
      loreText: "Модуль пылеочистки переведён в боевой режим.",
      levelLabels: lv13,
      stats: [
        {
          label: "Урон 1 удара",
          values: [
            "34.84%",
            "37.67%",
            "40.51%",
            "44.56%",
            "47.39%",
            "50.63%",
            "55.09%",
            "59.54%",
            "64%",
            "68.86%",
            "73.72%",
            "78.58%",
            "83.44%",
          ],
        },
        {
          label: "Урон 2 удара",
          values: [
            "34.22%",
            "37.01%",
            "39.79%",
            "43.77%",
            "46.56%",
            "49.74%",
            "54.12%",
            "58.49%",
            "62.87%",
            "67.65%",
            "72.42%",
            "77.2%",
            "81.97%",
          ],
        },
        {
          label: "Урон 3 удара",
          values: [
            "22.76% + 22.76%",
            "24.61% + 24.61%",
            "26.46% + 26.46%",
            "29.11% + 29.11%",
            "30.96% + 30.96%",
            "33.08% + 33.08%",
            "35.99% + 35.99%",
            "38.9% + 38.9%",
            "41.81% + 41.81%",
            "44.98% + 44.98%",
            "48.16% + 48.16%",
            "51.33% + 51.33%",
            "54.51% + 54.51%",
          ],
        },
        {
          label: "Урон 4 удара",
          values: [
            "56.07%",
            "60.63%",
            "65.2%",
            "71.71%",
            "76.28%",
            "81.49%",
            "88.67%",
            "95.84%",
            "103.01%",
            "110.83%",
            "118.65%",
            "126.48%",
            "134.3%",
          ],
        },
        {
          label: "Урон заряженной атаки",
          values: [
            "94.94%",
            "102.67%",
            "110.4%",
            "121.44%",
            "129.17%",
            "138%",
            "150.14%",
            "162.29%",
            "174.43%",
            "187.68%",
            "200.93%",
            "214.18%",
            "227.42%",
          ],
        },
        {
          label: "Расход выносливости",
          values: Array(13).fill("25"),
        },
        {
          label: "Урон в падении",
          values: [
            "63.93%",
            "69.14%",
            "74.34%",
            "81.77%",
            "86.98%",
            "92.93%",
            "101.1%",
            "109.28%",
            "117.46%",
            "126.38%",
            "135.3%",
            "144.22%",
            "153.14%",
          ],
        },
        {
          label: "Низкий / высокий удар",
          values: [
            "127.84% / 159.68%",
            "138.24% / 172.67%",
            "148.65% / 185.67%",
            "163.51% / 204.24%",
            "173.92% / 217.23%",
            "185.81% / 232.09%",
            "202.16% / 252.51%",
            "218.51% / 272.93%",
            "234.86% / 293.36%",
            "252.7% / 315.64%",
            "270.54% / 337.92%",
            "288.38% / 360.2%",
            "306.22% / 382.48%",
          ],
        },
      ],
      order: 0,
    },
    {
      id: "t_skill",
      name: "Режим очистки: Несущая частота",
      icon: `${iconBase}/skill.png`,
      description:
        "Инеффа активирует Усовершенствованный модуль уборки: **Электро урон** по площади, **Барьер оптического потока** и призыв **Биргитты**.\n\nЩит поглощает урон от **АТК** Инеффы и **Электро** урон с **250%** эффективностью. Биргитта раз в ~2 сек. бьёт разрядами по площади, если рядом есть враги.\n\nДлительность щита и Биргитты — **20 сек.** Откат **16 сек.**",
      loreText: "Несущая частота вычищает поле боя до блеска.",
      levelLabels: lv13,
      stats: [
        {
          label: "Урон навыка",
          values: [
            "86.4%",
            "92.88%",
            "99.36%",
            "108%",
            "114.48%",
            "120.96%",
            "129.6%",
            "138.24%",
            "146.88%",
            "155.52%",
            "164.16%",
            "172.8%",
            "183.6%",
          ],
        },
        {
          label: "Поглощение щита",
          values: [
            shield("221.18", "1386.68"),
            shield("237.77", "1525.36"),
            shield("254.36", "1675.61"),
            shield("276.48", "1837.41"),
            shield("293.07", "2010.77"),
            shield("309.66", "2195.68"),
            shield("331.78", "2392.16"),
            shield("353.89", "2600.19"),
            shield("376.01", "2819.77"),
            shield("398.13", "3050.92"),
            shield("420.25", "3293.62"),
            shield("442.37", "3547.88"),
            shield("470.02", "3813.7"),
          ],
        },
        {
          label: "Длительность щита",
          values: Array(13).fill("20 сек."),
        },
        {
          label: "Урон разряда Биргитты",
          values: [
            "96%",
            "103.2%",
            "110.4%",
            "120%",
            "127.2%",
            "134.4%",
            "144%",
            "153.6%",
            "163.2%",
            "172.8%",
            "182.4%",
            "192%",
            "204%",
          ],
        },
        {
          label: "Длительность Биргитты",
          values: Array(13).fill("20 сек."),
        },
        {
          label: "Время отката",
          values: Array(13).fill("16 сек."),
        },
      ],
      order: 1,
    },
    {
      id: "t_burst",
      name: "Высшая команда: Циклонический истребитель",
      icon: `${iconBase}/burst.png`,
      description:
        "**Биргитта** очищает поле **Ракетными кулаками**: Инеффа выпускает её в бой с **Электро уроном** по площади; Биргитта остаётся на поле. Если помощница уже призвана — перевызывается у цели и длительность сбрасывается.\n\nЭнергия **60**, откат **15 сек.**",
      loreText: "Высшая команда подтверждена. Цель — стерильность.",
      levelLabels: lv13,
      stats: [
        {
          label: "Урон навыка",
          values: [
            "676.8%",
            "727.56%",
            "778.32%",
            "846%",
            "896.76%",
            "947.52%",
            "1015.2%",
            "1082.88%",
            "1150.56%",
            "1218.24%",
            "1285.92%",
            "1353.6%",
            "1438.2%",
          ],
        },
        {
          label: "Время отката",
          values: Array(13).fill("15 сек."),
        },
        {
          label: "Потребление энергии",
          values: Array(13).fill("60"),
        },
      ],
      order: 2,
    },
    {
      id: "t_p1",
      name: "Контур превышения чистоты",
      icon: `${iconBase}/passive1.png`,
      description:
        "Когда **Биргитта** бьёт разрядом и рядом есть грозовые тучи **Лунного заряда**, она наносит доп. **Электро** по площади на **65%** АТК Инеффы. Урон считается **Лунным зарядом**.",
      order: 3,
    },
    {
      id: "t_p2",
      name: "Протокол панорамного преобразования",
      icon: `${iconBase}/passive2.png`,
      description:
        "При **Q** все персонажи получают **Параметрическое преобразование**: МС Инеффы и активного героя на **20 сек.** повышается на **6%** от силы атаки Инеффы.",
      order: 4,
    },
    {
      id: "t_p3",
      name: "Дар лунного знамения: Узел сборки",
      icon: `${iconBase}/passive3.png`,
      description:
        "Реакция **Заряжен** союзников конвертируется в **Лунный заряд**. Базовый урон ЛЗ +**0.7%** за каждые **100** АТК Инеффы (макс. **+14%**).\n\nПока она в отряде, уровень **Лунного знамения** +**1**.",
      order: 5,
    },
    {
      id: "t_util",
      name: "Модуль синтезирования вкусов",
      icon: `${iconBase}/utility.png`,
      description:
        "При потреблении еды с шансом **30%** даёт кухонный ингредиент-приправу. В Нод-Крае можно изменить облик **Биргитты**.",
      order: 6,
    },
  ];

  const constellations = [
    {
      id: "c1",
      level: 1,
      name: "Процессор ректификации",
      icon: `${cIconBase}/c1.png`,
      description:
        "При развёртывании **Барьера оптического потока** отряд на **20 сек.** получает **Токонесущий композит**: урон Лунного заряда +**2.5%** за каждые **100** АТК Инеффы (макс. **+50%**).",
      order: 0,
    },
    {
      id: "c2",
      level: 2,
      name: "Вспомогательный очистной модуль",
      icon: `${cIconBase}/c2.png`,
      description:
        "После попадания **Q** на одного врага вешается **Указ о взыскании**: через короткое время или при смерти цели — Электро по площади на **300%** АТК (считается Лунным зарядом). При **Q** активный персонаж также получает щит.",
      order: 1,
    },
    {
      id: "c3",
      level: 3,
      name: "Улучшенный эмулятор эмоций",
      icon: `${cIconBase}/c3.png`,
      description:
        "Уровень навыка **Режим очистки: Несущая частота** +**3** (макс. **15**).",
      order: 2,
    },
    {
      id: "c4",
      level: 4,
      name: "Путь без указа",
      icon: `${cIconBase}/c4.png`,
      description:
        "При **Лунном заряде** союзников восстанавливается **5** ед. энергии (раз в **4 сек.**).",
      order: 3,
    },
    {
      id: "c5",
      level: 5,
      name: "Преодоление зеркального сна",
      icon: `${cIconBase}/c5.png`,
      description:
        "Уровень навыка **Высшая команда: Циклонический истребитель** +**3** (макс. **15**).",
      order: 4,
    },
    {
      id: "c6",
      level: 6,
      name: "Рассветное утро для тебя",
      icon: `${cIconBase}/c6.png`,
      description:
        "Под **Токонесущим композитом** после удара грозовых туч Инеффа наносит **135%** АТК Электро по площади рядом с активным героем (считается Лунным зарядом, раз в **3.5 сек.**).",
      order: 5,
    },
  ];

  const minOrder = await prisma.character.aggregate({ _min: { order: true } });
  const order = (minOrder._min.order ?? 1) - 1;

  const existingBySlug = await prisma.character.findUnique({ where: { slug: SLUG } });

  let row;
  if (existingBySlug) {
    row = await prisma.character.update({
      where: { slug: SLUG },
      data: {
        name: NAME,
        rarity: Rarity.LEGEND,
        element: Element.ELECTRO,
        weaponType: "Копьё",
        region: "Нод-Край",
        sticker: null,
        shortDesc,
        contentHtml,
        levelMaterials,
        talents,
        constellations,
        published: true,
        order,
        // НЕ трогаем image / splashImage
      },
    });
  } else {
    console.warn(
      `WARNING: character slug="${SLUG}" not found — creating with empty image/splashImage. Prefer uploading icons in admin.`,
    );
    row = await prisma.character.create({
      data: {
        slug: SLUG,
        name: NAME,
        image: "",
        splashImage: "",
        rarity: Rarity.LEGEND,
        element: Element.ELECTRO,
        weaponType: "Копьё",
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
