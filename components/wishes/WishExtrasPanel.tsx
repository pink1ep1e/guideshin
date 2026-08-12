"use client";

import { useMemo } from "react";
import { Bell } from "lucide-react";
import type { GachaBannerKey } from "@/lib/wishes";

type StatLike = {
  key: GachaBannerKey;
  label: string;
  pity5: number;
  pity5Max: number;
  remaining5: number;
  softPityAt: number;
  total: number;
};

type Props = {
  stats: StatLike[];
};

export default function WishExtrasPanel({ stats }: Props) {
  const alerts = useMemo(() => {
    const list: string[] = [];
    for (const s of stats) {
      if (s.pity5 >= s.softPityAt) {
        list.push(
          `${s.label}: софт гарант (сейчас ${s.pity5}/${s.pity5Max})`,
        );
      } else if (s.remaining5 <= 10 && s.total > 0) {
        list.push(
          `${s.label}: до жёсткого гаранта ${s.remaining5} круток`,
        );
      }
    }
    return list;
  }, [stats]);

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 sm:px-6">
        <div className="flex items-start gap-3">
          <Bell className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <div>
            <p className="font-bold text-amber-950">Алерты по гаранту</p>
            <ul className="mt-2 space-y-1 text-sm text-amber-900/90">
              {alerts.map((a) => (
                <li key={a}>• {a}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

/** Сохранить authkey после импорта (для будущего обновления). */
export { setSavedAuthUrl as rememberAuthUrl } from "@/lib/wish-cabinet-extras";
