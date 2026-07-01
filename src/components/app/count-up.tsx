import { useEffect, useRef, useState } from "react";

export function CountUp({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const startedFor = useRef<number | null>(null);

  useEffect(() => {
    if (startedFor.current === value) return;
    startedFor.current = value;
    const from = 0;
    const to = Math.max(0, Math.floor(value || 0));
    if (to === 0) {
      setDisplay(0);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <>{display}</>;
}
