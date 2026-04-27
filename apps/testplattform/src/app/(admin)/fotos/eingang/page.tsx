import Link from "next/link";
import { redirect } from "next/navigation";
import { writeFile, mkdir, rename, unlink } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { eq, asc, sql, and } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";
import {
  absolutVonRelativ,
  fotoEingangOrdner,
  fotoEingangRelativ,
  fotoOrdner,
  fotoRelativ,
} from "@/lib/storage";
import { EingangZeile } from "./row";
import { DropZone } from "@/components/drop-zone";

export const dynamic = "force-dynamic";

async function uploadEingang(form: FormData) {
  "use server";
  const files = form.getAll("fotos") as File[];
  if (!files.length) return;

  const dir = fotoEingangOrdner();
  await mkdir(dir, { recursive: true });

  for (const file of files) {
    if (!file || file.size === 0) continue;
    if (!file.type.startsWith("image/")) continue;
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const dateiname = `${randomUUID()}.${ext}`;
    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(join(dir, dateiname), buf);

    await db.insert(schema.fotoEingang).values({
      dateiname: file.name,
      dateipfad: fotoEingangRelativ(dateiname),
      mime_type: file.type,
      groesse_bytes: file.size,
      status: "neu",
    });
  }

  redirect("/fotos/eingang");
}

async function zuweisen(form: FormData) {
  "use server";
  const eingangId = Number(form.get("eingang_id"));
  const artikelId = Number(form.get("artikel_id"));
  if (!eingangId || !artikelId) return;

  const [eingang] = await db
    .select()
    .from(schema.fotoEingang)
    .where(eq(schema.fotoEingang.id, eingangId));
  if (!eingang) return;

  const [artikel] = await db
    .select({ id: schema.artikel.id, projekt_id: schema.artikel.projekt_id })
    .from(schema.artikel)
    .where(eq(schema.artikel.id, artikelId));
  if (!artikel) return;

  // Datei vom Eingang in den Artikel-Ordner verschieben
  const zielOrdner = fotoOrdner(artikel.projekt_id, artikel.id);
  await mkdir(zielOrdner, { recursive: true });

  const urspruenglicherPfad = absolutVonRelativ(eingang.dateipfad);
  const ext = eingang.dateipfad.split(".").pop() ?? "jpg";
  const neuerDateiname = `${randomUUID()}.${ext}`;
  const neuerAbsoluterPfad = join(zielOrdner, neuerDateiname);

  await rename(urspruenglicherPfad, neuerAbsoluterPfad).catch(async () => {
    const buf = await (await import("fs/promises")).readFile(urspruenglicherPfad);
    await writeFile(neuerAbsoluterPfad, buf);
    await unlink(urspruenglicherPfad).catch(() => {});
  });

  // Naechste Reihenfolge fuer diesen Artikel
  const [maxR] = await db
    .select({ m: sql<number>`coalesce(max(reihenfolge), 0)` })
    .from(schema.foto)
    .where(eq(schema.foto.artikel_id, artikel.id));

  await db.insert(schema.foto).values({
    artikel_id: artikel.id,
    dateipfad: fotoRelativ(artikel.projekt_id, artikel.id, neuerDateiname),
    reihenfolge: (maxR?.m ?? 0) + 1,
  });

  await db
    .update(schema.fotoEingang)
    .set({ status: "zugewiesen", vorschlag_artikel_id: artikel.id })
    .where(eq(schema.fotoEingang.id, eingangId));

  redirect("/fotos/eingang");
}

async function verwerfen(form: FormData) {
  "use server";
  const eingangId = Number(form.get("eingang_id"));
  const [eingang] = await db
    .select()
    .from(schema.fotoEingang)
    .where(eq(schema.fotoEingang.id, eingangId));
  if (!eingang) return;

  try {
    await unlink(absolutVonRelativ(eingang.dateipfad));
  } catch {
    // ignore
  }
  await db
    .delete(schema.fotoEingang)
    .where(eq(schema.fotoEingang.id, eingangId));

  redirect("/fotos/eingang");
}

