import Link from "next/link";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eur } from "@/lib/format";
import { LiveCountdown } from "../countdown";
import { KATEGORIEN, kategorieVon } from "@/lib/public-helpers";

export const dynamic = "force-dynamic";

export default async function Auktionen({
  searchParams,
}: {
  searchParams: Promise<{ kategorie?: string; q?: string }>;
}) {
  const { kategorie = "alle", q = "" } = await searchParams;

  const jetzt = Math.floor(Date.now() / 1000);
  const rows = await db
    .select({
      auktion_id: schema.auktion.id,
      end_ts: schema.auktion.end_ts,
      startpreis: schema.auktion.startpreis,
      aktuelles_gebot: schema.auktion.aktuelles_gebot,
      status: schema.auktion.status,
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

  const suche = q.trim().toLowerCase();
  const gefiltert = rows.filter((r) => {
    const k = kategorieVon(r.bezeichnung, r.ist_fahrzeug ?? false).toLowerCase();
    const katOk =
      kategorie === "alle" ||
      (kategorie === "fahrzeuge" && k === "fahrzeuge") ||
      (kategorie === "maschinen" && k === "maschinen") ||
      (kategorie === "gastro" && k === "gastro") ||
      (kategorie === "zubehoer" && k === "zubehör");
    const textOk =
      !suche ||
      r.bezeichnung.toLowerCase().includes(suche) ||
      (r.zusatzinfo?.toLowerCase().includes(suche) ?? false);
    return katOk && textOk;
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-10">
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-ziegler_blau-500">
          Live-Auktionen
        </div>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-ink-300 md:text-5xl">
          Alle aktuellen Posten
        </h1>
        <p className="mt-4 max-w-xl text-ink-100">
          {rows.length} aktive Auktion{rows.length !== 1 ? "en" : ""} —
          aktualisiert in Echtzeit.
        </p>
      </div>

      <form className="mb-6 flex flex-wrap gap-3">
        <div className="flex flex-wrap gap-2">
          {KATEGORIEN.map((k) => (
            <Link
              key={k.id}
              href={`/versteigerung/auktionen?kategorie=${k.id}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className={`rounded-md border px-5 py-2 text-sm font-medium transition ${
                kategorie === k.id
                  ? "border-ziegler_blau-600 bg-ziegler_blau-600 text-white"
                  : "border-paper-300 bg-white text-ink-100 hover:border-ziegler_blau-400 hover:text-ziegler_blau-600"
              }`}
            >
              {k.label}
            </Link>
          ))}
        </div>
        <input
          type="hidden"
          name="kategorie"
          value={kategorie}
        />
        <input
          name="q"
          defaultValue={q}
          placeholder="Suche nach Bezeichnung..."
          className="ml-auto w-full rounded-md border border-paper-300 bg-white px-5 py-2 text-sm outline-none focus:border-ziegler_blau-500 md:w-80"
        />
      </form>

      {gefiltert.length === 0 ? (
        <div className="rounded-xl border border-paper-300 bg-white py-20 text-center">
          <p className="text-2xl font-bold text-ink-200">
            Keine Auktionen gefunden
          </p>
          <p className="mt-2 text-sm text-ink-50">
            Versuche es mit einer anderen Kategorie oder ohne Suchbegriff.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {gefiltert.map((a) => (
            <Link
              key={a.auktion_id}
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
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ziegler_blau-500">
                  {kategorieVon(a.bezeichnung, a.ist_fahrzeug ?? false)}
                </div>
                <h3 className="mt-2 line-clamp-2 text-base font-semibold leading-snug text-ink-300 group-hover:text-ziegler_blau-600">
                  {a.bezeichnung}
                </h3>
                {a.zusatzinfo && (
                  <p className="mt-1 line-clamp-1 text-sm text-ink-50">
                    {a.zusatzinfo}
                  </p>
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
          ))}
        </div>
      )}
    </div>
  );
}
