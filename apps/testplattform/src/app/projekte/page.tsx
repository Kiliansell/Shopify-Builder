import Link from "next/link";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { desc, sql } from "drizzle-orm";
import { datum } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ProjekteListe() {
  const projekte = await db
    .select({
      id: schema.projekt.id,
      aktenzeichen: schema.projekt.aktenzeichen,
      schuldner_firma: schema.projekt.schuldner_firma,
      gericht: schema.projekt.gericht,
      status: schema.projekt.status,
      beschluss_datum: schema.projekt.beschluss_datum,
      artikel_count: sql<number>`(select count(*) from artikel where artikel.projekt_id = projekt.id)`,
    })
    .from(schema.projekt)
    .orderBy(desc(schema.projekt.created_at));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projekte</h1>
        <Link
          href="/projekte/neu"
          className="rounded-md bg-ziegler-dark px-4 py-2 text-sm text-white hover:bg-black"
        >
          + Neues Projekt
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="min-w-full divide-y">
          <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3">Aktenzeichen</th>
              <th className="px-4 py-3">Schuldner</th>
              <th className="px-4 py-3">Gericht</th>
              <th className="px-4 py-3">Beschluss</th>
              <th className="px-4 py-3">Artikel</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {projekte.map((p) => (
              <tr key={p.id} className="hover:bg-neutral-50">
                <td className="px-4 py-3 font-mono text-sm">
                  <Link href={`/projekte/${p.id}`} className="text-ziegler-accent hover:underline">
                    {p.aktenzeichen}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm">{p.schuldner_firma}</td>
                <td className="px-4 py-3 text-sm text-neutral-600">{p.gericht ?? "-"}</td>
                <td className="px-4 py-3 text-sm text-neutral-600">{datum(p.beschluss_datum)}</td>
                <td className="px-4 py-3 text-sm">{p.artikel_count}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={p.status} />
                </td>
              </tr>
            ))}
            {projekte.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-neutral-500">
                  Noch keine Projekte.{" "}
                  <Link href="/projekte/neu" className="text-ziegler-accent hover:underline">
                    Neues anlegen
                  </Link>
                  .
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const farben: Record<string, string> = {
    entwurf: "bg-neutral-200 text-neutral-700",
    freigabe_offen: "bg-amber-100 text-amber-800",
    aktiv: "bg-emerald-100 text-emerald-800",
    auktion_laeuft: "bg-blue-100 text-blue-800",
    abgeschlossen: "bg-neutral-100 text-neutral-600",
    archiv: "bg-neutral-100 text-neutral-500",
  };
  return (
    <span className={`rounded-full px-2 py-1 text-xs ${farben[status] ?? "bg-neutral-100"}`}>
      {status}
    </span>
  );
}
