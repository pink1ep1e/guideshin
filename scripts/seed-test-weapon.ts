/**
 * Тестовое оружие без изображения + статы + таблица возвышения.
 * Запуск: npx tsx scripts/seed-test-weapon.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function mat(
  id: string,
  name: string,
  qty: number,
  rarityStars: number,
): { id: string; name: string; image: string; qty: number; rarityStars: number; href: string } {
  return { id, name, image: "", qty, rarityStars, href: "" };
}

const phases = [
  {
    id: "p1",
    phase: 1,
    maxLevel: 40,
    mora: 10000,
    materials: [
      mat("m1a", "Осколок бирюзы", 5, 2),
      mat("m1b", "Пыльца спор", 5, 1),
      mat("m1c", "Нектар", 3, 1),
    ],
  },
  {
    id: "p2",
    phase: 2,
    maxLevel: 50,
    mora: 20000,
    materials: [
      mat("m2a", "Фрагмент бирюзы", 5, 3),
      mat("m2b", "Светящаяся пыльца", 18, 2),
      mat("m2c", "Мерцающий нектар", 12, 2),
    ],
  },
  {
    id: "p3",
    phase: 3,
    maxLevel: 60,
    mora: 30000,
    materials: [
      mat("m3a", "Кусок бирюзы", 9, 4),
      mat("m3b", "Кристаллическая пыльца", 9, 3),
      mat("m3c", "Мерцающий нектар", 9, 2),
    ],
  },
  {
    id: "p4",
    phase: 4,
    maxLevel: 70,
    mora: 45000,
    materials: [
      mat("m4a", "Драгоценная бирюза", 5, 5),
      mat("m4b", "Кристаллическая пыльца", 18, 3),
      mat("m4c", "Элементальный нектар", 14, 3),
    ],
  },
  {
    id: "p5",
    phase: 5,
    maxLevel: 80,
    mora: 55000,
    materials: [
      mat("m5a", "Драгоценная бирюза", 9, 5),
      mat("m5b", "Пыльца мист-цветка", 14, 4),
      mat("m5c", "Элементальный нектар", 9, 3),
    ],
  },
  {
    id: "p6",
    phase: 6,
    maxLevel: 90,
    mora: 65000,
    materials: [
      mat("m6a", "Драгоценная бирюза", 6, 5),
      mat("m6b", "Пыльца мист-цветка", 27, 4),
      mat("m6c", "Элементальный нектар", 18, 3),
    ],
  },
];

const materialsSummary = [
  mat("s1", "Осколок бирюзы", 5, 2),
  mat("s2", "Фрагмент бирюзы", 14, 3),
  mat("s3", "Кусок бирюзы", 14, 4),
  mat("s4", "Драгоценная бирюза", 6, 5),
  mat("s5", "Пыльца спор", 23, 1),
  mat("s6", "Светящаяся пыльца", 27, 2),
  mat("s7", "Кристаллическая пыльца", 41, 3),
  mat("s8", "Пыльца мист-цветка", 15, 4),
  mat("s9", "Нектар", 23, 1),
  mat("s10", "Мерцающий нектар", 27, 2),
];

const guideDataBase = {
  atkMin: "46",
  atkMax: "608",
  subStatLabel: "Сила атаки",
  subStatMin: "10.8%",
  subStatMax: "49.6%",
  passive:
    "Увеличивает силу атаки на 20%.\nПосле попадания заряженной атакой по противнику следующий удар элементальным навыком наносит дополнительный урон, равный 40% от силы атаки. Эффект может возникнуть один раз в 12 сек.",
  levelUpNote:
    "Чтобы поднять оружие до 90 уровня, потребуется 6 053 650 опыта оружия (примерно 605 волшебной руды усиления) и 605 000 моры.",
  moraTotal: 225000,
  materialsSummary,
  ascensionNote:
    "Для полного возвышения оружия «Тестовое оружие без иконки» понадобятся следующие материалы:",
  phases,
  howToGetTitle: "Как получить",
  howToGetIntro: "Тестовое оружие для проверки страницы без иконки и таблицы возвышения.",
  banners: [],
};

async function main() {
  const chars = await prisma.character.findMany({
    where: { published: true },
    orderBy: { order: "asc" },
    take: 2,
    select: { name: true, slug: true, image: true, element: true, rarity: true },
  });

  const rarityStars: Record<string, number> = {
    LEGEND: 5,
    EPIC: 4,
    RARE: 3,
    COMMON: 2,
  };

  const recommended =
    chars.length > 0
      ? chars.map((c, i) => ({
          id: `rec${i + 1}`,
          name: c.name,
          image: c.image,
          element: c.element,
          rarityStars: rarityStars[c.rarity] ?? 5,
          href: `/wiki/characters/${c.slug}`,
        }))
      : [
          {
            id: "rec1",
            name: "Сандроне",
            image: "",
            element: "CRYO",
            rarityStars: 5,
            href: "",
          },
          {
            id: "rec2",
            name: "Мавуика",
            image: "",
            element: "PYRO",
            rarityStars: 5,
            href: "",
          },
        ];

  const links = recommended
    .map((c) => (c.href ? `<a href="${c.href}">${c.name}</a>` : c.name))
    .join(", ");

  const guideData = {
    ...guideDataBase,
    recommendedIntro: `Оружие Тестовое оружие без иконки может быть полезно персонажам: ${links}.`,
    recommended,
  };

  const weapon = await prisma.weapon.upsert({
    where: { slug: "testovoe-oruzhie-bez-ikonki" },
    create: {
      slug: "testovoe-oruzhie-bez-ikonki",
      name: "Тестовое оружие без иконки",
      image: "",
      rarity: "LEGEND",
      weaponType: "Двуручник",
      shortDesc: "Черновик для проверки карточки статов и таблицы материалов",
      contentHtml: "",
      guideData,
      published: true,
      order: 0,
    },
    update: {
      name: "Тестовое оружие без иконки",
      image: "",
      rarity: "LEGEND",
      weaponType: "Двуручник",
      shortDesc: "Черновик для проверки карточки статов и таблицы материалов",
      guideData,
      published: true,
    },
  });

  console.log("OK:", weapon.slug, weapon.id);
  console.log(
    "recommended:",
    recommended.map((c) => c.name).join(", "),
  );
  console.log("URL: /wiki/weapons/testovoe-oruzhie-bez-ikonki");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
