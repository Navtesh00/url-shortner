import Link from "next/link";
import { ShortenForm } from "@/components/shorten-form";

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-4 py-24">
      <div className="mx-auto w-full max-w-2xl text-center">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">
          <span className="size-1.5 rounded-full bg-brand" />
          6-character codes · visit tracking
        </div>

        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          Short links that{" "}
          <span className="text-brand">show you who clicked</span>.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-balance text-muted-foreground">
          Paste a long URL, get a short one back, and watch the visits climb.
        </p>

        <div className="mt-10">
          <ShortenForm />
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          Already have a code?{" "}
          <Link href="/stats" className="text-brand underline-offset-4 hover:underline">
            Look up its stats
          </Link>.
        </p>
      </div>
    </main>
  );
}