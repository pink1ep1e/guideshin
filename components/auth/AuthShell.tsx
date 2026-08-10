import Image from "next/image";
import Link from "next/link";
import { HOME_ASSETS } from "@/lib/home-content";
import { SITE_NAME } from "@/lib/site";

type Highlight = {
  title: string;
  text: string;
};

type Props = {
  children: React.ReactNode;
  artEyebrow?: string;
  artTitle?: string;
  artText?: string;
  /** Короткие плюсы под формой / на мобилке */
  highlights?: Highlight[];
  /** Показать маскота у формы */
  showMascot?: boolean;
};

const DEFAULT_HIGHLIGHTS: Highlight[] = [
  { title: "Облако", text: "История молитв не пропадёт" },
  { title: "Гарант", text: "Pity по всем баннерам" },
  { title: "Импорт", text: "ПК, телефон или paimon.moe" },
];

export default function AuthShell({
  children,
  artEyebrow = "Счётчик молитв",
  artTitle = "История и импорт в одном кабинете",
  artText = "Загрузите молитвы с ПК или из paimon.moe — и следите за гарантом по всем баннерам.",
  highlights = DEFAULT_HIGHLIGHTS,
  showMascot = true,
}: Props) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
        <header className="mb-6 flex items-center justify-between gap-3 sm:mb-8">
          <Link
            href="/"
            className="group inline-flex items-center gap-3 rounded-2xl pr-2 transition hover:opacity-95"
            aria-label={`${SITE_NAME} — на главную`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.svg"
              alt=""
              width={48}
              height={50}
              className="h-11 w-auto object-contain drop-shadow-sm sm:h-12"
              decoding="async"
            />
            <span className="hidden flex-col sm:flex">
              <span className="font-genshin text-lg leading-none tracking-wide text-foreground">
                {SITE_NAME}
              </span>
              <span className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#189b8e]">
                Гайды и молитвы
              </span>
            </span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.06] bg-white/70 px-3.5 py-2 text-sm font-bold text-[#189b8e] shadow-sm backdrop-blur-sm transition hover:bg-white hover:text-[#147f74]"
          >
            ← На главную
          </Link>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center gap-8 py-2 lg:flex-row lg:items-stretch lg:gap-12 lg:py-6">
          <div className="relative w-full max-w-lg shrink-0 self-center">
            {showMascot ? (
              <div className="pointer-events-none absolute -right-3 -top-10 z-20 hidden w-28 select-none sm:block lg:-right-6 lg:-top-12 lg:w-32">
                <Image
                  src={HOME_ASSETS.mascot}
                  alt=""
                  width={160}
                  height={160}
                  className="h-auto w-full drop-shadow-[0_12px_24px_rgba(11,61,56,0.25)]"
                  priority
                />
              </div>
            ) : null}

            <div className="relative overflow-hidden rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_-28px_rgba(11,61,56,0.35)] backdrop-blur-md sm:p-8">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#147f74] via-[#189b8e] to-[#5ec4b8]"
              />
              {children}
            </div>

            {highlights.length > 0 ? (
              <ul className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                {highlights.map((item, i) => (
                  <li
                    key={item.title}
                    className="flex items-start gap-2.5 rounded-2xl border border-white/70 bg-white/55 px-3.5 py-3 shadow-sm backdrop-blur-sm sm:flex-col sm:gap-2"
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-sm ${
                        i === 0
                          ? "bg-[#189b8e]"
                          : i === 1
                            ? "bg-[#0f5c54]"
                            : "bg-[#207970]"
                      }`}
                    >
                      <HighlightIcon index={i} />
                    </span>
                    <span>
                      <p className="text-[13px] font-bold text-foreground">{item.title}</p>
                      <p className="mt-0.5 text-[12px] leading-snug text-foreground/55">
                        {item.text}
                      </p>
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <aside className="relative hidden min-h-[460px] w-full max-w-xl overflow-hidden rounded-[28px] shadow-[0_28px_64px_-30px_rgba(11,61,56,0.45)] ring-1 ring-black/10 lg:block lg:min-h-0 lg:flex-1">
            <Image
              src={HOME_ASSETS.offerArt}
              alt=""
              fill
              priority
              className="object-cover"
              sizes="(min-width: 1024px) 40vw, 100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#062924]/92 via-[#0f5c54]/50 to-[#189b8e]/15" />
            <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-6">
              <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white/90 backdrop-blur-sm">
                {SITE_NAME}
              </span>
              <span className="rounded-full bg-[#189b8e]/90 px-3 py-1 text-[11px] font-bold text-white shadow-sm">
                Бесплатно
              </span>
            </div>
            <div className="absolute inset-x-0 bottom-0 z-10 p-8 xl:p-10">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-white/75">
                {artEyebrow}
              </p>
              <h2 className="mt-3 font-genshin text-3xl leading-snug tracking-wide text-white xl:text-[2.1rem]">
                {artTitle}
              </h2>
              <p className="mt-3 max-w-md text-base leading-relaxed text-white/85">
                {artText}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {["Гарант", "5★ история", "Синхронизация"].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-bold text-white/90 backdrop-blur-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function HighlightIcon({ index }: { index: number }) {
  if (index === 0) {
    return (
      <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M7 18a4 4 0 0 1-.6-7.96A5.5 5.5 0 0 1 17.2 9.1 3.5 3.5 0 0 1 18 18H7Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (index === 1) {
    return (
      <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 3 5 6.5v5.2c0 4.2 2.8 7.9 7 9.3 4.2-1.4 7-5.1 7-9.3V6.5L12 3Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="m9.2 12.2 1.9 1.9 3.8-3.8"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 16v4m-4 0h8M7 4h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
