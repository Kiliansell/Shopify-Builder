import Link from "next/link";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eur } from "@/lib/format";
import { LiveCountdown } from "./countdown";

export const dynamic = "force-dynamic";

export default async function VersteigerungHome() {
  const jetzt = Math.floor(Date.now() / 1000);
  const aktive = await db
    .select({
      auktion_id: schema.auktion.id,
      end_ts: schema.auktion.end_ts,
      startpreis: schema.auktion.startpreis,
      aktuelles_gebot: schema.auktion.aktuelles_gebot,
      artikel_id: schema.artikel.id,
      bezeichnung: schema.artikel.bezeichnung,
      zusatzinfo: schema.artikel.zusatzinfo,
      ist_fahrzeug: schema.artikel.ist_fahrzeug,
      global_pos_nr: schema.artikel.global_pos_nr,
      foto_id: sql<number | null>`(select id from foto where foto.artikel_id = artikel.id order by reihenfolge asc limit 1)`,
    })
    .from(schema.auktion)
    .innerJoin(schema.artikel, eq(schema.auktion.artikel_id, schema.artikel.id))
    .where(
      sql`${schema.auktion.status} = 'laeuft'
          AND ${schema.auktion.end_ts} > ${jetzt}
          AND ${schema.artikel.sichtbarkeit} = 'live'`,
    )
    .orderBy(asc(schema.auktion.end_ts));

  const hero = aktive.find((a) => a.ist_fahrzeug && a.foto_id) ?? aktive.find((a) => a.foto_id) ?? aktive[0];
  const highlights = aktive.slice(0, 3);
  const rest = aktive.slice(0, 12);

  const [statistik] = await db
    .select({
      artikel_gesamt: sql<number>`(select count(*) from artikel)`,
      aktive_auktionen: sql<number>`(select count(*) from auktion where status = 'laeuft')`,
    })
    .from(schema.firma);

  return (
    <>
      {/* Hero — voller Blau-Gradient mit Bild rechts */}
      <section className="relative overflow-hidden bg-gradient-to-br from-ziegler_blau-500 via-ziegler_blau-600 to-ziegler_blau-800 text-white">
        {/* Decoration */}
        <div className="absolute -top-32 right-0 h-[600px] w-[600px] rounded-full bg-ziegler_blau-400/30 blur-3xl"></div>
        <div className="absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-ziegler_blau-700/40 blur-3xl"></div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-12 lg:py-24">
          <div className="lg:col-span-6">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.25em] text-white/90 backdrop-blur">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white"></span>
              {statistik?.aktive_auktionen ?? 0} Auktionen live
            </div>
            <h1 className="text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
              Werte fair
              <br />
              versteigern.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/80">
              Öffentliche Versteigerungen aus Insolvenzmassen. Fahrzeuge,
              Maschinen, Betriebsausstattung — geprüft durch einen vereidigten
              Sachverständigen, transparent online ersteigerbar.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/versteigerung/auktionen"
                className="group inline-flex items-center gap-2 rounded-md bg-white px-7 py-3.5 text-sm font-semibold text-ziegler_blau-700 transition hover:bg-paper-200"
              >
                Alle Auktionen ansehen
                <span className="transition group-hover:translate-x-1">→</span>
              </Link>
              <Link
                href="/versteigerung/registrieren"
                className="inline-flex items-center gap-2 rounded-md border border-white/30 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Als Bieter anmelden
              </Link>
            </div>

            <div className="mt-14 grid grid-cols-3 gap-4 border-t border-white/15 pt-8">
              <Stat n={statistik?.aktive_auktionen ?? 0} l="Live-Auktionen" />
              <Stat n={statistik?.artikel_gesamt ?? 0} l="Artikel im Bestand" />
              <Stat n="50+" l="Jahre Erfahrung" />
            </div>
          </div>

          {hero && (
            <div className="lg:col-span-6">
              <Link
                href={`/versteigerung/auktionen/${hero.auktion_id}`}
                className="group block"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-ink-300 shadow-2xl ring-1 ring-white/10">
                  {hero.foto_id ? (
                    <img
                      src={`/api/fotos/${hero.foto_id}/file`}
                      alt={hero.bezeichnung}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-white/30">
                      <span className="text-6xl font-extrabold">ZIEGLER</span>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-300/95 via-ink-300/40 to-transparent p-7">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-ziegler_blau-300">
                      Position {hero.global_pos_nr}
                      {hero.ist_fahrzeug ? " · Fahrzeug" : ""}
                    </div>
                    <h2 className="mt-2 text-2xl font-bold leading-tight text-white md:text-3xl">
                      {hero.bezeichnung}
                    </h2>
                    <div className="mt-5 flex items-end justify-between">
                      <div>
                        <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/60">
                          Aktuelles Gebot
                        </div>
                        <div className="mt-1 text-2xl font-bold text-white">
                          {eur(hero.aktuelles_gebot ?? hero.startpreis)}
                        </div>
                      </div>
                      <div className="rounded-md bg-ziegler_blau-500 px-3 py-1.5 text-sm font-medium text-white">
                        <LiveCountdown endMs={hero.end_ts.getTime()} />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Highlights */}
      {highlights.length > 1 && (
        <section className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.25em] text-ziegler_blau-500">
                Kuratiert
              </div>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink-300 md:text-4xl">
                Highlight-Auktionen
              </h2>
            </div>
            <Link
              href="/versteigerung/auktionen"
              className="hidden text-sm font-medium text-ziegler_blau-600 hover:underline md:inline"
            >
              Alle ansehen →
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {highlights.map((h) => (
              <AuktionCard key={h.auktion_id} a={h} />
            ))}
          </div>
        </section>
      )}

      {/* Kategorien-Band */}
      <section className="bg-paper-200 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-ziegler_blau-500">
              Unser Programm
            </div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink-300 md:text-4xl">
              Drei Schwerpunkte
            </h2>
            <p className="mt-4 text-ink-100">
              Seit über 50 Jahren auf den Kern unseres Handwerks fokussiert —
              und offen für alles, was über eine Insolvenzmasse zu uns kommt.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <KategorieKachel
              titel="Fahrzeuge"
              untertitel="LKW, Anhänger, Transporter"
              beschreibung="Über 60 % unseres Umsatzes. Von Werkstattfahrzeugen bis Spezialaufbauten."
              href="/versteigerung/auktionen?kategorie=fahrzeuge"
            />
            <KategorieKachel
              titel="Maschinen"
              untertitel="Produktion, Bau, Garten &amp; Landschaft"
              beschreibung="Werkstatt, Abbruchhämmer, Rammer, Kompressoren — geprüft und dokumentiert."
              href="/versteigerung/auktionen?kategorie=maschinen"
            />
            <KategorieKachel
              titel="Gastro &amp; Möbel"
              untertitel="Komplettausstattungen"
              beschreibung="Restaurant-Einrichtungen, Küchen, Gastro-Geräte, historische Stücke."
              href="/versteigerung/auktionen?kategorie=gastro"
            />
          </div>
        </div>
      </section>

      {/* Alle aktuellen */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-ziegler_blau-500">
              Live
            </div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink-300 md:text-4xl">
              Aktuelle Auktionen
            </h2>
          </div>
          <Link
            href="/versteigerung/auktionen"
            className="text-sm font-medium text-ziegler_blau-600 hover:underline"
          >
            Alle {aktive.length} ansehen →
          </Link>
        </div>
        {rest.length === 0 ? (
          <div className="rounded-xl border border-paper-300 bg-white py-16 text-center text-ink-50">
            Aktuell laufen keine Auktionen. Bitte in Kürze wieder vorbeischauen.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rest.map((a) => (
              <AuktionCard key={a.auktion_id} a={a} />
            ))}
          </div>
        )}
      </section>

      {/* Vertrauens-Sektion */}
      <section className="bg-white py-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 md:grid-cols-2">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-ziegler_blau-500">
              Vertrauen
            </div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink-300 md:text-4xl">
              Warum bei uns ersteigern?
            </h2>
            <p className="mt-4 max-w-md text-ink-100">
              Nicht jedes Auktionshaus arbeitet mit der Sorgfalt eines
              vereidigten Sachverständigen. Wir schon.
            </p>
          </div>
          <div className="space-y-6">
            <Merkmal
              titel="Öffentlich bestellter Auktionator"
              text="Jürgen Oliver Ziegler ist von der IHK Nord Westfalen öffentlich bestellt und vereidigt — Zuschlag und Protokoll haben Urkundenqualität."
            />
            <Merkmal
              titel="Geprüfte Sachverständigen-Werte"
              text="Jeder Posten wird vor Aufruf begutachtet. Still-, Fort- und Auktionsstartwert werden dokumentiert und sind einsehbar."
            />
            <Merkmal
              titel="Fairer Ablauf, klare Regeln"
              text="Automatische Verlängerung in den letzten Minuten verhindert Last-Second-Sniping. Zahlung erst, Abholung dann — klare Ordnung."
            />
          </div>
        </div>
      </section>
    </>
  );
}

function Stat({ n, l }: { n: string | number; l: string }) {
  return (
    <div>
      <div className="text-3xl font-bold text-white">{n}</div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/60">
        {l}
      </div>
    </div>
  );
}

function AuktionCard({
  a,
}: {
  a: {
    auktion_id: number;
    end_ts: Date;
    startpreis: number;
    aktuelles_gebot: number | null;
    bezeichnung: string;
    zusatzinfo: string | null;
    ist_fahrzeug: boolean | null;
    global_pos_nr: number;
    foto_id: number | null;
  };
}) {
  return (
    <Link
      href={`/versteigerung/auktionen/${a.auktion_id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-paper-300 bg-white transition hover:-translate-y-0.5 hover:border-ziegler_blau-400 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-paper-200">
        {a.foto_id ? (
          <img
            src={`/api/fotos/${a.foto_id}/file`}
            alt={a.bezeichnung}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl font-extrabold text-ink-50/30">
            ZIEGLER
          </div>
        )}
        <div className="absolute left-3 top-3 rounded-md bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-ink-200 backdrop-blur">
          Pos {a.global_pos_nr}
        </div>
        <div className="absolute right-3 top-3 rounded-md bg-ziegler_blau-600/95 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
          <LiveCountdown endMs={a.end_ts.getTime()} />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 text-base font-semibold leading-snug text-ink-300 group-hover:text-ziegler_blau-600">
          {a.bezeichnung}
        </h3>
        {a.zusatzinfo && (
          <p className="mt-1 line-clamp-1 text-sm text-ink-50">{a.zusatzinfo}</p>
        )}
        <div className="mt-auto flex items-end justify-between pt-5">
          <div>
            <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink-50">
              Aktuelles Gebot
            </div>
            <div className="mt-1 text-xl font-bold text-ink-300">
              {eur(a.aktuelles_gebot ?? a.startpreis)}
            </div>
          </div>
          <span className="text-xs font-semibold text-ziegler_blau-600 transition group-hover:translate-x-1">
            Bieten →
          </span>
        </div>
      </div>
    </Link>
  );
}

function KategorieKachel({
  titel,
  untertitel,
  beschreibung,
  href,
}: {
  titel: string;
  untertitel: string;
  beschreibung: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-xl border border-paper-300 bg-white p-8 transition hover:-translate-y-1 hover:border-ziegler_blau-400 hover:shadow-lg"
    >
      <div className="text-xs font-semibold uppercase tracking-[0.25em] text-ziegler_blau-500">
        {untertitel}
      </div>
      <h3 className="mt-3 text-2xl font-bold tracking-tight text-ink-300 md:text-3xl">
        {titel}
      </h3>
      <p className="mt-4 text-sm leading-relaxed text-ink-100">{beschreibung}</p>
      <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-ziegler_blau-600 transition group-hover:gap-3">
        Entdecken <span>→</span>
      </div>
    </Link>
  );
}

function Merkmal({ titel, text }: { titel: string; text: string }) {
  return (
    <div className="flex gap-4">
      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ziegler_blau-100 text-ziegler_blau-600">
        ✓
      </div>
      <div>
        <h3 className="font-semibold text-ink-300">{titel}</h3>
        <p className="mt-1 text-ink-100">{text}</p>
      </div>
    </div>
  );
}
