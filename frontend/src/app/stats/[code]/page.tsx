import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { fetchUrlStats } from "@/lib/api";
import { StatsView } from "@/components/stats-view";

interface Props {
  params: Promise<{ code: string }>;
}

export default async function StatsCodePage({ params }: Props) {
  const { code } = await params;

  // Server-side fetch needs an absolute URL; derive it from the request.
  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  const origin = host ? `${proto}://${host}` : null;

  let record;
  try {
    record = await fetchUrlStats(code, origin);
  } catch {
    notFound();
  }

  return <StatsView record={record} />;
}