async function autoZuweisenAlle(_form: FormData) {
  "use server";
  // Weist alle analysierten Eingaenge mit hoher/mittlerer Konfidenz und
  // gueltigem Vorschlag automatisch zu.
  const kandidaten = await db
    .select()
    .from(schema.fotoEingang)
    .where(
      and(
        eq(schema.fotoEingang.status, "analysiert"),
        sql`vorschlag_artikel_id is not null`,
        sql`konfidenz in ('hoch', 'mittel')`,
      ),
    );

  for (const k of kandidaten) {
    if (!k.vorschlag_artikel_id) continue;
    const [artikel] = await db
      .select({ id: schema.artikel.id, projekt_id: schema.artikel.projekt_id })
      .from(schema.artikel)
      .where(eq(schema.artikel.id, k.vorschlag_artikel_id));
    if (!artikel) continue;

    const zielOrdner = fotoOrdner(artikel.projekt_id, artikel.id);
    await mkdir(zielOrdner, { recursive: true });

    const ext = k.dateipfad.split(".").pop() ?? "jpg";
    const neuerDateiname = `${randomUUID()}.${ext}`;
    const neuerAbsoluterPfad = join(zielOrdner, neuerDateiname);

    try {
      await rename(absolutVonRelativ(k.dateipfad), neuerAbsoluterPfad);
    } catch {
      continue;
    }

    const [maxR] = await db
      .select({ m: sql<number>`coalesce(max(reihenfolge), 0)` })
      .from(schema.foto)
      .where(eq(schema.foto.artikel_id, artikel.id));

    await db.insert(schema.foto).values({
      artikel_id: artikel.id,
      dateipfad: fotoRelativ(artikel.projekt_id, artikel.id, neuerDateiname),
      reihenfolge: (maxR?.m ?? 0) + 1,
    });

    await db
      .update(schema.fotoEingang)
      .set({ status: "zugewiesen" })
      .where(eq(schema.fotoEingang.id, k.id));
  }

  redirect("/fotos/eingang");
}

export default async function FotoEingangListe() {
  const eingaenge = await db
    .select({
      id: schema.fotoEingang.id,
      dateiname: schema.fotoEingang.dateiname,
      status: schema.fotoEingang.status,
      erkannte_nummer: schema.fotoEingang.erkannte_nummer,
      konfidenz: schema.fotoEingang.konfidenz,
      vorschlag_artikel_id: schema.fotoEingang.vorschlag_artikel_id,
      fehler: schema.fotoEingang.fehler,
      created_at: schema.fotoEingang.created_at,
    })
    .from(schema.fotoEingang)
    .orderBy(asc(schema.fotoEingang.id));

  const alleArtikel = await db
    .select({
      id: schema.artikel.id,
      global_pos_nr: schema.artikel.global_pos_nr,
      bezeichnung: schema.artikel.bezeichnung,
      projekt_id: schema.artikel.projekt_id,
    })
    .from(schema.artikel)
    .orderBy(asc(schema.artikel.global_pos_nr));

  const offene = eingaenge.filter((e) => e.status !== "zugewiesen");
  const zugewiesene = eingaenge.filter((e) => e.status === "zugewiesen");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Foto-Eingang</h1>
        <Link href="/" className="text-sm text-neutral-500 hover:text-ziegler-accent">
          ← Dashboard
        </Link>
      </div>

      <div className="rounded-lg border bg-blue-50 p-4 text-sm text-neutral-700">
        <strong>So funktioniert&apos;s:</strong>
        <ol className="mt-2 list-inside list-decimal space-y-1">
          <li>Produktfotos hochladen — Schild mit Positionsnummer muss im Bild sein.</li>
          <li>
            Auf jedem neu hochgeladenen Foto auf &bdquo;Mit Claude lesen&ldquo;
            klicken — die Nummer wird erkannt und mit dem Artikelstamm gematched.
          </li>
          <li>
            Zuordnungen pruefen, bei Bedarf korrigieren, dann &bdquo;Zuweisen&ldquo;
            — das Foto landet im Artikel-Ordner und erscheint auf der
            Artikelseite.
          </li>
        </ol>
      </div>

      <form action={uploadEingang} className="rounded-lg border bg-white p-5">
        <DropZone
          name="fotos"
          accept="image/*"
          multiple
          required
          hint="Produktfotos hierher ziehen oder klicken"
          subHint="Mehrere auf einmal — Schild mit Positionsnummer muss im Bild sein"
        />
        <button
          type="submit"
          className="mt-4 rounded-md bg-ziegler-accent px-4 py-2 text-sm text-white hover:opacity-90"
        >
          In Eingang ablegen
        </button>
      </form>

      {offene.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Zu bearbeiten ({offene.length})
            </h2>
            <form action={autoZuweisenAlle}>
              <button
                type="submit"
                className="rounded-md border px-3 py-1.5 text-sm hover:bg-neutral-50"
              >
                Alle mit hoher/mittlerer Konfidenz auto-zuweisen
              </button>
            </form>
          </div>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {offene.map((e) => (
              <EingangZeile
                key={e.id}
                eingang={e}
                alleArtikel={alleArtikel}
                zuweisenAction={zuweisen}
                verwerfenAction={verwerfen}
              />
            ))}
          </ul>
        </section>
      )}

      {zugewiesene.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Bereits zugewiesen ({zugewiesene.length})
          </h2>
          <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {zugewiesene.map((e) => (
              <li
                key={e.id}
                className="rounded border bg-neutral-50 p-2 text-xs text-neutral-500"
              >
                <div className="truncate">{e.dateiname}</div>
                {e.erkannte_nummer && (
                  <div className="font-mono">#{e.erkannte_nummer}</div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {eingaenge.length === 0 && (
        <div className="rounded-lg border bg-neutral-50 p-8 text-center text-sm text-neutral-500">
          Noch keine Fotos im Eingang. Oben hochladen.
        </div>
      )}
    </div>
  );
}
