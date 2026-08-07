# Шаблоны гайдов

## Быстрый цикл нового персонажа

1. Открой `scripts/templates/fetch-guide-sources.ts` → заполни `CONFIG` (`slug`, `yattaId`, `wotpackUrl`, `hoyolabEntryId`).
2. Запусти:
   ```bash
   npx tsx scripts/templates/fetch-guide-sources.ts
   ```
3. Смотри `scripts/_cache/<slug>/`:
   - `yatta-extracted.json` — RU имена/описания талантов и конст + таблицы L1–13
   - `wotpack.txt` / `wotpack.md` — текст билда (в финальном гайде источники не упоминать)
4. Скопируй `scripts/templates/seed-character-guide.TEMPLATE.ts` → `scripts/seed-<slug>-guide.ts`  
   или возьми за основу последний готовый сид (`seed-illugi-guide.ts`).
5. Заполни оружие / сеты / отряды / блоки; таланты можно оставить автозагрузкой из `yatta-extracted.json`.
6. Запусти сид:
   ```bash
   npx tsx scripts/seed-<slug>-guide.ts
   ```

## Жёсткие правила

- Lookup персонажа только `findUnique({ where: { slug } })`
- Не трогать `image` / `splashImage`
- Не писать названия сайтов-источников
- Артефакты: только Пески / Кубок / Корона
- Без Путешественника
- Иконки талантов/конст — заглушки путей ок

## Утилиты

- `scripts/lib/extract-yatta-avatar.ts` — парсит yatta JSON → extracted; `{LINK}`/`<color>` → `**акцент**`, `\\n` → реальные переносы (`cleanYattaText`)
- `scripts/lib/seed-guide-helpers.ts` — общие find*/ranked*/matCard
