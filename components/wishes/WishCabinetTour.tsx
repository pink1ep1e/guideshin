"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, ChevronLeft, ChevronRight, X } from "lucide-react";

const TOUR_STORAGE_KEY = "guideshin-wish-tour-v2";

export type WishTourStep = {
  id: string;
  target: string;
  title: string;
  body: string;
};

const DASHBOARD_STEPS: WishTourStep[] = [
  {
    id: "import",
    target: "tour-import",
    title: "Авто-импорт",
    body: "Отсюда загружается история молитв с Hoyoverse или из файла. Без импорта кабинет пустой — сначала добавьте данные.",
  },
  {
    id: "accounts",
    target: "tour-accounts",
    title: "Игровые аккаунты",
    body: "Каждый профиль хранится отдельно. Можно переименовать и поставить аватарку персонажа (карандаш на карточке). Импорт идёт в выбранный аккаунт.",
  },
  {
    id: "overview",
    target: "tour-overview",
    title: "Сводка сверху",
    body: "Всего молитв и примогемов — сколько вы потратили. «Шанс 5★» — доля легендарок в истории. «Средний гарант» — в среднем через сколько круток приходит 5★. Наведите на плитки с подсказкой — появится объяснение.",
  },
  {
    id: "banners",
    target: "tour-banners",
    title: "Гарант по баннерам",
    body: "Счётчик для персонажей, оружия, стандартного и хроник. Цифра X/Y — сколько круток с прошлого 5★ и жёсткий потолок. Полоска растёт к гаранту; «софт» — зона, где шанс заметно выше.",
  },
  {
    id: "charts",
    target: "tour-charts",
    title: "Графики и шансы",
    body: "Слева — сколько крутили по месяцам (фильтр по баннеру). Справа — ваши проценты 5★/4★ против базовых шансов игры: выше серого столбца — везло чаще среднего.",
  },
  {
    id: "compare",
    target: "tour-compare",
    title: "Сравнение аккаунтов",
    body: "Если профилей несколько, выберите второй и сравните молитвы, шансы и гаранты бок о бок — кто лучше, подсвечивается сразу.",
  },
  {
    id: "luck",
    target: "tour-luck",
    title: "Удачливость",
    body: "Сравнение с другими аккаунтами Guideshin: шансы 5★/4★, 50:50 и молитвы. Ниже — серия побед 50:50 и лучший стрик.",
  },
  {
    id: "fivestars",
    target: "tour-fivestars",
    title: "История 5★",
    body: "Все легендарки по баннерам с портретами и созвездиями/рангами. Удобно вспомнить, кого и когда выбивали.",
  },
  {
    id: "recent",
    target: "tour-recent",
    title: "Последние молитвы",
    body: "Свежий ленточный лог круток. Если есть гайд на Guideshin — ссылка «Гайд →» ведёт к нему.",
  },
  {
    id: "imports",
    target: "tour-imports",
    title: "История импортов",
    body: "Каждая загрузка истории фиксируется здесь. «Отменить» откатывает аккаунт к состоянию до этого импорта (если сохранился снимок).",
  },
];

const EMPTY_STEPS: WishTourStep[] = [
  {
    id: "import-empty",
    target: "tour-import",
    title: "С чего начать",
    body: "Нажмите «Авто-импорт» и следуйте шагам: ссылка из игры или файл истории. После загрузки откроется полный кабинет со статистикой.",
  },
  {
    id: "accounts-empty",
    target: "tour-accounts",
    title: "Аккаунты",
    body: "Можно вести несколько профилей Genshin, переименовывать их и ставить аватар. Импорт всегда идёт в выбранный сейчас аккаунт.",
  },
];

function readDone(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(TOUR_STORAGE_KEY) === "1";
  } catch {
    return true;
  }
}

