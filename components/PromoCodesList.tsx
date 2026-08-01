"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import type { HomePromo } from "@/lib/home-data";

function formatExpiry(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const expired = d.getTime() < Date.now();
  const label = d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return { label, expired };
}

export default function PromoCodesList({ promos }: { promos: HomePromo[] }) {
  const [copied, setCopied] = useState<string | null>(null);

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      /* ignore */
    }
  }

  if (promos.length === 0) {
    return (
      <p className="text-sm font-medium text-muted-foreground">
        Активных промокодов пока нет.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {promos.map((promo) => {
        const exp = formatExpiry(promo.expiresAt);
        return (
          <div
            key={promo.code}
            className="flex items-center justify-between gap-3 rounded-xl border border-black/[0.06] bg-[#189b8e]/[0.06] px-3.5 py-3"
          >
            <div className="min-w-0">
              <p className="font-display text-sm font-bold tracking-wide text-foreground">
                {promo.code}
              </p>
              <p className="text-xs font-medium text-muted-foreground">{promo.reward}</p>
              {exp && (
                <p
                  className={`mt-0.5 text-[11px] font-semibold ${
                    exp.expired ? "text-destructive" : "text-[#189b8e]"
                  }`}
                >
                  {exp.expired ? "Истёк" : "До"} {exp.label}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => void copyCode(promo.code)}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#189b8e]/15 text-[#189b8e] transition hover:bg-[#189b8e] hover:text-white"
              aria-label={`Копировать ${promo.code}`}
              title="Копировать"
            >
              {copied === promo.code ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
