import Link from "next/link";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { eur, datumZeit } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AuktionenListe() {
  const rows = await db
    .select({
      id: schema.auktion.id,
      status: schema.auktion.status,
      start_ts: schema.auktion.start_ts,
      end_ts: schema.auktion.end_ts,
      startpreis: schema.auktion.startpreis,
      aktuelles_gebot: schema.auktion.aktuelles_gebot,
      bezeichnung: schema.artikel.bezeichnung,
      pos: schema.artikel.global_pos_nr,
      projekt_id: schema.artikel.projekt_id,
    })
    .from(schema.auktion)
    .innerJoin(schema.artikel, eq(schema.auktion.artikel_id, schema.artikel.id));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Auktionen</h1>
      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="min-w-full divide-y text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3">Artikel</th>
              <th className="px-4 py-3">Start</th>
              <th className="px-4 py-3">Ende</th>
              <th className="px-4 py-3 text-right">Startpreis</th>
              <th className="px-4 py-3 text-right">Aktuell</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((a) => (
              <tr key={a.id} className="hover:bg-neutral-50">
                <td className="px-4 py-3">
                  <div className="font-medium">{a.bezeichnung}</div>
                  <div className="text-xs text-neutral-500">Pos {a.pos}</div>
                </td>
                <td className="px-4 py-3 text-neutral-600">{datumZeit(a.start_ts)}</td>
                <td className="px-4 py-3 text-neutral-600">{datumZeit(a.end_ts)}</td>
                <td className="px-4 py-3 text-right font-mono">{eur(a.startpreis)}</td>
                <td className="px-4 py-3 text-right font-mono">{eur(a.aktuelles_gebot)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      a.status === "laeuft" ? "bg-green-100 text-green-800" : "bg-neutral-100"
                    }`}
                  >
                    {a.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/auktionen/${a.id}`}
                    className="text-ziegler-accent hover:underline"
                  >
                    Detail
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                  Keine Auktionen.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
