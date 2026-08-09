"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Check,
  ClipboardPaste,
  Copy,
  Loader2,
  AlertCircle,
  Upload,
  Smartphone,
  Monitor,
  Cloud,
  Terminal,
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
  compact?: boolean;
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
  compact = false,
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
      const text = (await navigator.clipboard.readText()).trim();
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

  const tabs: { id: Platform; label: string; icon: React.ReactNode }[] = [
    { id: "pc", label: "PC", icon: <Monitor className="h-3.5 w-3.5" /> },
    {
      id: "android",
      label: "Android",
      icon: <Smartphone className="h-3.5 w-3.5" />,
    },
    { id: "ios", label: "iOS", icon: <Smartphone className="h-3.5 w-3.5" /> },
    { id: "paimon", label: "Paimon", icon: <Cloud className="h-3.5 w-3.5" /> },
  ];

  return (
    <div
      id="wish-import"
      className={`overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_12px_32px_-20px_rgba(15,70,60,0.35)] ${
        compact ? "" : ""
      }`}
    >
      <div
        className={`border-b border-black/[0.05] bg-gradient-to-br from-[#e8f7f5] via-white to-[#f3fbfa] ${
          compact ? "px-4 py-4" : "px-5 py-5"
        }`}
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#189b8e]">
          Автоимпорт
        </p>
        <h2
          className={`mt-0.5 font-genshin tracking-wide text-foreground ${
            compact ? "text-xl" : "text-2xl"
          }`}
        >
          Импорт молитв
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-foreground/70">
          Выберите платформу — короткая инструкция и импорт в одном месте.
        </p>
        {targetAccountLabel ? (
          <p className="mt-2 rounded-lg bg-white/80 px-3 py-2 text-sm font-bold text-[#0f5c54] ring-1 ring-[#189b8e]/20">
            Загрузка на аккаунт: {targetAccountLabel}
            {targetAccountServer ? (
              <span className="font-medium text-foreground/60">
                {" "}
                · {targetAccountServer}
              </span>
            ) : null}
          </p>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-1.5">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setPlatform(t.id)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                platform === t.id
                  ? "bg-[#189b8e] text-white"
                  : "bg-white/90 text-foreground/70 ring-1 ring-black/[0.06]"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className={compact ? "space-y-4 px-4 py-4" : "space-y-5 px-5 py-5"}>
        {platform === "pc" && (
          <ol className="space-y-4 text-sm leading-relaxed">
            <Step n={1} title="История в игре">
              Молитва → История молитв → дождитесь загрузки → закройте окно.
            </Step>
            <Step n={2} title="Команда в PowerShell">
              Win+R →{" "}
              <code className="rounded-md bg-black/[0.06] px-1.5 py-0.5 text-[13px] font-semibold">
                powershell
              </code>{" "}
              → вставьте команду:
              <div className="mt-3 overflow-hidden rounded-2xl border border-[#1a3d38] bg-gradient-to-b from-[#122824] to-[#0b1a17] shadow-[0_12px_28px_-16px_rgba(15,70,60,0.55)]">
                <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-3.5 py-2.5">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#189b8e]/20 ring-1 ring-[#189b8e]/35">
                      <Terminal className="h-4 w-4 text-[#7dede2]" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold tracking-wide text-[#c8f5f0]">
                        PowerShell
                      </p>
                      <p className="truncate text-[11px] text-white/45">
                        get-wish-url.ps1
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={!oneLiner || blocked}
                    onClick={() => void copyScript()}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition disabled:opacity-40 ${
                      copied
                        ? "bg-emerald-400/20 text-emerald-200 ring-1 ring-emerald-300/30"
                        : "bg-white/[0.08] text-[#9be8df] ring-1 ring-white/10 hover:bg-[#189b8e]/35 hover:text-white"
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        Скопировано
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Копировать
                      </>
                    )}
                  </button>
                </div>
                <div className="relative px-3.5 py-3.5">
                  <pre className="max-h-36 overflow-auto whitespace-pre-wrap break-all font-mono text-[12px] leading-relaxed text-[#a8f0e8] [scrollbar-width:thin]">
                    {oneLiner || (
                      <span className="text-white/40">Загрузка команды…</span>
                    )}
                  </pre>
                </div>
              </div>
            </Step>
            <Step n={3} title="Импорт">
              <ImportActions
                busy={busy}
                onPaste={() => void pasteAndImport()}
              />
            </Step>
          </ol>
        )}

        {platform === "android" && (
          <ol className="space-y-4 text-sm leading-relaxed">
            <Step n={1} title="Откройте историю">
              В Genshin: Молитва → История молитв, дождитесь загрузки.
            </Step>
            <Step n={2} title="Скопируйте ссылку">
              Нажмите «Поделиться» (или меню) в окне истории → «Копировать
              ссылку». Если кнопки нет — откройте историю через браузер телефона
              после входа в аккаунт HoYoverse.
            </Step>
            <Step n={3} title="Вставьте сюда">
              <ImportActions
                busy={busy}
                onPaste={() => void pasteAndImport()}
              />
            </Step>
          </ol>
        )}

        {platform === "ios" && (
          <ol className="space-y-4 text-sm leading-relaxed">
            <Step n={1} title="Откройте историю">
              В Genshin: Молитва → История молитв, дождитесь загрузки.
            </Step>
            <Step n={2} title="Поделиться → Скопировать">
              В углу окна истории нажмите «Поделиться» → «Скопировать». Ссылка с
              authkey попадёт в буфер.
            </Step>
            <Step n={3} title="Импорт на сайте">
              Вернитесь в Safari/Chrome на Guideshin и нажмите кнопку ниже.
              <div className="mt-2">
                <ImportActions
                  busy={busy}
                  onPaste={() => void pasteAndImport()}
                />
              </div>
            </Step>
          </ol>
        )}

        {platform === "paimon" && (
          <div className="space-y-4 text-base leading-relaxed">
            <div className="rounded-xl border border-amber-300/80 bg-amber-50 px-3.5 py-3 text-sm text-amber-950">
              <p className="font-bold">Важно</p>
              <p className="mt-1">
                Импорт из paimon.moe <strong>удалит все текущие молитвы</strong>{" "}
                выбранного игрового аккаунта и заменит их данными из файла.
              </p>
            </div>
            <p className="text-foreground/75">
              paimon.moe → Settings → Export & Import Data → Download Data. Затем
              загрузите файл сюда.
            </p>
            <ol className="space-y-4">
              <Step n={1} title="Экспорт в paimon.moe">
                Settings → Export & Import Data → Download Data
                (`paimon-moe-local-data….json`).
              </Step>
              <Step n={2} title="Загрузить JSON">
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
                  className="inline-flex items-center gap-2 rounded-xl bg-[#189b8e] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                  Выбрать файл paimon.moe
                </button>
              </Step>
              <Step n={3} title="Или ссылка Google Drive">
                Файл должен быть публичным по ссылке:
                <input
                  value={driveUrl}
                  onChange={(e) => setDriveUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/…"
                  className="mt-2 w-full rounded-xl border border-black/[0.08] px-3 py-2.5 text-sm outline-none ring-[#189b8e]/30 focus:ring-2"
                />
                <button
                  type="button"
                  disabled={blocked || !driveUrl.trim()}
                  onClick={() => setReplaceConfirm({ kind: "drive" })}
                  className="mt-2 inline-flex items-center gap-2 rounded-xl border-2 border-[#189b8e] px-3.5 py-2.5 text-sm font-bold text-[#189b8e] disabled:opacity-50"
                >
                  <Cloud className="h-4 w-4" />
                  Импорт с Drive
                </button>
              </Step>
            </ol>
          </div>
        )}

        {(busy || progress) && (
          <div className="rounded-xl border border-[#189b8e]/25 bg-[#e8f7f5] p-3">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-[#0f5c54]">
                {progress?.label || "Импортируем…"}
              </p>
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#189b8e]" />
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/80">
              <div
                className="h-full rounded-full bg-[#189b8e] transition-all duration-500"
                style={{ width: `${Math.max(progressPct, 8)}%` }}
              />
            </div>
            {progress && (
              <p className="mt-2 text-xs font-medium text-[#0f5c54]/85">
                {progress.step > 0
                  ? `Баннер ${progress.step}/${progress.steps}`
                  : null}
                {progress.page > 0 ? ` · стр. ${progress.page}` : null}
                {progress.totalApprox && progress.totalApprox > 0
                  ? ` · обработано ${progress.totalPulled.toLocaleString("ru-RU")} / ${progress.totalApprox.toLocaleString("ru-RU")}`
                  : ` · собрано ${progress.totalPulled.toLocaleString("ru-RU")}`}
              </p>
            )}
          </div>
        )}

        {platform !== "paimon" && (
          <details className="rounded-xl border border-black/[0.06] bg-[#f7faf9] p-3">
            <summary className="cursor-pointer text-xs font-bold text-foreground/65">
              Вставить ссылку вручную
            </summary>
            <textarea
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              rows={2}
              placeholder="https://…authkey=…"
              className="mt-2 w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-sm outline-none ring-[#189b8e]/30 focus:ring-2"
            />
            <button
              type="button"
              disabled={blocked || !url.trim()}
              className="mt-2 w-full rounded-lg border border-[#189b8e] py-2 text-xs font-bold text-[#189b8e] disabled:opacity-50"
              onClick={() => void importManualUrl()}
            >
              Импортировать
            </button>
          </details>
        )}

        {feedbackError && (
          <div className="flex gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-sm leading-relaxed text-red-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-bold">Ошибка импорта</p>
              <p className="mt-0.5">{feedbackError}</p>
            </div>
          </div>
        )}
        {message && !feedbackError && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm font-medium text-emerald-900">
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
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-panel"
              onClick={(e) => e.stopPropagation()}
            >
              <h3
                id="paimon-replace-title"
                className="font-genshin text-2xl text-foreground"
              >
                Заменить данные?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground/75">
                {replaceConfirm.kind === "drive"
                  ? "Импорт с Google Drive удалит все текущие молитвы этого игрового аккаунта и заменит их данными из файла."
                  : "Импорт из paimon.moe удалит все текущие молитвы этого игрового аккаунта и заменит их данными из файла."}
              </p>
              <div className="mt-6 flex gap-2.5">
                <button
                  type="button"
                  disabled={blocked}
                  onClick={() => setReplaceConfirm(null)}
                  className="flex-1 rounded-xl border border-black/[0.08] py-3 text-sm font-bold disabled:opacity-50"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  disabled={blocked}
                  onClick={confirmReplaceImport}
                  className="flex-1 rounded-xl bg-[#189b8e] py-3 text-sm font-bold text-white disabled:opacity-50"
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

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#189b8e] text-xs font-bold text-white">
        {n}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-foreground">{title}</p>
        <div className="mt-1 text-foreground/70">{children}</div>
      </div>
    </li>
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
      className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#189b8e] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#147f74] disabled:opacity-70 sm:w-auto"
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
