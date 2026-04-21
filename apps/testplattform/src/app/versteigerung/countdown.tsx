"use client";

import { useEffect, useState } from "react";
import { countdownText } from "@/lib/public-helpers";

export function LiveCountdown({
  endMs,
  className,
  prefix = "",
}: {
  endMs: number;
  className?: string;
  prefix?: string;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const diff = endMs - now;
  const warnend = diff > 0 && diff < 2 * 60_000;
  const mins = Math.floor(Math.max(0, diff) / 60_000);
  const secs = Math.floor((Math.max(0, diff) % 60_000) / 1000);
  const tage = Math.floor(diff / (24 * 3600_000));

  return (
    <span
      className={`tabular-nums ${warnend ? "text-red-500" : ""} ${className ?? ""}`}
    >
      {prefix}
      {diff <= 0
        ? "beendet"
        : tage >= 1
          ? countdownText(endMs, now)
          : `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`}
    </span>
  );
}

export function PreciseCountdown({ endMs }: { endMs: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const diff = Math.max(0, endMs - now);
  const tage = Math.floor(diff / (24 * 3600_000));
  const std = Math.floor((diff % (24 * 3600_000)) / 3600_000);
  const min = Math.floor((diff % 3600_000) / 60_000);
  const sec = Math.floor((diff % 60_000) / 1000);

  if (diff <= 0)
    return (
      <div className="font-serif text-3xl text-ink-50">Auktion beendet</div>
    );

  return (
    <div className="flex items-baseline gap-3 font-mono tabular-nums">
      <TimeBlock n={tage} label="Tage" />
      <span className="text-2xl text-gold-500">:</span>
      <TimeBlock n={std} label="Std" />
      <span className="text-2xl text-gold-500">:</span>
      <TimeBlock n={min} label="Min" />
      <span className="text-2xl text-gold-500">:</span>
      <TimeBlock n={sec} label="Sek" />
    </div>
  );
}

function TimeBlock({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-4xl font-light text-ink-200">
        {String(n).padStart(2, "0")}
      </span>
      <span className="mt-1 text-[10px] uppercase tracking-[0.2em] text-ink-50">
        {label}
      </span>
    </div>
  );
}
