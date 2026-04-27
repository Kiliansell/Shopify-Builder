import Link from "next/link";
import type { ReactNode } from "react";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { Logo } from "./logo";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const [firma] = await db.select().from(schema.firma).limit(1);

  return (
    <div className="min-h-screen bg-paper-100 font-sans text-ink-200">
      {/* Top-Strip in Ziegler-Blau Gradient */}
      <div className="bg-gradient-to-r from-ziegler_blau-400 via-ziegler_blau-500 to-ziegler_blau-700 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-2 text-xs">
          <span className="hidden sm:inline">
            Öffentlich bestellt · Vereidigter Auktionator · Seit 1973
          </span>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <a
              href={`mailto:${firma?.email ?? ""}`}
              className="font-medium hover:text-white/80"
            >
              {firma?.email}
            </a>
            <a
              href={`tel:${firma?.telefon ?? ""}`}
              className="hover:text-white/80"
            >
              {firma?.telefon}
            </a>
            <Link href="/" className="hidden sm:inline hover:text-white/80">
              Intranet →
            </Link>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-paper-300 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
          <Link href="/versteigerung" className="flex items-center gap-3">
            <Logo />
          </Link>
          <nav className="hidden gap-8 text-sm font-medium text-ink-100 md:flex">
            <Link
              href="/versteigerung/auktionen"
              className="transition hover:text-ziegler_blau-500"
            >
              Auktionen
            </Link>
            <Link
              href="/versteigerung/auktionen?kategorie=fahrzeuge"
              className="transition hover:text-ziegler_blau-500"
            >
              Fahrzeuge
            </Link>
            <Link
              href="/versteigerung/auktionen?kategorie=maschinen"
              className="transition hover:text-ziegler_blau-500"
            >
              Maschinen
            </Link>
            <Link
              href="/versteigerung/archiv"
              className="transition hover:text-ziegler_blau-500"
            >
              Archiv
            </Link>
            <Link
              href="/versteigerung/ueber-uns"
              className="transition hover:text-ziegler_blau-500"
            >
              Über uns
            </Link>
          </nav>
          <Link
            href="/versteigerung/registrieren"
            className="hidden rounded-md bg-ziegler_blau-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-ziegler_blau-700 md:inline-block"
          >
            Anmelden
          </Link>
        </div>
      </header>

      {/* Main */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="mt-24 bg-ink-300 text-paper-200">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="text-2xl font-extrabold tracking-tight text-white">
              ZIEGLER
              <span className="ml-2 inline-block translate-y-[-2px] text-ziegler_blau-400">
                ›
              </span>
            </div>
            <div className="mt-1 text-xs uppercase tracking-[0.3em] text-ziegler_blau-300">
              Verwaltungs GmbH &amp; Co. Treuhand KG
            </div>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-paper-200/70">
              Öffentlich bestellter und vereidigter Auktionator,
              Sachverständiger für Maschinen und industrielle Anlagen.
              Versteigerungen von Fahrzeugen, Maschinen und Betriebsausstattung.
            </p>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-ziegler_blau-300">
              Kontakt
            </div>
            <ul className="mt-4 space-y-1 text-sm text-paper-200/80">
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
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-ziegler_blau-300">
              Rechtliches
            </div>
            <ul className="mt-4 space-y-1 text-sm text-paper-200/80">
              <li>
                {firma?.hra} · {firma?.amtsgericht}
              </li>
              <li>Geschäftsführer: {firma?.geschaeftsfuehrer}</li>
              <li className="pt-3">
                <Link
                  href="/versteigerung/agb"
                  className="hover:text-ziegler_blau-300"
                >
                  AGB
                </Link>
              </li>
              <li>
                <Link
                  href="/versteigerung/datenschutz"
                  className="hover:text-ziegler_blau-300"
                >
                  Datenschutz
                </Link>
              </li>
              <li>
                <Link
                  href="/versteigerung/impressum"
                  className="hover:text-ziegler_blau-300"
                >
                  Impressum
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto max-w-7xl px-6 py-6 text-xs text-paper-200/50">
            © {new Date().getFullYear()} {firma?.name}. Alle Rechte vorbehalten.
          </div>
        </div>
      </footer>
    </div>
  );
}
