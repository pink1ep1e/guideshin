import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const guideData = {
  description:
    'Эфирокрылый мотылёк — одна из диковинок Мондштадта. Основное применение этого материала это возвышение персонажей <a href="/wiki/characters/loen">Лоэн</a> и <a href="/wiki/characters/linnea">Линнея</a>. Эфирокрылый мотылёк можно найти в дикой природе на просторах Тейвата. Где найти и собрать Эфирокрылый мотылёк вы можете посмотреть на интерактивной карте ниже.',
  lore: "Странное существо, излучающее священное золотое сияние, парящее словно мотылёк в столь же странных залах. Легенда гласит, что небесные мотыльки рождены из перьев падших ангелов-бунтовщиков, что некогда восстали против Владычицы Высших Небес. Возможно, в глазах некоего божества они, будучи свидетелями кары для преступников, тоже заслуживают того, чтобы их сохранили.",
  charactersIntro:
    'Материал Эфирокрылый мотылёк используется для улучшения следующих персонажей: <a href="/wiki/characters/loen">Лоэн</a> и <a href="/wiki/characters/linnea">Линнея</a>.',
  characters: [
    {
      id: "loen",
      name: "Лоэн",
      image: "",
      element: "CRYO",
      rarityStars: 5,
      href: "/wiki/characters/loen",
    },
    {
      id: "linnea",
      name: "Линнея",
      image: "",
      element: "GEO",
      rarityStars: 5,
      href: "/wiki/characters/linnea",
    },
  ],
  weaponsIntro: "",
  weapons: [],
  alchemyUseIntro: "",
  alchemyUses: [],
  sourcesIntro: "",
  sources: [],
  alchemyCraftIntro: "",
  alchemyCraft: [],
  mapTitle: "Интерактивная карта",
  mapIntro: "Где находятся материал Эфирокрылый мотылёк отмечено на интерактивной карте",
  mapUrl:
    "https://act.hoyolab.com/ys/app/interactive-map/index.html?lang=ru-ru#/map/2?shown_types=813&center=-803.58,-602.02&zoom=-0.50",
};

async function main() {
  const material = await prisma.material.upsert({
    where: { slug: "efirokrylyi-motylyok" },
    create: {
      slug: "efirokrylyi-motylyok",
      name: "Эфирокрылый мотылёк",
      image: "",
      rarityStars: 1,
      category: "local",
      shortDesc: "Диковинка Мондштадта для возвышения персонажей",
      contentHtml: "",
      guideData,
      published: true,
      order: 0,
    },
    update: {
      name: "Эфирокрылый мотылёк",
      image: "",
      rarityStars: 1,
      category: "local",
      shortDesc: "Диковинка Мондштадта для возвышения персонажей",
      guideData,
      published: true,
    },
  });

  console.log("OK:", material.slug, material.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
