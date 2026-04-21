import Link from "next/link";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import * as schema from "@/db/schema";

export default async function Home() {
  const [projekte] = await db.select({ c: sql<number>`count(*)` }).from(schema.projekt);
  const [artikel] = await db.select({ c: sql<number>`count(*)` }).from(schema.artikel);
  const [auktionen] = await db.select({ c: sql<number>`count(*)` }).from(schema.auktion);
  const [rechnungen] = await db.select({ c: sql<number>`count(*)` }).from(schema.rechnung);
  const [eingang] = await db
    .select({ c: sql<number>`count(*)` })
    .from(schema.fotoEingang)
    .where(sql`status != 'zugewiesen'`);

  const kacheln = [
    { label: "Projekte", wert: projekte.c, href: "/projekte", hint: "Gerichtsverfahren/Versteigerungen" },
    { label: "Artikel", wert: artikel.c, href: "/projekte", hint: "Versteigerbare Positionen" },
    { label: "Auktionen", wert: auktionen.c, href: "/auktionen", hint: "Aktiv + beendet" },
    { label: "Rechnungen", wert: rechnungen.c, href: "/rechnungen", hint: "Standard + Provision" },
    { label: "Foto-Eingang", wert: eingang.c, href: "/fotos/eingang", hint: "Bulk-Upload + Auto-Zuordnung" },
  ];

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-semibold">Uebersicht</h1>
        <p className="mt-2 text-neutral-600">
          Testplattform mit Sample-Daten aus dem Beschluss{" "}
          <code className="rounded bg-neutral-100 px-1 text-sm">73 IN 4/26</code> und der
          Rechnung <code className="rounded bg-neutral-100 px-1 text-sm">3202-0021/20</code>.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kacheln.map((k) => (
          <Link
            key={k.label}
            href={k.href}
            className="block rounded-lg border bg-white p-6 shadow-sm transition hover:border-ziegler-accent"
          >
            <div className="text-xs uppercase tracking-wide text-neutral-500">{k.label}</div>
            <div className="mt-2 text-4xl font-semibold">{k.wert}</div>
            <div className="mt-2 text-xs text-neutral-500">{k.hint}</div>
          </Link>
        ))}
      </section>

      <section className="rounded-lg border bg-white p-6">
        <h2 className="text-xl font-semibold">Was funktioniert in Sprint 1</h2>
        <ul className="mt-4 list-inside list-disc space-y-1 text-sm text-neutral-700">
          <li>Projekt anlegen, anzeigen, Artikel verwalten</li>
          <li>Artikel mit Fahrzeug-Details, Werten (Stilllegung / Fortfuehrung / Startwert)</li>
          <li>Dokumenten-Upload (Beschluss-PDF, Fahrzeugscheine, sonstige)</li>
          <li>Rechnungs-Vorschau mit Briefkopf auf Basis der Sample-Rechnung</li>
          <li>Live-Auktion mit Auto-Extend-Regel (2min unter 500, 1min ab 500 EUR)</li>
          <li>Kundenstamm mit Such-Index (Name, Mail, Tel.)</li>
        </ul>
      </section>

      <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-6">
        <h2 className="text-lg font-semibold">Neu in Sprint 2</h2>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-neutral-700">
          <li>
            Beschluss-Upload {">"} Claude API (<code>claude-opus-4-7</code>) mit
            JSON-Schema-Extraktion {">"} Side-by-Side Review-UI {">"} Projekt
            anlegen per 1 Klick.
          </li>
          <li>
            Test: PDF unter <Link href="/dokumente/upload" className="text-ziegler-accent underline">/dokumente/upload</Link>{" "}
            hochladen (Typ: Beschluss), dann Auswerten &amp; freigeben.
          </li>
          <li>
            Braucht <code>ANTHROPIC_API_KEY</code> in{" "}
            <code>.env.local</code>.
          </li>
        </ul>
      </section>

      <section className="rounded-lg border bg-amber-50 p-6">
        <h2 className="text-lg font-semibold">Noch nicht implementiert</h2>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-neutral-700">
          <li>Fahrzeugschein-OCR (Azure Document Intelligence)</li>
          <li>Foto-Upload mit Drag-&amp;-Drop-Sortierung</li>
          <li>PDF-Export (derzeit nur HTML-Vorschau)</li>
          <li>WhatsApp-Bot, Social-Posting, Email-Versand</li>
          <li>Auth / Benutzerverwaltung</li>
        </ul>
      </section>
    </div>
  );
}
