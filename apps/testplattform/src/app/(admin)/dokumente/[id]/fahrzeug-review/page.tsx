import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { eq, max } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { ParseButton } from "../review/parse-button";

export const dynamic = "force-dynamic";

async function alsArtikelAnlegen(form: FormData) {
  "use server";
  const dokumentId = Number(form.get("dokument_id"));
  const projektId = form.get("projekt_id")
    ? Number(form.get("projekt_id"))
    : null;

  if (!projektId) return;

  const [dok] = await db
    .select()
    .from(schema.dokument)
    .where(eq(schema.dokument.id, dokumentId));
  if (!dok) return;

  // Werte aus dem Formular
  const fabrikat = String(form.get("fabrikat") ?? "").trim();
  const handelsbezeichnung = String(form.get("handelsbezeichnung") ?? "").trim();
  const typ = String(form.get("typ") ?? "").trim();
  const beschreibung = String(form.get("beschreibung_frei") ?? "").trim();
  const fin = String(form.get("fin") ?? "").trim() || null;
  const kennzeichen = String(form.get("kennzeichen") ?? "").trim() || null;
  const erstzulassung = String(form.get("erstzulassung") ?? "").trim() || null;
  const hubraum = Number(form.get("hubraum_ccm") ?? 0) || null;
  const leistungKw = Number(form.get("leistung_kw") ?? 0) || null;
  const leergewicht = Number(form.get("leergewicht_kg") ?? 0) || null;
  const gesamtmasse = Number(form.get("zulaessige_gesamtmasse_kg") ?? 0) || null;
  const startwert = Number(form.get("auktionsstartwert") ?? 0) || null;
  const stilllegungswert =
    Number(form.get("stilllegungswert") ?? 0) || null;
  const fortfuehrungswert =
    Number(form.get("fortfuehrungswert") ?? 0) || null;

  if (!fabrikat && !handelsbezeichnung) return;

  // Positions-Nummern bestimmen
  const [maxLokal] = await db
    .select({ m: max(schema.artikel.lokale_pos_nr) })
    .from(schema.artikel)
    .where(eq(schema.artikel.projekt_id, projektId));
  const [maxGlobal] = await db
    .select({ m: max(schema.artikel.global_pos_nr) })
    .from(schema.artikel);

  const bezeichnung = [fabrikat, handelsbezeichnung, typ]
    .filter(Boolean)
    .join(" ")
    .trim();

  // Langtext aus Fahrzeugdaten zusammensetzen
  const langtextZeilen: string[] = [];
  if (erstzulassung) langtextZeilen.push(`Erstzulassung: ${erstzulassung}`);
  if (hubraum) langtextZeilen.push(`Hubraum: ${hubraum} ccm`);
  if (leistungKw) langtextZeilen.push(`Leistung: ${leistungKw} kW`);
  if (leergewicht) langtextZeilen.push(`Leergewicht: ${leergewicht} kg`);
  if (gesamtmasse) langtextZeilen.push(`Zul. Gesamtmasse: ${gesamtmasse} kg`);
  if (beschreibung) langtextZeilen.push("", beschreibung);

  const [artikel] = await db
    .insert(schema.artikel)
    .values({
      projekt_id: projektId,
      global_pos_nr: (maxGlobal?.m ?? 2000) + 1,
      lokale_pos_nr: (maxLokal?.m ?? 0) + 1,
      anzahl: 1,
      bezeichnung: bezeichnung || "Fahrzeug",
      langtext: langtextZeilen.join("\n") || null,
      zustand: "gebraucht",
      auktionsstartwert: startwert,
      stilllegungswert: stilllegungswert,
      fortfuehrungswert: fortfuehrungswert,
      steuersatz: 19,
      ist_fahrzeug: true,
    })
    .returning();

  await db.insert(schema.fahrzeug).values({
    artikel_id: artikel.id,
    fabrikat: fabrikat || null,
    typ: [handelsbezeichnung, typ].filter(Boolean).join(" / ") || null,
    kennzeichen,
    fin,
    erstzulassung,
  });

  // Dokument mit Projekt verknuepfen
  await db
    .update(schema.dokument)
    .set({ projekt_id: projektId })
    .where(eq(schema.dokument.id, dokumentId));

  redirect(`/projekte/${projektId}/artikel/${artikel.id}`);
}

