"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/wishes";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Неверный email или пароль");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div>
      <p className="mb-2 text-sm font-bold uppercase tracking-[0.14em] text-[#189b8e]">
        Guideshin
      </p>
      <h1 className="font-genshin text-[2.75rem] tracking-wide text-foreground sm:text-5xl">
        Вход
      </h1>
      <p className="mt-3 text-base text-foreground/60 sm:text-[17px]">
        Счётчик молитв и история — в личном кабинете.
      </p>

      {googleEnabled && (
        <button
          type="button"
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl border border-black/[0.08] bg-white px-4 py-3.5 text-sm font-bold text-foreground transition hover:bg-[#189b8e]/[0.06]"
          onClick={() => signIn("google", { callbackUrl })}
        >
          <GoogleIcon />
          Войти через Google
        </button>
      )}

      {googleEnabled && (
        <div className="my-6 flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <span className="h-px flex-1 bg-black/[0.08]" />
          или email
          <span className="h-px flex-1 bg-black/[0.08]" />
        </div>
      )}

      <form onSubmit={handleSubmit} className={googleEnabled ? "" : "mt-8"}>
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-muted-foreground">
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-black/[0.08] bg-white px-4 py-3.5 text-base outline-none ring-[#189b8e]/30 focus:ring-2"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-muted-foreground">
              Пароль
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-black/[0.08] bg-white px-4 py-3.5 text-base outline-none ring-[#189b8e]/30 focus:ring-2"
              required
            />
          </div>
        </div>

        {error && (
          <p className="mt-4 text-sm font-medium text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="ui-btn-primary mt-6 w-full rounded-2xl py-3.5"
        >
          {loading ? "Входим…" : "Войти"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Нет аккаунта?{" "}
        <Link
          href={`/auth/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="font-bold text-[#189b8e] hover:underline"
        >
          Зарегистрироваться
        </Link>
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
