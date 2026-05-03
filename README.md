# Ansara Reels

Веб-приложение, позволяющее создавать настраиваемые сетки коротких видео (рилсы) и встраивать их на любой сайт через `<iframe>`. Каждый проект получает уникальный публичный URL, ведёт уникальные просмотры и клики, и поддерживает гибкую настройку внешнего вида.

## Стек

- **Next.js 15** (App Router, Server Components)
- **TypeScript**, **TailwindCSS**, **lucide-react**
- **Prisma** + **PostgreSQL 18**
- **NextAuth v5** (Credentials, JWT) + **bcryptjs**
- **AWS SDK v3** для совместимого S3 (TWC Cloud Storage)
- **recharts** для графиков аналитики

## Запуск локально

1. Скопируйте `.env.local.example` в `.env.local` (и создайте файл `.env` с теми же `DATABASE_URL` для Prisma CLI).
2. Установите зависимости:
   ```bash
   npm install
   ```
3. Примените миграции:
   ```bash
   npx prisma migrate deploy
   # или для разработки:
   npx prisma migrate dev
   ```
4. Запустите dev-сервер:
   ```bash
   npm run dev
   ```
5. Откройте `http://localhost:3000`. Зарегистрируйтесь, создайте проект.

## Прод

```bash
npm run build
npm start
```

> На проде обязательно HTTPS — partitioned cookies требуют атрибут `Secure`.

## Структура

- `prisma/schema.prisma` — БД (User, Project, Reel, ReelView, ReelClick).
- `src/app/(auth)` — страницы логина и регистрации.
- `src/app/(dashboard)` — личный кабинет, проекты с табами View/Content/Settings/Analytics.
- `src/app/embed/[slug]` — публичная iframe-friendly страница.
- `src/app/api/...` — REST endpoints: проекты, рилсы, presigned-загрузка, аналитика, треки.
- `src/components/reels` — `ReelGrid`, `ReelCard`, `ReelModal`, `GlowBorder` (4 варианта свечения).
- `src/lib` — `db`, `auth`, `s3`, `viewer`, `settings`, `glow`.

## Загрузка файлов в S3

Файлы заливаются клиентом напрямую в S3 через presigned PUT URL (`POST /api/uploads/presign`), бэкенд хранит только ключ. Все объекты живут под префиксом `ansara-reels/{userId}/{projectId}/{reelId}/`. Лимиты:

- Фоновое изображение: до 5 МБ (jpg/png/webp).
- Видео при наведении: до 10 МБ (mp4/webm).
- Основное видео: до 100 МБ (mp4/webm).

## Аналитика

Просмотр считается, когда зритель открывает рилс в модалке. Уникальность определяется по cookie `arv` (`SameSite=None; Secure; Partitioned` для CHIPS), либо по хэшу IP+User-Agent для браузеров без cookies. На уровне БД — уникальный составной индекс `@@unique([reelId, viewerHash])`. То же для кликов по кнопке.

## Iframe-сниппет

В настройках проекта есть кнопка «Скопировать», копирующая готовый сниппет вида:

```html
<iframe src="https://YOUR_HOST/embed/SLUG" style="width:100%;border:0" loading="lazy" allow="autoplay; encrypted-media"></iframe>
```

Заголовок `Content-Security-Policy: frame-ancestors *` ставится автоматически, поэтому страница встраивается на любой сайт.

## Что не входит в первую итерацию

- Подтверждение email (доменная почта будет позже).
- Загрузка кастомных шрифтов в S3 — есть селектор пресетов и зарезервированное поле `customFontUrl`.
- Биллинг и лимиты на пользователя.
