import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import type { Metadata } from "next";
import { authOptions } from "@/lib/auth";
import WishCabinet from "@/components/wishes/WishCabinet";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `Счётчик молитв | ${SITE_NAME}` },
  description: "Личный счётчик молитв Genshin Impact: pity, история и импорт с paimon.moe.",
  robots: { index: false, follow: false },
};

export default async function WishesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.kind !== "user") {
    redirect("/auth/login?callbackUrl=/wishes");
  }

  const isAdmin = String(session.user.role || "").toLowerCase() === "admin";

  return (
    <WishCabinet
      userName={session.user.name || session.user.email}
      isAdmin={isAdmin}
    />
  );
}
