import { db } from "@/db";
import * as schema from "@/db/schema";
import { redirect } from "next/navigation";

async function createProjekt(form: FormData) {
  "use server";
  const aktenzeichen = String(form.get("aktenzeichen") ?? "").trim();
  const schuldner_firma = String(form.get("schuldner_firma") ?? "").trim();
  if (!aktenzeichen || !schuldner_firma) return;

  const [p] = await db
    .insert(schema.projekt)
    .values({
      aktenzeichen,
      schuldner_firma,
      gericht: String(form.get("gericht") ?? "") || null,
      beschluss_datum: String(form.get("beschluss_datum") ?? "") || null,
      richter_name: String(form.get("richter_name") ?? "") || null,
      verwalter_name: String(form.get("verwalter_name") ?? "") || null,
      verwalter_adresse: String(form.get("verwalter_adresse") ?? "") || null,
      schuldner_adresse: String(form.get("schuldner_adresse") ?? "") || null,
      handelsregister: String(form.get("handelsregister") ?? "") || null,
      status: "entwurf",
    })
    .returning();

  redirect(`/projekte/${p.id}`);
}

export default function NeuesProjekt() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Neues Projekt</h1>
      <form action={createProjekt} className="space-y-4 rounded-lg border bg-white p-6">
        <Feld label="Aktenzeichen *" name="aktenzeichen" placeholder="73 IN 4/26" required />
        <Feld label="Gericht" name="gericht" placeholder="Amtsgericht Muenster" />
        <Feld label="Beschluss-Datum" name="beschluss_datum" type="date" />
        <Feld label="Richter" name="richter_name" placeholder="Brambrink" />
        <Feld label="Schuldner-Firma *" name="schuldner_firma" placeholder="Andreas Mey Galabau GmbH" required />
        <Feld label="Schuldner-Adresse" name="schuldner_adresse" />
        <Feld label="Handelsregister" name="handelsregister" placeholder="HRB 12594" />
        <Feld label="Insolvenzverwalter" name="verwalter_name" />
        <Feld label="Verwalter-Adresse" name="verwalter_adresse" />
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            className="rounded-md bg-ziegler-dark px-4 py-2 text-sm text-white hover:bg-black"
          >
            Speichern
          </button>
        </div>
      </form>
      <div className="rounded-lg border bg-blue-50 p-4 text-sm text-neutral-700">
        <strong>Hinweis:</strong> In der finalen Version werden diese Felder automatisch aus dem
        hochgeladenen Beschluss-PDF vorausgefuellt. Hier im Prototyp manuell.
      </div>
    </div>
  );
}

function Feld({
  label,
  name,
  placeholder,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-neutral-700">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-ziegler-accent"
      />
    </label>
  );
}
