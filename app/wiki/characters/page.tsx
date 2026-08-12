import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import CharacterCatalog from "@/components/CharacterCatalog";
import { withPrisma } from "@/prisma/prisma-client";
import { HOME_ASSETS } from "@/lib/home-content";
import { SITE_NAME } from "@/lib/site";
import { faqPageJsonLd, serializeJsonLd } from "@/lib/seo";
import type { Metadata } from "next";

const CHARACTER_FAQS = [
  {
    question: "Как найти гайд на персонажа?",
    answer:
      "Откройте каталог персонажей и выберите героя. На странице гайда — билд, оружие, артефакты, приоритет талантов и материалы прокачки.",
  },
  {
    question: "Как выбрать билд персонажа?",
    answer:
      "На странице гайда указаны рекомендуемое оружие, сеты артефактов и приоритет талантов. Начните с основного DPS или саппорта вашей команды.",
  },
  {
    question: "Почему Guideshin?",
    answer:
      "Мы собираем актуальные гайды без воды: понятные билды, материалы и рекомендации, чтобы быстрее собрать рабочую команду.",
  },
];

export const metadata: Metadata = {
  title: { absolute: `Персонажи | ${SITE_NAME}` },
  description:
    "Все персонажи Genshin Impact — гайды, билды, оружие, артефакты и материалы прокачки.",
  alternates: { canonical: "/wiki/characters" },
  keywords: [
    "персонажи Genshin",
    "гайды персонажей",
    "гайд на персонажа",
    "билды Genshin Impact",
    "Guideshin",
  ],
};

export const dynamic = "force-dynamic";

export default async function CharactersPage() {
  const charactersRaw = await withPrisma((prisma) =>
    prisma.character.findMany({
      where: { published: true },
      orderBy: [{ rarity: "desc" }, { name: "asc" }],
      select: {
        slug: true,
        name: true,
        image: true,
        rarity: true,
        element: true,
        region: true,
        sticker: true,
        shortDesc: true,
      },
    }),
  ).catch(() => []);

  const characters = charactersRaw.map((c) => ({
    slug: c.slug,
    name: c.name,
    image: c.image,
    rarity: c.rarity,
    element: c.element,
    region: c.region,
    sticker: c.sticker,
    shortDesc: c.shortDesc,
  }));

  return (
    <div className="pb-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqPageJsonLd(CHARACTER_FAQS)) }}
      />
      <section className="container-page pt-7 sm:pt-9">
        <div className="glass-panel relative overflow-hidden p-6 sm:p-8 lg:p-10">
          <div className="absolute inset-0 opacity-[0.18] dark:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={HOME_ASSETS.heroBg}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-white via-white/95 to-white/70 dark:from-[hsl(var(--card))] dark:via-[hsl(var(--card)/0.96)] dark:to-[hsl(var(--card)/0.85)]" />
          <span className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-[#189b8e]/12 blur-2xl" />
          <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#189b8e] to-[#67d5cc]" />

          <div className="relative max-w-2xl">
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.1em] text-[#189b8e]">
              Guideshin
            </p>
            <h1 className="font-genshin text-4xl tracking-wide text-foreground sm:text-5xl">
              Персонажи
            </h1>
            <p className="mt-3 text-base font-medium leading-relaxed text-muted-foreground sm:text-lg">
              Билды, таланты и материалы для прокачки. Найдите героя по имени или стихии.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/wiki/artifacts" className="ui-btn-secondary">
                Артефакты
              </Link>
              <Link href="/wiki/weapons" className="ui-btn-secondary">
                Оружие
              </Link>
              <Link href="/" className="ui-btn-primary">
                На главную
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page mt-8">
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-8">
            {characters.length === 0 ? (
              <div className="glass-panel p-8">
                <p className="text-base font-medium text-muted-foreground">
                  Персонажи пока не добавлены. Заполните базу через админ-панель — /admin.
                </p>
              </div>
            ) : (
              <CharacterCatalog characters={characters} />
            )}

            <div className="glass-panel relative overflow-hidden p-6 sm:p-8">
              <span className="pointer-events-none absolute -bottom-12 left-1/3 h-40 w-40 rounded-full bg-[#189b8e]/10 blur-2xl" />
              <div className="relative">
                <p className="mb-1 text-sm font-bold uppercase tracking-[0.08em] text-[#189b8e]">
                  FAQ
                </p>
                <h2 className="section-title mb-4">Частые вопросы</h2>
                <div className="space-y-4">
                  {CHARACTER_FAQS.map((faq) => (
                    <div key={faq.question}>
                      <h3 className="text-base font-bold text-foreground">{faq.question}</h3>
                      <p className="mt-1 text-base font-medium leading-relaxed text-muted-foreground">
                        {faq.answer}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 space-y-3 text-base font-medium leading-relaxed text-muted-foreground">
                  <p>
                    В игре Genshin Impact много персонажей. В этом разделе — актуальный список с
                    гайдами и тех, кого скоро добавят.
                  </p>
                  <p>
                    Часть героев открывается по сюжету — Кейа, Лиза, Сян Лин и Эмбер. Других дают за
                    активности и события.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Sidebar />
        </div>
      </section>
    </div>
  );
}
