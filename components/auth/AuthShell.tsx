import Link from "next/link";
import { SITE_NAME } from "@/lib/site";
import { ThemeToggle } from "@/components/shared";

type Props = {
  children: React.ReactNode;
};

/** Минималистичная оболочка входа / регистрации. */
export default function AuthShell({ children }: Props) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-8 sm:px-6">
        <header className="mb-10 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 transition hover:opacity-80"
            aria-label={`${SITE_NAME} — на главную`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.svg"
              alt=""
              width={36}
              height={38}
              className="logo-mark h-9 w-auto object-contain"
              decoding="async"
            />
            <span className="font-genshin text-base tracking-wide text-foreground">
              {SITE_NAME}
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle className="!h-10 !w-10 !rounded-xl" />
            <Link
              href="/"
              className="text-sm text-muted-foreground transition hover:text-foreground"
            >
              На главную
            </Link>
          </div>
        </header>

        <main className="flex flex-1 flex-col justify-center pb-12">
          {children}
        </main>
      </div>
    </div>
  );
}
