# URL Shortener — Frontend

Next.js 16 App Router frontend for the URL shortener API. Provides the shorten form, stats lookup, and per-code stats pages, proxying API calls through Next.js rewrites so the browser never calls the backend cross-origin.

## Pages

| Path | Purpose |
|------|---------|
| `/` | Home — shorten form to create a new short link |
| `/stats` | Stats lookup — enter a 6-character code to view click counts |
| `/stats/[code]` | Per-code stats page — live visit count, last visit time, copyable short link |

## Connecting to the backend

The browser never calls the API cross-origin. Instead, `next.config.ts` rewrites `/backend/:path*` → `BACKEND_URL`. All browser code uses relative `/backend/...` paths (`src/lib/api.ts`).

Server-side fetches (SSR on `/stats/[code]`) resolve an absolute URL from the incoming request's `Host` header, so the same rewrite works on the server too.

## Required environment variables

Copy `.env.local.example` to `.env.local` and adjust for your environment:

```bash
cp .env.local.example .env.local
```

| Variable | Description | Default |
|----------|-------------|---------|
| `BACKEND_URL` | Origin of the backend API (used by `next.config.ts` rewrites) | `http://localhost:3001` |
| `NEXT_PUBLIC_API_URL` | Origin used to build/copy short links shown to users | `http://localhost:3001` |

Keep `BACKEND_URL` and `NEXT_PUBLIC_API_URL` in sync in development. In production, set both to your deployed backend origin.

## Setup

### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Configure environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local` if your backend runs on a different host or port.

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The backend must be running on `BACKEND_URL` (default `http://localhost:3001`).

## Screenshots

### Home page — shorten form

![Home page screenshot](./docs/screenshots/home.png)

### Stats page — per-code visit tracking

![Stats page screenshot](./docs/screenshots/stats.png)

> Add screenshots under `frontend/docs/screenshots/` to replace these placeholders.

## Build

```bash
npm run build
```

Next.js also runs type-checking during build. Lint separately:

```bash
npm run lint
```

## Architecture notes

- `@/*` maps to `frontend/src/*`.
- `NEXT_PUBLIC_API_URL` is the origin used for displayed/copied short links, not for proxying — it's duplicated in `src/lib/api.ts:32` and `src/components/stats-view.tsx:21`; keep both (and `BACKEND_URL`) in sync.
- Backend has no CORS middleware; the proxy rewrite is the CORS workaround. In production, configure CORS on the backend to allow only the frontend origin.
