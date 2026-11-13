# Engineering notes

## Short-code generation & data model

| Field | Type | Constraints / purpose |
|-------|------|----------------------|
| `longURL` | String | Required, trimmed, ≤ 2,048 chars |
| `shortURL` | String | Required, unique, indexed; six-character code |
| `totalVisits` | Number | Defaults to `0` |
| `lastVisitedAt` | Date | `null` until a visit is recorded |
| `createdAt` / `updatedAt` | Date | Mongoose `timestamps: true` |

`customAlphabet` treats its argument as a literal character set — it does not expand ranges like `A-Z`. Pass the full alphabet explicitly:

```js
import { customAlphabet } from "nanoid";

const alphabet =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"; // 62 chars
const generateCode = customAlphabet(alphabet, 6);
```

62⁶ = **56,800,235,584** possible six-character codes. The database `unique` index remains the final guard; creation retries on a duplicate-key conflict.

## Redis caching & visit processing

Redis accelerates URL resolution. MongoDB remains the persistent store.

| Key pattern | Value | Purpose |
|-------------|-------|---------|
| `{KEY_PREFIX}:url:{code}` | Cached URL record | Resolve repeat redirects without a MongoDB read |
| `{KEY_PREFIX}:notfound:{code}` | Short-lived marker (string + TTL) | Stop repeated lookups for unknown codes |

Exact key names and TTLs live in `backend/src/services/url_cache_service.js`.

### Request behavior

1. Redirect checks Redis.
2. On miss, API queries MongoDB and caches the record.
3. API emits `302` immediately.
4. A BullMQ `update-visit-count` job is enqueued.
5. The worker `$inc`s `totalVisits` and sets `lastVisitedAt`.

Because step 5 is async, statistics can be briefly stale. The worker must be running.

## Validation & error handling

Frontend (`lib/validators.ts`) and backend (`utils/validators.js`) share rules: accept absolute `http` / `https` URLs, reject malformed codes.

| Error source | HTTP response |
|--------------|---------------|
| `AppError` | Its own status code + message |
| MongoDB duplicate key (`11000`) | `409 Conflict` |
| Mongoose `CastError` | `400` with a readable message |
| Mongoose `ValidationError` | `400` with a validation message |
| Unhandled error | `500`; stack only in development |

```js
throw new AppError("Short URL not found", 404);
```

Constructor order is `(message, statusCode)`.

### SSRF note

URL syntax validation alone doesn't prevent SSRF. Block `localhost`, private ranges (`10/8`, `172.16/12`, `192.168/16`), and link-local (`169.254/16`) destinations.

## Dirty set iteration (write-behind flush)

The dirty set is iterated with `SSCAN` and members are removed only after their `$inc` succeeds; `SPOP` is avoided because it discards the code before the drain has a chance to fail safely. A crash mid-drain therefore leaves the code in `dirty` with the count preserved in `flush:{code}:{jobId}`, and the retry resolves to a no-such-key `SREM` rather than a double count.
