import Image from "next/image";
import Link from "next/link";
import { HOME_ASSETS } from "@/lib/home-content";

type Props = {
  children: React.ReactNode;
  /** Короткий акцент справа на арте */
  artEyebrow?: string;
  artTitle?: string;
  artText?: string;
};

export default function AuthShell({
  children,
  artEyebrow = "Счётчик молитв",
  artTitle = "История, pity и импорт в одном кабинете",
  artText = "Загрузите молитвы с ПК или из paimon.moe — и следите за гарантом по всем баннерам.",
}: Props) {
  return (
    <div className="relative flex min-h-screen">
      <div className="relative z-10 flex w-full flex-col justify-center px-5 py-10 sm:px-8 lg:w-[48%] lg:px-12 xl:px-16">
        <Link
          href="/"
          className="mb-10 inline-flex w-fit items-center gap-2 text-sm font-bold text-[#189b8e] transition hover:text-[#147f74]"
        >
          ← На главную
        </Link>
        <div className="mx-auto w-full max-w-md lg:mx-0">{children}</div>
      </div>

      <aside className="relative hidden overflow-hidden lg:block lg:w-[52%]">
        <Image
          src={HOME_ASSETS.offerArt}
          alt=""
          fill
          priority
          className="object-cover"
          sizes="52vw"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0b3d38]/75 via-[#0f5c54]/55 to-[#189b8e]/40" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,255,255,0.18),transparent_55%)]" />
        <div className="relative z-10 flex h-full flex-col justify-end p-10 xl:p-14">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-white/75">
            {artEyebrow}
          </p>
          <h2 className="mt-3 max-w-lg font-genshin text-3xl leading-snug tracking-wide text-white xl:text-4xl">
            {artTitle}
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-white/80">
            {artText}
          </p>
        </div>
      </aside>
    </div>
  );
}
