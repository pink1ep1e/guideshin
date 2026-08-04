import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

async function main() {
  const chars = await p.character.findMany({
    where: {
      OR: [
        {
          slug: {
            in: [
              "lauma",
              "nefer",
              "kolombina",
              "ajno",
              "yagoda",
              "nahida",
              "nilou",
              "bay-chzhu",
              "yao-yao",
              "yaoyao",
              "collei",
              "barbara",
              "xingqiu",
              "yelan",
              "kuki",
              "kuki-sinobu",
              "alhaitham",
              "al-haytam",
              "kokomi",
              "furina",
              "kaveh",
              "toma",
              "thoma",
              "kirara",
              "sin-cyu",
              "e-lan",
              "sangonomiya-kokomi",
            ],
          },
        },
        { name: { contains: "Лаума" } },
        { name: { contains: "Айно" } },
        { name: { contains: "Кавех" } },
        { name: { contains: "Аль-Хайтам" } },
        { name: { contains: "Кокоми" } },
        { name: { contains: "Яо Яо" } },
        { name: { contains: "Куки" } },
        { name: { contains: "Син Цю" } },
        { name: { contains: "Е Лань" } },
        { name: { contains: "Тома" } },
        { name: { contains: "Барбара" } },
        { name: { contains: "Коллеи" } },
        { name: { contains: "Нилу" } },
        { name: { contains: "Нахида" } },
        { name: { contains: "Бай Чжу" } },
        { name: { contains: "Фурина" } },
        { name: { contains: "Ягода" } },
        { name: { contains: "Коломбина" } },
        { name: { contains: "Нефер" } },
        { name: { contains: "Синобу" } },
      ],
    },
    select: {
      slug: true,
      name: true,
      rarity: true,
      element: true,
      weaponType: true,
      image: true,
      splashImage: true,
    },
  });
  console.log("CHARS", JSON.stringify(chars, null, 2));

  const mats = await p.material.findMany({
    where: {
      OR: [
        { name: { contains: "Лунн" } },
        { name: { contains: "лунн" } },
        { name: { contains: "Нагадус" } },
        { name: { contains: "мандат" } },
        { name: { contains: "Мандат" } },
        { name: { contains: "чешуйчат" } },
        { name: { contains: "Чешуйчат" } },
        { name: { contains: "Серебро захода" } },
        { name: { contains: "Корона" } },
        { name: { contains: "Мора" } },
        { name: { contains: "Опыт героя" } },
        { name: { contains: "Истлевш" } },
        { name: { contains: "Светящ" } },
      ],
    },
    select: { name: true, slug: true, rarityStars: true, category: true },
  });
  console.log("MATS", JSON.stringify(mats, null, 2));

  const weapons = await p.weapon.findMany({
    where: {
      OR: [
        { name: { contains: "прядильщиц" } },
        { name: { contains: "тысячи ночей" } },
        { name: { contains: "ткача" } },
        { name: { contains: "сердцевин" } },
        { name: { contains: "взывающего" } },
        { name: { contains: "мемуар" } },
        { name: { contains: "восполнен" } },
        { name: { contains: "атлас" } },
        { name: { contains: "Атлас" } },
        { name: { contains: "Фавони" } },
        { name: { contains: "Лютн" } },
        { name: { contains: "Фонарь" } },
        { name: { contains: "Зеркало" } },
        { name: { contains: "Сновиден" } },
        { name: { contains: "Церемониальн" } },
      ],
    },
    select: { name: true, slug: true, rarity: true },
  });
  console.log("WEAPONS", JSON.stringify(weapons, null, 2));

  const arts = await p.artifact.findMany({
    where: {
      OR: [
        { name: { contains: "дремучего" } },
        { name: { contains: "Серенада" } },
        { name: { contains: "Позолоченн" } },
        { name: { contains: "потерянного" } },
        { name: { contains: "Эмблем" } },
        { name: { contains: "Ночь открыт" } },
        { name: { contains: "Странствующ" } },
      ],
    },
    select: { name: true, slug: true, rarity: true },
  });
  console.log("ARTS", JSON.stringify(arts, null, 2));
}

main()
  .catch(console.error)
  .finally(() => p.$disconnect());
