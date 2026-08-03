import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { HOME_ASSETS } from "@/lib/home-content";
import PromoCodesList from "@/components/PromoCodesList";
import { TelegramLink } from "@/components/TelegramLink";
import { loadDailyTip, loadPromoCodes } from "@/lib/home-data";

const links = [
  { label: "Список промокодов", href: "#promos" },
  { label: "Интерактивная карта", href: "/map" },
  { label: "Предметы и материалы", href: "/wiki/materials" },
  { label: "Тир лист персонажей", href: "/wiki/characters" },
  { label: "Тир лист оружия", href: "/wiki/weapons" },
  { label: "Тир лист артефактов", href: "/wiki/artifacts" },
];

export default async function Sidebar() {
  const [promos, tip] = await Promise.all([loadPromoCodes(), loadDailyTip()]);

  return (
    <div className="space-y-5">
      <aside className="panel overflow-hidden">
        <div className="relative h-[150px] overflow-hidden bg-navy">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={HOME_ASSETS.sidebarBanner}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/90 to-transparent" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={HOME_ASSETS.mascot}
            alt=""
            className="absolute bottom-0 right-2 h-[130px] w-auto object-contain drop-shadow-lg"
          />
          <p className="absolute bottom-3 left-4 font-genshin text-lg tracking-wide text-white">
            Навигация
          </p>
        </div>
        <div className="p-5">
          <TelegramLink
            placement="sidebar"
            className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#229ED9] px-3.5 py-3 text-[15px] font-bold text-white shadow-sm transition hover:bg-[#1b8bc0]"
          />
          <div className="grid gap-1.5">
            {links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="group flex items-center justify-between rounded-xl bg-[#189b8e]/[0.08] px-3.5 py-3.5 text-[15px] font-semibold text-foreground transition hover:bg-[#189b8e]/15 hover:text-[#189b8e]"
              >
                <span>{link.label}</span>
                <ChevronDown className="h-4 w-4 -rotate-90 text-[#189b8e] transition group-hover:rotate-90" />
              </Link>
            ))}
          </div>
        </div>
      </aside>

      <aside id="promos" className="panel p-5">
        <h2 className="font-display mb-1 text-xl font-bold text-foreground">Промокоды</h2>
        <p className="mb-4 text-sm font-medium text-muted-foreground">
          Нажмите на иконку, чтобы скопировать. Проверьте актуальность в игре.
        </p>
        <PromoCodesList promos={promos} />
      </aside>

      <aside className="relative overflow-hidden rounded-3xl bg-navy p-5 pr-28 text-white shadow-soft">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={HOME_ASSETS.mascotAlt}
          alt=""
          className="absolute -bottom-2 -right-2 h-28 w-auto object-contain opacity-95"
        />
        <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#67d5cc]">Совет дня</p>
        <p className="font-genshin mt-2 text-lg tracking-wide">{tip.title}</p>
        <p className="mt-2 text-sm font-medium text-white/75">{tip.body}</p>
      </aside>
    </div>
  );
}
