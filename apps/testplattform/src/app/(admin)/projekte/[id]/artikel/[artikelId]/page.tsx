import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { writeFile, mkdir, unlink } from "fs/promises";
import { randomUUID } from "crypto";
import { eq, asc, sql } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eur } from "@/lib/format";
import { absolutVonRelativ, fotoOrdner, fotoRelativ } from "@/lib/storage";
import { join } from "path";

export const dynamic = "force-dynamic";

async function uploadFotos(form: FormData) {
  "use server";
  const artikelId = Number(form.get("artikel_id"));
  const projektId = Number(form.get("projekt_id"));
  const files = form.getAll("fotos") as File[];
  if (!files.length) return;

  const dir = fotoOrdner(projektId, artikelId);
  await mkdir(dir, { recursive: true });

  const [max] = await db
    .select({ m: sql<number>`coalesce(max(reihenfolge), 0)` })
    .from(schema.foto)
    .where(eq(schema.foto.artikel_id, artikelId));
  let naechste = (max?.m ?? 0) + 1;

  for (const file of files) {
    if (!file || file.size === 0) continue;
    if (!file.type.startsWith("image/")) continue;
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const dateiname = `${randomUUID()}.${ext}`;
    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(join(dir, dateiname), buf);
    await db.insert(schema.foto).values({
      artikel_id: artikelId,
      dateipfad: fotoRelativ(projektId, artikelId, dateiname),
      reihenfolge: naechste++,
    });
  }

  redirect(`/projekte/${projektId}/artikel/${artikelId}`);
}

async function moveFoto(form: FormData) {
  "use server";
  const fotoId = Number(form.get("foto_id"));
  const artikelId = Number(form.get("artikel_id"));
  const projektId = Number(form.get("projekt_id"));
  const richtung = String(form.get("richtung"));

  const alle = await db
    .select()
    .from(schema.foto)
    .where(eq(schema.foto.artikel_id, artikelId))
    .orderBy(asc(schema.foto.reihenfolge));

  const idx = alle.findIndex((f) => f.id === fotoId);
  if (idx < 0) return;

  const nachbarIdx = richtung === "up" ? idx - 1 : idx + 1;
  if (nachbarIdx < 0 || nachbarIdx >= alle.length) return;

  const a = alle[idx];
  const b = alle[nachbarIdx];

  // Reihenfolge tauschen
  await db
    .update(schema.foto)
    .set({ reihenfolge: b.reihenfolge })
    .where(eq(schema.foto.id, a.id));
  await db
    .update(schema.foto)
    .set({ reihenfolge: a.reihenfolge })
    .where(eq(schema.foto.id, b.id));

  redirect(`/projekte/${projektId}/artikel/${artikelId}`);
}

async function deleteFoto(form: FormData) {
  "use server";
  const fotoId = Number(form.get("foto_id"));
  const artikelId = Number(form.get("artikel_id"));
  const projektId = Number(form.get("projekt_id"));

  const [f] = await db
    .select()
    .from(schema.foto)
    .where(eq(schema.foto.id, fotoId));
  if (!f) return;

  try {
    await unlink(absolutVonRelativ(f.dateipfad));
  } catch {
    // Datei ggf. schon weg — nur DB-Eintrag loeschen
  }
  await db.delete(schema.foto).where(eq(schema.foto.id, fotoId));

  redirect(`/projekte/${projektId}/artikel/${artikelId}`);
}

