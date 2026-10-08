"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Eye } from "lucide-react";
import { displayOrigin } from "@/lib/api";
import { formatAbsolute, formatRelative } from "@/lib/format";
import { CopyField } from "@/components/copy-field";
import { CountUp } from "@/components/count-up";

export function StatsView({ record }: { record: {
  _id: string;
  longURL: string;
  shortURL: string;
  totalVisits: number;
  lastVisitedAt: string | null;
  createdAt: string;
  updatedAt: string;
} }) {
  const shortLink = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/${record.shortURL}`;

  // Render a deterministic absolute timestamp first so SSR and client match,
  // then swap to a live relative string after hydration.
  const [label, setLabel] = useState(
    record.lastVisitedAt ? formatAbsolute(record.lastVisitedAt) : "Never"
  );

  useEffect(() => {
    if (!record.lastVisitedAt) return;

    let timer: ReturnType<typeof setInterval> | undefined;
    const tick = () => setLabel(formatRelative(record.lastVisitedAt));
    tick();
    timer = setInterval(tick, 60_000);
    return () => clearInterval(timer);
  }, [record.lastVisitedAt]);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Statistics</h1>
        <p className="mt-1 text-muted-foreground">Live counts for this short link.</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-card p-6">
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-brand" />
          <p className="font-mono text-sm text-muted-foreground">{record.shortURL}</p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Eye className="size-3.5" /> Clicks
            </div>
            <CountUp value={record.totalVisits} className="mt-1 text-2xl font-semibold" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarClock className="size-3.5" /> Last visit
            </div>
            <p className="mt-1 text-sm text-foreground">{label}</p>
          </div>
        </div>

        <div className="mt-4 border-t border-white/5 pt-4">
          <p className="text-xs text-muted-foreground">Original URL</p>
          <a
            href={record.longURL}
            target="_blank"
            rel="noreferrer"
            className="mt-1 block truncate text-sm text-foreground hover:text-brand"
            title={record.longURL}
          >
            {displayOrigin(record.longURL)}
          </a>
        </div>

        <div className="mt-4">
          <p className="text-xs text-muted-foreground">Short link</p>
          <div className="mt-2">
            <CopyField value={shortLink} />
          </div>
        </div>
      </div>
    </div>
  );
}