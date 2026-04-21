"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function ParseButton({ dokumentId }: { dokumentId: number }) {
  const [pending, start] = useTransition();
  const [fehler, setFehler] = useState<string | null>(null);
  const router = useRouter();

  async function parse() {
    setFehler(null);
    try {
      const res = await fetch(`/api/dokumente/${dokumentId}/parse`, {
        method: "POST",
      });
      const body = await res.json();
      if (!res.ok) {
        setFehler(body?.error ?? "Unbekannter Fehler");
        return;
      }
      start(() => router.refresh());
    } catch (e) {
      setFehler(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={parse}
        disabled={pending}
        className="rounded-md bg-ziegler-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Claude extrahiert..." : "Mit Claude extrahieren"}
      </button>
      {fehler && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800">
          <strong>Fehler:</strong> {fehler}
        </div>
      )}
    </div>
  );
}
