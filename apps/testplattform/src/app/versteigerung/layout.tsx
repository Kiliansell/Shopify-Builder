import Link from "next/link";
import type { ReactNode } from "react";
import { db } from "@/db";
import * as schema from "@/db/schema";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const [firma] = await db.select().from(schema.firma).limit(1);

  return (
    <div className="min-h-screen bg-paper-50 font-sans text-ink-200">
      {/* Top-Strip */}
      <div className="border-b border-paper-200 bg-paper-100/60 text-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2">
          <span className="text-ink-50">
            Öffentlich bestellt · Vereidigter Auktionator · Seit 1973
          </span>
          <div className="flex gap-4 text-ink-50">
            <a href={`tel:${firma?.telefon ?? ""}`} className="hover:text-gold-500">
              {firma?.telefon}
            </a>
            <a
              href={`mailto:${firma?.email ?? ""}`}
              className="hover:text-gold-500"
            >
              {firma?.email}
            </a>
            <Link href="/" className="hover:text-gold-500">
              Intranet →
            </Link>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-paper-200 bg-paper-50/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/versteigerung" className="group flex flex-col leading-tight">
            <span className="font-serif text-2xl tracking-tight text-ink-300 group-hover:text-gold-500">
              Ziegler Treuhand
            </span>
            <span className="text-[11px] uppercase tracking-[0.3em] text-ink-50">
              Auktionshaus Gronau
            </span>
          </Link>
          <nav className="hidden gap-9 text-sm font-medium text-ink-100 md:flex">
            <Link href="/versteigerung/auktionen" className="hover:text-gold-500">
              Auktionen
            </Link>
            <Link
              href="/versteigerung/auktionen?kategorie=fahrzeuge"
              className="hover:text-gold-500"
            >
              Fahrzeuge
            </Link>
            <Link href="/versteigerung/ueber-uns" className="hover:text-gold-500">
              Über uns
            </Link>
            <Link href="/versteigerung/kontakt" className="hover:text-gold-500">
              Kontakt
            </Link>
          </nav>
          <Link
            href="/versteigerung/registrieren"
            className="rounded-full border border-ink-200 px-5 py-2 text-sm font-medium transition hover:border-gold-500 hover:bg-ink-200 hover:text-paper-50"
          >
            Als Bieter anmelden
          </Link>
        </div>
      </header>

      {/* Main */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="mt-24 border-t border-paper-200 bg-ink-300 text-paper-100">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="font-serif text-2xl">Ziegler Treuhand</div>
            <div className="mt-1 text-xs uppercase tracking-[0.3em] text-gold-400">
              Auktionshaus Gronau
            </div>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-paper-100/70">
              Öffentlich bestellter und vereidigter Auktionator, Sachverständiger
              für Maschinen und industrielle Anlagen. Versteigerungen von
              Fahrzeugen, Maschinen und Betriebsausstattung.
            </p>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-400">
              Kontakt
            </div>
            <ul className="mt-4 space-y-1 text-sm text-paper-100/80">
              <li>{firma?.name}</li>
              <li>{firma?.strasse}</li>
              <li>
                {firma?.plz} {firma?.ort}
              </li>
              <li className="pt-3">Tel. {firma?.telefon}</li>
              <li>{firma?.email}</li>
            </ul>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-400">
              Rechtliches
            </div>
            <ul className="mt-4 space-y-1 text-sm text-paper-100/80">
              <li>
                {firma?.hra} · {firma?.amtsgericht}
              </li>
              <li>Geschäftsführer: {firma?.geschaeftsfuehrer}</li>
              <li className="pt-3">
                <Link href="/versteigerung/agb" className="hover:text-gold-400">
                  AGB
                </Link>
              </li>
              <li>
                <Link
                  href="/versteigerung/datenschutz"
                  className="hover:text-gold-400"
                >
                  Datenschutz
                </Link>
              </li>
              <li>
                <Link
                  href="/versteigerung/impressum"
                  className="hover:text-gold-400"
                >
                  Impressum
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto max-w-7xl px-6 py-6 text-xs text-paper-100/50">
            © {new Date().getFullYear()} {firma?.name}. Alle Rechte vorbehalten.
          </div>
        </div>
      </footer>
    </div>
  );
}
