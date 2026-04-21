import { notFound } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eur, datumZeit } from "@/lib/format";
import { berechneNeueEndzeit } from "@/lib/auction";
import { PreciseCountdown } from "../../countdown";
import { kategorieVon } from "@/lib/public-helpers";
import { GalerieClient } from "./galerie";

export const dynamic = "force-dynamic";

async function gebotAbgeben(form: FormData) {
  "use server";
  const auktionId = Number(form.get("auktion_id"));
  const betrag = Number(form.get("betrag"));
  const kundenNr = String(form.get("kunden_nr") ?? "").trim();
  if (!betrag || !kundenNr) return;

  const [a] = await db
    .select()
    .from(schema.auktion)
    .where(eq(schema.auktion.id, auktionId));
  if (!a || a.status !== "laeuft") return;
  if (betrag <= (a.aktuelles_gebot ?? a.startpreis)) return;

  let [k] = await db
    .select()
    .from(schema.kunde)
    .where(eq(schema.kunde.kunden_nr, kundenNr));
  if (!k) {
    const inserted = await db
      .insert(schema.kunde)
      .values({ kunden_nr: kundenNr, bietername: kundenNr })
      .returning();
    k = inserted[0];
  }

  const jetzt = new Date();
  const neueEndzeit = berechneNeueEndzeit(a.end_ts, betrag, jetzt);

  await db.insert(schema.gebot).values({
    auktion_id: auktionId,
    kunde_id: k.id,
    betrag,
    abgegeben_am: jetzt,
  });

  await db
    .update(schema.auktion)
    .set({ aktuelles_gebot: betrag, end_ts: neueEndzeit })
    .where(eq(schema.auktion.id, auktionId));

  revalidatePath(`/versteigerung/auktionen/${auktionId}`);
}

