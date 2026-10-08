import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard may be unavailable; nothing to do.
    }
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      className="flex w-full items-center gap-2 rounded-lg border border-white/10 bg-background/60 px-3 py-2 font-mono text-sm text-foreground transition-colors hover:bg-accent"
    >
      <span className="truncate">{value}</span>
      <span className="ml-auto shrink-0 text-muted-foreground">
        {copied ? <Check className="size-3.5 text-brand" /> : <Copy className="size-3.5" />}
      </span>
    </button>
  );
}