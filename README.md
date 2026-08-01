# Guideshin (guideshin.ru)

Next.js 16 + Tailwind CSS + Prisma + Neon Postgres.

## Возможности

- Тёмная/светлая тема (переключатель в шапке, через `next-themes`)
- Страницы персонажей с гайдами хранятся в базе данных (Neon Postgres через Prisma)
- Админ-панель `/admin` — создание, редактирование и удаление персонажей
- Контент страницы персонажа заполняется произвольным HTML-кодом прямо из админки
- Авторизация через `next-auth` (Credentials, пароль хранится в базе хешированным bcrypt)

## Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Neon Postgres

1. Зарегистрируйтесь на https://neon.tech и создайте проект.
2. Скопируйте **pooled connection string** (Dashboard → Connection Details → Pooled connection).
3. Скопируйте `.env.example` в `.env` и вставьте строку подключения в `POSTGRES_URL`.

```bash
cp .env.example .env
```

4. Сгенерируйте `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

и вставьте в `.env`.

### 3. Миграции и заполнение базы

```bash
npx prisma db push       # создаёт таблицы в Neon по schema.prisma
npm run prisma:seed      # заливает список персонажей + создаёт admin-пользователя
```

Сид создаёт учётку админа:

- логин: `admin`
- пароль: `changeme123`

**Обязательно смените пароль после первого входа** (через `prisma studio` или напрямую в базе — сгенерируйте новый bcrypt-хэш).

### 4. Запуск

```bash
npm run dev
```

- Сайт: http://localhost:3000
- Админ-панель: http://localhost:3000/admin/login

## Структура

- `prisma/schema.prisma` — модели `Character`, `Page`, `AdminUser`
- `app/wiki/characters` — список персонажей (из БД)
- `app/wiki/characters/[slug]` — страница гайда, `contentHtml` рендерится напрямую
- `app/admin` — защищённая middleware`ом (`middleware.ts`) панель управления
- `components/admin/CharacterForm.tsx` — форма создания/редактирования, включая textarea с HTML-контентом

## Добавление нового персонажа

1. Зайдите в `/admin`, нажмите «Новый персонаж».
2. Загрузите иконку персонажа в `public/images/mini-characters/` и укажите путь в поле «Путь к иконке».
3. Заполните поле «Содержимое страницы (HTML)» — это то, что увидит пользователь на странице гайда.
4. Сохраните — персонаж сразу появится в `/wiki/characters`.

## Деплой

Проект готов к деплою на Vercel. В настройках проекта на Vercel добавьте переменные окружения `POSTGRES_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (production-домен).
