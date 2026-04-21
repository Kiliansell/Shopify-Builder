import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, desc, sql, asc } from "drizzle-orm";
import { eur, datum } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ProjektDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const projektId = Number(id);
  const [p] = await db.select().from(schema.projekt).where(eq(schema.projekt.id, projektId));
  if (!p) notFound();

  const artikel = await db
    .select({
      id: schema.artikel.id,
      global_pos_nr: schema.artikel.global_pos_nr,
      lokale_pos_nr: schema.artikel.lokale_pos_nr,
      bezeichnung: schema.artikel.bezeichnung,
      zusatzinfo: schema.artikel.zusatzinfo,
      auktionsstartwert: schema.artikel.auktionsstartwert,
      fortfuehrungswert: schema.artikel.fortfuehrungswert,
      ist_fahrzeug: schema.artikel.ist_fahrzeug,
      foto_count: sql<number>`(select count(*) from foto where foto.artikel_id = artikel.id)`,
      erstes_foto_id: sql<number | null>`(select id from foto where foto.artikel_id = artikel.id order by reihenfolge asc limit 1)`,
    })
    .from(schema.artikel)
    .where(eq(schema.artikel.projekt_id, projektId))
    .orderBy(asc(schema.artikel.lokale_pos_nr));

  const dokumente = await db
    .select()
    .from(schema.dokument)
    .where(eq(schema.dokument.projekt_id, projektId))
    .orderBy(desc(schema.dokument.created_at));

  return (
    <div className="space-y-8">
      <div>
        <Link href="/projekte" className="text-sm text-neutral-500 hover:text-ziegler-accent">
          ← Projekte
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">
          <span className="font-mono text-ziegler-accent">{p.aktenzeichen}</span>
          <span className="ml-3 text-neutral-700">— {p.schuldner_firma}</span>
        </h1>
      </div>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <InfoBox titel="Gerichtsdaten">
          <Zeile k="Gericht" v={p.gericht} />
          <Zeile k="Beschluss-Datum" v={datum(p.beschluss_datum)} />
          <Zeile k="Richter" v={p.richter_name} />
        </InfoBox>

        <InfoBox titel="Schuldner">
          <Zeile k="Firma" v={p.schuldner_firma} />
          <Zeile k="Adresse" v={p.schuldner_adresse} />
          <Zeile k="Handelsregister" v={p.handelsregister} />
          <Zeile k="HR-Gericht" v={p.hr_gericht} />
          <Zeile k="Vertreter" v={p.vertreter_name} />
        </InfoBox>

        <InfoBox titel="Insolvenzverwalter">
          <Zeile k="Name" v={p.verwalter_name} />
          <Zeile k="Adresse" v={p.verwalter_adresse} />
          <Zeile k="Telefon" v={p.verwalter_tel} />
          <Zeile k="Fax" v={p.verwalter_fax} />
        </InfoBox>

        <InfoBox titel="Status">
          <Zeile k="Status" v={p.status} />
          <Zeile k="Notizen" v={p.notizen} />
        </InfoBox>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Artikel ({artikel.length})</h2>
          <Link
            href={`/projekte/${p.id}/artikel/neu`}
            className="rounded-md bg-ziegler-dark px-4 py-2 text-sm text-white hover:bg-black"
          >
            + Neuer Artikel
          </Link>
        </div>
        <div className="overflow-hidden rounded-lg border bg-white">
          <table className="min-w-full divide-y text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-2">Foto</th>
                <th className="px-4 py-2">Pos</th>
                <th className="px-4 py-2">Bezeichnung</th>
                <th className="px-4 py-2">Zusatz</th>
                <th className="px-4 py-2 text-right">Startwert</th>
                <th className="px-4 py-2 text-right">Fortfuehrung</th>
                <th className="px-4 py-2">Typ</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {artikel.map((a) => (
                <tr key={a.id} className="hover:bg-neutral-50">
                  <td className="px-3 py-2">
                    {a.erstes_foto_id ? (
                      <img
                        src={`/api/fotos/${a.erstes_foto_id}/file`}
                        alt=""
                        className="h-12 w-12 rounded border object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded border bg-neutral-50 text-xs text-neutral-400">
                        -
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 font-mono">
                    {a.lokale_pos_nr}{" "}
                    <span className="text-neutral-400">
                      / {a.global_pos_nr}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <Link
                      href={`/projekte/${p.id}/artikel/${a.id}`}
                      className="font-medium text-ziegler-accent hover:underline"
                    >
                      {a.bezeichnung}
                    </Link>
                    {a.foto_count > 0 && (
                      <span className="ml-2 text-xs text-neutral-500">
                        ({a.foto_count} Foto{a.foto_count !== 1 ? "s" : ""})
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-neutral-600">
                    {a.zusatzinfo ?? "-"}
                  </td>
                  <td className="px-4 py-2 text-right font-mono">
                    {eur(a.auktionsstartwert)}
                  </td>
                  <td className="px-4 py-2 text-right font-mono">
                    {eur(a.fortfuehrungswert)}
                  </td>
                  <td className="px-4 py-2">
                    {a.ist_fahrzeug ? (
                      <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
                        Fahrzeug
                      </span>
                    ) : (
                      <span className="text-neutral-400">Standard</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/projekte/${p.id}/artikel/${a.id}`}
                      className="text-xs text-neutral-500 hover:text-ziegler-accent"
                    >
                      Details →
                    </Link>
                  </td>
                </tr>
              ))}
              {artikel.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-6 text-center text-neutral-500"
                  >
                    Keine Artikel erfasst.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Dokumente ({dokumente.length})</h2>
          <Link
            href={`/dokumente/upload?projekt=${p.id}`}
            className="rounded-md border px-4 py-2 text-sm hover:bg-neutral-50"
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
                </div>
              </div>
              <Link
                href={`/dokumente/${d.id}`}
                className="text-ziegler-accent hover:underline"
              >
                Ansehen
              </Link>
            </li>
          ))}
          {dokumente.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-neutral-500">
              Noch keine Dokumente hochgeladen.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}

function InfoBox({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-white p-5">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">{titel}</h3>
      <dl className="space-y-1 text-sm">{children}</dl>
    </div>
  );
}

function Zeile({ k, v }: { k: string; v: string | null | undefined }) {
  return (
    <div className="flex gap-2">
      <dt className="w-32 shrink-0 text-neutral-500">{k}</dt>
      <dd className="text-neutral-900">{v || "-"}</dd>
    </div>
  );
}
