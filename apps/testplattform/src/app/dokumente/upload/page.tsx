import { db } from "@/db";
import * as schema from "@/db/schema";
import { redirect } from "next/navigation";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

async function uploadDokument(form: FormData) {
  "use server";
  const file = form.get("datei") as File | null;
  const typ = String(form.get("typ") ?? "sonstiges") as
    | "beschluss"
    | "fahrzeugschein"
    | "artikelliste"
    | "gutachten"
    | "rechnung"
    | "abrechnung"
    | "sonstiges";
  const projektRaw = String(form.get("projekt_id") ?? "");
  const projekt_id = projektRaw ? Number(projektRaw) : null;

  if (!file || file.size === 0) return;

  const uploadDir = join(process.cwd(), "uploads");
  await mkdir(uploadDir, { recursive: true });

  const ext = file.name.split(".").pop() ?? "bin";
  const dateiname = `${randomUUID()}.${ext}`;
  const pfad = join(uploadDir, dateiname);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(pfad, buffer);

  await db.insert(schema.dokument).values({
    projekt_id,
    typ,
    dateiname: file.name,
    dateipfad: dateiname,
    mime_type: file.type || null,
    groesse_bytes: file.size,
  });

  redirect(projekt_id ? `/projekte/${projekt_id}` : "/dokumente");
}

export default async function DokumentUpload({
  searchParams,
}: {
  searchParams: Promise<{ projekt?: string }>;
}) {
  const { projekt } = await searchParams;
  const projekte = await db.select().from(schema.projekt);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dokument hochladen</h1>
      <form action={uploadDokument} className="space-y-4 rounded-lg border bg-white p-6">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Projekt (optional)</span>
          <select
            name="projekt_id"
            defaultValue={projekt ?? ""}
            className="w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="">— kein Projekt —</option>
            {projekte.map((p) => (
              <option key={p.id} value={p.id}>
                {p.aktenzeichen} — {p.schuldner_firma}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Dokument-Typ</span>
          <select name="typ" defaultValue="sonstiges" className="w-full rounded-md border px-3 py-2 text-sm">
            <option value="beschluss">Beschluss</option>
            <option value="fahrzeugschein">Fahrzeugschein</option>
            <option value="artikelliste">Artikelliste</option>
            <option value="gutachten">Gutachten</option>
            <option value="rechnung">Rechnung</option>
            <option value="abrechnung">Abrechnung</option>
            <option value="sonstiges">Sonstiges</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Datei (PDF, JPG, PNG)</span>
          <input
            name="datei"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            required
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-ziegler-dark px-4 py-2 text-sm text-white hover:bg-black"
        >
          Hochladen
        </button>
      </form>
      <div className="rounded-lg border bg-blue-50 p-4 text-sm text-neutral-700">
        <strong>Naechster Schritt in der Vollversion:</strong> Beim Upload eines Beschluss-PDFs wird
        automatisch der LLM-Parser angestossen und die extrahierten Felder in einem Review-UI zur
        Bestaetigung angezeigt.
      </div>
    </div>
  );
}
