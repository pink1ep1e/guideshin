import Link from "next/link";
import { notFound } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { withPrisma } from "@/prisma/prisma-client";
import { RARITY_LABEL, RARITY_STARS } from "@/lib/genshin";
import { SITE_NAME } from "@/lib/site";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = await withPrisma((prisma) =>
    prisma.artifact.findUnique({ where: { slug } }),
  ).catch(() => null);
  if (!item) return { title: "Артефакт не найден" };

  const title = `Гайд на ${item.name}`;
  const fullTitle = `${title} | ${SITE_NAME}`;
  const description =
    item.shortDesc?.trim() ||
    `Гайд на сет артефактов ${item.name} в Genshin Impact: бонусы сета и кому подойдёт.`;
  const url = `/wiki/artifacts/${item.slug}`;

  return {
    title: { absolute: fullTitle },
    description,
    keywords: [`гайд ${item.name}`, item.name, "артефакты Genshin", "Genshin Impact", SITE_NAME],
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description,
      url,
      images: item.image ? [{ url: item.image, alt: item.name }] : undefined,
    },
  };
}

export const revalidate = 60;

export default async function ArtifactDetailPage({ params }: Props) {
  const { slug } = await params;
  const item = await withPrisma((prisma) =>
    prisma.artifact.findUnique({ where: { slug } }),
  ).catch(() => null);
  if (!item || !item.published) notFound();
  const stars = RARITY_STARS[item.rarity] ?? 4;

  return (
    <div className="container-page py-7 sm:py-9">
      <div className="mb-5">
        <Link href="/wiki/artifacts" className="text-sm font-bold text-[#189b8e] hover:underline">
          ← Все артефакты
        </Link>
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-5">
          <section className="glass-panel relative overflow-hidden p-5 sm:p-7">
            <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#189b8e] to-[#67d5cc]" />
            <div className="flex flex-wrap items-start gap-5">
              <div
                className="relative h-[140px] w-[140px] overflow-hidden rounded-[20px] bg-cover bg-center shadow-panel"
                style={{
                  backgroundImage: `url(${stars === 5 ? "/images/legend-bg.jpg" : "/images/epic-bg.jpg"})`,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="mb-1 text-sm font-bold uppercase tracking-[0.08em] text-[#189b8e]">
                  {RARITY_LABEL[item.rarity]} сет
                </p>
                <h1 className="font-genshin text-3xl tracking-wide text-foreground">{item.name}</h1>
                {item.shortDesc && (
                  <p className="mt-2 text-base font-medium text-muted-foreground">{item.shortDesc}</p>
                )}
              </div>
            </div>
          </section>
          {item.contentHtml && (
            <section className="panel p-6 sm:p-7">
              <div
                className="guide-html"
                dangerouslySetInnerHTML={{ __html: item.contentHtml }}
              />
            </section>
          )}
        </div>
        <Sidebar />
      </div>
    </div>
  );
}
