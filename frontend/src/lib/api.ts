/**
 * Client for the URL shortener API.
 *
 * In the browser, calls are same-origin and Next rewrites /backend/* -> the backend
 * (see next.config.ts), so CORS is a non-issue.
 *
 * On the server, Node's fetch (undici) needs an absolute URL, so we resolve the
 * origin from the incoming request's Host header. This keeps the same /backend
 * rewrite working for SSR too.
 */
export interface UrlRecord {
  _id: string;
  longURL: string;
  shortURL: string;
  totalVisits: number;
  lastVisitedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** Origin that serves GET /:code, i.e. where a shortened link must point. */
const SHORT_LINK_ORIGIN = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/** Same-origin prefix handled by the rewrite in next.config.ts. */
const PROXY = "/backend";

async function request<T>(path: string, init?: RequestInit, origin?: string | null): Promise<T> {
  let url: string;

  if (typeof window === "undefined") {
    // Server-side: undici needs an absolute URL. The /backend rewrite only
    // applies to browser navigation, so resolve against the request origin.
    const o = origin ?? `http://localhost:${process.env.PORT ?? 3001}`;
    url = `${o}${PROXY}${path}`;
  } else {
    url = `${PROXY}${path}`;
  }

  let response: Response;

  try {
    response = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
      cache: "no-store",
    });
  } catch {
    throw new ApiError("Can't reach the API. Is the backend running?", 0);
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(data?.message ?? `Request failed (${response.status})`, response.status);
  }

  return data as T;
}

export function shortenUrl(longURL: string): Promise<UrlRecord> {
  return request<{ message: string; url: UrlRecord }>("/api/shorten", {
    method: "POST",
    body: JSON.stringify({ longURL }),
  }).then((data) => data.url);
}

export function fetchUrlStats(code: string, origin?: string | null): Promise<UrlRecord> {
  return request<{ message: string; url: UrlRecord }>(
    `/api/shorten/${encodeURIComponent(code)}/stats`,
    undefined,
    origin
  ).then((data) => data.url);
}

/** The clickable short link, e.g. http://localhost:3001/abc123 */
export function buildShortLink(code: string): string {
  return `${SHORT_LINK_ORIGIN}/${code}`;
}

/** Strip protocol + trailing slash so a long URL renders cleanly in the UI. */
export function displayOrigin(url: string): string {
  try {
    const { hostname, pathname } = new URL(url);
    return hostname + (pathname === "/" ? "" : pathname);
  } catch {
    return url;
  }
}