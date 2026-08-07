"use client";

import { ArrowUpRight } from "lucide-react";
import { trackEvent } from "@/components/AnalyticsProvider";
import { TelegramIcon } from "@/components/TelegramLink";
import {
  PNK_VPN_BOOSTY,
  PNK_VPN_BOT,
  PNK_VPN_LOGO,
  SITE_TELEGRAM,
} from "@/lib/site";

export function PnkVpnPromo() {
  return (
    <aside className="overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-black/[0.04]">
      <div className="p-5">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="font-genshin text-[1.25rem] tracking-wide text-foreground">
              PNK VPN
            </h2>
            <p className="mt-1.5 text-[13px] font-medium leading-snug text-muted-foreground">
              Любимые ресурсы ждут.
              <br />
              Анонимность в яркой упаковке.
            </p>
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={PNK_VPN_LOGO}
            alt="PNK VPN"
            className="h-[72px] w-auto shrink-0 object-contain invert"
          />
        </div>

        <a
          href={PNK_VPN_BOT}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#189b8e]/[0.1] px-3.5 py-3 text-[14px] font-bold text-[#189b8e] transition hover:bg-[#189b8e]/18"
          onClick={() =>
            trackEvent("outbound", {
              meta: {
                placement: "sidebar_pnk_vpn",
                href: PNK_VPN_BOT,
                label: "connect",
              },
            })
          }
        >
          Подключить
          <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>

      <div className="grid gap-2 border-t border-black/[0.04] px-4 pb-4 pt-3">
        <a
          href={PNK_VPN_BOOSTY}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center rounded-xl bg-[#f15a29]/[0.12] px-3.5 py-3 transition hover:bg-[#f15a29]/20"
          onClick={() =>
            trackEvent("outbound", {
              meta: {
                placement: "sidebar_pnk_vpn",
                href: PNK_VPN_BOOSTY,
                label: "boosty",
              },
            })
          }
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/boosty-founder-light.svg"
            alt="Boosty"
            className="h-7 w-auto"
          />
        </a>

        <a
          href={SITE_TELEGRAM}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#189b8e]/[0.1] px-3.5 py-3 text-[14px] font-bold text-[#189b8e] transition hover:bg-[#189b8e]/18"
          onClick={() =>
            trackEvent("telegram_click", {
              meta: { placement: "sidebar_pnk_vpn", href: SITE_TELEGRAM },
            })
          }
        >
          <TelegramIcon className="h-4 w-4 shrink-0" />
          Telegram
        </a>
      </div>
    </aside>
  );
}
