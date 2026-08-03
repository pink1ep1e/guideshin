"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  parseEntityFromPath,
  shouldTrackPath,
  type AnalyticsEventType,
  type ClientAnalyticsPayload,
} from "@/lib/analytics";

const VISITOR_KEY = "gs_vid";
const SESSION_KEY = "gs_sid";

function rid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

function getVisitorId() {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = rid("v");
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return rid("v");
  }
}

function getSessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = rid("s");
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return rid("s");
  }
}

function screenInfo() {
  if (typeof window === "undefined") return undefined;
  return `${window.screen.width}x${window.screen.height}`;
}

const queue: ClientAnalyticsPayload[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function flush() {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (queue.length === 0) return;
  const events = queue.splice(0, queue.length);
  const body = JSON.stringify({ events });
  try {
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      const ok = navigator.sendBeacon("/api/analytics", blob);
      if (ok) return;
    }
  } catch {
    /* fall through */
  }
  void fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
}

function enqueue(partial: Omit<ClientAnalyticsPayload, "sessionId" | "visitorId">) {
  if (typeof window === "undefined") return;
  if (!shouldTrackPath(partial.path)) return;

  queue.push({
    ...partial,
    sessionId: getSessionId(),
    visitorId: getVisitorId(),
    referrer: document.referrer || undefined,
    language: navigator.language || undefined,
    screen: screenInfo(),
  });

  if (queue.length >= 8) {
    flush();
    return;
  }
  if (!flushTimer) flushTimer = setTimeout(flush, 800);
}

/** Публичный трекер для кликов / Telegram / внешних ссылок. */
export function trackEvent(
  type: AnalyticsEventType,
  opts: {
    path?: string;
    title?: string;
    entityName?: string;
    meta?: Record<string, unknown>;
  } = {},
) {
  const path = opts.path || (typeof window !== "undefined" ? window.location.pathname : "/");
  const parsed = parseEntityFromPath(path);
  enqueue({
    type,
    path,
    title: opts.title || (typeof document !== "undefined" ? document.title : undefined),
    entityType: parsed.entityType,
    entitySlug: parsed.entitySlug,
    entityName: opts.entityName,
    meta: opts.meta,
  });
  flush();
}

function AnalyticsTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastKey = useRef<string>("");

  useEffect(() => {
    if (!pathname || !shouldTrackPath(pathname)) return;
    const qs = searchParams?.toString();
    const key = qs ? `${pathname}?${qs}` : pathname;
    if (lastKey.current === key) return;
    lastKey.current = key;

    const parsed = parseEntityFromPath(pathname);

    const t = window.setTimeout(() => {
      const nameGuess = document.title.replace(/\s*\|\s*.*$/i, "").trim();
      enqueue({
        type: "pageview",
        path: pathname,
        title: document.title,
        entityType: parsed.entityType,
        entitySlug: parsed.entitySlug,
        entityName:
          parsed.entitySlug && nameGuess && !/guideshin/i.test(nameGuess)
            ? nameGuess
            : undefined,
      });
    }, 150);

    return () => window.clearTimeout(t);
  }, [pathname, searchParams]);

  useEffect(() => {
    function onHide() {
      flush();
    }
    window.addEventListener("pagehide", onHide);
    const onVis = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onVis);
      flush();
    };
  }, []);

  return null;
}

/** Трекер просмотров страниц (без обёртки children). */
export default function AnalyticsProvider() {
  return (
    <Suspense fallback={null}>
      <AnalyticsTrackerInner />
    </Suspense>
  );
}
