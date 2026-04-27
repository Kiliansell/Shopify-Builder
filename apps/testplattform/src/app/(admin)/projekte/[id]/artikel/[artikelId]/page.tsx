import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { writeFile, mkdir, unlink } from "fs/promises";
import { randomUUID } from "crypto";
import { eq, asc, sql } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eur, datumZeit } from "@/lib/format";
import { absolutVonRelativ, fotoOrdner, fotoRelativ } from "@/lib/storage";
import { join } from "path";
import { DropZone } from "@/components/drop-zone";
import { artikelSichtbarkeitSetzen, auktionBeenden } from "@/lib/lifecycle";
import { revalidatePath } from "next/cache";

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

async function sichtbarkeitToggleAction(form: FormData) {
  "use server";
  const artikelId = Number(form.get("artikel_id"));
  const projektId = Number(form.get("projekt_id"));
  const neu = String(form.get("sichtbarkeit")) as
    | "entwurf"
    | "vorschau"
    | "live"
    | "archiv";
  await artikelSichtbarkeitSetzen(artikelId, neu);
  revalidatePath(`/projekte/${projektId}/artikel/${artikelId}`);
  revalidatePath("/versteigerung");
  revalidatePath("/versteigerung/auktionen");
}

async function auktionBeendenAction(form: FormData) {
  "use server";
  const auktionId = Number(form.get("auktion_id"));
  const projektId = Number(form.get("projekt_id"));
  const artikelId = Number(form.get("artikel_id"));
  await auktionBeenden(auktionId);
  revalidatePath(`/projekte/${projektId}/artikel/${artikelId}`);
  revalidatePath(`/versteigerung/auktionen/${auktionId}`);
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

  const auktionen = await db
    .select()
    .from(schema.auktion)
    .where(eq(schema.auktion.artikel_id, artId))
    .orderBy(asc(schema.auktion.start_ts));

  return (
    <div className="space-y-6">
      <Link
        href={`/projekte/${projektId}`}
        className="text-sm text-neutral-500 hover:text-ziegler-accent"
      >
        ← Projekt
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-neutral-500">
            Pos {a.lokale_pos_nr}
            <span className="ml-2 text-neutral-400">/ {a.global_pos_nr}</span>
          </div>
          <h1 className="text-2xl font-semibold">{a.bezeichnung}</h1>
          {a.zusatzinfo && (
            <p className="mt-1 text-neutral-600">{a.zusatzinfo}</p>
          )}
          <div className="mt-3 flex items-center gap-2">
            <SichtbarkeitsBadge wert={a.sichtbarkeit} />
            {a.sichtbarkeit === "live" && (
              <a
                href={`/versteigerung/auktionen/${auktionen[0]?.id ?? ""}`}
                target="_blank"
                rel="noopener"
                className="text-xs text-ziegler-accent hover:underline"
              >
                ↗ Live-Ansicht
              </a>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {a.sichtbarkeit !== "live" && (
            <form action={sichtbarkeitToggleAction}>
              <input type="hidden" name="artikel_id" value={a.id} />
              <input type="hidden" name="projekt_id" value={projektId} />
              <input type="hidden" name="sichtbarkeit" value="live" />
              <button
                type="submit"
                className="rounded-md bg-ziegler-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                ↗ Veröffentlichen
              </button>
            </form>
          )}
          {a.sichtbarkeit === "live" && (
            <form action={sichtbarkeitToggleAction}>
              <input type="hidden" name="artikel_id" value={a.id} />
              <input type="hidden" name="projekt_id" value={projektId} />
              <input type="hidden" name="sichtbarkeit" value="entwurf" />
              <button
                type="submit"
                className="rounded-md border px-4 py-2 text-sm hover:bg-neutral-50"
              >
                Auf Entwurf zurücksetzen
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Werte */}
      <section className="grid grid-cols-2 gap-4 rounded-lg border bg-white p-5 sm:grid-cols-4">
        <Wert titel="Stilllegung" wert={eur(a.stilllegungswert)} />
        <Wert titel="Fortfuehrung" wert={eur(a.fortfuehrungswert)} />
        <Wert titel="Startwert" wert={eur(a.auktionsstartwert)} />
        <Wert titel="Neupreis" wert={eur(a.neupreis)} />
      </section>

      {auktionen.length > 0 && (
        <section className="rounded-lg border bg-white p-5">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Auktionen
          </h3>
          <ul className="divide-y text-sm">
            {auktionen.map((au) => (
              <li
                key={au.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div>
                  <div className="font-medium">
                    {au.status === "laeuft"
                      ? "Läuft"
                      : au.status === "beendet"
                        ? "Beendet"
                        : au.status === "geplant"
                          ? "Geplant"
                          : "Abgebrochen"}
                  </div>
                  <div className="text-xs text-neutral-500">
                    Endet {datumZeit(au.end_ts)} · Startpreis {eur(au.startpreis)}
                  </div>
                  {au.status === "beendet" && au.zuschlag_preis && (
                    <div className="mt-1 text-xs text-emerald-700">
                      Zuschlag: {eur(au.zuschlag_preis)}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm">
                    {eur(au.aktuelles_gebot ?? au.startpreis)}
                  </span>
                  {au.status === "laeuft" && (
                    <form action={auktionBeendenAction}>
                      <input type="hidden" name="auktion_id" value={au.id} />
                      <input type="hidden" name="projekt_id" value={projektId} />
                      <input type="hidden" name="artikel_id" value={a.id} />
                      <button
                        type="submit"
                        className="rounded-md border px-3 py-1.5 text-xs hover:bg-neutral-50"
                        title="Auktion vorzeitig beenden und Gewinner ermitteln"
                      >
                        Beenden + Zuschlag
                      </button>
                    </form>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

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
          <DropZone
            name="fotos"
            accept="image/*"
            multiple
            required
            hint="Produktfotos hierher ziehen"
            subHint="Mehrere auf einmal — Reihenfolge bestimmt spaetere Anzeige auf der oeffentlichen Seite"
          />
          <button
            type="submit"
            className="mt-4 rounded-md bg-ziegler-accent px-4 py-2 text-sm text-white hover:opacity-90"
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

function SichtbarkeitsBadge({ wert }: { wert: string }) {
  const map: Record<string, string> = {
    entwurf: "bg-neutral-200 text-neutral-700",
    vorschau: "bg-amber-100 text-amber-800",
    live: "bg-emerald-100 text-emerald-800",
    archiv: "bg-neutral-100 text-neutral-500",
  };
  const label =
    wert === "live"
      ? "Live auf Website"
      : wert === "entwurf"
        ? "Entwurf — nicht oeffentlich"
        : wert.charAt(0).toUpperCase() + wert.slice(1);
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${map[wert] ?? "bg-neutral-100"}`}
    >
      {label}
    </span>
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