export default async function ArtikelDetail({
  params,
}: {
  params: Promise<{ id: string; artikelId: string }>;
}) {
  const { id, artikelId } = await params;
  const projektId = Number(id);
  const artId = Number(artikelId);

  const [a] = await db
    .select()
    .from(schema.artikel)
    .where(eq(schema.artikel.id, artId));
  if (!a || a.projekt_id !== projektId) notFound();

  const fotos = await db
    .select()
    .from(schema.foto)
    .where(eq(schema.foto.artikel_id, artId))
    .orderBy(asc(schema.foto.reihenfolge));

  const [fz] = await db
    .select()
    .from(schema.fahrzeug)
    .where(eq(schema.fahrzeug.artikel_id, artId));

  return (
    <div className="space-y-6">
      <Link
        href={`/projekte/${projektId}`}
        className="text-sm text-neutral-500 hover:text-ziegler-accent"
      >
        ← Projekt
      </Link>

      <div>
        <div className="text-sm text-neutral-500">
          Pos {a.lokale_pos_nr}
          <span className="ml-2 text-neutral-400">/ {a.global_pos_nr}</span>
        </div>
        <h1 className="text-2xl font-semibold">{a.bezeichnung}</h1>
        {a.zusatzinfo && (
          <p className="mt-1 text-neutral-600">{a.zusatzinfo}</p>
        )}
      </div>

      {/* Werte */}
      <section className="grid grid-cols-2 gap-4 rounded-lg border bg-white p-5 sm:grid-cols-4">
        <Wert titel="Stilllegung" wert={eur(a.stilllegungswert)} />
        <Wert titel="Fortfuehrung" wert={eur(a.fortfuehrungswert)} />
        <Wert titel="Startwert" wert={eur(a.auktionsstartwert)} />
        <Wert titel="Neupreis" wert={eur(a.neupreis)} />
      </section>

      {a.langtext && (
        <section className="rounded-lg border bg-white p-5">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Langtext
          </h3>
          <pre className="whitespace-pre-wrap font-mono text-sm text-neutral-700">
            {a.langtext}
          </pre>
        </section>
      )}

      {fz && (
        <section className="rounded-lg border bg-white p-5">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Fahrzeug-Daten
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
            <FzFeld k="Fabrikat" v={fz.fabrikat} />
            <FzFeld k="Typ" v={fz.typ} />
            <FzFeld k="Kennzeichen" v={fz.kennzeichen} />
            <FzFeld k="FIN" v={fz.fin} />
            <FzFeld k="Erstzulassung" v={fz.erstzulassung} />
            <FzFeld k="TUEV bis" v={fz.tuev_bis} />
          </div>
        </section>
      )}

      {/* Fotos */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Fotos ({fotos.length})
          </h2>
        </div>

        <form
          action={uploadFotos}
          className="mb-4 rounded-lg border bg-white p-4"
        >
          <input type="hidden" name="projekt_id" value={projektId} />
          <input type="hidden" name="artikel_id" value={artId} />
          <label className="block">
            <span className="mb-1 block text-sm font-medium">
              Fotos hinzufuegen (mehrere auf einmal moeglich)
            </span>
            <input
              name="fotos"
              type="file"
              accept="image/*"
              multiple
              required
              className="w-full rounded-md border px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-ziegler-dark file:px-3 file:py-1.5 file:text-sm file:text-white hover:file:bg-black"
            />
          </label>
          <button
            type="submit"
            className="mt-3 rounded-md bg-ziegler-accent px-4 py-2 text-sm text-white hover:opacity-90"
          >
            Hochladen
          </button>
        </form>

        {fotos.length === 0 ? (
          <div className="rounded-lg border bg-neutral-50 p-8 text-center text-sm text-neutral-500">
            Noch keine Fotos. Oben hochladen — Reihenfolge bestimmt die
            Anzeige auf der spaeteren oeffentlichen Auktions-Seite.
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {fotos.map((f, i) => (
              <li
                key={f.id}
                className="group overflow-hidden rounded-lg border bg-white"
              >
                <div className="relative aspect-square bg-neutral-100">
                  <img
                    src={`/api/fotos/${f.id}/file`}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute left-2 top-2 rounded-md bg-black/70 px-2 py-0.5 text-xs text-white">
                    #{i + 1}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-1 p-2">
                  <div className="flex gap-1">
                    <SortButton
                      fotoId={f.id}
                      projektId={projektId}
                      artikelId={artId}
                      richtung="up"
                      disabled={i === 0}
                    />
                    <SortButton
                      fotoId={f.id}
                      projektId={projektId}
                      artikelId={artId}
                      richtung="down"
                      disabled={i === fotos.length - 1}
                    />
                  </div>
                  <form action={deleteFoto}>
                    <input type="hidden" name="foto_id" value={f.id} />
                    <input type="hidden" name="artikel_id" value={artId} />
                    <input type="hidden" name="projekt_id" value={projektId} />
                    <button
                      type="submit"
                      className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                      title="Loeschen"
                    >
                      Loeschen
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Wert({ titel, wert }: { titel: string; wert: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-neutral-500">
        {titel}
      </div>
      <div className="mt-1 font-mono text-lg">{wert}</div>
    </div>
  );
}

function FzFeld({ k, v }: { k: string; v: string | null | undefined }) {
  return (
    <div>
      <div className="text-xs text-neutral-500">{k}</div>
      <div>{v || "-"}</div>
    </div>
  );
}

function SortButton({
  fotoId,
  projektId,
  artikelId,
  richtung,
  disabled,
}: {
  fotoId: number;
  projektId: number;
  artikelId: number;
  richtung: "up" | "down";
  disabled?: boolean;
}) {
  const label = richtung === "up" ? "←" : "→";
  return (
    <form action={moveFoto}>
      <input type="hidden" name="foto_id" value={fotoId} />
      <input type="hidden" name="artikel_id" value={artikelId} />
      <input type="hidden" name="projekt_id" value={projektId} />
      <input type="hidden" name="richtung" value={richtung} />
      <button
        type="submit"
        disabled={disabled}
        className="rounded border px-2 py-1 text-xs hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-30"
        title={richtung === "up" ? "Nach vorne" : "Nach hinten"}
      >
        {label}
      </button>
    </form>
  );
}
