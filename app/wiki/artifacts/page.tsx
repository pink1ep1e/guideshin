import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import ArtifactCatalog, { type ArtifactItem } from "@/components/ArtifactCatalog";
import { HOME_ASSETS } from "@/lib/home-content";
import { RARITY_STARS } from "@/lib/genshin";
import { SITE_NAME } from "@/lib/site";
import { withPrisma } from "@/prisma/prisma-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: `Артефакты | ${SITE_NAME}` },
  description:
    "Сеты артефактов Genshin Impact — гайды, бонусы и рекомендации по ролям.",
  alternates: { canonical: "/wiki/artifacts" },
  keywords: ["артефакты Genshin", "сеты артефактов", "гайды артефактов", "Guideshin"],
};

export const dynamic = "force-dynamic";

export default async function ArtifactsPage() {
  const dbItems = await withPrisma((prisma) =>
    prisma.artifact.findMany({
      where: { published: true },
      orderBy: [{ rarity: "desc" }, { name: "asc" }],
      select: {
        slug: true,
        name: true,
        image: true,
        rarity: true,
        region: true,
        shortDesc: true,
      },
    }),
  );

  const artifacts: ArtifactItem[] = dbItems.map((a) => ({
    name: a.name,
    img: a.image,
    href: `/wiki/artifacts/${a.slug}`,
    rarity: (RARITY_STARS[a.rarity] ?? 5) >= 5 ? 5 : 4,
    region: a.region,
    lore: a.shortDesc,
  }));

  return (
    <div className="pb-8">
      <section className="container-page pt-7 sm:pt-9">
        <div className="glass-panel relative overflow-hidden p-6 sm:p-8 lg:p-10">
          <div className="absolute inset-0 opacity-[0.18] dark:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={HOME_ASSETS.featureWide}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-white via-white/95 to-white/70 dark:from-[hsl(var(--card))] dark:via-[hsl(var(--card)/0.96)] dark:to-[hsl(var(--card)/0.85)]" />
          <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#189b8e] to-[#67d5cc]" />

          <div className="relative max-w-2xl">
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.1em] text-[#189b8e]">
              Экипировка
            </p>
            <h1 className="font-genshin text-4xl tracking-wide text-foreground sm:text-5xl">
              Артефакты
            </h1>
            <p className="mt-3 text-base font-medium leading-relaxed text-muted-foreground sm:text-lg">
              Сеты и рекомендации по ролям. Найдите нужный комплект по названию или редкости.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/wiki/characters" className="ui-btn-secondary">
                Персонажи
              </Link>
              <Link href="/wiki/weapons" className="ui-btn-primary">
                Оружие
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page mt-8">
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-8">
            <ArtifactCatalog artifacts={artifacts} />

            <div className="glass-panel relative overflow-hidden p-6 sm:p-8">
              <div className="relative space-y-6">
                <div>
                  <p className="mb-1 text-sm font-bold uppercase tracking-[0.08em] text-[#189b8e]">
                    Справка
                  </p>
                  <h2 className="section-title mb-3">Характеристики артефактов</h2>
                  <div className="space-y-3 text-base font-medium leading-relaxed text-muted-foreground">
                    <p>
                      У каждого артефакта есть основная характеристика, которую нельзя изменить. Именно
                      она увеличивается при улучшении и зависит от слота.
                    </p>
                    <p>
                      Помимо основной есть дополнительные. У 4★ и 5★ уже есть от 3 до 4 доп.
                      характеристик, и каждые 4 уровня добавляется новая или усиливается одна из
                      имеющихся.
                    </p>
                  </div>
                </div>

                <div>
                  <h2 className="section-title mb-3 text-[22px] sm:text-2xl">
                    Рекомендации по ролям
                  </h2>
                  <div className="space-y-3 text-base font-medium leading-relaxed text-muted-foreground">
                    <p>Для атакующих — артефакты с уроном атаки и критическим уроном.</p>
                    <p>Для хилеров и танков — HP и защита.</p>
                    <p>Для саппортов — мастерство стихий.</p>
                  </div>
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
