import Link from "next/link";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function DokumenteListe() {
  const dokumente = await db.select().from(schema.dokument).orderBy(desc(schema.dokument.created_at));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dokumente</h1>
        <Link
          href="/dokumente/upload"
          className="rounded-md bg-ziegler-dark px-4 py-2 text-sm text-white hover:bg-black"
        >
          + Hochladen
        </Link>
      </div>
      <ul className="divide-y rounded-lg border bg-white">
        {dokumente.map((d) => (
          <li key={d.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <div>
              <div className="font-medium">{d.dateiname}</div>
              <div className="text-xs text-neutral-500">
                {d.typ} · {Math.round((d.groesse_bytes ?? 0) / 1024)} KB
                {d.projekt_id ? ` · Projekt #${d.projekt_id}` : ""}
              </div>
            </div>
            <Link href={`/dokumente/${d.id}`} className="text-ziegler-accent hover:underline">
              Ansehen
            </Link>
          </li>
        ))}
        {dokumente.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-neutral-500">Keine Dokumente.</li>
        )}
      </ul>
    </div>
  );
}
