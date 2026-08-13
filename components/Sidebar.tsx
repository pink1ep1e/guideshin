import PromoCodesList from "@/components/PromoCodesList";
import { PnkVpnPromo } from "@/components/PnkVpnPromo";
import { HOME_ASSETS } from "@/lib/home-content";
import { loadDailyTip, loadPromoCodes } from "@/lib/home-data";

export default async function Sidebar() {
  const [promos, tip] = await Promise.all([loadPromoCodes(), loadDailyTip()]);

  return (
    <div className="space-y-5">
      <PnkVpnPromo />

      <aside id="promos" className="panel p-5">
        <h2 className="font-display mb-1 text-xl font-bold text-foreground">Промокоды</h2>
        <p className="mb-4 text-sm font-medium text-muted-foreground">
          Нажмите на иконку, чтобы скопировать. Проверьте актуальность в игре.
        </p>
        <PromoCodesList promos={promos} />
      </aside>

      <aside className="relative overflow-hidden rounded-3xl bg-navy p-5 pr-28 text-white">
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
