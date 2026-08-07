"use client";

import { ArrowUpRight } from "lucide-react";
import { trackEvent } from "@/components/AnalyticsProvider";
import { TelegramIcon } from "@/components/TelegramLink";
import {
  PNK_VPN_BG,
  PNK_VPN_BOOSTY,
  PNK_VPN_BOT,
  PNK_VPN_LOGO,
  SITE_TELEGRAM,
} from "@/lib/site";

function BoostyIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M4.8 3.2c-.55 0-1 .45-1 1v15.6c0 .55.45 1 1 1h4.35c.4 0 .76-.24.92-.61l1.55-3.64h3.02l2.95 4.1c.2.28.52.45.86.45H19.2c.55 0 1-.45 1-1V4.2c0-.55-.45-1-1-1H4.8zm2.2 2.5h4.85c1.85 0 3.2 1.2 3.2 2.95 0 1.15-.65 2.1-1.7 2.55 1.35.4 2.25 1.5 2.25 2.95 0 2.05-1.55 3.35-3.85 3.35H7V5.7zm2.55 2.15v2.45h2.15c.85 0 1.35-.45 1.35-1.2s-.5-1.25-1.35-1.25H9.55zm0 4.55v2.7h2.45c1 0 1.6-.5 1.6-1.35s-.6-1.35-1.6-1.35H9.55z" />
    </svg>
  );
}

export function PnkVpnPromo() {
  return (
    <aside className="overflow-hidden rounded-3xl shadow-soft">
      <div className="relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={PNK_VPN_BG}
          alt=""
          className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl"
          aria-hidden
        />
        <div className="absolute inset-0 bg-black/55" aria-hidden />

        <div className="relative z-[1] p-5">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="font-genshin text-[1.25rem] tracking-wide text-white">
                PNK VPN
              </h2>
              <p className="mt-1.5 text-[13px] font-medium leading-snug text-white/65">
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
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#189b8e]/[0.18] px-3.5 py-3 text-[14px] font-bold text-[#67d5cc] transition hover:bg-[#189b8e]/30"
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
      </div>

      <div className="grid gap-2 bg-white p-4">
        <a
          href={PNK_VPN_BOOSTY}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#f15a29]/[0.12] px-3.5 py-3 text-[14px] font-bold text-[#d14a1f] transition hover:bg-[#f15a29]/20"
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
          <BoostyIcon className="h-4 w-4 shrink-0" />
          Boosty
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
