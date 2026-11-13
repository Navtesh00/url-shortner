# URL Shortener API

See the [main README](../README.md) for project overview, quick start, architecture, and API reference.

## Backend-specific notes

- Entry point: `backend/server.js` (Express API)
- Visit worker: `backend/worker.js` (separate process; required for visit counting)
- Cache layer: Redis via `backend/src/services/url_cache_service.js`
- Flush scheduler: `backend/src/jobs/flush_scheduler.js` (10-minute backstop)
- Environment: copy `backend/.env.example` to `backend/.env`
- Tests: `backend/tests/unit/` — run `npm test` from `backend/`

## Backend setup

```bash
cd backend
cp .env.example .env
npm install
npm run dev          # API
npm run worker:dev   # Visit worker (separate terminal)
```

Deep-dive engineering notes (cache keys, flush algorithm, dirty set, validation) are in `docs/ENGINEERING.md`.
