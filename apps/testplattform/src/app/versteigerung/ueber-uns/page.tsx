import Link from "next/link";
import { db } from "@/db";
import * as schema from "@/db/schema";

export default async function UeberUns() {
  const [firma] = await db.select().from(schema.firma).limit(1);

  return (
    <div className="mx-auto max-w-4xl px-6 py-20">
      <div className="text-xs uppercase tracking-[0.25em] text-gold-500">
        Das Haus
      </div>
      <h1 className="mt-3 font-serif text-5xl leading-tight text-ink-300">
        Seit 1973 werten wir, <br />
        was andere zurücklassen.
      </h1>
      <p className="mt-8 max-w-2xl text-lg leading-relaxed text-ink-100/80">
        Ziegler Treuhand ist ein inhabergeführtes Auktionshaus im westfälischen
        Gronau — spezialisiert auf die Verwertung von Insolvenzmassen. Unsere
        Auftraggeber sind Insolvenzverwalter, Banken, Gerichte und Unternehmen,
        die fair und transparent trennen müssen.
      </p>

      <div className="mt-16 grid gap-12 border-t border-paper-200 pt-16 md:grid-cols-2">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-gold-500">
            Öffentliche Bestellung
          </div>
          <h2 className="mt-2 font-serif text-3xl text-ink-300">
            Jürgen Oliver Ziegler
          </h2>
          <p className="mt-4 leading-relaxed text-ink-100/75">
            Öffentlich bestellter und vereidigter Auktionator der IHK Nord
            Westfalen, Sachverständiger für Maschinen und industrielle Anlagen,
            Versteigerer für Immobilien.
          </p>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-gold-500">
            Kontakt
          </div>
          <h2 className="mt-2 font-serif text-3xl text-ink-300">
            Sprechen Sie uns an.
          </h2>
          <div className="mt-4 space-y-1 text-ink-100/80">
            <div>{firma?.strasse}</div>
            <div>
              {firma?.plz} {firma?.ort}
            </div>
            <div className="pt-3">Tel. {firma?.telefon}</div>
            <a
              href={`mailto:${firma?.email}`}
              className="text-gold-500 hover:underline"
            >
              {firma?.email}
            </a>
          </div>
        </div>
      </div>

      <div className="mt-20 grid grid-cols-3 gap-6 rounded-2xl bg-paper-100 p-10 text-center">
        <Fakt n="50+" l="Jahre" />
        <Fakt n="1000+" l="Verwertungen pro Jahr" />
        <Fakt n="2" l="Kopf-Team" />
      </div>

      <div className="mt-16 text-center">
        <Link
          href="/versteigerung/auktionen"
          className="inline-flex items-center gap-2 rounded-full bg-ink-300 px-8 py-4 text-sm font-medium text-paper-50 transition hover:bg-gold-500"
        >
          Aktuelle Auktionen ansehen →
        </Link>
      </div>
    </div>
  );
}

function Fakt({ n, l }: { n: string; l: string }) {
  return (
    <div>
      <div className="font-serif text-4xl text-ink-300">{n}</div>
      <div className="mt-2 text-xs uppercase tracking-[0.2em] text-ink-50">
        {l}
      </div>
    </div>
  );
}
