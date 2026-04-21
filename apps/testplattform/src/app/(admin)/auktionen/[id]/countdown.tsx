"use client";
import { useEffect, useState } from "react";

export function Countdown({ endMs }: { endMs: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const diff = Math.max(0, endMs - now);
  const mins = Math.floor(diff / 60_000);
  const secs = Math.floor((diff % 60_000) / 1000);

  return (
    <div className={`font-mono text-3xl ${diff < 120_000 ? "text-red-400" : ""}`}>
      {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
    </div>
  );
}
