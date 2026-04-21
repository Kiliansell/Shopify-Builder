import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, max } from "drizzle-orm";
import { redirect } from "next/navigation";

async function createArtikel(form: FormData) {
  "use server";
  const projekt_id = Number(form.get("projekt_id"));

  const [maxLokal] = await db
    .select({ m: max(schema.artikel.lokale_pos_nr) })
    .from(schema.artikel)
    .where(eq(schema.artikel.projekt_id, projekt_id));
  const [maxGlobal] = await db.select({ m: max(schema.artikel.global_pos_nr) }).from(schema.artikel);

  const bezeichnung = String(form.get("bezeichnung") ?? "").trim();
  if (!bezeichnung) return;

  await db.insert(schema.artikel).values({
    projekt_id,
    lokale_pos_nr: (maxLokal.m ?? 0) + 1,
    global_pos_nr: (maxGlobal.m ?? 2000) + 1,
    anzahl: Number(form.get("anzahl") ?? 1),
    bezeichnung,
    zusatzinfo: String(form.get("zusatzinfo") ?? "") || null,
    langtext: String(form.get("langtext") ?? "") || null,
    zustand: (String(form.get("zustand") || "gebraucht") as "neu" | "gebraucht" | "zerlegt" | "defekt" | "unbekannt"),
    standort: String(form.get("standort") ?? "") || null,
    stilllegungswert: numberOrNull(form.get("stilllegungswert")),
    fortfuehrungswert: numberOrNull(form.get("fortfuehrungswert")),
    auktionsstartwert: numberOrNull(form.get("auktionsstartwert")),
    neupreis: numberOrNull(form.get("neupreis")),
    steuersatz: Number(form.get("steuersatz") ?? 19),
    ist_fahrzeug: form.get("ist_fahrzeug") === "on",
  });

  redirect(`/projekte/${projekt_id}`);
}

function numberOrNull(v: FormDataEntryValue | null): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default async function NeuerArtikel({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Neuer Artikel</h1>
      <form action={createArtikel} className="space-y-4 rounded-lg border bg-white p-6">
        <input type="hidden" name="projekt_id" value={id} />
        <Feld label="Bezeichnung *" name="bezeichnung" placeholder="Knupp HM 600" required />
        <Feld label="Anzahl" name="anzahl" type="number" placeholder="1" />
        <Feld label="Zusatzinfo" name="zusatzinfo" placeholder="3 Paletten, zerlegt" />
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Langtext</span>
          <textarea
            name="langtext"
            rows={4}
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-ziegler-accent"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Zustand</span>
          <select
            name="zustand"
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-ziegler-accent"
            defaultValue="gebraucht"
          >
            <option value="neu">Neu</option>
            <option value="gebraucht">Gebraucht</option>
            <option value="zerlegt">Zerlegt</option>
            <option value="defekt">Defekt</option>
            <option value="unbekannt">Unbekannt</option>
          </select>
        </label>
        <Feld label="Standort" name="standort" placeholder="48477 Hoerstel, Westfalenstrasse 44" />
        <div className="grid grid-cols-2 gap-3">
          <Feld label="Stilllegungswert" name="stilllegungswert" type="number" placeholder="0.00" />
          <Feld label="Fortfuehrungswert" name="fortfuehrungswert" type="number" placeholder="0.00" />
          <Feld label="Auktionsstartwert" name="auktionsstartwert" type="number" placeholder="0.00" />
          <Feld label="Neupreis" name="neupreis" type="number" placeholder="0.00" />
        </div>
        <Feld label="Steuersatz (%)" name="steuersatz" type="number" placeholder="19" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="ist_fahrzeug" /> Als Fahrzeug markieren
        </label>
        <div className="pt-2">
          <button
            type="submit"
            className="rounded-md bg-ziegler-dark px-4 py-2 text-sm text-white hover:bg-black"
          >
            Anlegen
          </button>
        </div>
      </form>
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
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <input
        name={name}
        type={type}
        step={type === "number" ? "0.01" : undefined}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-ziegler-accent"
      />
    </label>
  );
}
