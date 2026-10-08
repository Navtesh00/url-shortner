import { ShortenForm } from "@/components/shorten-form";

export default function ShortenPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-24">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Shorten a link</h1>
        <p className="mt-2 text-muted-foreground">
          Works with any http or https address. You get a six-character code back.
        </p>
      </div>
      <ShortenForm />
    </main>
  );
}