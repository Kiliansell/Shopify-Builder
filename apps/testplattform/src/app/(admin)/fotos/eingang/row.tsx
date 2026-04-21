"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Eingang = {
  id: number;
  dateiname: string;
  status: "neu" | "analysiert" | "zugewiesen" | "verworfen";
  erkannte_nummer: string | null;
  konfidenz: "hoch" | "mittel" | "niedrig" | null;
  vorschlag_artikel_id: number | null;
  fehler: string | null;
};

type Artikel = {
  id: number;
  global_pos_nr: number;
  bezeichnung: string;
  projekt_id: number;
};

export function EingangZeile({
  eingang,
  alleArtikel,
  zuweisenAction,
  verwerfenAction,
}: {
  eingang: Eingang;
  alleArtikel: Artikel[];
  zuweisenAction: (form: FormData) => void | Promise<void>;
  verwerfenAction: (form: FormData) => void | Promise<void>;
}) {
  const [pending, start] = useTransition();
  const [fehler, setFehler] = useState<string | null>(null);
  const router = useRouter();

  async function analysieren() {
    setFehler(null);
    try {
      const res = await fetch(`/api/fotos/eingang/${eingang.id}/analyze`, {
        method: "POST",
      });
      const body = await res.json();
      if (!res.ok) {
        setFehler(body?.error ?? "Fehler");
        return;
      }
      start(() => router.refresh());
    } catch (e) {
      setFehler(e instanceof Error ? e.message : String(e));
    }
  }

  const aktuelleAuswahl = eingang.vorschlag_artikel_id?.toString() ?? "";
  const bildUrl = `/api/fotos/eingang/file/${eingang.id}`;

  return (
    <li className="overflow-hidden rounded-lg border bg-white">
      <div className="relative aspect-[4/3] bg-neutral-100">
        <img
          src={bildUrl}
          alt={eingang.dateiname}
          className="h-full w-full object-cover"
        />
        {eingang.erkannte_nummer && (
          <div className="absolute left-2 top-2 rounded-md bg-black/80 px-2 py-1 text-xs font-mono text-white">
            #{eingang.erkannte_nummer}
          </div>
        )}
        {eingang.konfidenz && (
          <div className="absolute right-2 top-2">
            <KonfidenzPill wert={eingang.konfidenz} />
          </div>
        )}
      </div>

      <div className="space-y-2 p-3">
        <div className="truncate text-xs text-neutral-500">
          {eingang.dateiname}
        </div>

        {eingang.status === "neu" && (
          <button
            type="button"
            onClick={analysieren}
            disabled={pending}
            className="w-full rounded-md bg-ziegler-accent py-1.5 text-sm text-white hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Claude liest..." : "Mit Claude lesen"}
          </button>
        )}

        {eingang.status === "analysiert" && (
          <form action={zuweisenAction} className="space-y-2">
            <input type="hidden" name="eingang_id" value={eingang.id} />
            <label className="block text-xs">
              <span className="mb-0.5 block text-neutral-500">
                Artikel zuordnen
              </span>
              <select
                name="artikel_id"
                defaultValue={aktuelleAuswahl}
                required
                className="w-full rounded-md border px-2 py-1 text-sm"
              >
                <option value="">— waehlen —</option>
                {alleArtikel.map((a) => (
                  <option key={a.id} value={a.id}>
                    #{a.global_pos_nr} — {a.bezeichnung}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 rounded-md bg-ziegler-dark py-1.5 text-sm text-white hover:bg-black"
              >
                Zuweisen
              </button>
              <button
                type="button"
                onClick={analysieren}
                disabled={pending}
                className="rounded-md border px-2 py-1.5 text-xs hover:bg-neutral-50"
                title="Erneut analysieren"
              >
                ↻
              </button>
            </div>
          </form>
        )}

        <form action={verwerfenAction}>
          <input type="hidden" name="eingang_id" value={eingang.id} />
          <button
            type="submit"
            className="w-full rounded py-1 text-xs text-red-600 hover:bg-red-50"
          >
            Verwerfen
          </button>
        </form>

        {fehler && (
          <div className="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-800">
            {fehler}
          </div>
        )}
        {eingang.fehler && (
          <div className="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-800">
            {eingang.fehler}
          </div>
        )}
      </div>
    </li>
  );
}

function KonfidenzPill({ wert }: { wert: string }) {
  const farbe =
    wert === "hoch"
      ? "bg-emerald-500"
      : wert === "niedrig"
        ? "bg-red-500"
        : "bg-amber-500";
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-medium text-white ${farbe}`}
    >
      {wert}
    </span>
  );
}
