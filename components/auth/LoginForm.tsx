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
      <h1 className="font-genshin text-3xl tracking-wide text-foreground sm:text-4xl">
        Вход
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Личный кабинет счётчика молитв
      </p>

      {googleEnabled && (
        <>
          <button
            type="button"
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl border border-black/[0.08] bg-white px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-black/[0.02]"
            onClick={() => signIn("google", { callbackUrl })}
          >
            <GoogleIcon />
            Google
          </button>
          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-black/[0.08]" />
            или
            <span className="h-px flex-1 bg-black/[0.08]" />
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} className={googleEnabled ? "" : "mt-8"}>
        <div className="flex flex-col gap-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Email
            </span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-3 text-sm outline-none transition placeholder:text-foreground/30 focus:border-[#189b8e]/50 focus:ring-2 focus:ring-[#189b8e]/15"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Пароль
            </span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-3 text-sm outline-none transition placeholder:text-foreground/30 focus:border-[#189b8e]/50 focus:ring-2 focus:ring-[#189b8e]/15"
              required
            />
          </label>
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-[#189b8e] py-3 text-sm font-semibold text-white transition hover:bg-[#147f74] disabled:opacity-60"
        >
          {loading ? "Входим…" : "Войти"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Нет аккаунта?{" "}
        <Link
          href={`/auth/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="font-semibold text-[#189b8e] hover:underline"
        >
          Регистрация
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
