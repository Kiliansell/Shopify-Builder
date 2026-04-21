# Ziegler Treuhand — Testplattform (Sprint 1)

Erster lauffähiger Prototyp für das neue Auktions-Tool. Ziel ist,
die Kernmodelle und Flows am echten Sample-Material aus
`docs/samples/` durchzuspielen.

## Schnellstart

```bash
cd apps/testplattform
npm install
npm run db:push      # Schema in SQLite anlegen
npm run db:seed      # Sample-Daten aus Beschluss + Rechnung einspielen
npm run dev          # http://localhost:3000
```

Oder in einem Schritt: `npm run setup && npm run dev`.

## Was drin ist

| Bereich | Status | Weg |
|---------|--------|-----|
| Projekte (Liste, Detail, Neu) | ✅ | `/projekte` |
| Artikel je Projekt (Liste, Neu) | ✅ | `/projekte/:id/artikel/neu` |
| Fahrzeug-Detail-Felder im Schema | ✅ | `src/db/schema.ts` |
| Kundenstamm + Volltext-Suche (Name / Mail / Telefon / Bietername) | ✅ | `/kunden` |
| Auktions-Liste | ✅ | `/auktionen` |
| Live-Auktion + Gebot + **Auto-Extend-Regel** (2 min < 500 EUR, 1 min ≥ 500 EUR) | ✅ | `/auktionen/:id` |
| Dokumenten-Upload (PDF/JPG/PNG) + PDF-Viewer | ✅ | `/dokumente/upload` |
| Rechnungs-Vorschau mit Ziegler-Briefkopf + Abholfenster + Achtung-Texte | ✅ | `/rechnungen/:id` |
| Provisionsrechnung mit Bezug auf Hauptrechnung | ✅ | Seed erzeugt eine |

## Sample-Daten nach Seed

- **Projekt** `73 IN 4/26` — Andreas Mey Galabau GmbH (aus `Beschluss.pdf`)
- **8 Artikel** (Lydi-Hammer, Knupp HM 600, Rammer E64, … — aus der handschriftlichen Liste)
- **1 Fahrzeug-Artikel** (Anhänger ALF KA 350 — aus `Rechnung_21.pdf`)
- **1 Auktion läuft** (10-Min-Countdown; Gebot abgeben, um Auto-Extend zu testen)
- **1 Kunde** Johannes van de Loo — Kd.Nr. `22478/10047`
- **2 Rechnungen** — Standard `3202-0021/20` + Provision `99999-0021/20`

## Ordnerstruktur

```
apps/testplattform/
├── src/
│   ├── app/                 # Next.js 15 App Router
│   │   ├── page.tsx         # Dashboard
│   │   ├── projekte/
│   │   ├── auktionen/
│   │   ├── rechnungen/
│   │   ├── dokumente/
│   │   ├── kunden/
│   │   └── api/dokumente/[id]/file/route.ts
│   ├── db/
│   │   ├── schema.ts        # Drizzle-Schema
│   │   ├── seed.ts          # Seed mit Sample-Daten
│   │   └── index.ts         # DB-Verbindung
│   └── lib/
│       ├── auction.ts       # Auto-Extend-Logik (mit Tests testbar)
│       └── format.ts        # EUR / Datum
├── data/                    # SQLite-DB (gitignored)
├── uploads/                 # Dokumenten-Uploads (gitignored)
└── drizzle/                 # Migrations
```

## Tech-Stack

- Next.js 15 (App Router, Server Actions)
- SQLite über `better-sqlite3` + Drizzle ORM
- Tailwind CSS
- TypeScript / Zod
- Keine externen Services nötig (lokal lauffähig ohne API-Keys)

## Bewusst NICHT in Sprint 1

- Authentifizierung (Single-User-Prototyp)
- Echte Beschluss/Fahrzeugschein-Extraktion (LLM/OCR)
- Fotos mit Drag-&-Drop-Sortierung
- Email-Versand
- PDF-Export (nur HTML-Vorschau)
- WhatsApp-Bot, Social-Posting
- Mobile PWA

Siehe `docs/03-coding-plan.md` für den Gesamtplan.

## Auto-Extend testen

1. Auf `/auktionen` gehen
2. Die laufende Auktion öffnen (Anhänger ALF KA 350)
3. Kleines Gebot (z. B. 1.220 EUR) → da ≥ 500 EUR, verlängert sich die Endzeit um 1 Min, wenn noch < 2 Min übrig
4. Siehe Countdown und Ende-Spalte
