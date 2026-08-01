import { PrismaClient, Rarity, Element } from "@prisma/client";

const prisma = new PrismaClient();

const characters = [
  { slug: "syan-yun", name: "Сянь Юнь", image: "/images/mini-characters/Syan-YUn.webp", rarity: Rarity.LEGEND, element: Element.ANEMO, sticker: "Новый" },
  { slug: "ka-min", name: "Ка мин", image: "/images/mini-characters/Ka-Min.webp", rarity: Rarity.EPIC, element: Element.PYRO, sticker: "Новый" },
  { slug: "naviya", name: "Навия", image: "/images/mini-characters/Naviya.webp", rarity: Rarity.LEGEND, element: Element.GEO, sticker: null },
  { slug: "shevryez", name: "Шеврёз", image: "/images/mini-characters/Shevryez.webp", rarity: Rarity.EPIC, element: Element.PYRO, sticker: null },
  { slug: "furina", name: "Фурина", image: "/images/mini-characters/Furina.webp", rarity: Rarity.LEGEND, element: Element.HYDRO, sticker: null },
  { slug: "sharlotta", name: "Шарлотта", image: "/images/mini-characters/Sharlotta.webp", rarity: Rarity.EPIC, element: Element.CRYO, sticker: null },
  { slug: "wriothesley", name: "Ризли", image: "/images/mini-characters/wriothesley.webp", rarity: Rarity.LEGEND, element: Element.CRYO, sticker: null },
  { slug: "neuvillette", name: "Нёвиллет", image: "/images/mini-characters/neuvillette.webp", rarity: Rarity.LEGEND, element: Element.HYDRO, sticker: null },
  { slug: "lini", name: "Лини", image: "/images/mini-characters/Lini.webp", rarity: Rarity.LEGEND, element: Element.PYRO, sticker: null },
  { slug: "fremine", name: "Фремине", image: "/images/mini-characters/Fremine.webp", rarity: Rarity.EPIC, element: Element.CRYO, sticker: null },
  { slug: "linett", name: "Линетт", image: "/images/mini-characters/Linett.webp", rarity: Rarity.EPIC, element: Element.ANEMO, sticker: null },
  { slug: "kirara", name: "Кирара", image: "/images/mini-characters/Kirara.webp", rarity: Rarity.EPIC, element: Element.DENDRO, sticker: null },
  { slug: "bay-chzhu", name: "Бай Чжу", image: "/images/mini-characters/Bay-CHzhu.webp", rarity: Rarity.LEGEND, element: Element.DENDRO, sticker: null },
  { slug: "kavekh", name: "Кавех", image: "/images/mini-characters/Kavekh.webp", rarity: Rarity.EPIC, element: Element.DENDRO, sticker: null },
  { slug: "mika", name: "Мика", image: "/images/mini-characters/Mika.webp", rarity: Rarity.EPIC, element: Element.CRYO, sticker: null },
  { slug: "dehya", name: "Дэхья", image: "/images/mini-characters/Dehya.webp", rarity: Rarity.LEGEND, element: Element.PYRO, sticker: null },
  { slug: "al-khaytam", name: "Аль-Хайтам", image: "/images/mini-characters/Al_KHaytam.webp", rarity: Rarity.LEGEND, element: Element.DENDRO, sticker: null },
  { slug: "yao-yao", name: "Яо Яо", image: "/images/mini-characters/YAo_YAo.webp", rarity: Rarity.EPIC, element: Element.DENDRO, sticker: null },
  { slug: "strannik", name: "Странник", image: "/images/mini-characters/Strannik.webp", rarity: Rarity.LEGEND, element: Element.ANEMO, sticker: null },
  { slug: "faruzan", name: "Фарузан", image: "/images/mini-characters/Faruzan.webp", rarity: Rarity.EPIC, element: Element.ANEMO, sticker: null },
  { slug: "layla", name: "Лайла", image: "/images/mini-characters/layla.webp", rarity: Rarity.EPIC, element: Element.CRYO, sticker: null },
  { slug: "nahida", name: "Нахида", image: "/images/mini-characters/nahida.webp", rarity: Rarity.LEGEND, element: Element.DENDRO, sticker: null },
  { slug: "nilou", name: "Нилу", image: "/images/mini-characters/Nilou.webp", rarity: Rarity.LEGEND, element: Element.HYDRO, sticker: null },
  { slug: "cyno", name: "Сайно", image: "/images/mini-characters/Cyno.webp", rarity: Rarity.LEGEND, element: Element.ELECTRO, sticker: null },
  { slug: "candace", name: "Кандакия", image: "/images/mini-characters/Candace.webp", rarity: Rarity.EPIC, element: Element.HYDRO, sticker: null },
  { slug: "dori", name: "Дори", image: "/images/mini-characters/Dori.webp", rarity: Rarity.EPIC, element: Element.ELECTRO, sticker: null },
  { slug: "tighnari", name: "Тигнари", image: "/images/mini-characters/tighnari.webp", rarity: Rarity.LEGEND, element: Element.DENDRO, sticker: null },
  { slug: "collei", name: "Коллеи", image: "/images/mini-characters/Collei.webp", rarity: Rarity.EPIC, element: Element.DENDRO, sticker: null },
  { slug: "heizou", name: "Хэйдзо", image: "/images/mini-characters/Heizou.png", rarity: Rarity.EPIC, element: Element.ANEMO, sticker: null },
  { slug: "kuki", name: "Синобу", image: "/images/mini-characters/kuki.webp", rarity: Rarity.EPIC, element: Element.ELECTRO, sticker: null },
  { slug: "yelan", name: "Е Лань", image: "/images/mini-characters/yelan.webp", rarity: Rarity.LEGEND, element: Element.HYDRO, sticker: null },
  { slug: "ayato", name: "Аято", image: "/images/mini-characters/ayato.png", rarity: Rarity.LEGEND, element: Element.HYDRO, sticker: null },
  { slug: "yae-miko", name: "Яэ Мико", image: "/images/mini-characters/YAe-Miko.png", rarity: Rarity.LEGEND, element: Element.ELECTRO, sticker: null },
  { slug: "shen-khe", name: "Шэнь Хэ", image: "/images/mini-characters/SHen-KHe.png", rarity: Rarity.LEGEND, element: Element.CRYO, sticker: null },
  { slug: "yun-tszin", name: "Юнь Цзинь", image: "/images/mini-characters/YUn-TSzin.png", rarity: Rarity.EPIC, element: Element.GEO, sticker: null },
  { slug: "itto", name: "Итто", image: "/images/mini-characters/itto.webp", rarity: Rarity.LEGEND, element: Element.GEO, sticker: null },
  { slug: "gorou", name: "Горо", image: "/images/mini-characters/gorou.webp", rarity: Rarity.EPIC, element: Element.GEO, sticker: null },
  { slug: "thoma", name: "Тома", image: "/images/mini-characters/thoma.webp", rarity: Rarity.EPIC, element: Element.PYRO, sticker: null },
  { slug: "kokomi", name: "Кокоми", image: "/images/mini-characters/kokomi.webp", rarity: Rarity.LEGEND, element: Element.HYDRO, sticker: null },
  { slug: "shougun", name: "Райдэн", image: "/images/mini-characters/shougun.webp", rarity: Rarity.LEGEND, element: Element.ELECTRO, sticker: null },
  { slug: "aloy", name: "Элой", image: "/images/mini-characters/aloy.webp", rarity: Rarity.LEGEND, element: Element.CRYO, sticker: null },
  { slug: "sara", name: "Сара", image: "/images/mini-characters/sara.webp", rarity: Rarity.EPIC, element: Element.ELECTRO, sticker: null },
  { slug: "yoimiya", name: "Ёимия", image: "/images/mini-characters/yoimiya.webp", rarity: Rarity.LEGEND, element: Element.PYRO, sticker: null },
  { slug: "sayu", name: "Саю", image: "/images/mini-characters/sayu.webp", rarity: Rarity.EPIC, element: Element.ANEMO, sticker: null },
  { slug: "ayaka", name: "Аяка", image: "/images/mini-characters/ayaka.webp", rarity: Rarity.LEGEND, element: Element.CRYO, sticker: null },
  { slug: "kazuha", name: "Кадзуха", image: "/images/mini-characters/kazuha.webp", rarity: Rarity.LEGEND, element: Element.ANEMO, sticker: null },
  { slug: "eula", name: "Эола", image: "/images/mini-characters/eula.webp", rarity: Rarity.LEGEND, element: Element.CRYO, sticker: null },
  { slug: "feiyan", name: "Янь Фэй", image: "/images/mini-characters/feiyan.webp", rarity: Rarity.EPIC, element: Element.PYRO, sticker: null },
  { slug: "rosaria", name: "Розария", image: "/images/mini-characters/rosaria.webp", rarity: Rarity.EPIC, element: Element.CRYO, sticker: null },
  { slug: "hutao", name: "Ху Тао", image: "/images/mini-characters/hutao.webp", rarity: Rarity.LEGEND, element: Element.PYRO, sticker: null },
  { slug: "xiao", name: "Сяо", image: "/images/mini-characters/xiao.webp", rarity: Rarity.LEGEND, element: Element.ANEMO, sticker: null },
  { slug: "ganyu", name: "Гань Юй", image: "/images/mini-characters/ganyu.webp", rarity: Rarity.LEGEND, element: Element.CRYO, sticker: null },
  { slug: "albedo", name: "Альбедо", image: "/images/mini-characters/albedo.webp", rarity: Rarity.LEGEND, element: Element.GEO, sticker: null },
  { slug: "zhongli", name: "Чжун Ли", image: "/images/mini-characters/zhongli.webp", rarity: Rarity.LEGEND, element: Element.GEO, sticker: null },
  { slug: "xinyan", name: "Синь Янь", image: "/images/mini-characters/xinyan.webp", rarity: Rarity.EPIC, element: Element.PYRO, sticker: null },
  { slug: "tartaglia", name: "Тарталья", image: "/images/mini-characters/tartaglia.webp", rarity: Rarity.LEGEND, element: Element.HYDRO, sticker: null },
  { slug: "diona", name: "Диона", image: "/images/mini-characters/diona.webp", rarity: Rarity.EPIC, element: Element.CRYO, sticker: null },
  { slug: "klee", name: "Кли", image: "/images/mini-characters/klee.webp", rarity: Rarity.LEGEND, element: Element.PYRO, sticker: null },
  { slug: "venti", name: "Венти", image: "/images/mini-characters/venti.webp", rarity: Rarity.LEGEND, element: Element.ANEMO, sticker: null },
  { slug: "qiqi", name: "Ци Ци", image: "/images/mini-characters/qiqi.webp", rarity: Rarity.LEGEND, element: Element.CRYO, sticker: null },
  { slug: "mona", name: "Мона", image: "/images/mini-characters/mona.webp", rarity: Rarity.LEGEND, element: Element.HYDRO, sticker: null },
  { slug: "keqing", name: "Кэ Цин", image: "/images/mini-characters/keqing.webp", rarity: Rarity.LEGEND, element: Element.ELECTRO, sticker: null },
  { slug: "diluc", name: "Дилюк", image: "/images/mini-characters/diluc.webp", rarity: Rarity.LEGEND, element: Element.PYRO, sticker: null },
  { slug: "jean", name: "Джинн", image: "/images/mini-characters/jean.webp", rarity: Rarity.LEGEND, element: Element.ANEMO, sticker: null },
  { slug: "amber", name: "Эмбер", image: "/images/mini-characters/amber.webp", rarity: Rarity.EPIC, element: Element.PYRO, sticker: null },
  { slug: "chongyun", name: "Чун Юнь", image: "/images/mini-characters/chongyun.webp", rarity: Rarity.EPIC, element: Element.CRYO, sticker: null },
  { slug: "fischl", name: "Фишль", image: "/images/mini-characters/fischl.webp", rarity: Rarity.EPIC, element: Element.ELECTRO, sticker: null },
  { slug: "xiangling", name: "Сян Лин", image: "/images/mini-characters/xiangling.webp", rarity: Rarity.EPIC, element: Element.PYRO, sticker: null },
  { slug: "xingqiu", name: "Син Цю", image: "/images/mini-characters/xingqiu.webp", rarity: Rarity.EPIC, element: Element.HYDRO, sticker: null },
  { slug: "sucrose", name: "Сахароза", image: "/images/mini-characters/sucrose.webp", rarity: Rarity.EPIC, element: Element.ANEMO, sticker: null },
  { slug: "razor", name: "Рэйзор", image: "/images/mini-characters/razor.webp", rarity: Rarity.EPIC, element: Element.ELECTRO, sticker: null },
  { slug: "noelle", name: "Ноэлль", image: "/images/mini-characters/noelle.webp", rarity: Rarity.EPIC, element: Element.GEO, sticker: null },
  { slug: "ningguang", name: "Нин Гуан", image: "/images/mini-characters/ningguang.webp", rarity: Rarity.EPIC, element: Element.GEO, sticker: null },
  { slug: "lisa", name: "Лиза", image: "/images/mini-characters/lisa.webp", rarity: Rarity.EPIC, element: Element.ELECTRO, sticker: null },
  { slug: "kaeya", name: "Кэйа", image: "/images/mini-characters/kaeya.webp", rarity: Rarity.EPIC, element: Element.CRYO, sticker: null },
  { slug: "baidou", name: "Бэй Доу", image: "/images/mini-characters/baidou.webp", rarity: Rarity.EPIC, element: Element.ELECTRO, sticker: null },
  { slug: "bennett", name: "Беннет", image: "/images/mini-characters/bennett.webp", rarity: Rarity.EPIC, element: Element.PYRO, sticker: null },
  { slug: "barbara", name: "Барбара", image: "/images/mini-characters/barbara.webp", rarity: Rarity.EPIC, element: Element.HYDRO, sticker: null },
];

async function main() {
  for (const [index, c] of characters.entries()) {
    await prisma.character.upsert({
      where: { slug: c.slug },
      update: {},
      create: {
        slug: c.slug,
        name: c.name,
        image: c.image,
        rarity: c.rarity,
        element: c.element,
        sticker: c.sticker,
        shortDesc: `Гайд на ${c.name} — билды, таланты и материалы для прокачки.`,
        contentHtml: `<h2>О персонаже</h2><p>Гайд на ${c.name} находится в разработке. Заполните эту страницу через админ-панель.</p>`,
        order: index,
      },
    });
  }

  const existingAdmin = await prisma.adminUser.findUnique({ where: { userName: "admin" } });
  if (!existingAdmin) {
    const bcrypt = await import("bcrypt");
    const hashed = await bcrypt.hash("changeme123", 10);
    await prisma.adminUser.create({
      data: { userName: "admin", password: hashed, role: "ADMIN" },
    });
    console.log("Создан admin / changeme123 — обязательно смените пароль после первого входа.");
  }

  console.log(`Загружено персонажей: ${characters.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
