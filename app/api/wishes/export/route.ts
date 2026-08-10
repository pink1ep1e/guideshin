import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { resolveWishUser } from "@/lib/wish-auth";
import { withPrisma } from "@/prisma/prisma-client";
import { buildUigfExport } from "@/lib/wish-uigf";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const user = await resolveWishUser(session);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accountId = new URL(req.url).searchParams.get("accountId");

  const data = await withPrisma(async (prisma) => {
    const account = accountId
      ? await prisma.wishAccount.findFirst({
          where: { id: accountId, userId: user.id },
        })
      : await prisma.wishAccount.findFirst({
          where: { userId: user.id },
          orderBy: { createdAt: "asc" },
        });
    if (!account) return null;

    const pulls = await prisma.wishPull.findMany({
      where: { accountId: account.id },
      orderBy: { wishTime: "asc" },
      select: {
        hoyoId: true,
        gachaType: true,
        itemName: true,
        itemType: true,
        rankType: true,
        wishTime: true,
      },
    });

    return { account, pulls };
  });

  if (!data) {
    return NextResponse.json({ error: "Аккаунт не найден" }, { status: 404 });
  }

  const payload = buildUigfExport({
    uid: data.account.uid,
    accountLabel: data.account.label,
    pulls: data.pulls,
  });

  const filename = `guideshin-uigf-${data.account.label.replace(/\s+/g, "-")}.json`;
  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
