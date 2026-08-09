/** Человекочитаемые ошибки импорта (можно на клиенте). */
export function friendlyWishImportError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? "");

  if (/Foreign key|WishAccount_userId_fkey/i.test(raw)) {
    return "Сессия не привязана к аккаунту. Выйдите и войдите снова, затем повторите импорт.";
  }
  if (/Unique constraint|WishPull_accountId_hoyoId/i.test(raw)) {
    return "Часть молитв уже сохранена. Обновите страницу.";
  }
  if (/Unauthorized|SESSION/i.test(raw)) {
    return "Нужно войти в аккаунт заново.";
  }
  if (/USER_NOT_FOUND/i.test(raw)) {
    return "Аккаунт не найден. Выйдите и войдите снова.";
  }
  if (/Invalid `prisma\.|invocation:/i.test(raw)) {
    return "Не удалось сохранить молитвы. Выйдите, войдите снова и попробуйте ещё раз.";
  }

  return raw || "Ошибка импорта. Попробуйте ещё раз.";
}
