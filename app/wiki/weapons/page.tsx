import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import WeaponCatalog from "@/components/WeaponCatalog";
import { withPrisma } from "@/prisma/prisma-client";
import { HOME_ASSETS } from "@/lib/home-content";
import { SITE_NAME } from "@/lib/site";
import { parseWeaponGuide, weaponHoverFromGuide } from "@/lib/wiki-guide-data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: `Оружие | ${SITE_NAME}` },
  description: "Оружие Genshin Impact — гайды, редкость, типы и материалы возвышения.",
  alternates: { canonical: "/wiki/weapons" },
};

export const dynamic = "force-dynamic";

export default async function WeaponsCatalogPage() {
  const weaponsRaw = await withPrisma((prisma) =>
    prisma.weapon.findMany({
      where: { published: true },
      orderBy: [{ rarity: "desc" }, { name: "asc" }],
      select: {
        id: true,
        slug: true,
        name: true,
        image: true,
        rarity: true,
        weaponType: true,
        shortDesc: true,
        guideData: true,
      },
    }),
  );

  const weapons = weaponsRaw.map((w) => ({
    id: w.id,
    slug: w.slug,
    name: w.name,
    image: w.image,
    rarity: w.rarity,
    weaponType: w.weaponType,
    lore: w.shortDesc,
    weaponMeta: weaponHoverFromGuide(w.weaponType, parseWeaponGuide(w.guideData)),
  }));

  return (
    <div className="pb-8">
      <section className="container-page pt-7 sm:pt-9">
        <div className="glass-panel relative overflow-hidden p-6 sm:p-8 lg:p-10">
          <div className="absolute inset-0 opacity-[0.18]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={HOME_ASSETS.featureWide} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-white via-white/95 to-white/70" />
          <span className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-[#189b8e]/12 blur-2xl" />
          <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#189b8e] to-[#67d5cc]" />

          <div className="relative max-w-2xl">
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.1em] text-[#189b8e]">
              Экипировка
            </p>
            <h1 className="font-genshin text-4xl tracking-wide text-foreground sm:text-5xl">
              Оружие
            </h1>
            <p className="mt-3 text-base font-medium leading-relaxed text-muted-foreground sm:text-lg">
              Гайды и рекомендации. Найдите оружие по названию, редкости или типу.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/wiki/artifacts" className="ui-btn-secondary">
                Артефакты
              </Link>
              <Link href="/wiki/characters" className="ui-btn-primary">
                Персонажи
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page mt-8">
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <WeaponCatalog weapons={weapons} />
          <Sidebar />
        </div>
      </section>
    </div>
  );
}
