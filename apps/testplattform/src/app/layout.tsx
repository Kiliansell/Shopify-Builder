import "./globals.css";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata = {
  title: "Ziegler Treuhand — Testplattform",
  description: "Prototyp fuer das neue Auktions-Tool",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <body className="min-h-screen">
        <header className="border-b bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              Ziegler Treuhand — Testplattform
            </Link>
            <nav className="flex gap-6 text-sm">
              <Link href="/projekte" className="hover:text-ziegler-accent">Projekte</Link>
              <Link href="/auktionen" className="hover:text-ziegler-accent">Auktionen</Link>
              <Link href="/rechnungen" className="hover:text-ziegler-accent">Rechnungen</Link>
              <Link href="/dokumente" className="hover:text-ziegler-accent">Dokumente</Link>
              <Link href="/kunden" className="hover:text-ziegler-accent">Kunden</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
        <footer className="mx-auto max-w-6xl px-6 py-8 text-xs text-neutral-500">
          Prototyp • Sprint 1 • SQLite local
        </footer>
      </body>
    </html>
  );
}
