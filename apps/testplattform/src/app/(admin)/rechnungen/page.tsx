import Link from "next/link";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { eur } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function RechnungenListe() {
  const rechnungen = await db
    .select({
      id: schema.rechnung.id,
      rechnungs_nr: schema.rechnung.rechnungs_nr,
      typ: schema.rechnung.typ,
      datum: schema.rechnung.datum,
      netto: schema.rechnung.netto,
      brutto: schema.rechnung.brutto,
      status: schema.rechnung.status,
      kunde_name: schema.kunde.nachname,
      kunde_vorname: schema.kunde.vorname,
    })
    .from(schema.rechnung)
    .innerJoin(schema.kunde, eq(schema.rechnung.kunde_id, schema.kunde.id))
    .orderBy(desc(schema.rechnung.created_at));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Rechnungen</h1>
      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="min-w-full divide-y text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3">Rech.-Nr.</th>
              <th className="px-4 py-3">Typ</th>
              <th className="px-4 py-3">Datum</th>
              <th className="px-4 py-3">Kunde</th>
              <th className="px-4 py-3 text-right">Netto</th>
              <th className="px-4 py-3 text-right">Brutto</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rechnungen.map((r) => (
              <tr key={r.id} className="hover:bg-neutral-50">
                <td className="px-4 py-3 font-mono">{r.rechnungs_nr}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded px-2 py-0.5 text-xs ${
                      r.typ === "provision"
                        ? "bg-purple-100 text-purple-800"
                        : r.typ === "proforma"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {r.typ}
                  </span>
                </td>
                <td className="px-4 py-3">{r.datum}</td>
                <td className="px-4 py-3">
                  {r.kunde_vorname} {r.kunde_name}
                </td>
                <td className="px-4 py-3 text-right font-mono">{eur(r.netto)}</td>
                <td className="px-4 py-3 text-right font-mono">{eur(r.brutto)}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-neutral-100 px-2 py-1 text-xs">{r.status}</span>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/rechnungen/${r.id}`}
                    className="text-ziegler-accent hover:underline"
                  >
                    Vorschau
                  </Link>
                </td>
              </tr>
            ))}
            {rechnungen.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-neutral-500">
                  Keine Rechnungen.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
