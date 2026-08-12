"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Check,
  ClipboardPaste,
  Copy,
  Loader2,
  Upload,
  Cloud,
} from "lucide-react";
import { looksLikeWishAuthUrl } from "@/lib/wishes-client";
import type { WishImportProgress } from "@/lib/wishes";

type Props = {
  busy: boolean;
  progress: WishImportProgress | null;
  onImportUrl: (url: string) => Promise<void>;
  onImportJson: (
    payload: unknown,
    opts?: { replace?: boolean; source?: string },
  ) => Promise<void>;
  onImportPulls?: (
    pulls: unknown[],
    opts: { replace?: boolean; source?: string },
  ) => Promise<void>;
  onProgressChange?: (p: WishImportProgress | null) => void;
  error: string | null;
  message: string | null;
  onClearFeedback?: () => void;
  /** На какой игровой аккаунт идёт импорт */
  targetAccountLabel?: string | null;
  targetAccountServer?: string | null;
};

type Platform = "pc" | "android" | "ios" | "paimon";

export default function WishImportWizard({
  busy,
  progress,
  onImportUrl,
  onImportJson,
  onImportPulls,
  onProgressChange,
  error,
  message,
  onClearFeedback,
  targetAccountLabel,
  targetAccountServer,
}: Props) {
  const [platform, setPlatform] = useState<Platform>("pc");
  const [oneLiner, setOneLiner] = useState("");
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");
  const [driveUrl, setDriveUrl] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [replaceConfirm, setReplaceConfirm] = useState<
    null | { kind: "file"; file: File } | { kind: "drive" }
  >(null);
  const [mounted, setMounted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      let text = (await navigator.clipboard.readText()).trim();
      // Если в буфере текст со скрипта — вытаскиваем URL с authkey
      if (!looksLikeWishAuthUrl(text)) {
        const m = text.match(/https?:\/\/[^\s"'<>]+authkey=[^\s"'<>]+/i);
        if (m) text = m[0].replace(/[\\]+$/, "");
      }
      if (!looksLikeWishAuthUrl(text)) {
        setLocalError(
          "В буфере нет ссылки. Сначала получите её по инструкции выше.",
        );
        return;
      }
      setUrl(text);
      await onImportUrl(text);
    } catch {
      setLocalError("Нет доступа к буферу. Вставьте ссылку вручную ниже.");
    }
  }, [onClearFeedback, onImportUrl]);

  const importManualUrl = useCallback(async () => {
    setLocalError(null);
    onClearFeedback?.();
    const text = url.trim();
    if (!looksLikeWishAuthUrl(text)) {
      setLocalError("Нужна полная ссылка с authkey.");
      return;
    }
    await onImportUrl(text);
  }, [onClearFeedback, onImportUrl, url]);

  const handleFile = useCallback(
    async (file: File) => {
      setLocalError(null);
      onClearFeedback?.();

      try {
        onProgressChange?.({
          phase: "connecting",
          label: "Читаем файл…",
          step: 0,
          steps: 6,
          page: 0,
          totalPulled: 0,
        });
        const text = await file.text();
        const payload = JSON.parse(text) as unknown;

        const { isPaimonMoeExport, parsePaimonMoeExport, buildPaimonRarityLookup } =
          await import("@/lib/paimon-import");

        if (!isPaimonMoeExport(payload)) {
          await onImportJson(payload, { replace: false, source: "json" });
          return;
        }

        onProgressChange?.({
          phase: "connecting",
          label: "Загружаем каталог имён…",
          step: 0,
          steps: 6,
          page: 0,
          totalPulled: 0,
        });
        const catRes = await fetch("/api/catalog", { cache: "no-store" });
        const catalog = catRes.ok
          ? ((await catRes.json()) as {
              characters: {
                slug: string;
                name: string;
                rarity: string;
                image?: string;
              }[];
              weapons: {
                slug: string;
                name: string;
                rarity: string;
                image?: string;
              }[];
            })
          : { characters: [], weapons: [] };

        const lookup = buildPaimonRarityLookup(catalog);
        const pulls = parsePaimonMoeExport(payload, lookup, (p) => {
          onProgressChange?.({
            phase: "banner",
            label: `Разбор: ${p.bannerLabel}`,
            step: p.step,
            steps: p.steps,
            page: 0,
            totalPulled: p.processed,
            totalApprox: p.totalApprox,
          });
        });

        if (pulls.length === 0) {
          setLocalError("В файле paimon.moe не найдено молитв.");
          onProgressChange?.(null);
          return;
        }

        onProgressChange?.({
          phase: "saving",
          label: "Удаляем старые данные и сохраняем…",
          step: 6,
          steps: 6,
          page: 0,
          totalPulled: pulls.length,
        });

        const serializable = pulls.map((p) => ({
          id: p.hoyoId,
          gacha_type: p.gachaType,
          name: p.itemName,
          item_type: p.itemType,
          rank_type: p.rankType,
          time: p.wishTime.toISOString(),
          paimon_rate: (p.raw as { paimon_rate?: number } | undefined)
            ?.paimon_rate,
        }));

        if (onImportPulls) {
          await onImportPulls(serializable, {
            replace: true,
            source: "paimon",
          });
        } else {
          await onImportJson(payload, { replace: true, source: "paimon" });
        }
      } catch {
        setLocalError(
          "Не удалось прочитать файл. Нужен JSON-экспорт paimon.moe / UIGF.",
        );
        onProgressChange?.(null);
      }
    },
    [onClearFeedback, onImportJson, onImportPulls, onProgressChange],
  );

  const importFromDriveLink = useCallback(async () => {
    setLocalError(null);
    onClearFeedback?.();
    const link = driveUrl.trim();
    if (!link) {
      setLocalError("Вставьте ссылку на файл Google Drive.");
      return;
    }
    try {
      onProgressChange?.({
        phase: "connecting",
        label: "Скачиваем файл с Drive…",
        step: 0,
        steps: 6,
        page: 0,
        totalPulled: 0,
      });
      const res = await fetch("/api/wishes/import-drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: link }),
      });
      const json = (await res.json()) as {
        error?: string;
        payload?: unknown;
      };
      if (!res.ok || !json.payload) {
        throw new Error(json.error || "Не удалось скачать файл с Drive");
      }
      // Переиспользуем тот же путь, что и для файла
      const blob = new Blob([JSON.stringify(json.payload)], {
        type: "application/json",
      });
      const file = new File([blob], "paimon-drive.json", {
        type: "application/json",
      });
      // без второго confirm — уже спросили
      const text = await file.text();
      const payload = JSON.parse(text) as unknown;
      const { isPaimonMoeExport, parsePaimonMoeExport, buildPaimonRarityLookup } =
        await import("@/lib/paimon-import");
      if (isPaimonMoeExport(payload)) {
        const catRes = await fetch("/api/catalog", { cache: "no-store" });
        const catalog = catRes.ok
          ? await catRes.json()
          : { characters: [], weapons: [] };
        const lookup = buildPaimonRarityLookup(catalog);
        const pulls = parsePaimonMoeExport(payload, lookup, (p) => {
          onProgressChange?.({
            phase: "banner",
            label: `Разбор: ${p.bannerLabel}`,
            step: p.step,
            steps: p.steps,
            page: 0,
            totalPulled: p.processed,
            totalApprox: p.totalApprox,
          });
        });
        const serializable = pulls.map((p) => ({
          id: p.hoyoId,
          gacha_type: p.gachaType,
          name: p.itemName,
          item_type: p.itemType,
          rank_type: p.rankType,
          time: p.wishTime.toISOString(),
          paimon_rate: (p.raw as { paimon_rate?: number } | undefined)
            ?.paimon_rate,
        }));
        if (onImportPulls) {
          await onImportPulls(serializable, { replace: true, source: "paimon" });
        } else {
          await onImportJson(payload, { replace: true, source: "paimon" });
        }
      } else {
        await onImportJson(json.payload, { replace: true, source: "json" });
      }
    } catch (e) {
      setLocalError(
        e instanceof Error
          ? e.message
          : "Не удалось импортировать с Google Drive",
      );
      onProgressChange?.(null);
    }
  }, [
    driveUrl,
    onClearFeedback,
    onImportJson,
    onImportPulls,
    onProgressChange,
  ]);

  const confirmReplaceImport = useCallback(() => {
    if (!replaceConfirm) return;
    const pending = replaceConfirm;
    setReplaceConfirm(null);
    if (pending.kind === "file") {
      void handleFile(pending.file);
    } else {
      void importFromDriveLink();
    }
  }, [handleFile, importFromDriveLink, replaceConfirm]);

  const feedbackError = localError || error;
  const blocked = busy || Boolean(progress);
  const progressPct = (() => {
    if (!progress) return busy ? 12 : 0;
    if (progress.phase === "saving" || progress.phase === "done") {
      return progress.totalPulled > 0 ? 96 : 88;
    }
    const approx = progress.totalApprox || 0;
    if (approx > 0) {
      return Math.min(
        90,
        Math.round(8 + (progress.totalPulled / approx) * 82),
      );
    }
    if (progress.steps > 0) {
      return Math.min(
        90,
        Math.round(
          (progress.step / progress.steps) * 70 +
            Math.min(20, (progress.totalPulled / 2000) * 20),
        ),
      );
    }
    return busy ? 12 : 0;
  })();

  const tabs: { id: Platform; label: string }[] = [
    { id: "pc", label: "PC" },
    { id: "android", label: "Android" },
    { id: "ios", label: "iOS" },
    { id: "paimon", label: "Paimon" },
  ];

  return (
    <div id="wish-import" className="rounded-3xl bg-white p-6 sm:p-8">
      <div className="max-w-xl">
        <h2 className="font-genshin text-3xl tracking-wide text-foreground sm:text-[2rem]">
          Импорт молитв
        </h2>
        {targetAccountLabel ? (
          <p className="mt-2 text-base text-foreground/60">
            Аккаунт{" "}
            <span className="font-semibold text-foreground">
              {targetAccountLabel}
            </span>
            {targetAccountServer ? (
              <span> · {targetAccountServer}</span>
            ) : null}
          </p>
        ) : (
          <p className="mt-2 text-base text-foreground/60">
            Загрузите историю с ПК, телефона или из paimon.moe
          </p>
        )}
      </div>

      <div className="mt-6 flex gap-1 border-b border-black/[0.06]">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setPlatform(t.id)}
            className={`-mb-px px-4 py-2.5 text-sm font-bold transition ${
              platform === t.id
                ? "border-b-2 border-[#189b8e] text-[#189b8e]"
                : "text-foreground/45 hover:text-foreground/70"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-7 space-y-7">
        {platform === "pc" && (
          <div className="space-y-6 text-[15px] leading-relaxed text-foreground/75 sm:text-base">
            <SimpleStep n={1}>
              <p>
                В игре откройте{" "}
                <strong className="text-foreground">Молитва → История</strong>,
                дождитесь загрузки и закройте окно.
              </p>
            </SimpleStep>
            <SimpleStep n={2}>
              <p>
                Win+R → введите{" "}
                <strong className="text-foreground">powershell</strong> →
                вставьте команду:
              </p>
              <button
                type="button"
                disabled={!oneLiner || blocked}
                onClick={() => void copyScript()}
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-black/[0.08] bg-muted/70 px-4 py-3.5 text-left transition hover:border-[#189b8e]/35 hover:bg-muted disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.08]"
              >
                <span className="min-w-0 flex-1 truncate font-mono text-[13px] text-foreground/80">
                  {oneLiner || "Загрузка команды…"}
                </span>
                <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-[#189b8e]">
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" /> Готово
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" /> Копировать
                    </>
                  )}
                </span>
              </button>
            </SimpleStep>
            <SimpleStep n={3}>
              <p>Вернитесь сюда и вставьте ссылку из буфера.</p>
              <ImportActions
                busy={busy}
                onPaste={() => void pasteAndImport()}
              />
            </SimpleStep>
          </div>
        )}

        {platform === "android" && (
          <div className="space-y-6 text-[15px] leading-relaxed text-foreground/75 sm:text-base">
            <SimpleStep n={1}>
              <p>Откройте историю молитв в игре и дождитесь загрузки.</p>
            </SimpleStep>
            <SimpleStep n={2}>
              <p>В окне истории нажмите «Поделиться» → «Копировать ссылку».</p>
            </SimpleStep>
            <SimpleStep n={3}>
              <p>Вставьте ссылку сюда.</p>
              <ImportActions
                busy={busy}
                onPaste={() => void pasteAndImport()}
              />
            </SimpleStep>
          </div>
        )}

        {platform === "ios" && (
          <div className="space-y-6 text-[15px] leading-relaxed text-foreground/75 sm:text-base">
            <SimpleStep n={1}>
              <p>Откройте историю молитв в игре и дождитесь загрузки.</p>
            </SimpleStep>
            <SimpleStep n={2}>
              <p>«Поделиться» → «Скопировать» — ссылка попадёт в буфер.</p>
            </SimpleStep>
            <SimpleStep n={3}>
              <p>Вернитесь на сайт и вставьте ссылку.</p>
              <ImportActions
                busy={busy}
                onPaste={() => void pasteAndImport()}
              />
            </SimpleStep>
          </div>
        )}

        {platform === "paimon" && (
          <div className="space-y-6 text-[15px] leading-relaxed text-foreground/75 sm:text-base">
            <p className="rounded-2xl border border-amber-500/25 bg-amber-500/15 px-4 py-3 text-sm font-medium text-amber-950 dark:border-amber-400/30 dark:bg-amber-400/15 dark:text-amber-100">
              Импорт из paimon.moe заменит все текущие молитвы этого аккаунта.
            </p>
            <SimpleStep n={1}>
              <p>
                В paimon.moe: Settings → Export & Import Data → Download Data.
              </p>
            </SimpleStep>
            <SimpleStep n={2}>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setReplaceConfirm({ kind: "file", file: f });
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                disabled={blocked}
                onClick={() => fileRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#189b8e] px-5 py-3 text-sm font-bold text-white disabled:opacity-50 sm:w-fit"
              >
                <Upload className="h-4 w-4" />
                Выбрать JSON-файл
              </button>
            </SimpleStep>
            <SimpleStep n={3}>
              <p>Или публичная ссылка Google Drive:</p>
              <input
                value={driveUrl}
                onChange={(e) => setDriveUrl(e.target.value)}
                placeholder="https://drive.google.com/file/d/…"
                className="w-full rounded-2xl border border-black/[0.08] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#189b8e]/25"
              />
              <button
                type="button"
                disabled={blocked || !driveUrl.trim()}
                onClick={() => setReplaceConfirm({ kind: "drive" })}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#189b8e] px-5 py-3 text-sm font-bold text-[#189b8e] disabled:opacity-50 sm:w-fit"
              >
                <Cloud className="h-4 w-4" />
                Импорт с Drive
              </button>
            </SimpleStep>
          </div>
        )}

        {(busy || progress) && (
          <div className="rounded-2xl bg-[#eef8f6] px-4 py-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-[#0f5c54]">
                {progress?.label || "Импортируем…"}
              </p>
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#189b8e]" />
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-[#189b8e] transition-all duration-500"
                style={{ width: `${Math.max(progressPct, 8)}%` }}
              />
            </div>
            {progress && (
              <p className="mt-2 text-xs text-[#0f5c54]/80">
                {progress.step > 0
                  ? `Баннер ${progress.step}/${progress.steps}`
                  : null}
                {progress.page > 0 ? ` · стр. ${progress.page}` : null}
                {progress.totalApprox && progress.totalApprox > 0
                  ? ` · ${progress.totalPulled.toLocaleString("ru-RU")} / ${progress.totalApprox.toLocaleString("ru-RU")}`
                  : ` · ${progress.totalPulled.toLocaleString("ru-RU")}`}
              </p>
            )}
          </div>
        )}

        {platform !== "paimon" && (
          <div className="rounded-2xl border border-dashed border-black/[0.1] bg-muted/70 p-4 dark:border-white/10 dark:bg-white/[0.03]">
            <p className="text-sm font-bold text-foreground/70">
              Быстрый импорт по ссылке
            </p>
            <p className="mt-1 text-sm text-foreground/50">
              Если ссылка уже есть — вставьте сюда, без PowerShell.
            </p>
            <textarea
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              rows={2}
              placeholder="https://…authkey=…"
              className="mt-3 w-full rounded-2xl border border-black/[0.08] bg-card px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-[#189b8e]/25 dark:border-white/10 dark:bg-white/[0.04]"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={blocked}
                className="rounded-2xl bg-[#189b8e] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                onClick={() => void pasteAndImport()}
              >
                Из буфера
              </button>
              <button
                type="button"
                disabled={blocked || !url.trim()}
                className="rounded-2xl border border-[#189b8e] px-5 py-2.5 text-sm font-bold text-[#189b8e] disabled:opacity-50"
                onClick={() => void importManualUrl()}
              >
                Импортировать ссылку
              </button>
            </div>
          </div>
        )}

        {feedbackError && (
          <div className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3.5 text-sm leading-relaxed text-red-800 dark:border-red-400/30 dark:bg-red-500/15 dark:text-red-200">
            <p className="font-bold">Не удалось импортировать</p>
            <p className="mt-1">{feedbackError}</p>
          </div>
        )}
        {message && !feedbackError && (
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3.5 text-sm font-medium text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-100">
            {message}
          </div>
        )}
      </div>

      {mounted &&
        replaceConfirm &&
        createPortal(
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4"
            onClick={() => !blocked && setReplaceConfirm(null)}
            role="presentation"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="paimon-replace-title"
              className="w-full max-w-md rounded-3xl bg-white p-7 shadow-panel"
              onClick={(e) => e.stopPropagation()}
            >
              <h3
                id="paimon-replace-title"
                className="font-genshin text-2xl text-foreground"
              >
                Заменить данные?
              </h3>
              <p className="mt-2 text-base leading-relaxed text-foreground/70">
                {replaceConfirm.kind === "drive"
                  ? "Импорт с Google Drive удалит все текущие молитвы этого аккаунта."
                  : "Импорт из paimon.moe удалит все текущие молитвы этого аккаунта."}
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  disabled={blocked}
                  onClick={() => setReplaceConfirm(null)}
                  className="flex-1 rounded-2xl border border-black/[0.08] py-3 text-sm font-bold disabled:opacity-50"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  disabled={blocked}
                  onClick={confirmReplaceImport}
                  className="flex-1 rounded-2xl bg-[#189b8e] py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  Продолжить
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

function SimpleStep({
  n,
  children,
}: {
  n: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#189b8e]/10 text-sm font-bold text-[#189b8e]">
        {n}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-3">{children}</div>
    </div>
  );
}

function ImportActions({
  busy,
  onPaste,
}: {
  busy: boolean;
  onPaste: () => void;
}) {
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onPaste}
      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#189b8e] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#147f74] disabled:opacity-70 sm:w-fit"
    >
      {busy ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Импортируем…
        </>
      ) : (
        <>
          <ClipboardPaste className="h-4 w-4" />
          Вставить из буфера
        </>
      )}
    </button>
  );
}
