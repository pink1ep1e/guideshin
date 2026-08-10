import type { PrismaClient } from "@prisma/client";
import type { AccountLuckSnapshot } from "@/lib/wish-luck";

type CatalogCache = {
  at: number;
  characters: {
    slug: string;
    name: string;
    image: string;
    rarity: string;
    element: string;
  }[];
  weapons: {
    slug: string;
    name: string;
    image: string;
    rarity: string;
  }[];
  defaultAvatarUrl: string | null;
};

type PeerCache = {
  at: number;
  peers: AccountLuckSnapshot[];
};

const CATALOG_TTL_MS = 10 * 60 * 1000;
const PEER_TTL_MS = 8 * 60 * 1000;

const g = globalThis as unknown as {
  __wishCatalogCache?: CatalogCache;
  __wishPeerCache?: PeerCache;
};

/** Иконка Путешественника из каталога (даже если не published). */
export async function getDefaultWishAvatarUrl(
  prisma: PrismaClient,
): Promise<string | null> {
  const cached = g.__wishCatalogCache;
  if (cached && Date.now() - cached.at < CATALOG_TTL_MS) {
    return cached.defaultAvatarUrl;
  }
  const data = await loadWishGuideCatalog(prisma);
  return data.defaultAvatarUrl;
}

export async function loadWishGuideCatalog(prisma: PrismaClient) {
  const cached = g.__wishCatalogCache;
  if (cached && Date.now() - cached.at < CATALOG_TTL_MS) {
    return cached;
  }

  const [characters, weapons, traveler] = await Promise.all([
    prisma.character.findMany({
      where: { published: true },
      select: {
        slug: true,
        name: true,
        image: true,
        rarity: true,
        element: true,
      },
    }),
    prisma.weapon.findMany({
      where: { published: true },
      select: { slug: true, name: true, image: true, rarity: true },
    }),
    prisma.character.findFirst({
      where: {
        OR: [
          { slug: { startsWith: "puteshestvennik" } },
          { slug: { contains: "traveler" } },
          { name: { equals: "Путешественник" } },
        ],
      },
      select: { image: true },
      orderBy: { id: "asc" },
    }),
  ]);

  const next: CatalogCache = {
    at: Date.now(),
    characters,
    weapons,
    defaultAvatarUrl: traveler?.image || null,
  };
  g.__wishCatalogCache = next;
  return next;
}

export function getCachedPeerSnapshots(): AccountLuckSnapshot[] | null {
  const cached = g.__wishPeerCache;
  if (!cached) return null;
  if (Date.now() - cached.at > PEER_TTL_MS) return null;
  return cached.peers;
}

export function setCachedPeerSnapshots(peers: AccountLuckSnapshot[]) {
  g.__wishPeerCache = { at: Date.now(), peers };
}
