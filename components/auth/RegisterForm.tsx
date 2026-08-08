"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function RegisterForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/wishes";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
    const data = (await res.json()) as { error?: string };

    if (!res.ok) {
      setLoading(false);
      setError(data.error || "Не удалось зарегистрироваться");
      return;
    }

    const sign = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);

    if (sign?.error) {
      setError("Аккаунт создан, но вход не удался — попробуйте войти");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="w-full max-w-md">
      <div className="glass-panel relative overflow-hidden p-6 sm:p-8">
        <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#189b8e] to-[#67d5cc]" />
        <p className="mb-1 text-sm font-bold uppercase tracking-[0.1em] text-[#189b8e]">
          Guideshin
        </p>
        <h1 className="font-genshin text-3xl tracking-wide text-foreground">
          Регистрация
        </h1>
        <p className="mt-2 text-sm font-medium text-muted-foreground">
          Создайте аккаунт, чтобы хранить историю молитв в облаке.
        </p>

        {googleEnabled && (
          <button
            type="button"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-black/[0.08] bg-white px-4 py-3 text-sm font-bold text-foreground transition hover:bg-[#189b8e]/[0.06]"
            onClick={() => signIn("google", { callbackUrl })}
          >
            Продолжить с Google
          </button>
        )}

        {googleEnabled && (
          <div className="my-5 flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <span className="h-px flex-1 bg-black/[0.08]" />
            или email
            <span className="h-px flex-1 bg-black/[0.08]" />
          </div>
        )}

        <form onSubmit={handleSubmit} className={googleEnabled ? "" : "mt-6"}>
          <div className="flex flex-col gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold text-muted-foreground">
                Имя (необязательно)
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-sm outline-none ring-[#189b8e]/30 focus:ring-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-muted-foreground">
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-sm outline-none ring-[#189b8e]/30 focus:ring-2"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-muted-foreground">
                Пароль (от 8 символов)
              </label>
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-sm outline-none ring-[#189b8e]/30 focus:ring-2"
                required
              />
            </div>
          </div>

          {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}

          <button type="submit" disabled={loading} className="ui-btn-primary mt-5 w-full">
            {loading ? "Создаём…" : "Создать аккаунт"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Уже есть аккаунт?{" "}
          <Link
            href={`/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="font-bold text-[#189b8e] hover:underline"
          >
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}