export default async function AuktionDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const auktionId = Number(id);

  const [row] = await db
    .select({
      auktion: schema.auktion,
      artikel: schema.artikel,
    })
    .from(schema.auktion)
    .innerJoin(schema.artikel, eq(schema.auktion.artikel_id, schema.artikel.id))
    .where(eq(schema.auktion.id, auktionId));
  if (!row) notFound();

  const { auktion, artikel } = row;

  const fotos = await db
    .select()
    .from(schema.foto)
    .where(eq(schema.foto.artikel_id, artikel.id))
    .orderBy(asc(schema.foto.reihenfolge));

  const [fahrzeug] = artikel.ist_fahrzeug
    ? await db
        .select()
        .from(schema.fahrzeug)
        .where(eq(schema.fahrzeug.artikel_id, artikel.id))
    : [null];

  const gebote = await db
    .select({
      id: schema.gebot.id,
      betrag: schema.gebot.betrag,
      abgegeben_am: schema.gebot.abgegeben_am,
      bietername: schema.kunde.bietername,
    })
    .from(schema.gebot)
    .innerJoin(schema.kunde, eq(schema.gebot.kunde_id, schema.kunde.id))
    .where(eq(schema.gebot.auktion_id, auktionId))
    .orderBy(desc(schema.gebot.abgegeben_am))
    .limit(10);

  const minGebot = (auktion.aktuelles_gebot ?? auktion.startpreis) + 10;
  const kategorie = kategorieVon(artikel.bezeichnung, artikel.ist_fahrzeug ?? false);

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <nav className="mb-8 flex items-center gap-2 text-sm text-ink-50">
        <Link href="/versteigerung" className="hover:text-gold-500">
          Home
        </Link>
        <span>/</span>
        <Link href="/versteigerung/auktionen" className="hover:text-gold-500">
          Auktionen
        </Link>
        <span>/</span>
        <span className="text-ink-200">Pos {artikel.global_pos_nr}</span>
      </nav>

      <div className="grid gap-12 lg:grid-cols-12">
        {/* Linke Spalte: Gallerie + Beschreibung */}
        <div className="lg:col-span-7">
          <div className="mb-4 flex items-center gap-3">
            <span className="rounded-full bg-paper-100 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-ink-100">
              {kategorie}
            </span>
            <span className="text-xs text-ink-50">
              Position {artikel.global_pos_nr}
            </span>
          </div>

          <GalerieClient
            bilder={fotos.map((f) => ({
              id: f.id,
              url: `/api/fotos/${f.id}/file`,
            }))}
            titel={artikel.bezeichnung}
          />

          <h1 className="mt-10 font-serif text-5xl leading-[1.1] text-ink-300">
            {artikel.bezeichnung}
          </h1>
          {artikel.zusatzinfo && (
            <p className="mt-3 text-lg text-ink-100/80">{artikel.zusatzinfo}</p>
          )}

          {/* Beschreibung */}
          {artikel.langtext && (
            <section className="mt-12">
              <h2 className="border-b border-paper-200 pb-3 font-serif text-2xl text-ink-300">
                Beschreibung
              </h2>
              <pre className="mt-6 whitespace-pre-wrap font-sans text-base leading-relaxed text-ink-100">
                {artikel.langtext}
              </pre>
            </section>
          )}

          {/* Fahrzeugdaten */}
          {fahrzeug && (
            <section className="mt-12">
              <h2 className="border-b border-paper-200 pb-3 font-serif text-2xl text-ink-300">
                Fahrzeugdaten
              </h2>
              <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-4 text-sm md:grid-cols-3">
                <Dt k="Fabrikat" v={fahrzeug.fabrikat} />
                <Dt k="Typ" v={fahrzeug.typ} />
                <Dt k="FIN" v={fahrzeug.fin} mono />
                <Dt k="Kennzeichen" v={fahrzeug.kennzeichen} mono />
                <Dt k="Erstzulassung" v={fahrzeug.erstzulassung} />
                <Dt k="TÜV bis" v={fahrzeug.tuev_bis} />
              </dl>
            </section>
          )}

          {/* Hinweise */}
          <section className="mt-12 rounded-2xl border border-paper-200 bg-paper-100 p-8">
            <h3 className="font-serif text-xl text-ink-300">Wichtige Hinweise</h3>
            <ul className="mt-4 space-y-3 text-sm text-ink-100">
              <li className="flex gap-3">
                <span className="text-gold-500">◆</span>
                Der Verkauf erfolgt unter Ausschluss jeglicher Gewährleistung
                für Sachmängel (§§ 3 Abs. 8, 4 Abs. 1 S. 3 AGB).
              </li>
              <li className="flex gap-3">
                <span className="text-gold-500">◆</span>
                Auf den Zuschlagspreis wird ein Aufgeld von 18 % (zzgl. MwSt.)
                erhoben.
              </li>
              <li className="flex gap-3">
                <span className="text-gold-500">◆</span>
                Herausgabe erst nach Zahlungseingang auf unserem Konto.
              </li>
              <li className="flex gap-3">
                <span className="text-gold-500">◆</span>
                Automatische Verlängerung: Bei Gebot in den letzten 2 Min.
                verlängert sich die Auktion um 1–2 Minuten.
              </li>
            </ul>
          </section>
        </div>

        {/* Rechte Spalte: Gebot-Panel */}
        <div className="lg:col-span-5">
          <div className="sticky top-28 space-y-6">
            <div className="rounded-2xl bg-ink-300 p-8 text-paper-100">
              <div className="text-[11px] uppercase tracking-[0.25em] text-gold-400">
                Aktuelles Gebot
              </div>
              <div className="mt-2 font-serif text-5xl">
                {eur(auktion.aktuelles_gebot ?? auktion.startpreis)}
              </div>
              <div className="mt-1 text-sm text-paper-100/60">
                Startpreis: {eur(auktion.startpreis)}
              </div>

              <div className="mt-8 border-t border-white/10 pt-8">
                <div className="text-[11px] uppercase tracking-[0.25em] text-paper-100/60">
                  Endet in
                </div>
                <div className="mt-3">
                  <PreciseCountdown endMs={auktion.end_ts.getTime()} />
                </div>
                <div className="mt-3 text-xs text-paper-100/50">
                  {datumZeit(auktion.end_ts)}
                </div>
              </div>
            </div>

            {auktion.status === "laeuft" && (
              <form
                action={gebotAbgeben}
                className="rounded-2xl border border-paper-200 bg-paper-50 p-8"
              >
                <h3 className="font-serif text-xl text-ink-300">
                  Gebot abgeben
                </h3>
                <input type="hidden" name="auktion_id" value={auktion.id} />
                <label className="mt-5 block text-sm">
                  <span className="mb-1 block text-xs uppercase tracking-[0.15em] text-ink-50">
                    Bieter-Nummer
                  </span>
                  <input
                    name="kunden_nr"
                    required
                    placeholder="z. B. 22478/10047"
                    className="w-full rounded-lg border border-paper-200 bg-paper-50 px-4 py-3 outline-none focus:border-gold-500"
                  />
                </label>
                <label className="mt-4 block text-sm">
                  <span className="mb-1 block text-xs uppercase tracking-[0.15em] text-ink-50">
                    Betrag (EUR)
                  </span>
                  <input
                    name="betrag"
                    type="number"
                    step="1"
                    min={minGebot}
                    required
                    placeholder={String(minGebot)}
                    className="w-full rounded-lg border border-paper-200 bg-paper-50 px-4 py-3 font-mono text-lg tabular-nums outline-none focus:border-gold-500"
                  />
                  <span className="mt-1 block text-xs text-ink-50">
                    Mindestgebot: {eur(minGebot)}
                  </span>
                </label>
                <button
                  type="submit"
                  className="mt-6 w-full rounded-full bg-gold-500 py-4 text-sm font-semibold text-paper-50 transition hover:bg-gold-600"
                >
                  Gebot bestätigen
                </button>
                <p className="mt-3 text-center text-xs text-ink-50">
                  Mit Abgabe des Gebots akzeptieren Sie die{" "}
                  <Link
                    href="/versteigerung/agb"
                    className="underline hover:text-gold-500"
                  >
                    Versteigerungsbedingungen
                  </Link>
                  .
                </p>
              </form>
            )}

            {/* Gebots-Historie */}
            {gebote.length > 0 && (
              <div className="rounded-2xl border border-paper-200 bg-paper-50 p-6">
                <h3 className="font-serif text-lg text-ink-300">
                  Letzte Gebote
                </h3>
                <ul className="mt-4 divide-y divide-paper-200 text-sm">
                  {gebote.map((g) => (
                    <li
                      key={g.id}
                      className="flex items-center justify-between py-2"
                    >
                      <div>
                        <div className="font-medium text-ink-200">
                          {g.bietername}
                        </div>
                        <div className="text-xs text-ink-50">
                          {datumZeit(g.abgegeben_am)}
                        </div>
                      </div>
                      <div className="font-mono text-ink-300">
                        {eur(g.betrag)}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Dt({
  k,
  v,
  mono,
}: {
  k: string;
  v: string | null | undefined;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-[0.15em] text-ink-50">
        {k}
      </dt>
      <dd
        className={`mt-1 text-ink-300 ${mono ? "font-mono text-sm" : ""}`}
      >
        {v || "—"}
      </dd>
    </div>
  );
}
