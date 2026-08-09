"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, ClipboardPaste, Copy, Loader2, AlertCircle } from "lucide-react";
import { looksLikeWishAuthUrl } from "@/lib/wishes-client";
import type { WishImportProgress } from "@/lib/wishes";

type Props = {
  busy: boolean;
  progress: WishImportProgress | null;
  onImportUrl: (url: string) => Promise<void>;
  onImportJson: (payload: unknown) => Promise<void>;
  error: string | null;
  message: string | null;
  onClearFeedback?: () => void;
};

type Tab = "pc" | "json";

export default function WishImportWizard({
  busy,
  progress,
  onImportUrl,
  onImportJson,
  error,
  message,
  onClearFeedback,
}: Props) {
  const [tab, setTab] = useState<Tab>("pc");
  const [oneLiner, setOneLiner] = useState("");
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/wishes/import-script")
      .then((r) => r.text())
      .then((text) => {
        if (!cancelled) setOneLiner(text.trim());
      })
      .catch(() => {
        if (!cancelled) {
          setOneLiner(
            "Set-ExecutionPolicy Bypass -Scope Process -Force; irm 'https://guideshin.ru/scripts/get-wish-url.ps1' | iex",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const copyScript = useCallback(async () => {
    if (!oneLiner) return;
    await navigator.clipboard.writeText(oneLiner);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, [oneLiner]);

  const pasteAndImport = useCallback(async () => {
    setLocalError(null);
    onClearFeedback?.();
    try {
      const text = (await navigator.clipboard.readText()).trim();
      if (!looksLikeWishAuthUrl(text)) {
        setLocalError(
          "В буфере нет ссылки. Сначала выполните команду в PowerShell.",
        );
        return;
      }
      setUrl(text);
      await onImportUrl(text);
    } catch {
      setLocalError(
        "Нет доступа к буферу. Вставьте ссылку вручную в поле ниже.",
      );
    }
  }, [onClearFeedback, onImportUrl]);

  const handleJsonImport = useCallback(async () => {
    setLocalError(null);
    onClearFeedback?.();
    try {
      const payload = JSON.parse(jsonText);
      await onImportJson(payload);
    } catch {
      setLocalError("Некорректный JSON. Вставьте экспорт UIGF / paimon.moe.");
    }
  }, [jsonText, onClearFeedback, onImportJson]);

  const feedbackError = localError || error;
  const progressPct =
    progress && progress.steps > 0
      ? Math.min(
          100,
          Math.round(
            ((progress.phase === "saving" || progress.phase === "done"
              ? progress.steps
              : Math.max(0, progress.step - 1)) /
              progress.steps) *
              100 +
              (progress.phase === "banner" ? 8 : 0),
          ),
        )
      : busy
        ? 12
        : 0;

  return (
    <div className="overflow-hidden rounded-[28px] border border-black/[0.06] bg-white shadow-[0_20px_50px_-28px_rgba(15,70,60,0.35)]">
      <div className="border-b border-black/[0.05] bg-gradient-to-br from-[#e8f7f5] via-white to-[#f3fbfa] px-6 py-7 sm:px-8 sm:py-8">
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#189b8e]">
          Импорт
        </p>
        <h2 className="mt-1 font-genshin text-[2rem] leading-tight text-foreground sm:text-[2.35rem]">
          Импорт с PC
        </h2>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-foreground/75 sm:text-lg">
          Три простых шага: история в игре → команда → вставить сюда.
        </p>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
              tab === "pc"
                ? "bg-[#189b8e] text-white shadow-soft"
                : "bg-white/80 text-foreground/70 ring-1 ring-black/[0.06]"
            }`}
            onClick={() => setTab("pc")}
          >
            PC
          </button>
          <button
            type="button"
            className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
              tab === "json"
                ? "bg-[#189b8e] text-white shadow-soft"
                : "bg-white/80 text-foreground/70 ring-1 ring-black/[0.06]"
            }`}
            onClick={() => setTab("json")}
          >
            JSON
          </button>
        </div>
      </div>

      <div className="px-6 py-6 sm:px-8 sm:py-7">
        {tab === "pc" ? (
          <div className="space-y-7">
            <ol className="space-y-7">
              <li className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#189b8e] text-base font-bold text-white">
                  1
                </span>
                <div>
                  <p className="text-lg font-bold text-foreground sm:text-xl">
                    Откройте историю молитв
                  </p>
                  <p className="mt-1.5 text-base leading-relaxed text-foreground/70">
                    В игре: Молитва → История молитв. Дождитесь загрузки списка,
                    потом закройте окно.
                  </p>
                </div>
              </li>

              <li className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#189b8e] text-base font-bold text-white">
                  2
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold text-foreground sm:text-xl">
                    Запустите команду
                  </p>
                  <p className="mt-1.5 text-base leading-relaxed text-foreground/70">
                    Нажмите <strong>Win + R</strong>, введите{" "}
                    <code className="rounded-md bg-black/[0.06] px-1.5 py-0.5 text-[0.95em]">
                      powershell
                    </code>
                    , Enter — и вставьте команду:
                  </p>
                  <div className="mt-3 rounded-2xl bg-[#0d1f1c] p-4">
                    <p className="break-all font-mono text-sm leading-relaxed text-[#9be8df]">
                      {oneLiner || "Загрузка команды…"}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={!oneLiner || busy}
                    onClick={() => void copyScript()}
                    className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#189b8e] px-5 py-3 text-base font-bold text-white transition hover:bg-[#147f74] disabled:opacity-50"
                  >
                    {copied ? (
                      <>
                        <Check className="h-5 w-5" />
                        Скопировано
                      </>
                    ) : (
                      <>
                        <Copy className="h-5 w-5" />
                        Скопировать команду
                      </>
                    )}
                  </button>
                  <p className="mt-2.5 text-sm text-foreground/55">
                    Успех в PowerShell: «OK! Link copied to clipboard».
                  </p>
                </div>
              </li>

              <li className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#189b8e] text-base font-bold text-white">
                  3
                </span>
                <div className="min-w-0 flex-1">
                  <p className="mb-3 text-lg font-bold text-foreground sm:text-xl">
                    Вернитесь и импортируйте
                  </p>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void pasteAndImport()}
                    className="inline-flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#189b8e] px-5 py-4 text-base font-bold text-white transition hover:bg-[#147f74] disabled:opacity-70 sm:w-auto sm:min-w-[280px]"
                  >
                    {busy ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Импортируем…
                      </>
                    ) : (
                      <>
                        <ClipboardPaste className="h-5 w-5" />
                        Вставить из буфера
                      </>
                    )}
                  </button>
                </div>
              </li>
            </ol>

            {(busy || progress) && (
              <div className="rounded-2xl border border-[#189b8e]/25 bg-[#e8f7f5] p-4 sm:p-5">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-base font-bold text-[#0f5c54]">
                    {progress?.label || "Импортируем молитвы…"}
                  </p>
                  <Loader2 className="h-5 w-5 shrink-0 animate-spin text-[#189b8e]" />
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-white/80">
                  <div
                    className="h-full rounded-full bg-[#189b8e] transition-all duration-500"
                    style={{ width: `${Math.max(progressPct, 8)}%` }}
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium text-[#0f5c54]/80">
                  {progress && progress.step > 0 ? (
                    <span>
                      Баннер {progress.step} из {progress.steps}
                    </span>
                  ) : null}
                  {progress && progress.page > 0 ? (
                    <span>Страница {progress.page}</span>
                  ) : null}
                  {progress ? (
                    <span>
                      Собрано: {progress.totalPulled.toLocaleString("ru-RU")}
                    </span>
                  ) : null}
                </div>
              </div>
            )}

            <details className="rounded-2xl border border-black/[0.06] bg-[#f7faf9] p-4">
              <summary className="cursor-pointer text-base font-bold text-foreground/70">
                Ссылка не скопировалась — вставить вручную
              </summary>
              <textarea
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                rows={3}
                placeholder="https://…authkey=…"
                className="mt-3 w-full rounded-xl border border-black/[0.08] bg-white px-4 py-3 text-base outline-none ring-[#189b8e]/30 focus:ring-2"
              />
              <button
                type="button"
                disabled={busy || !url.trim()}
                className="mt-3 w-full rounded-xl border-2 border-[#189b8e] px-4 py-3 text-base font-bold text-[#189b8e] disabled:opacity-50"
                onClick={() => {
                  setLocalError(null);
                  onClearFeedback?.();
                  void onImportUrl(url.trim());
                }}
              >
                Импортировать ссылку
              </button>
            </details>
          </div>
        ) : (
          <div>
            <p className="mb-3 text-base text-foreground/70">
              Вставьте экспорт UIGF / paimon.moe целиком.
            </p>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              rows={8}
              placeholder='{"list":[...]}'
              className="w-full rounded-xl border border-black/[0.08] bg-white px-4 py-3 font-mono text-sm outline-none ring-[#189b8e]/30 focus:ring-2"
            />
            <button
              type="button"
              disabled={busy || !jsonText.trim()}
              className="mt-3 w-full rounded-2xl bg-[#189b8e] px-5 py-4 text-base font-bold text-white disabled:opacity-50"
              onClick={() => void handleJsonImport()}
            >
              {busy ? "Импортируем…" : "Импортировать JSON"}
            </button>
          </div>
        )}

        {feedbackError && (
          <div className="mt-6 flex gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-base leading-relaxed text-red-800">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-bold">Ошибка импорта</p>
              <p className="mt-1">{feedbackError}</p>
            </div>
          </div>
        )}
        {message && !feedbackError && (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-base font-medium leading-relaxed text-emerald-900">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
