"use client";

import { useState } from "react";
import Link from "next/link";
import { isValidCode } from "@/lib/validators";

export default function StatsLookup() {
  const [code, setCode] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = code.trim();
    if (isValidCode(value)) {
      setCode("");
      window.location.href = `/stats/${value}`;
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-24 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">View statistics</h1>
      <p className="mt-2 text-muted-foreground">
        Enter a short code to see how many times it has been clicked.
      </p>
      <form className="mt-8 flex gap-2" onSubmit={handleSubmit}>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          minLength={6}
          maxLength={10}
          pattern="[A-Za-z0-9]+"
          placeholder="e.g. aB3xK9"
          className="flex-1 rounded-lg border border-input bg-background px-4 py-2.5 font-mono text-sm tracking-wide placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          className="whitespace-nowrap rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-brand-foreground transition-colors hover:opacity-90"
        >
          Look up
        </button>
      </form>
      <p className="mt-6 text-xs text-muted-foreground">
        Or open a short link from the shorten page and click{" "}
        <Link href="/stats" className="text-brand underline-offset-4 hover:underline">
          View stats
        </Link>.
      </p>
    </main>
  );
}