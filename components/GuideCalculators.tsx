"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ArrowRight, Calculator } from "lucide-react";
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

  const moraTotal = levelResult.mora + levelResult.ascensionMora;

  return (
    <section className="glass-panel relative overflow-hidden p-5 sm:p-6">
      <span className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-[#189b8e]/10 blur-2xl" />
      <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#189b8e] to-[#67d5cc]" />

      <div className="relative mb-6">
        <p className="mb-1 text-sm font-bold uppercase tracking-[0.08em] text-[#189b8e]">
          Калькуляторы
        </p>
        <h2 className="font-genshin text-xl tracking-wide text-foreground sm:text-2xl">
          Прокачка {characterName}
        </h2>
        <p className="mt-1.5 max-w-xl text-sm font-medium leading-relaxed text-muted-foreground">
          Быстрый расчёт книг опыта, моры и талантов — ориентир для фарма.
        </p>
      </div>

      <div className="relative grid gap-4 lg:grid-cols-2">
        <CalcCard title="Уровень персонажа">
          <LevelRange
            from={fromLvl}
            to={toLvl}
            onFrom={setFromLvl}
            onTo={setToLvl}
            options={levelOpts}
          />
          <ResultList>
            <ResultRow
              icon={CALC_ICONS.heroWit}
              label="Опыт героя"
              value={`×${formatNum(levelResult.books)}`}
            />
            <ResultRow
              icon={CALC_ICONS.mora}
              label="Мора за уровни"
              value={formatNum(levelResult.mora)}
            />
            <ResultRow
              icon={CALC_ICONS.mora}
              label="Мора за возвышение"
              value={formatNum(levelResult.ascensionMora)}
            />
            <ResultRow
              icon={CALC_ICONS.mora}
              label="Мора всего"
              value={formatNum(moraTotal)}
              emphasize
            />
          </ResultList>
        </CalcCard>

        <CalcCard title="Один талант">
          <LevelRange
            from={fromTalent}
            to={toTalent}
            onFrom={setFromTalent}
            onTo={setToTalent}
            options={talentOpts}
          />
          <ResultList>
            <ResultRow
              icon={CALC_ICONS.talentBooks}
              label="Книги талантов"
              value={`×${formatNum(talentResult.books)}`}
            />
            <ResultRow
              icon={CALC_ICONS.mora}
              label="Мора"
              value={formatNum(talentResult.mora)}
              emphasize
            />
          </ResultList>
          <p className="mt-3 text-[12px] font-medium leading-relaxed text-muted-foreground">
            Для трёх талантов умножьте результат на 3 (без учёта корон и материалов боссов).
          </p>
        </CalcCard>
      </div>
    </section>
  );
}

function CalcCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-[18px] border border-black/[0.06] bg-white/90 p-4 shadow-soft sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#189b8e]/12 text-[#189b8e]">
          <Calculator className="h-4 w-4" />
        </span>
        <h3 className="font-display text-[15px] font-bold text-foreground sm:text-base">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function LevelRange({
  from,
  to,
  onFrom,
  onTo,
  options,
}: {
  from: string;
  to: string;
  onFrom: (v: string) => void;
  onTo: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="mb-4 grid grid-cols-[1fr_auto_1fr] items-end gap-2.5">
      <FancySelect label="С уровня" value={from} onChange={onFrom} options={options} size="sm" />
      <span className="mb-2.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#0b1f44]/[0.04] text-muted-foreground">
        <ArrowRight className="h-3.5 w-3.5" />
      </span>
      <FancySelect label="До уровня" value={to} onChange={onTo} options={options} size="sm" />
    </div>
  );
}

function ResultList({ children }: { children: ReactNode }) {
  return (
    <ul className="overflow-hidden rounded-[14px] border border-black/[0.05] bg-[#f7f8fa]">
      {children}
    </ul>
  );
}

function ResultRow({
  icon,
  label,
  value,
  emphasize = false,
}: {
  icon: string;
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <li
      className={`flex items-center gap-3 border-b border-black/[0.05] px-3 py-2.5 last:border-b-0 sm:px-3.5 ${
        emphasize ? "bg-[#189b8e]/[0.07]" : ""
      }`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-black/[0.05]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={icon} alt="" className="h-7 w-7 object-contain" />
      </span>
      <span className="min-w-0 flex-1 text-[13px] font-semibold text-foreground/80">
        {label}
      </span>
      <span
        className={`shrink-0 tabular-nums font-display text-[15px] font-bold sm:text-base ${
          emphasize ? "text-[#189b8e]" : "text-foreground"
        }`}
      >
        {value}
      </span>
    </li>
  );
}
