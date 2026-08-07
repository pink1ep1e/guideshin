"use client";

import { trackEvent } from "@/components/AnalyticsProvider";
import { TelegramIcon } from "@/components/TelegramLink";
import {
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

function ShieldGlow() {
  return (
    <div className="pnk-vpn-glow" aria-hidden>
      <span className="pnk-vpn-glow__ring" />
      <span className="pnk-vpn-glow__pulse" />
    </div>
  );
}

export function PnkVpnPromo() {
  const boostyHref = PNK_VPN_BOOSTY.trim();
  const hasBoosty = Boolean(boostyHref);

  return (
    <aside className="pnk-vpn panel overflow-hidden">
      <div className="pnk-vpn__hero relative px-5 pb-6 pt-7 text-center">
        <div className="pnk-vpn__grid" aria-hidden />
        <div className="pnk-vpn__vignette" aria-hidden />

        <div className="relative z-[1] mx-auto flex w-fit flex-col items-center">
          <ShieldGlow />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={PNK_VPN_LOGO}
            alt="PNK VPN"
            className="pnk-vpn__logo relative z-[1] h-[78px] w-auto object-contain"
          />
        </div>

        <p className="pnk-vpn__eyebrow relative z-[1] mt-4">VPN · Guideshin</p>
        <h2 className="relative z-[1] mt-1 font-genshin text-[1.35rem] tracking-wide text-white">
          PNK VPN
        </h2>
        <p className="relative z-[1] mx-auto mt-2 max-w-[15.5rem] text-[13px] font-medium leading-snug text-white/65">
          Любимые ресурсы ждут. Анонимность в яркой упаковке.
        </p>
      </div>

      <div className="grid gap-2.5 border-t border-black/[0.04] bg-gradient-to-b from-[#f7fafb] to-white p-4">
        <a
          href={PNK_VPN_BOT}
          target="_blank"
          rel="noopener noreferrer"
          className="pnk-vpn__connect group"
          onClick={() =>
            trackEvent("outbound", {
              meta: { placement: "sidebar_pnk_vpn", href: PNK_VPN_BOT, label: "connect" },
            })
          }
        >
          <span className="pnk-vpn__connect-shine" aria-hidden />
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-[18px] w-[18px] shrink-0 transition group-hover:rotate-12"
            aria-hidden
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9.5 12.5l1.8 1.8 3.7-3.8" />
          </svg>
          Подключить
        </a>

        <div className="grid grid-cols-2 gap-2">
          {hasBoosty ? (
            <a
              href={boostyHref}
              target="_blank"
              rel="noopener noreferrer"
              className="pnk-vpn__side pnk-vpn__side--boosty"
              onClick={() =>
                trackEvent("outbound", {
                  meta: {
                    placement: "sidebar_pnk_vpn",
                    href: boostyHref,
                    label: "boosty",
                  },
                })
              }
            >
              <BoostyIcon className="h-4 w-4 shrink-0" />
              Boosty
            </a>
          ) : (
            <span
              className="pnk-vpn__side pnk-vpn__side--muted"
              title="Скоро"
              aria-disabled="true"
            >
              <BoostyIcon className="h-4 w-4 shrink-0 opacity-70" />
              <span className="flex flex-col items-start leading-none">
                <span>Boosty</span>
                <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                  скоро
                </span>
              </span>
            </span>
          )}

          <a
            href={SITE_TELEGRAM}
            target="_blank"
            rel="noopener noreferrer"
            className="pnk-vpn__side pnk-vpn__side--tg"
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
      </div>
    </aside>
  );
}
