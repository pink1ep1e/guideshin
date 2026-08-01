import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }
  return globalForPrisma.prisma;
}

function isRetryableDbError(error: unknown): boolean {
  const name = error instanceof Error ? error.name : "";
  const message = error instanceof Error ? error.message : String(error);
  return (
    name.includes("PrismaClientInitializationError") ||
    message.includes("Can't reach database server") ||
    message.includes("P1001") ||
    message.includes("P1017") ||
    message.includes("Connection reset") ||
    message.includes("Timed out fetching") ||
    message.includes("Server has closed the connection")
  );
}

export async function withPrisma<T>(run: (prisma: PrismaClient) => Promise<T>): Promise<T> {
  const maxAttempts = 3;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const prisma = getPrisma();
    try {
      return await run(prisma);
    } catch (error) {
      lastError = error;
      const retry = isRetryableDbError(error) && attempt < maxAttempts;
      if (!retry) throw error;
      // Recreate client after a broken connection
      await prisma.$disconnect().catch(() => undefined);
      globalForPrisma.prisma = undefined;
      await new Promise((r) => setTimeout(r, 350 * attempt));
    }
  }

  throw lastError;
}

export function prismaErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return "Ошибка базы данных";
  if (error.message.includes("Can't reach database server")) {
    return "Не удалось подключиться к базе (Neon). Попробуйте ещё раз через пару секунд.";
  }
  if (error.message.includes("Unique constraint")) {
    return "Такой slug уже занят. Измените slug и сохраните снова.";
  }
  return error.message.split("\n")[0] || "Ошибка базы данных";
}
