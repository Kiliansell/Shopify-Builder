import Link from "next/link";
import type { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Ziegler Treuhand — Intranet
          </Link>
          <nav className="flex gap-5 text-sm">
            <Link href="/projekte" className="hover:text-ziegler-accent">
              Projekte
            </Link>
            <Link href="/auktionen" className="hover:text-ziegler-accent">
              Auktionen
            </Link>
            <Link href="/rechnungen" className="hover:text-ziegler-accent">
              Rechnungen
            </Link>
            <Link href="/dokumente" className="hover:text-ziegler-accent">
              Dokumente
            </Link>
            <Link href="/fotos/eingang" className="hover:text-ziegler-accent">
              Foto-Eingang
            </Link>
            <Link href="/kunden" className="hover:text-ziegler-accent">
              Kunden
            </Link>
            <Link
              href="/versteigerung"
              className="rounded-full bg-ziegler-dark px-3 py-1 text-xs text-white hover:bg-black"
            >
              ↗ Öffentliche Seite
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      <footer className="mx-auto max-w-6xl px-6 py-8 text-xs text-neutral-500">
        Prototyp · SQLite lokal · Intranet
      </footer>
    </>
  );
}
