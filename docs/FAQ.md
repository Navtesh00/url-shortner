# FAQ and glossary

## FAQ

**Can I choose a custom short code?**

Not yet. Custom aliases are on the roadmap.

**Do links expire?**

Not in V1. Expiry + auto-deletion are on the roadmap.

**Are visits deduplicated?**

No — each redirect increments the count, including your own tests.

**What analytics are collected?**

Only `totalVisits` and `lastVisitedAt`. Per-day, country, referrer, and user-agent analytics are not part of V1.

**Is there authentication?**

No — the V1 API is public and unauthenticated. Add rate limiting before exposing it publicly.

## Glossary

| Term | Meaning |
|------|---------|
| Cache hit | Redis already holds the URL record for the requested code. |
| Cache miss | No Redis record → API falls back to MongoDB. |
| Negative caching | Brief caching of a not-found result to avoid repeated DB lookups. |
| Asynchronous visit update | Redirect returns without waiting for the visit write to persist. |
| Eventual consistency | Statistics become accurate shortly after the redirect, not within the same request. |
