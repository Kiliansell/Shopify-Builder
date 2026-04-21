import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { ParseButton } from "./parse-button";

export const dynamic = "force-dynamic";

async function freigabe(form: FormData) {
  "use server";
  const dokumentId = Number(form.get("dokument_id"));
  const [dok] = await db
    .select()
    .from(schema.dokument)
    .where(eq(schema.dokument.id, dokumentId));
  if (!dok) return;

  const daten = {
    aktenzeichen: String(form.get("aktenzeichen") ?? "").trim(),
    gericht: String(form.get("gericht") ?? "").trim() || null,
    beschluss_datum:
      String(form.get("beschluss_datum") ?? "").trim() || null,
    richter_name: String(form.get("richter_name") ?? "").trim() || null,
    schuldner_firma: String(form.get("schuldner_firma") ?? "").trim(),
    schuldner_adresse:
      String(form.get("schuldner_adresse") ?? "").trim() || null,
    handelsregister: String(form.get("handelsregister") ?? "").trim() || null,
    hr_gericht: String(form.get("hr_gericht") ?? "").trim() || null,
    vertreter_name: String(form.get("vertreter_name") ?? "").trim() || null,
    vertreter_adresse:
      String(form.get("vertreter_adresse") ?? "").trim() || null,
    verwalter_name: String(form.get("verwalter_name") ?? "").trim() || null,
    verwalter_adresse:
      String(form.get("verwalter_adresse") ?? "").trim() || null,
    verwalter_tel: String(form.get("verwalter_tel") ?? "").trim() || null,
    verwalter_fax: String(form.get("verwalter_fax") ?? "").trim() || null,
  };

  if (!daten.aktenzeichen || !daten.schuldner_firma) return;

  const [projekt] = await db
    .insert(schema.projekt)
    .values({ ...daten, status: "aktiv" })
    .returning();

  await db
    .update(schema.dokument)
    .set({ projekt_id: projekt.id })
    .where(eq(schema.dokument.id, dokumentId));

  redirect(`/projekte/${projekt.id}`);
}

export default async function DokumentReview({
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

  const extrakt = dok.extrahierte_daten_json
    ? (JSON.parse(dok.extrahierte_daten_json) as Record<string, string>)
    : null;

  const pdfUrl = `/api/dokumente/${dok.id}/file`;

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
          Beschluss pruefen & freigeben
        </h1>
        {extrakt && (
          <KonfidenzPill wert={extrakt.konfidenz ?? "mittel"} />
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Linke Spalte: PDF */}
        <div className="rounded-lg border bg-white p-3">
          <div className="mb-2 text-xs text-neutral-500">{dok.dateiname}</div>
          <iframe
            src={pdfUrl}
            className="h-[80vh] w-full rounded border"
            title={dok.dateiname}
          />
        </div>

        {/* Rechte Spalte: Formular */}
        <div className="space-y-4">
          {!extrakt && (
            <div className="rounded-lg border bg-amber-50 p-4 text-sm">
              <p className="mb-3">
                Noch keine Auto-Extraktion vorhanden. Claude auswerten
                lassen oder Felder manuell befuellen.
              </p>
              <ParseButton dokumentId={dok.id} />
            </div>
          )}

          <form
            action={freigabe}
            className="space-y-3 rounded-lg border bg-white p-5"
          >
            <input type="hidden" name="dokument_id" value={dok.id} />

            <Gruppe titel="Gericht">
              <Feld
                name="aktenzeichen"
                label="Aktenzeichen *"
                defaultValue={extrakt?.aktenzeichen}
                required
              />
              <Feld
                name="gericht"
                label="Gericht"
                defaultValue={extrakt?.gericht}
              />
              <Feld
                name="beschluss_datum"
                label="Beschluss-Datum"
                type="date"
                defaultValue={extrakt?.beschluss_datum}
              />
              <Feld
                name="richter_name"
                label="Richter"
                defaultValue={extrakt?.richter_name}
              />
            </Gruppe>

            <Gruppe titel="Schuldner">
              <Feld
                name="schuldner_firma"
                label="Firma *"
                defaultValue={extrakt?.schuldner_firma}
                required
              />
              <Feld
                name="schuldner_adresse"
                label="Adresse"
                defaultValue={extrakt?.schuldner_adresse}
              />
              <Feld
                name="handelsregister"
                label="Handelsregister"
                defaultValue={extrakt?.handelsregister}
              />
              <Feld
                name="hr_gericht"
                label="HR-Gericht"
                defaultValue={extrakt?.hr_gericht}
              />
              <Feld
                name="vertreter_name"
                label="Vertreter"
                defaultValue={extrakt?.vertreter_name}
              />
              <Feld
                name="vertreter_adresse"
                label="Vertreter-Adresse"
                defaultValue={extrakt?.vertreter_adresse}
              />
            </Gruppe>

            <Gruppe titel="Insolvenzverwalter">
              <Feld
                name="verwalter_name"
                label="Name"
                defaultValue={extrakt?.verwalter_name}
              />
              <Feld
                name="verwalter_adresse"
                label="Adresse"
                defaultValue={extrakt?.verwalter_adresse}
              />
              <Feld
                name="verwalter_tel"
                label="Telefon"
                defaultValue={extrakt?.verwalter_tel}
              />
              <Feld
                name="verwalter_fax"
                label="Fax"
                defaultValue={extrakt?.verwalter_fax}
              />
            </Gruppe>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="submit"
                className="rounded-md bg-ziegler-dark px-4 py-2 text-sm text-white hover:bg-black"
              >
                Projekt anlegen
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Gruppe({
  titel,
  children,
}: {
  titel: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {titel}
      </legend>
      <div className="space-y-2">{children}</div>
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
