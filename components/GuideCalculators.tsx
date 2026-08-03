"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ArrowRight, Calculator } from "lucide-react";
import FancySelect from "@/components/ui/FancySelect";
import ItemIconCard from "@/components/ItemIconCard";

/** Cumulative Character EXP required to reach each ascension milestone. */
const CUMULATIVE_XP: Record<number, number> = {
  1: 0,
  20: 120_175,
  40: 698_500,
  50: 1_277_600,
  60: 2_131_725,
  70: 3_327_650,
  80: 4_939_525,
  90: 8_362_650,
};

const BOOK_XP = { wit: 20_000, adventurer: 5_000, wanderer: 1_000 } as const;

/** Ascension mora at gates 20 / 40 / 50 / 60 / 70 / 80. */
const ASCENSION_MORA = [20_000, 40_000, 60_000, 80_000, 100_000, 120_000] as const;
const ASCENSION_GATES = [20, 40, 50, 60, 70, 80] as const;

/** Talent books by destination level (index = talent level after upgrade). */
const TALENT_BOOKS = [0, 0, 3, 2, 4, 6, 9, 4, 6, 12, 16];
const TALENT_MORA = [
  0, 0, 12_500, 17_500, 25_000, 30_000, 37_500, 120_000, 260_000, 450_000, 700_000,
];

const LEVEL_OPTIONS = [1, 20, 40, 50, 60, 70, 80, 90] as const;
const TALENT_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

const CALC_ICONS = {
  heroWit: "/opit-geroya.png",
  adventurer: "/opit-iskatelya.png",
  wanderer: "/sovet-strannika.png",
  talentBooks: "/knigi-talantov.webp",
  mora: "/mora.png",
} as const;

type ExpBooks = { wit: number; adventurer: number; wanderer: number; mora: number; xp: number };

/** Pack XP into books with minimal overshoot (smallest book = 1 000). */
function booksForXp(xpNeeded: number): ExpBooks {
  if (xpNeeded <= 0) return { wit: 0, adventurer: 0, wanderer: 0, mora: 0, xp: 0 };

  const provided = Math.ceil(xpNeeded / BOOK_XP.wanderer) * BOOK_XP.wanderer;
  let rem = provided;
  const wit = Math.floor(rem / BOOK_XP.wit);
  rem %= BOOK_XP.wit;
  const adventurer = Math.floor(rem / BOOK_XP.adventurer);
  rem %= BOOK_XP.adventurer;
  const wanderer = rem / BOOK_XP.wanderer;

  return {
    wit,
    adventurer,
    wanderer,
    mora: provided / 5,
    xp: xpNeeded,
  };
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
    if (start === end) {
      return { wit: 0, adventurer: 0, wanderer: 0, mora: 0, xp: 0, ascensionMora: 0 };
    }

    // XP overflow is wasted at each ascension cap — pack books per segment.
    let wit = 0;
    let adventurer = 0;
    let wanderer = 0;
    let mora = 0;
    let xp = 0;
    for (let i = 0; i < LEVEL_OPTIONS.length - 1; i++) {
      const a = LEVEL_OPTIONS[i];
      const b = LEVEL_OPTIONS[i + 1];
      if (a >= start && b <= end) {
        const seg = booksForXp((CUMULATIVE_XP[b] ?? 0) - (CUMULATIVE_XP[a] ?? 0));
        wit += seg.wit;
        adventurer += seg.adventurer;
        wanderer += seg.wanderer;
        mora += seg.mora;
        xp += seg.xp;
      }
    }

    let ascensionMora = 0;
    ASCENSION_GATES.forEach((gate, idx) => {
      // Need the gate only when leveling past it (end > gate), not merely reaching it.
      if (start < gate && end > gate) {
        ascensionMora += ASCENSION_MORA[idx] ?? 0;
      }
    });

    return { wit, adventurer, wanderer, mora, xp, ascensionMora };
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
  const bookItems = [
    {
      icon: CALC_ICONS.heroWit,
      label: "Опыт героя",
      qty: levelResult.wit,
      rarity: 4,
    },
    {
      icon: CALC_ICONS.adventurer,
      label: "Опыт искателя",
      qty: levelResult.adventurer,
      rarity: 3,
    },
    {
      icon: CALC_ICONS.wanderer,
      label: "Совет странника",
      qty: levelResult.wanderer,
      rarity: 2,
    },
  ].filter((b) => b.qty > 0);

  return (
    <section
      id="guide-calc"
      className="rounded-[18px] border border-black/[0.045] bg-white p-4 shadow-soft sm:p-5"
    >
      <div className="mb-4">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#189b8e]">
          Калькуляторы
        </p>
        <h2 className="font-genshin text-lg tracking-wide text-foreground sm:text-xl">
          Прокачка {characterName}
        </h2>
        <p className="mt-1 max-w-lg text-[13px] leading-relaxed text-muted-foreground">
          Расчёт опыта, моры и материалов талантов.
        </p>
      </div>

      <div className="grid gap-3.5 lg:grid-cols-2">
        <CalcCard title="Уровень персонажа">
          <LevelRange
            from={fromLvl}
            to={toLvl}
            onFrom={setFromLvl}
            onTo={setToLvl}
            options={levelOpts}
          />

          <div className="mb-3 overflow-hidden rounded-[14px] border border-black/[0.05] bg-white/80 p-3">
            <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              Книги опыта
            </p>
            {bookItems.length > 0 ? (
              <div className="flex flex-wrap gap-2.5">
                {bookItems.map((item) => (
                  <ItemIconCard
                    key={item.label}
                    name={item.label}
                    image={item.icon}
                    rarityStars={item.rarity}
                    qty={item.qty}
                    size="sm"
                    compact
                    preview
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm font-medium text-muted-foreground">—</p>
            )}
          </div>

          <ResultList>
            <ResultRow label="Опыта всего" value={formatNum(levelResult.xp)} />
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
    <div className="rounded-[16px] border border-black/[0.05] bg-[#f7f9fb]/80 p-4">
      <div className="mb-3.5 flex items-center gap-2.5">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#189b8e]/10 text-[#189b8e]">
          <Calculator className="h-3.5 w-3.5" />
        </span>
        <h3 className="text-[14px] font-semibold tracking-tight text-foreground sm:text-[15px]">
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
    <ul className="overflow-hidden rounded-[14px] border border-black/[0.05] bg-white/80">
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
  icon?: string;
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <li
      className={`flex items-center gap-3 border-b border-black/[0.05] px-3 py-2.5 last:border-b-0 sm:px-3.5 ${
        emphasize ? "bg-[#189b8e]/[0.08]" : ""
      }`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f7f8fa] ring-1 ring-black/[0.04]">
        {icon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={icon} alt="" className="h-6 w-6 object-contain" />
        ) : (
          <span className="font-sans text-[10px] font-semibold uppercase tracking-wide text-[#189b8e]">
            XP
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1 text-[13px] font-medium text-foreground/75">
        {label}
      </span>
      <span
        className={`shrink-0 tabular-nums text-[14px] font-semibold sm:text-[15px] ${
          emphasize ? "text-[#189b8e]" : "text-foreground"
        }`}
      >
        {value}
      </span>
    </li>
  );
}
