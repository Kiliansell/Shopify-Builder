"use client";

import { useState } from "react";

export function GalerieClient({
  bilder,
  titel,
}: {
  bilder: { id: number; url: string }[];
  titel: string;
}) {
  const [active, setActive] = useState(0);

  if (bilder.length === 0) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-2xl border border-paper-200 bg-paper-100">
        <span className="font-serif text-6xl text-ink-50/30">ZT</span>
      </div>
    );
  }

  const current = bilder[Math.min(active, bilder.length - 1)];

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl bg-ink-300">
        <img
          src={current.url}
          alt={titel}
          className="aspect-[4/3] w-full object-contain"
        />
        {bilder.length > 1 && (
          <>
            <button
              type="button"
              onClick={() =>
                setActive((i) => (i - 1 + bilder.length) % bilder.length)
              }
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-paper-50/80 p-3 backdrop-blur transition hover:bg-paper-50"
              aria-label="Vorheriges Bild"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => setActive((i) => (i + 1) % bilder.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-paper-50/80 p-3 backdrop-blur transition hover:bg-paper-50"
              aria-label="Naechstes Bild"
            >
              →
            </button>
            <div className="absolute bottom-4 right-4 rounded-full bg-ink-300/80 px-3 py-1 text-xs text-paper-100 backdrop-blur">
              {active + 1} / {bilder.length}
            </div>
          </>
        )}
      </div>

      {bilder.length > 1 && (
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-6 lg:grid-cols-5">
          {bilder.map((b, i) => (
            <button
              type="button"
              key={b.id}
              onClick={() => setActive(i)}
              className={`relative overflow-hidden rounded-lg border-2 transition ${
                i === active
                  ? "border-gold-500"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <img src={b.url} alt="" className="aspect-square w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
