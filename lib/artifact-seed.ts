import type { Rarity } from "@prisma/client";

export type ArtifactSeedItem = {
  name: string;
  img: string;
  slug: string;
  rarity: 4 | 5;
  region: string;
};

/** Каталог артефактов для сида в БД (иконки в /images/mini-artifacts/). */
export const ARTIFACT_SEED: ArtifactSeedItem[] = [
  { name: "Охотник Сумеречного двора", img: "Okhota-na-ten.webp", slug: "ohotnik-sum", rarity: 5, region: "Фонтейн" },
  { name: "Золотая труппа", img: "Zolotaya-truppa.webp", slug: "zolotaya-truppa", rarity: 5, region: "Фонтейн" },
  { name: "Сияние Вурукаши", img: "Siyanie-sladkoy-rosy.webp", slug: "sianie-varukashi", rarity: 5, region: "Сумеру" },
  { name: "Сон нимфы", img: "Son-nimfy.webp", slug: "son-nimfi", rarity: 5, region: "Фонтейн" },
  { name: "Цветок потерянного рая", img: "TSvetok-poteryannogo-raya.webp", slug: "tsvetok-poteranogo-raya", rarity: 5, region: "Сумеру" },
  { name: "Хроники Чертогов в пустыне", img: "KHroniki-CHertogov-v-pustyne.webp", slug: "hroniki-chertogov-pustini", rarity: 5, region: "Сумеру" },
  { name: "Позолоченные сны", img: "Pozolochennye-sny.webp", slug: "pozolochenie-sni", rarity: 5, region: "Сумеру" },
  { name: "Воспоминания дремучего леса", img: "Vospominaniya-dremuchego-lesa.webp", slug: "vospominanie-drem-lesa", rarity: 5, region: "Сумеру" },
  { name: "Киноварное загробье", img: "Kinovarnoe-zagrobe.webp", slug: "kinovarnoe-zagrobie", rarity: 5, region: "Ли Юэ" },
  { name: "Отголоски подношения", img: "Otgoloski-podnosheniya.webp", slug: "otgoloski-podnoshenia", rarity: 5, region: "Инадзума" },
  { name: "Моллюск морских красок", img: "Mollyusk-morskikh-krasok.png", slug: "molusk-morkih-krasok", rarity: 5, region: "Инадзума" },
  { name: "Кокон сладких грёз", img: "Kokon-sladkikh-gryez.png", slug: "kokon-sladkih-grez", rarity: 5, region: "Инадзума" },
  { name: "Воспоминания Симэнавы", img: "Ochishchenie-pamyati.png", slug: "vospominanie-simenavi", rarity: 5, region: "Инадзума" },
  { name: "Эмблема рассечённой судьбы", img: "Pechat-izolyatsii-_1_.png", slug: "emblema-raschetnoi-sudbi", rarity: 5, region: "Инадзума" },
  { name: "Бледный огонь", img: "Blednyy-ogon.png", slug: "blednyi-ogon", rarity: 5, region: "Другое" },
  { name: "Стойкость Миллелита", img: "Stoykost-Millelita.png", slug: "stoikost-millelita", rarity: 5, region: "Ли Юэ" },
  { name: "Сердце глубин", img: "sertse_glubin.png", slug: "serdtse-glubin", rarity: 5, region: "Мондштадт" },
  { name: "Заблудший в метели", img: "zabludshiy-v-meteli.png", slug: "zabludshi-v-meteli", rarity: 5, region: "Другое" },
  { name: "Встречная комета", img: "vstrechtaya-kometa.png", slug: "vstrechnaya-cometa", rarity: 4, region: "Другое" },
  { name: "Архаичный камень", img: "arkhaichniy-kamen.png", slug: "arhaichnyi-kamen", rarity: 5, region: "Ли Юэ" },
  { name: "Ступающий по лаве", img: "stupayshiy-po-lave.png", slug: "stupayshyi-po-lave", rarity: 5, region: "Ли Юэ" },
  { name: "Горящая алая ведьма", img: "gorashya-alaia-vedma.png", slug: "gorashaia-vedma", rarity: 5, region: "Мондштадт" },
  { name: "Усмиряющий гром", img: "usmirayshiy-grom.png", slug: "usmirayshiy-grom", rarity: 5, region: "Инадзума" },
  { name: "Громогласный рёв ярости", img: "gromoglasniy-rev-uarosti.png", slug: "gremoglasniy-grom-uarosti", rarity: 5, region: "Инадзума" },
  { name: "Изумрудная тень", img: "izumrudnaya-ten.png", slug: "izumrudnaya-ten", rarity: 5, region: "Мондштадт" },
  { name: "Конец гладиатора", img: "konets-gladiatora.png", slug: "konets-gladiatora", rarity: 5, region: "Другое" },
  { name: "Странствующий ансамбль", img: "stranstvuyushiy-ansambl.png", slug: "stranstvuyushiy-ansambl", rarity: 5, region: "Другое" },
  { name: "Церемония древней знати", img: "tseremonia-dreyney-znati.png", slug: "tseremonia-drevney-znati", rarity: 5, region: "Мондштадт" },
  { name: "Возлюбленные юные девы", img: "vozlublennaya-unaya-deva.png", slug: "vozlublennye-yunye-devy", rarity: 5, region: "Мондштадт" },
  { name: "Рыцарь крови", img: "ritsar-krovi.png", slug: "ritsar-krovi", rarity: 5, region: "Мондштадт" },
  { name: "Азартный игрок", img: "azarntyi-igrok.png", slug: "azartnyi-igrok", rarity: 4, region: "Другое" },
  { name: "Берсерк", img: "berserk.png", slug: "berserk", rarity: 4, region: "Другое" },
  { name: "Воин", img: "voin.png", slug: "voin", rarity: 4, region: "Другое" },
  { name: "Воля защитника", img: "vola-zashitnika.png", slug: "volya-zashitnika", rarity: 4, region: "Другое" },
  { name: "Душа храбреца", img: "dusha-hrabretsa.png", slug: "dusha-hrabretsa", rarity: 4, region: "Другое" },
  { name: "Изгнанник", img: "izgnannik.png", slug: "izgnannik", rarity: 4, region: "Другое" },
  { name: "Инструктор", img: "instruktor.png", slug: "instruktor", rarity: 4, region: "Другое" },
  { name: "Маленькое чудо", img: "malenkoe-chudo.png", slug: "malenkoe-chudo", rarity: 4, region: "Другое" },
  { name: "Решимость временщика", img: "reshimost-vremenshika.png", slug: "reshimost-vremenshika", rarity: 4, region: "Другое" },
  { name: "Учёный", img: "ucheniy.png", slug: "ucheniy", rarity: 4, region: "Другое" },
  { name: "Шаман воды", img: "shaman-vodi.png", slug: "shaman-vody", rarity: 4, region: "Другое" },
  { name: "Шаман льда", img: "shaman-lda.png", slug: "shaman-lda", rarity: 4, region: "Другое" },
  { name: "Шаман молний", img: "shaman-molnij.png", slug: "shaman-molniy", rarity: 4, region: "Другое" },
  { name: "Шаман огня", img: "shaman-ogna.png", slug: "shaman-ognya", rarity: 4, region: "Другое" },
];

export function artifactImagePath(img: string): string {
  if (img.startsWith("/") || img.startsWith("http")) return img;
  return `/images/mini-artifacts/${img}`;
}

export function rarityStarsToEnum(stars: 4 | 5): Rarity {
  return stars >= 5 ? "LEGEND" : "EPIC";
}
