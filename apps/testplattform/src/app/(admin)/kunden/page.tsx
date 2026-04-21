import { db } from "@/db";
import * as schema from "@/db/schema";
import { like, or, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function KundenSuche({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const suche = (q ?? "").trim();

  const kunden = suche
    ? await db
        .select()
        .from(schema.kunde)
        .where(
          or(
            like(schema.kunde.nachname, `%${suche}%`),
            like(schema.kunde.vorname, `%${suche}%`),
            like(schema.kunde.email, `%${suche}%`),
            like(schema.kunde.telefon, `%${suche}%`),
            like(schema.kunde.bietername, `%${suche}%`),
            like(schema.kunde.kunden_nr, `%${suche}%`),
          ),
        )
    : await db.select().from(schema.kunde).limit(50);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Kunden</h1>
      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={suche}
          placeholder="Suche nach Name, Mail, Telefon, Bietername, Kd.Nr."
          className="flex-1 rounded-md border px-3 py-2 text-sm"
        />
        <button className="rounded-md bg-ziegler-dark px-4 py-2 text-sm text-white">Suchen</button>
      </form>
      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="min-w-full divide-y text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3">Kd.Nr.</th>
              <th className="px-4 py-3">Bietername</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Telefon</th>
              <th className="px-4 py-3">Ort</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {kunden.map((k) => (
              <tr key={k.id} className="hover:bg-neutral-50">
                <td className="px-4 py-3 font-mono">{k.kunden_nr ?? "-"}</td>
                <td className="px-4 py-3">{k.bietername ?? "-"}</td>
                <td className="px-4 py-3">
                  {k.anrede} {k.vorname} {k.nachname}
                </td>
                <td className="px-4 py-3">{k.email ?? "-"}</td>
                <td className="px-4 py-3">{k.telefon ?? "-"}</td>
                <td className="px-4 py-3">
                  {k.plz} {k.ort}
                </td>
              </tr>
            ))}
            {kunden.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                  Keine Kunden gefunden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="rounded-lg border bg-emerald-50 p-4 text-sm text-neutral-700">
        <strong>Verbesserung ggu. Altsystem:</strong> Suche funktioniert hier ueber Name,
        E-Mail, Telefon, Bietername und Kundennummer gleichzeitig.
      </div>
    </div>
  );
}
