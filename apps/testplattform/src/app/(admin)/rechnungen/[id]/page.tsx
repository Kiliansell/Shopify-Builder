import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { eur, datum } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function RechnungVorschau({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rechnungId = Number(id);

  const [r] = await db.select().from(schema.rechnung).where(eq(schema.rechnung.id, rechnungId));
  if (!r) notFound();

  const [kunde] = await db.select().from(schema.kunde).where(eq(schema.kunde.id, r.kunde_id));
  const [firma] = await db.select().from(schema.firma).limit(1);
  const positionen = await db
    .select()
    .from(schema.rechnungPosition)
    .where(eq(schema.rechnungPosition.rechnung_id, rechnungId));

  return (
    <div className="space-y-4">
      <Link href="/rechnungen" className="text-sm text-neutral-500 hover:text-ziegler-accent">
        ← Rechnungen
      </Link>

      <div className="mx-auto max-w-[210mm] rounded-lg border bg-white p-12 shadow-sm">
        {/* Briefkopf */}
        <div className="flex justify-between border-b pb-6">
          <div className="text-xs text-neutral-500">
            {firma?.name} · {firma?.strasse} · {firma?.plz} {firma?.ort}
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold leading-tight">{firma?.name}</div>
          </div>
        </div>

        {/* Empfaenger + Absender */}
        <div className="mt-8 grid grid-cols-2 gap-8">
          <div>
            <div className="text-sm font-semibold">{kunde?.anrede}</div>
            <div className="text-sm font-semibold">
              {kunde?.nachname}, {kunde?.vorname}
            </div>
            <div className="mt-1 text-sm">{kunde?.strasse}</div>
            <div className="text-sm font-semibold">
              {kunde?.plz} {kunde?.ort}
            </div>
          </div>
          <div className="text-xs text-neutral-600">
            <div className="font-semibold">{firma?.geschaeftsfuehrer}</div>
            <div className="mt-1 whitespace-pre-line">{firma?.funktion_text}</div>
            <div className="mt-3">
              {firma?.plz} {firma?.ort}, {firma?.strasse}
            </div>
            <div>Tel.: {firma?.telefon}</div>
            <div>Fax: {firma?.fax}</div>
            <div>{firma?.email}</div>
          </div>
        </div>

        {/* Rechnungs-Header */}
        <div className="mt-10 flex items-end justify-between border-b pb-3">
          <h1 className="text-2xl font-semibold">
            {r.typ === "proforma" ? "Proforma-Rechnung" : r.typ === "provision" ? "Provisionsrechnung" : "Rechnung"}
          </h1>
          <div className="grid grid-cols-4 gap-6 text-xs">
            <div>
              <div className="text-neutral-500">Rech.-Nr.</div>
              <div className="font-mono font-semibold">{r.rechnungs_nr}</div>
            </div>
            <div>
              <div className="text-neutral-500">Datum</div>
              <div className="font-semibold">{datum(r.datum)}</div>
            </div>
            <div>
              <div className="text-neutral-500">Kd.Nr.</div>
              <div className="font-mono font-semibold">{kunde?.kunden_nr ?? "-"}</div>
            </div>
            <div>
              <div className="text-neutral-500">Seite</div>
              <div className="font-semibold">1</div>
            </div>
          </div>
        </div>

        {/* Referenz bei Provisions-Rechnung */}
        {r.typ === "provision" && r.bezug_rechnung_nr && (
          <div className="mt-4 text-sm italic text-neutral-600">
            Bezug: Rechnung {r.bezug_rechnung_nr}
          </div>
        )}

        {/* Positionen */}
        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase tracking-wide text-neutral-500">
              <th className="pb-2">Pos</th>
              <th className="pb-2">Anzahl</th>
              <th className="pb-2">Bezeichnung</th>
              <th className="pb-2 text-right">MwSt.</th>
              <th className="pb-2 text-right">Preis</th>
            </tr>
          </thead>
          <tbody>
            {positionen.map((p) => (
              <tr key={p.id} className="border-b align-top">
                <td className="py-3 font-mono">{p.pos}</td>
                <td className="py-3">{p.anzahl}</td>
                <td className="py-3 whitespace-pre-line">{p.bezeichnung}</td>
                <td className="py-3 text-right">{p.mwst}%</td>
                <td className="py-3 text-right font-mono">{eur(p.einzelpreis)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Standard-Warn-Texte */}
        <div className="mt-6 space-y-2 text-xs text-neutral-700">
          <p>
            Verkauf erfolgt unter Ausschluss jeglicher Gewaehrleistung fuer Sachmaengel
            (§§ 3 Abs. 8, 4 Abs. 1 S. 3 AGB).
          </p>
          <p>Bitte bringen Sie zur Abholung Ihre Proforma-Rechnung mit.</p>
          {r.abhol_fenster_start && r.abhol_fenster_ende && (
            <p className="font-semibold">
              Abholung der Kaufgegenstaende:{" "}
              {new Intl.DateTimeFormat("de-DE", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              }).format(r.abhol_fenster_start)}
              , {new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit" }).format(r.abhol_fenster_start)}
              {" - "}
              {new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit" }).format(r.abhol_fenster_ende)}
              {" Uhr !!!"}
            </p>
          )}
          {r.standort && (
            <p>
              Standort: <span className="font-semibold">{r.standort}</span>
            </p>
          )}
          <p className="font-semibold">
            !!! ACHTUNG: Eine Herausgabe der ersteigerten Position kann nur nach Zahlungseingang auf
            unserem Konto erfolgen !!!
          </p>
        </div>

        {/* Summen */}
        <div className="mt-8 border-t pt-4">
          <div className="grid grid-cols-3 text-sm">
            <div></div>
            <div className="text-right text-neutral-500">Netto</div>
            <div className="text-right text-neutral-500">MwSt.</div>
          </div>
          <div className="mt-2 grid grid-cols-3 text-sm">
            <div>Summe 19%</div>
            <div className="text-right font-mono">{eur(r.netto)}</div>
            <div className="text-right font-mono">{eur(r.steuer)}</div>
          </div>
          <div className="mt-4 grid grid-cols-3 border-t pt-3 text-base">
            <div className="font-semibold">Rechnungsbetrag</div>
            <div></div>
            <div className="text-right font-mono font-semibold">{eur(r.brutto)}</div>
          </div>
        </div>

        {/* Fussbereich */}
        <div className="mt-12 grid grid-cols-2 gap-6 border-t pt-4 text-xs text-neutral-600">
          <div>
            <div>
              Rechtsform: GmbH &amp; Co. KG · Sitz {firma?.ort} · Eingetragen {firma?.hra} ·{" "}
              {firma?.amtsgericht}
            </div>
            <div className="mt-1">Geschaeftsfuehrer: {firma?.geschaeftsfuehrer}</div>
            <div className="mt-3 italic">
              Bei Versand per E-Mail erfolgt kein postalischer Versand dieses Schriftstueckes.
            </div>
          </div>
          <div>
            <div>
              <span className="text-neutral-500">Bankverbindung:</span> {firma?.bank_name}
            </div>
            <div>
              <span className="text-neutral-500">BIC:</span> {firma?.bic}
            </div>
            <div>
              <span className="text-neutral-500">IBAN:</span> {firma?.iban}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