export default async function FahrzeugReview({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [dok] = await db
    .select()
    .from(schema.dokument)
    .where(eq(schema.dokument.id, Number(id)));
  if (!dok) notFound();

  const projekte = await db.select().from(schema.projekt);

  const extrakt = dok.extrahierte_daten_json
    ? (JSON.parse(dok.extrahierte_daten_json) as Record<string, string | number>)
    : null;

  const bildUrl = `/api/dokumente/${dok.id}/file`;

  return (
    <div className="space-y-4">
      <Link
        href={`/dokumente/${dok.id}`}
        className="text-sm text-neutral-500 hover:text-ziegler-accent"
      >
        ← Dokument
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          Fahrzeugschein → Artikel anlegen
        </h1>
        {extrakt && <KonfidenzPill wert={String(extrakt.konfidenz ?? "mittel")} />}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-white p-3">
          <div className="mb-2 text-xs text-neutral-500">{dok.dateiname}</div>
          <img
            src={bildUrl}
            alt={dok.dateiname}
            className="max-h-[80vh] w-full rounded border object-contain"
          />
        </div>

        <div className="space-y-4">
          {!extrakt && (
            <div className="rounded-lg border bg-amber-50 p-4 text-sm">
              <p className="mb-3">
                Noch keine Auto-Extraktion. Claude auswerten lassen oder
                Felder manuell befuellen.
              </p>
              <ParseButton dokumentId={dok.id} />
            </div>
          )}

          <form
            action={alsArtikelAnlegen}
            className="space-y-4 rounded-lg border bg-white p-5"
          >
            <input type="hidden" name="dokument_id" value={dok.id} />

            <label className="block">
              <span className="mb-1 block text-xs text-neutral-500">
                Projekt zuordnen *
              </span>
              <select
                name="projekt_id"
                defaultValue={dok.projekt_id ?? ""}
                required
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="">— waehlen —</option>
                {projekte.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.aktenzeichen} — {p.schuldner_firma}
                  </option>
                ))}
              </select>
            </label>

            <Gruppe titel="Fahrzeug">
              <div className="grid grid-cols-2 gap-3">
                <Feld
                  name="fabrikat"
                  label="Fabrikat *"
                  defaultValue={asString(extrakt?.fabrikat)}
                  required
                />
                <Feld
                  name="handelsbezeichnung"
                  label="Handelsbezeichnung"
                  defaultValue={asString(extrakt?.handelsbezeichnung)}
                />
                <Feld
                  name="typ"
                  label="Typ / Variante"
                  defaultValue={asString(extrakt?.typ)}
                />
                <Feld
                  name="kennzeichen"
                  label="Kennzeichen"
                  defaultValue={asString(extrakt?.kennzeichen)}
                />
                <Feld
                  name="fin"
                  label="FIN"
                  defaultValue={asString(extrakt?.fin)}
                />
                <Feld
                  name="erstzulassung"
                  label="Erstzulassung"
                  type="date"
                  defaultValue={asString(extrakt?.erstzulassung)}
                />
              </div>
            </Gruppe>

            <Gruppe titel="Technische Daten">
              <div className="grid grid-cols-2 gap-3">
                <Feld
                  name="hubraum_ccm"
                  label="Hubraum (ccm)"
                  type="number"
                  defaultValue={asString(extrakt?.hubraum_ccm)}
                />
                <Feld
                  name="leistung_kw"
                  label="Leistung (kW)"
                  type="number"
                  defaultValue={asString(extrakt?.leistung_kw)}
                />
                <Feld
                  name="leergewicht_kg"
                  label="Leergewicht (kg)"
                  type="number"
                  defaultValue={asString(extrakt?.leergewicht_kg)}
                />
                <Feld
                  name="zulaessige_gesamtmasse_kg"
                  label="Zul. Gesamtmasse (kg)"
                  type="number"
                  defaultValue={asString(extrakt?.zulaessige_gesamtmasse_kg)}
                />
              </div>
            </Gruppe>

            <label className="block">
              <span className="mb-1 block text-xs text-neutral-500">
                Beschreibung / Ausstattung
              </span>
              <textarea
                name="beschreibung_frei"
                rows={3}
                defaultValue={asString(extrakt?.beschreibung_frei)}
                className="w-full rounded-md border px-2 py-1.5 text-sm"
              />
            </label>

            <Gruppe titel="Werte">
              <div className="grid grid-cols-3 gap-3">
                <Feld
                  name="stilllegungswert"
                  label="Stilllegung (EUR)"
                  type="number"
                />
                <Feld
                  name="fortfuehrungswert"
                  label="Fortfuehrung (EUR)"
                  type="number"
                />
                <Feld
                  name="auktionsstartwert"
                  label="Startwert (EUR)"
                  type="number"
                />
              </div>
            </Gruppe>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="submit"
                className="rounded-md bg-ziegler-dark px-4 py-2 text-sm text-white hover:bg-black"
              >
                Als Artikel anlegen
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function asString(v: unknown): string {
  if (v == null) return "";
  return String(v);
}

function Gruppe({
  titel,
  children,
}: {
  titel: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {titel}
      </legend>
      {children}
    </fieldset>
  );
}

function Feld({
  name,
  label,
  defaultValue,
  type = "text",
  required,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-0.5 block text-xs text-neutral-500">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        required={required}
        step={type === "number" ? "1" : undefined}
        className="w-full rounded-md border px-2 py-1.5 text-sm outline-none focus:border-ziegler-accent"
      />
    </label>
  );
}

function KonfidenzPill({ wert }: { wert: string }) {
  const farbe =
    wert === "hoch"
      ? "bg-emerald-100 text-emerald-800"
      : wert === "niedrig"
        ? "bg-red-100 text-red-800"
        : "bg-amber-100 text-amber-800";
  return (
    <span className={`rounded-full px-3 py-1 text-xs ${farbe}`}>
      Konfidenz: {wert}
    </span>
  );
}
