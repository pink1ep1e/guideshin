"use client";

import type { ReactNode } from "react";
import { trackEvent } from "@/components/AnalyticsProvider";

export function TelegramLinkClient({
  href,
  className,
  placement,
  ariaLabel,
  children,
}: {
  href: string;
  className?: string;
  placement: string;
  ariaLabel: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      aria-label={ariaLabel}
      onClick={() => {
        trackEvent("telegram_click", {
          meta: { placement, href },
        });
      }}
    >
      {children}
    </a>
  );
}
