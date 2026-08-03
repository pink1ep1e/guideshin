import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized, withPrisma } from "@/lib/admin-api";

export const runtime = "nodejs";

function rangeStart(range: string): Date {
  const now = Date.now();
  const days =
    range === "1d" ? 1 : range === "30d" ? 30 : range === "90d" ? 90 : 7;
  return new Date(now - days * 24 * 60 * 60 * 1000);
}

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const range = req.nextUrl.searchParams.get("range") || "7d";
  const since = rangeStart(range);

  try {
    const data = await withPrisma(async (prisma) => {
      const [
        totalViews,
        totalTelegram,
        uniqueVisitors,
        uniqueSessions,
        topPaths,
        topGuides,
        byCountry,
        byDay,
        recent,
        telegramByPlacement,
      ] = await Promise.all([
        prisma.analyticsEvent.count({
          where: { createdAt: { gte: since }, type: "pageview" },
        }),
        prisma.analyticsEvent.count({
          where: { createdAt: { gte: since }, type: "telegram_click" },
        }),
        prisma.analyticsEvent.groupBy({
          by: ["visitorId"],
          where: { createdAt: { gte: since } },
          _count: true,
        }),
        prisma.analyticsEvent.groupBy({
          by: ["sessionId"],
          where: { createdAt: { gte: since } },
          _count: true,
        }),
        prisma.analyticsEvent.groupBy({
          by: ["path"],
          where: { createdAt: { gte: since }, type: "pageview" },
          _count: { _all: true },
          orderBy: { _count: { path: "desc" } },
          take: 15,
        }),
        prisma.analyticsEvent.groupBy({
          by: ["entityType", "entitySlug", "entityName"],
          where: {
            createdAt: { gte: since },
            type: "pageview",
            entitySlug: { not: null },
            entityType: { in: ["character", "weapon", "artifact", "material"] },
          },
          _count: { _all: true },
          orderBy: { _count: { entityType: "desc" } },
          take: 20,
        }),
        prisma.analyticsEvent.groupBy({
          by: ["country", "countryCode"],
          where: {
            createdAt: { gte: since },
            countryCode: { not: null },
          },
          _count: { _all: true },
          orderBy: { _count: { countryCode: "desc" } },
          take: 15,
        }),
        prisma.$queryRaw<Array<{ day: Date; views: bigint; visitors: bigint }>>`
          SELECT date_trunc('day', "createdAt") AS day,
                 COUNT(*) FILTER (WHERE type = 'pageview') AS views,
                 COUNT(DISTINCT "visitorId") AS visitors
          FROM "AnalyticsEvent"
          WHERE "createdAt" >= ${since}
          GROUP BY 1
          ORDER BY 1 ASC
        `,
        prisma.analyticsEvent.findMany({
          where: { createdAt: { gte: since } },
          orderBy: { createdAt: "desc" },
          take: 80,
          select: {
            id: true,
            type: true,
            path: true,
            title: true,
            entityType: true,
            entitySlug: true,
            entityName: true,
            ip: true,
            country: true,
            countryCode: true,
            city: true,
            region: true,
            referrer: true,
            language: true,
            screen: true,
            userAgent: true,
            meta: true,
            visitorId: true,
            sessionId: true,
            createdAt: true,
          },
        }),
        prisma.$queryRaw<Array<{ placement: string; clicks: bigint }>>`
          SELECT COALESCE(meta->>'placement', 'unknown') AS placement,
                 COUNT(*)::bigint AS clicks
          FROM "AnalyticsEvent"
          WHERE "createdAt" >= ${since}
            AND type = 'telegram_click'
          GROUP BY 1
          ORDER BY clicks DESC
        `,
      ]);

      return {
        range,
        since: since.toISOString(),
        summary: {
          pageviews: totalViews,
          telegramClicks: totalTelegram,
          uniqueVisitors: uniqueVisitors.length,
          sessions: uniqueSessions.length,
        },
        topPaths: topPaths.map((r) => ({
          path: r.path,
          count: r._count._all,
        })),
        topGuides: topGuides
          .map((r) => ({
            entityType: r.entityType,
            entitySlug: r.entitySlug,
            entityName: r.entityName,
            count: r._count._all,
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 15),
        byCountry: byCountry.map((r) => ({
          country: r.country,
          countryCode: r.countryCode,
          count: r._count._all,
        })),
        byDay: byDay.map((r) => ({
          day: r.day,
          views: Number(r.views),
          visitors: Number(r.visitors),
        })),
        telegramByPlacement: telegramByPlacement.map((r) => ({
          placement: r.placement,
          clicks: Number(r.clicks),
        })),
        recent,
      };
    });

    return NextResponse.json(data);
  } catch (err) {
    console.error("[admin/analytics]", err);
    return NextResponse.json(
      { error: "Не удалось загрузить аналитику. Проверьте миграцию БД." },
      { status: 500 },
    );
  }
}
