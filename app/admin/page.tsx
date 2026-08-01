import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  Image as ImageIcon,
  Layers,
  Lightbulb,
  Package,
  Sparkles,
  Swords,
  Ticket,
  Users,
} from "lucide-react";
import { authOptions } from "@/lib/auth";
import { withPrisma } from "@/prisma/prisma-client";
import AdminSignOutButton from "@/components/admin/SignOutButton";
import { AdminNavTabs } from "@/components/admin/AdminNavTabs";

const SECTIONS = [
  {
    href: "/admin/characters",
    createHref: "/admin/characters/new",
    key: "characters" as const,
    title: "Персонажи",
    desc: "Гайды, билды и публикации",
    icon: Users,
    accent: "from-[#189b8e] to-[#0d6b62]",
  },
  {
    href: "/admin/weapons",
    createHref: "/admin/weapons/new",
    key: "weapons" as const,
    title: "Оружие",
    desc: "Характеристики и возвышения",
    icon: Swords,
    accent: "from-[#1a5f8f] to-[#0d3d5c]",
  },
  {
    href: "/admin/artifacts",
    createHref: "/admin/artifacts/new",
    key: "artifacts" as const,
    title: "Артефакты",
    desc: "Сеты и рекомендации",
    icon: Layers,
    accent: "from-[#6b4ea0] to-[#3d2a5c]",
  },
  {
    href: "/admin/materials",
    createHref: "/admin/materials/new",
    key: "materials" as const,
    title: "Материалы",
    desc: "Фарм и карта сбора",
    icon: Package,
    accent: "from-[#b07a18] to-[#7a5210]",
  },
  {
    href: "/admin/banners",
    createHref: "/admin/banners",
    key: "banners" as const,
    title: "Баннер",
    desc: "Слайды на главной",
    icon: ImageIcon,
    accent: "from-[#0b1f44] to-[#1e5fd6]",
  },
  {
    href: "/admin/promos",
    createHref: "/admin/promos",
    key: "promos" as const,
    title: "Промокоды",
    desc: "Коды и срок действия",
    icon: Ticket,
    accent: "from-[#c45c26] to-[#8a3a12]",
  },
  {
    href: "/admin/tips",
    createHref: "/admin/tips",
    key: "tips" as const,
    title: "Советы дня",
    desc: "Ротация подсказок",
    icon: Lightbulb,
    accent: "from-[#0d8f7a] to-[#1db8a0]",
  },
] as const;

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const stats = await withPrisma(async (prisma) => {
    const [
      characters,
      charactersPublished,
      weapons,
      artifacts,
      materials,
      banners,
      promos,
      tips,
    ] = await Promise.all([
      prisma.character.count(),
      prisma.character.count({ where: { published: true } }),
      prisma.weapon.count(),
      prisma.artifact.count(),
      prisma.material.count(),
      prisma.homeBannerSlide.count(),
      prisma.promoCode.count(),
      prisma.dailyTip.count(),
    ]);
    return {
      characters,
      charactersPublished,
      weapons,
      artifacts,
      materials,
      banners,
      promos,
      tips,
    };
  });

  const counts: Record<(typeof SECTIONS)[number]["key"], number> = {
    characters: stats.characters,
    weapons: stats.weapons,
    artifacts: stats.artifacts,
    materials: stats.materials,
    banners: stats.banners,
    promos: stats.promos,
    tips: stats.tips,
  };

  const drafts = Math.max(0, stats.characters - stats.charactersPublished);

  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[320px] bg-[radial-gradient(ellipse_at_top,_rgba(24,155,142,0.18),_transparent_60%),linear-gradient(180deg,_rgba(11,31,68,0.06),_transparent)]"
      />

      <div className="container-page relative py-8 pb-14">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <p className="mb-2 inline-flex items-center gap-1.5 text-sm font-bold uppercase tracking-[0.1em] text-[#189b8e]">
              <Sparkles className="h-3.5 w-3.5" />
              Панель управления
            </p>
            <h1 className="font-genshin text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Обзор
            </h1>
            <p className="mt-2 text-sm font-medium leading-relaxed text-muted-foreground sm:text-base">
              Привет, {session.user?.name ?? "администратор"}. Здесь статистика и быстрый доступ ко
              всем разделам контента.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/" className="ui-btn-secondary px-4 py-2.5 text-xs">
              На сайт
            </Link>
            <Link href="/map" className="ui-btn-secondary px-4 py-2.5 text-xs">
              Карта
            </Link>
            <AdminSignOutButton />
          </div>
        </div>

        <AdminNavTabs active="overview" />

        <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Персонажи",
              value: stats.characters,
              hint: `${stats.charactersPublished} опубл.`,
            },
            { label: "Оружие", value: stats.weapons, hint: "в каталоге" },
            { label: "Артефакты", value: stats.artifacts, hint: "сетов" },
            {
              label: "Черновики",
              value: drafts,
              hint: "персонажи без публикации",
            },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-[22px] border border-black/[0.05] bg-white/90 p-5 shadow-panel backdrop-blur-sm"
            >
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
                {card.label}
              </p>
              <p className="mt-2 font-genshin text-3xl tracking-wide text-foreground tabular-nums">
                {card.value}
              </p>
              <p className="mt-1 text-xs font-medium text-muted-foreground">{card.hint}</p>
            </div>
          ))}
        </div>

        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-genshin text-lg tracking-wide text-foreground">Разделы</h2>
          <p className="text-xs font-medium text-muted-foreground">
            {SECTIONS.length} разделов · клик — открыть список
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            const count = counts[section.key];
            return (
              <div
                key={section.key}
                className="group relative overflow-hidden rounded-[24px] border border-black/[0.05] bg-white/90 shadow-panel backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-20px_rgba(11,31,68,0.35)]"
              >
                <div
                  className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${section.accent}`}
                />
                <div className="flex h-full flex-col p-5">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <span
                      className={`inline-flex h-11 w-11 items-center justify-center rounded-[16px] bg-gradient-to-br ${section.accent} text-white shadow-sm`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="rounded-full bg-[#189b8e]/10 px-2.5 py-1 text-xs font-bold tabular-nums text-[#189b8e]">
                      {count}
                    </span>
                  </div>
                  <h3 className="font-genshin text-lg tracking-wide text-foreground">
                    {section.title}
                  </h3>
                  <p className="mt-1 flex-1 text-sm font-medium text-muted-foreground">
                    {section.desc}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link
                      href={section.href}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[14px] bg-[#189b8e] px-3 py-2.5 text-xs font-bold text-white transition hover:bg-[#207970]"
                    >
                      Открыть
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                    <Link
                      href={section.createHref}
                      className="inline-flex items-center justify-center rounded-[14px] border border-black/[0.08] bg-white px-3 py-2.5 text-xs font-bold text-[#189b8e] transition hover:bg-[#189b8e]/10"
                    >
                      + Добавить
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
