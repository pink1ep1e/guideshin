import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import {
  clientIpFromHeaders,
  countryFromHeaders,
  isBotUserAgent,
  lookupGeo,
  shouldTrackPath,
  type ClientAnalyticsPayload,
} from "@/lib/analytics";
import { withPrisma } from "@/prisma/prisma-client";

export const runtime = "nodejs";

type IncomingBody = {
  events?: ClientAnalyticsPayload[];
};

export async function POST(req: NextRequest) {
  try {
    const ua = req.headers.get("user-agent") || "";
    if (isBotUserAgent(ua)) {
      return NextResponse.json({ ok: true, skipped: "bot" });
    }

    const body = (await req.json().catch(() => null)) as IncomingBody | null;
    const events = Array.isArray(body?.events) ? body!.events.slice(0, 20) : [];
    if (events.length === 0) {
      return NextResponse.json({ error: "No events" }, { status: 400 });
    }

    const ip = clientIpFromHeaders(req.headers);
    const headerGeo = countryFromHeaders(req.headers);
    let geo = {
      country: headerGeo.country as string | undefined,
      countryCode: headerGeo.countryCode,
      city: undefined as string | undefined,
      region: undefined as string | undefined,
    };

    if (!geo.countryCode && ip) {
      const looked = await lookupGeo(ip);
      geo = { ...geo, ...looked };
    } else if (geo.countryCode && !geo.country && ip) {
      const looked = await lookupGeo(ip);
      geo = {
        country: looked.country || geo.country,
        countryCode: geo.countryCode || looked.countryCode,
        city: looked.city,
        region: looked.region,
      };
    }

    const rows = events
      .filter((e) => e?.type && e?.path && e?.sessionId && e?.visitorId)
      .filter((e) => shouldTrackPath(String(e.path)))
      .map((e) => ({
        type: String(e.type).slice(0, 40),
        path: String(e.path).slice(0, 500),
        title: e.title ? String(e.title).slice(0, 300) : null,
        entityType: e.entityType ? String(e.entityType).slice(0, 40) : null,
        entitySlug: e.entitySlug ? String(e.entitySlug).slice(0, 120) : null,
        entityName: e.entityName ? String(e.entityName).slice(0, 200) : null,
        sessionId: String(e.sessionId).slice(0, 80),
        visitorId: String(e.visitorId).slice(0, 80),
        ip,
        country: geo.country ?? null,
        countryCode: geo.countryCode ?? null,
        city: geo.city ?? null,
        region: geo.region ?? null,
        userAgent: ua.slice(0, 800) || null,
        referrer: e.referrer ? String(e.referrer).slice(0, 500) : null,
        language: e.language ? String(e.language).slice(0, 40) : null,
        screen: e.screen ? String(e.screen).slice(0, 40) : null,
        meta:
          e.meta && typeof e.meta === "object"
            ? (e.meta as Prisma.InputJsonValue)
            : undefined,
      }));

    if (rows.length === 0) {
      return NextResponse.json({ ok: true, inserted: 0 });
    }

    await withPrisma((prisma) =>
      prisma.analyticsEvent.createMany({ data: rows }),
    );

    return NextResponse.json({ ok: true, inserted: rows.length });
  } catch (err) {
    console.error("[analytics]", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
