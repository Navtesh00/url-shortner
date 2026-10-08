"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ArrowUpRight, BarChart3, Link2 } from "lucide-react";

import { buildShortLink, shortenUrl, type UrlRecord } from "@/lib/api";
import { isValidHttpUrl } from "@/lib/validators";
import { truncateMiddle } from "@/lib/format";
import { CopyField } from "@/components/copy-field";
import { CountUp } from "@/components/count-up";

export function ShortenForm() {
  const [longURL, setLongURL] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [record, setRecord] = useState<UrlRecord | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const value = longURL.trim();
    if (!isValidHttpUrl(value)) {
      setError("Enter a valid URL starting with http:// or https://");
      return;
    }

    setError(null);
    setIsPending(true);

    try {
      const created = await shortenUrl(value);
      setRecord(created);
      setLongURL("");
      toast.success("Short link ready");
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Could not shorten that URL";
      setError(message);
      toast.error(message);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
        <input
          value={longURL}
          onChange={(e) => {
            setLongURL(e.target.value);
            if (error) setError(null);
          }}
          disabled={isPending}
          type="url"
          inputMode="url"
          placeholder="https://your-very-long-link.com/analytics?report=42"
          className="flex-1 rounded-lg border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isPending}
          className="whitespace-nowrap rounded-lg bg-brand px-6 py-3 text-sm font-medium text-brand-foreground transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Shortening…" : "Shorten"}
        </button>
      </form>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {record ? <ShortenResult record={record} /> : null}
    </div>
  );
}

function ShortenResult({ record }: { record: UrlRecord }) {
  const shortLink = buildShortLink(record.shortURL);

  return (
    <div className="rounded-xl border border-white/10 bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Link2 className="size-4 text-brand" />
        <h3 className="text-sm font-medium">Your short link</h3>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <CopyField value={shortLink} />
        <a
          href={shortLink}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          Open <ArrowUpRight className="size-3.5" />
        </a>
      </div>

      <p className="mt-3 truncate text-xs text-muted-foreground" title={record.longURL}>
        {truncateMiddle(record.longURL, 64)}
      </p>

      <div className="mt-4 flex items-center gap-2 border-t border-white/5 pt-4">
        <span className="text-xs text-muted-foreground">Clicks</span>
        <CountUp value={record.totalVisits} className="text-sm font-semibold" />
        <a
          href={`/stats/${record.shortURL}`}
          className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-white/10 px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <BarChart3 className="size-3.5" /> View stats
        </a>
      </div>
    </div>
  );
}