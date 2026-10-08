import { useEffect, useRef } from "react";

export function CountUp({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const target = Number(value) || 0;
    const duration = 700;
    const start = performance.now();

    function frame(now: number) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = String(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(frame);
      else el.textContent = String(target);
    }

    requestAnimationFrame(frame);
  }, [value]);

  return <span ref={ref} className={className} />;
}