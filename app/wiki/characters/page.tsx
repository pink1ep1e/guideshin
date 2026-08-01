import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import CharacterCatalog from "@/components/CharacterCatalog";
import { withPrisma } from "@/prisma/prisma-client";
import { HOME_ASSETS } from "@/lib/home-content";
import { SITE_NAME } from "@/lib/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: `Персонажи | ${SITE_NAME}` },
  description:
    "Все персонажи Genshin Impact — гайды, билды, оружие, артефакты и материалы прокачки.",
  alternates: { canonical: "/wiki/characters" },
  keywords: ["персонажи Genshin", "гайды персонажей", "билды Genshin Impact", "Guideshin"],
};

export const dynamic = "force-dynamic";

export default async function CharactersPage() {
  const characters = await withPrisma((prisma) =>
    prisma.character.findMany({
      where: { published: true },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      select: {
        slug: true,
        name: true,
        image: true,
        rarity: true,
        element: true,
        region: true,
        sticker: true,
      },
    }),
  ).catch(() => []);

  return (
    <div className="pb-8">
      <section className="container-page pt-7 sm:pt-9">
        <div className="glass-panel relative overflow-hidden p-6 sm:p-8 lg:p-10">
          <div className="absolute inset-0 opacity-[0.18]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={HOME_ASSETS.heroBg}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-white via-white/95 to-white/70" />
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
                  Справка
                </p>
                <h2 className="section-title mb-4">Как получить персонажей</h2>
                <div className="space-y-3 text-base font-medium leading-relaxed text-muted-foreground">
                  <p>
                    В игре Геншин Импакт присутствует большое количество самых разных персонажей. В
                    этом разделе вы найдете актуальный список персонажей, доступных для игры, а также
                    тех, кого уже совсем скоро добавят в игру.
                  </p>
                  <p>
                    Часть персонажей открываются по мере прохождения сюжетной линии — Кейа, Лиза,
                    Сян Лин и Эмбер. Некоторых можно получить за активности: Коллеи за Витую бездну,
                    Барбару по спец. квесту. Во время событий тоже часто раздают героев.
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
