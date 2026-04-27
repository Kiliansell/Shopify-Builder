"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Feld =
  | "stilllegungswert"
  | "fortfuehrungswert"
  | "auktionsstartwert"
  | "neupreis";

export function InlineWertCell({
  artikelId,
  feld,
  initial,
  align = "right",
}: {
  artikelId: number;
  feld: Feld;
  initial: number | null;
  align?: "right" | "left";
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(initial?.toString() ?? "");
  const [pending, start] = useTransition();
  const [saving, setSaving] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const router = useRouter();

  async function speichern() {
    setSaving(true);
    setFehler(null);
    try {
      const wert = val === "" ? null : Number(val);
      if (wert !== null && !Number.isFinite(wert)) {
        setFehler("Ungueltige Zahl");
        setSaving(false);
        return;
      }
      const res = await fetch(`/api/artikel/${artikelId}/wert`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ feld, wert }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setFehler(body.error ?? "Fehler beim Speichern");
        setSaving(false);
        return;
      }
      setEditing(false);
      start(() => router.refresh());
    } catch (e) {
      setFehler(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  const formatted =
    initial != null
      ? new Intl.NumberFormat("de-DE", {
          style: "currency",
          currency: "EUR",
        }).format(initial)
      : "—";

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className={`block w-full font-mono text-sm ${align === "right" ? "text-right" : "text-left"} hover:bg-amber-50 hover:underline`}
        title="Doppelklick zum Bearbeiten"
      >
        {formatted}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        step="1"
        autoFocus
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={speichern}
        onKeyDown={(e) => {
          if (e.key === "Enter") speichern();
          if (e.key === "Escape") {
            setVal(initial?.toString() ?? "");
            setEditing(false);
          }
        }}
        className="w-24 rounded border border-ziegler-accent bg-white px-1 py-0.5 text-right font-mono text-sm outline-none"
        disabled={saving || pending}
      />
      {(saving || pending) && (
        <span className="text-xs text-neutral-400">…</span>
      )}
      {fehler && (
        <span className="text-xs text-red-600" title={fehler}>
          ⚠
        </span>
      )}
    </div>
  );
}
