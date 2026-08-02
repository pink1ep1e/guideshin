"use client";

import { useMemo, useState } from "react";
import { Calculator } from "lucide-react";
import FancySelect from "@/components/ui/FancySelect";

/** Approximate Genshin XP book / mora costs for practical planning. */
const HERO_WIT_BY_RANGE: Record<string, number> = {
  "1-20": 6,
  "20-40": 28,
  "40-50": 29,
  "50-60": 42,
  "60-70": 59,
  "70-80": 80,
  "80-90": 171,
};

const MORA_LEVEL_BY_RANGE: Record<string, number> = {
  "1-20": 24000,
  "20-40": 116000,
  "40-50": 116000,
  "50-60": 171000,
  "60-70": 239000,
  "70-80": 322000,
  "80-90": 684000,
};

const ASCENSION_MORA = [0, 20000, 40000, 60000, 80000, 100000, 120000];

const TALENT_BOOKS = [0, 0, 3, 2, 4, 6, 9, 4, 6, 12];
const TALENT_MORA = [
  0, 0, 12500, 17500, 25000, 30000, 37500, 120000, 260000, 450000,
];

const LEVEL_OPTIONS = [1, 20, 40, 50, 60, 70, 80, 90] as const;
const TALENT_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

const CALC_ICONS = {
  heroWit: "/opit-geroya.png",
  talentBooks: "/knigi-talantov.webp",
  mora: "/mora.png",
} as const;

function sumRange(
  map: Record<string, number>,
  from: number,
  to: number,
  points: readonly number[],
) {
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (a >= from && b <= to) total += map[`${a}-${b}`] ?? 0;
  }
  return total;
}

function formatNum(n: number) {
  return n.toLocaleString("ru-RU");
}

export default function GuideCalculators({ characterName }: { characterName: string }) {
  const [fromLvl, setFromLvl] = useState("1");
  const [toLvl, setToLvl] = useState("90");
  const [fromTalent, setFromTalent] = useState("1");
  const [toTalent, setToTalent] = useState("9");

  const levelResult = useMemo(() => {
    const start = Math.min(Number(fromLvl), Number(toLvl));
    const end = Math.max(Number(fromLvl), Number(toLvl));
    if (start === end) return { books: 0, mora: 0, ascensionMora: 0 };

    const books = sumRange(HERO_WIT_BY_RANGE, start, end, LEVEL_OPTIONS);
    const mora = sumRange(MORA_LEVEL_BY_RANGE, start, end, LEVEL_OPTIONS);

    let ascensionMora = 0;
    const ascensionAt = [20, 40, 50, 60, 70, 80];
    ascensionAt.forEach((lvl, idx) => {
      if (lvl > start && lvl <= end) ascensionMora += ASCENSION_MORA[idx + 1] ?? 0;
    });

    return { books, mora, ascensionMora };
  }, [fromLvl, toLvl]);

  const talentResult = useMemo(() => {
    const start = Math.min(Number(fromTalent), Number(toTalent));
    const end = Math.max(Number(fromTalent), Number(toTalent));
    let books = 0;
    let mora = 0;
    for (let lvl = start + 1; lvl <= end; lvl++) {
      books += TALENT_BOOKS[lvl] ?? 0;
      mora += TALENT_MORA[lvl] ?? 0;
    }
    return { books, mora };
  }, [fromTalent, toTalent]);

  const levelOpts = LEVEL_OPTIONS.map((l) => ({
    value: String(l),
    label: String(l),
  }));
  const talentOpts = TALENT_OPTIONS.map((l) => ({
    value: String(l),
    label: String(l),
  }));

  return (
    <section className="glass-panel relative p-5 sm:p-6">
      <span className="absolute inset-x-0 top-0 h-1 rounded-t-[inherit] bg-gradient-to-r from-[#189b8e] to-[#67d5cc]" />
      <div className="mb-5 flex items-start gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#189b8e]/12 text-[#189b8e]">
          <Calculator className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#189b8e]">
            Калькуляторы
          </p>
          <h2 className="font-genshin text-xl tracking-wide text-foreground sm:text-2xl">
            Прокачка {characterName}
          </h2>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            Быстрый расчёт книг опыта, моры и талантов — ориентир для фарма.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[18px] border border-black/[0.05] bg-white/80 p-4 shadow-soft">
          <h3 className="font-display mb-3 text-base font-bold text-foreground">
            Уровень персонажа
          </h3>
          <div className="mb-4 grid grid-cols-[1fr_auto_1fr] items-end gap-2">
            <FancySelect
              label="С уровня"
              value={fromLvl}
              onChange={setFromLvl}
              options={levelOpts}
              size="sm"
            />
            <span className="mb-2.5 text-sm font-bold text-muted-foreground">→</span>
            <FancySelect
              label="До уровня"
              value={toLvl}
              onChange={setToLvl}
              options={levelOpts}
              size="sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <StatChip
              icon={CALC_ICONS.heroWit}
              label="Опыт героя"
              value={`×${formatNum(levelResult.books)}`}
            />
            <StatChip
              icon={CALC_ICONS.mora}
              label="Мора (уровни)"
              value={formatNum(levelResult.mora)}
            />
            <StatChip
              icon={CALC_ICONS.mora}
              label="Мора (возвышение)"
              value={formatNum(levelResult.ascensionMora)}
            />
          </div>
        </div>

        <div className="rounded-[18px] border border-black/[0.05] bg-white/80 p-4 shadow-soft">
          <h3 className="font-display mb-3 text-base font-bold text-foreground">
            Один талант
          </h3>
          <div className="mb-4 grid grid-cols-[1fr_auto_1fr] items-end gap-2">
            <FancySelect
              label="С уровня"
              value={fromTalent}
              onChange={setFromTalent}
              options={talentOpts}
              size="sm"
            />
            <span className="mb-2.5 text-sm font-bold text-muted-foreground">→</span>
            <FancySelect
              label="До уровня"
              value={toTalent}
              onChange={setToTalent}
              options={talentOpts}
              size="sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <StatChip
              icon={CALC_ICONS.talentBooks}
              label="Книги талантов"
              value={`×${formatNum(talentResult.books)}`}
            />
            <StatChip
              icon={CALC_ICONS.mora}
              label="Мора"
              value={formatNum(talentResult.mora)}
            />
          </div>
          <p className="mt-3 text-xs font-medium text-muted-foreground">
            Для трёх талантов умножьте результат на 3 (без учёта корон и материалов боссов).
          </p>
        </div>
      </div>
    </section>
  );
}

function StatChip({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl bg-[#189b8e]/8 px-3 py-2.5">
      {icon ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={icon}
          alt=""
          className="h-9 w-9 shrink-0 object-contain drop-shadow-sm"
        />
      ) : null}
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 font-display text-lg font-bold leading-tight text-foreground">
          {value}
        </p>
      </div>
    </div>
  );
}
