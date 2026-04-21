import Link from "next/link";
import { asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eur } from "@/lib/format";
import { LiveCountdown } from "./countdown";

export const dynamic = "force-dynamic";

export default async function VersteigerungHome() {
  // Aktive Auktionen fuer Highlight- und Grid-Sektion
  const jetzt = new Date();
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
      sql`${schema.auktion.status} = 'laeuft' AND ${schema.auktion.end_ts} > ${Math.floor(jetzt.getTime() / 1000)}`,
    )
    .orderBy(asc(schema.auktion.end_ts));

  const hero = aktive.find((a) => a.ist_fahrzeug) ?? aktive[0];
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
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-paper-200 bg-paper-100">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-20 lg:grid-cols-12 lg:py-28">
          <div className="lg:col-span-6">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-100/60 px-4 py-1.5 text-xs uppercase tracking-[0.25em] text-gold-600">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold-500"></span>
              Aktuell live
            </div>
            <h1 className="font-serif text-5xl leading-[1.05] text-ink-300 md:text-6xl lg:text-[68px]">
              Werte, die <em className="text-gold-500 not-italic">bleiben.</em>
              <br />
              Preise, die <em className="text-gold-500 not-italic">fair</em>{" "}
              entstehen.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-100/80">
              Öffentliche Versteigerungen aus Insolvenzmassen. Fahrzeuge,
              Maschinen, Betriebsausstattung — geprüft durch einen vereidigten
              Sachverständigen, transparent online ersteigerbar.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/versteigerung/auktionen"
                className="group inline-flex items-center gap-2 rounded-full bg-ink-300 px-8 py-4 text-sm font-medium text-paper-50 transition hover:bg-gold-500"
              >
                Alle Auktionen ansehen
                <span className="transition group-hover:translate-x-1">→</span>
              </Link>
              <Link
                href="/versteigerung/ueber-uns"
                className="text-sm font-medium text-ink-100 underline-offset-4 hover:text-gold-500 hover:underline"
              >
                Mehr über das Haus
              </Link>
            </div>

            <div className="mt-14 flex gap-10 border-t border-paper-200 pt-8">
              <div>
                <div className="font-serif text-3xl text-ink-300">
                  {statistik?.aktive_auktionen ?? 0}
                </div>
                <div className="mt-1 text-xs uppercase tracking-[0.2em] text-ink-50">
                  Live-Auktionen
                </div>
              </div>
              <div>
                <div className="font-serif text-3xl text-ink-300">
                  {statistik?.artikel_gesamt ?? 0}
                </div>
                <div className="mt-1 text-xs uppercase tracking-[0.2em] text-ink-50">
                  Artikel im Bestand
                </div>
              </div>
              <div>
                <div className="font-serif text-3xl text-ink-300">1973</div>
                <div className="mt-1 text-xs uppercase tracking-[0.2em] text-ink-50">
                  Gegründet
                </div>
              </div>
            </div>
          </div>

          {/* Hero-Artikel */}
          {hero && (
            <div className="lg:col-span-6">
              <Link
                href={`/versteigerung/auktionen/${hero.auktion_id}`}
                className="group block"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-ink-300">
                  {hero.foto_id ? (
                    <img
                      src={`/api/fotos/${hero.foto_id}/file`}
                      alt={hero.bezeichnung}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-paper-100/40">
                      <span className="font-serif text-6xl">ZT</span>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-300/95 via-ink-300/50 to-transparent p-8 text-paper-100">
                    <div className="text-xs uppercase tracking-[0.25em] text-gold-400">
                      Position {hero.global_pos_nr}
                      {hero.ist_fahrzeug ? " · Fahrzeug" : ""}
                    </div>
                    <h2 className="mt-2 font-serif text-3xl leading-tight">
                      {hero.bezeichnung}
                    </h2>
                    <div className="mt-6 flex items-end justify-between">
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.2em] text-paper-100/60">
                          Aktuelles Gebot
                        </div>
                        <div className="mt-1 font-serif text-3xl">
                          {eur(hero.aktuelles_gebot ?? hero.startpreis)}
                        </div>
                      </div>
                      <div className="rounded-full bg-paper-50/10 px-4 py-2 text-sm backdrop-blur">
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
          <div className="mb-10 flex items-end justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-gold-500">
                Kuratiert
              </div>
              <h2 className="mt-3 font-serif text-4xl text-ink-300">
                Highlight-Auktionen
              </h2>
            </div>
            <Link
              href="/versteigerung/auktionen"
              className="hidden text-sm font-medium text-ink-100 hover:text-gold-500 md:inline"
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
      <section className="bg-ink-300 py-20 text-paper-100">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 max-w-2xl">
            <div className="text-xs uppercase tracking-[0.25em] text-gold-400">
              Unser Programm
            </div>
            <h2 className="mt-3 font-serif text-4xl">Drei Schwerpunkte</h2>
            <p className="mt-4 text-paper-100/70">
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
              untertitel="Produktion, Baugewerbe, Garten &amp; Landschaft"
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
            <div className="text-xs uppercase tracking-[0.25em] text-gold-500">
              Live
            </div>
            <h2 className="mt-3 font-serif text-4xl text-ink-300">
              Aktuelle Auktionen
            </h2>
          </div>
          <Link
            href="/versteigerung/auktionen"
            className="text-sm font-medium text-ink-100 hover:text-gold-500"
          >
            Alle {aktive.length} ansehen →
          </Link>
        </div>
        {rest.length === 0 ? (
          <div className="rounded-2xl border border-paper-200 bg-paper-100/40 py-16 text-center text-ink-50">
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
      <section className="border-t border-paper-200 bg-paper-100 py-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 md:grid-cols-2">
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-gold-500">
              Vertrauen
            </div>
            <h2 className="mt-3 font-serif text-4xl text-ink-300">
              Warum bei uns ersteigern?
            </h2>
          </div>
          <div className="space-y-6 text-base leading-relaxed text-ink-100">
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
      className="group flex flex-col overflow-hidden rounded-2xl border border-paper-200 bg-paper-50 transition hover:border-gold-500 hover:shadow-xl"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-paper-100">
        {a.foto_id ? (
          <img
            src={`/api/fotos/${a.foto_id}/file`}
            alt={a.bezeichnung}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-serif text-5xl text-ink-50/30">
            ZT
          </div>
        )}
        <div className="absolute left-3 top-3 rounded-full bg-paper-50/95 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.15em] text-ink-200 backdrop-blur">
          Pos {a.global_pos_nr}
        </div>
        <div className="absolute right-3 top-3 rounded-full bg-ink-300/80 px-3 py-1 text-xs text-paper-100 backdrop-blur">
          <LiveCountdown endMs={a.end_ts.getTime()} />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 font-serif text-lg leading-snug text-ink-300">
          {a.bezeichnung}
        </h3>
        {a.zusatzinfo && (
          <p className="mt-1 line-clamp-1 text-sm text-ink-50">{a.zusatzinfo}</p>
        )}
        <div className="mt-auto pt-5">
          <div className="text-[10px] uppercase tracking-[0.2em] text-ink-50">
            Aktuelles Gebot
          </div>
          <div className="mt-1 font-serif text-2xl text-ink-300">
            {eur(a.aktuelles_gebot ?? a.startpreis)}
          </div>
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
      className="group block rounded-2xl border border-white/10 bg-white/[0.03] p-8 transition hover:border-gold-400 hover:bg-white/[0.06]"
    >
      <div className="text-xs uppercase tracking-[0.25em] text-gold-400">
        {untertitel}
      </div>
      <h3 className="mt-3 font-serif text-3xl">{titel}</h3>
      <p className="mt-4 text-sm leading-relaxed text-paper-100/70">
        {beschreibung}
      </p>
      <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-gold-400 transition group-hover:gap-3">
        Entdecken <span>→</span>
      </div>
    </Link>
  );
}

function Merkmal({ titel, text }: { titel: string; text: string }) {
  return (
    <div>
      <h3 className="font-serif text-xl text-ink-300">{titel}</h3>
      <p className="mt-2 text-ink-100/75">{text}</p>
    </div>
  );
}
