import Image from "next/image";
import Link from "next/link";
import { HOME_ASSETS } from "@/lib/home-content";

type Props = {
  children: React.ReactNode;
  artEyebrow?: string;
  artTitle?: string;
  artText?: string;
};

export default function AuthShell({
  children,
  artEyebrow = "Счётчик молитв",
  artTitle = "История и импорт в одном кабинете",
  artText = "Загрузите молитвы с ПК или из paimon.moe — и следите за гарантом по всем баннерам.",
}: Props) {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-8 sm:px-8 lg:px-10">
        <Link
          href="/"
          className="mb-6 inline-flex w-fit items-center gap-2 text-base font-bold text-[#189b8e] transition hover:text-[#147f74]"
        >
          ← На главную
        </Link>

        <div className="flex flex-1 flex-col items-center justify-center gap-10 py-6 lg:flex-row lg:items-stretch lg:gap-14 lg:py-10">
          <div className="w-full max-w-lg shrink-0 self-center">{children}</div>

          <aside className="relative hidden min-h-[420px] w-full max-w-xl overflow-hidden rounded-[28px] lg:block lg:min-h-0 lg:flex-1">
            <Image
              src={HOME_ASSETS.offerArt}
              alt=""
              fill
              priority
              className="object-cover"
              sizes="(min-width: 1024px) 40vw, 100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b3d38]/90 via-[#0f5c54]/45 to-transparent" />
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
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