function writeDone() {
  try {
    localStorage.setItem(TOUR_STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
}

type Spot = { top: number; left: number; width: number; height: number };

function measure(target: string): Spot | null {
  const el = document.querySelector(`[data-tour="${target}"]`);
  if (!(el instanceof HTMLElement)) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 4 || r.height < 4) return null;
  const pad = 8;
  return {
    top: Math.max(0, r.top - pad),
    left: Math.max(0, r.left - pad),
    width: r.width + pad * 2,
    height: r.height + pad * 2,
  };
}

function scrollToTarget(target: string) {
  const el = document.querySelector(`[data-tour="${target}"]`);
  if (!(el instanceof HTMLElement)) return;
  el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
}

type Props = {
  hasPulls: boolean;
  active: boolean;
  onActiveChange: (v: boolean) => void;
};

export function WishCabinetTour({ hasPulls, active, onActiveChange }: Props) {
  const [stepIndex, setStepIndex] = useState(0);
  const [spot, setSpot] = useState<Spot | null>(null);
  const [mounted, setMounted] = useState(false);
  const [available, setAvailable] = useState<WishTourStep[]>([]);
  const maskId = "wish-tour-mask";

  useEffect(() => {
    setMounted(true);
  }, []);

  const resolveSteps = useCallback(() => {
    const pool = hasPulls ? DASHBOARD_STEPS : EMPTY_STEPS;
    return pool.filter((s) =>
      document.querySelector(`[data-tour="${s.target}"]`),
    );
  }, [hasPulls]);

  useEffect(() => {
    if (!mounted || active) return;
    if (readDone()) return;
    const t = window.setTimeout(() => {
      const steps = resolveSteps();
      if (steps.length === 0) return;
      setAvailable(steps);
      setStepIndex(0);
      onActiveChange(true);
    }, 700);
    return () => window.clearTimeout(t);
  }, [mounted, active, resolveSteps, onActiveChange, hasPulls]);

  useEffect(() => {
    if (!active) return;
    const steps = resolveSteps();
    setAvailable(steps);
    setStepIndex(0);
  }, [active, resolveSteps]);

  const step = available[stepIndex] ?? null;

  useLayoutEffect(() => {
    if (!active || !step) {
      setSpot(null);
      return;
    }
    scrollToTarget(step.target);
    const sync = () => setSpot(measure(step.target));
    const t1 = window.setTimeout(sync, 80);
    const t2 = window.setTimeout(sync, 360);
    window.addEventListener("resize", sync);
    window.addEventListener("scroll", sync, true);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener("resize", sync);
      window.removeEventListener("scroll", sync, true);
    };
  }, [active, step]);

  const close = useCallback(
    (markDone: boolean) => {
      if (markDone) writeDone();
      onActiveChange(false);
      setSpot(null);
    },
    [onActiveChange],
  );

  const go = useCallback(
    (dir: -1 | 1) => {
      setStepIndex((i) => {
        const next = i + dir;
        if (next < 0) return i;
        if (next >= available.length) {
          close(true);
          return i;
        }
        return next;
      });
    },
    [available.length, close],
  );

  useEffect(() => {
    if (!active) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close(true);
      if (e.key === "ArrowRight" || e.key === "Enter") go(1);
      if (e.key === "ArrowLeft") go(-1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, close, go]);

  if (!mounted || !active || !step) return null;

  const isLast = stepIndex >= available.length - 1;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const cardBelow =
    spot && spot.top + spot.height + 230 < vh
      ? true
      : !(spot && spot.top > 230);

  const overlay = (
    <AnimatePresence>
      <motion.div
        key="wish-tour"
        className="fixed inset-0 z-[100]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Затемнение с «дыркой» вокруг целевого блока */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          width={vw}
          height={vh}
          aria-hidden
        >
          <defs>
            <mask id={maskId}>
              <rect x="0" y="0" width={vw} height={vh} fill="white" />
              {spot ? (
                <rect
                  x={spot.left}
                  y={spot.top}
                  width={spot.width}
                  height={spot.height}
                  rx="18"
                  ry="18"
                  fill="black"
                />
              ) : null}
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width={vw}
            height={vh}
            fill="rgba(6, 35, 32, 0.72)"
            mask={`url(#${maskId})`}
          />
        </svg>

        {/* Клики по затемнению закрывают тур; дырка не перехватывает */}
        <button
          type="button"
          aria-label="Закрыть обучение"
          className="absolute inset-0 cursor-default bg-transparent"
          style={
            spot
              ? {
                  clipPath: `polygon(
                    0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
                    ${spot.left}px ${spot.top}px,
                    ${spot.left}px ${spot.top + spot.height}px,
                    ${spot.left + spot.width}px ${spot.top + spot.height}px,
                    ${spot.left + spot.width}px ${spot.top}px,
                    ${spot.left}px ${spot.top}px
                  )`,
                }
              : undefined
          }
          onClick={() => close(true)}
        />

        {spot ? (
          <div
            className="pointer-events-none absolute rounded-[18px] border-2 border-[#189b8e] shadow-[0_0_0_4px_rgba(24,155,142,0.35)]"
            style={{
              top: spot.top,
              left: spot.left,
              width: spot.width,
              height: spot.height,
            }}
          />
        ) : null}

        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.2 }}
          className="pointer-events-auto absolute z-[101] w-[min(420px,calc(100vw-24px))] rounded-3xl border border-black/[0.06] bg-white p-5 shadow-[0_24px_60px_-28px_rgba(15,70,60,0.55)] sm:p-6"
          style={
            spot
              ? {
                  top: cardBelow
                    ? Math.min(spot.top + spot.height + 14, vh - 210)
                    : Math.max(12, spot.top - 14),
                  left: Math.min(
                    Math.max(12, spot.left),
                    vw - Math.min(420, vw - 24) - 12,
                  ),
                  transform: cardBelow ? undefined : "translateY(-100%)",
                }
              : {
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                }
          }
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#189b8e]">
                Обучение · {stepIndex + 1}/{available.length}
              </p>
              <h3 className="mt-1 font-genshin text-2xl text-foreground">
                {step.title}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => close(true)}
              className="rounded-xl p-2 text-foreground/50 transition hover:bg-black/[0.04] hover:text-foreground"
              aria-label="Закрыть"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-[15px] leading-relaxed text-foreground/75">
            {step.body}
          </p>

          <div className="mt-5 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => close(true)}
              className="text-sm font-bold text-muted-foreground transition hover:text-foreground"
            >
              Пропустить
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={stepIndex === 0}
                onClick={() => go(-1)}
                className="inline-flex items-center gap-1 rounded-2xl border border-black/[0.08] px-3.5 py-2.5 text-sm font-bold disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Назад
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                className="inline-flex items-center gap-1 rounded-2xl bg-[#189b8e] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#147f74]"
              >
                {isLast ? "Понятно" : "Далее"}
                {!isLast ? <ChevronRight className="h-4 w-4" /> : null}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(overlay, document.body);
}

export function WishTourTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-2xl border border-black/[0.08] bg-white px-5 py-3 text-base font-bold text-foreground/80 transition hover:bg-black/[0.03]"
    >
      <BookOpen className="h-5 w-5 text-[#189b8e]" />
      Обучение
    </button>
  );
}
