# Feldstrukturen aus Sample-Dokumenten

Extrahiert aus den hochgeladenen Dokumenten vom 21.04.2026.

---

## 1. Beschluss (Gerichts-Insolvenzbeschluss)

**Sample:** `docs/samples/eingehend/beschluesse/Beschluss.pdf` (3 Seiten, gescannt, Microsoft Print To PDF)

### Kopfzeile (wiederkehrend)
- Erstellungsdatum links oben: `21.01.2026-13:51`
- Mittig: `Amtsgericht Münster`
- Rechts: `S. X/Y`

### Seite 1 — Kernfelder
| Feld | Beispielwert | Parser-Strategie |
|------|--------------|------------------|
| `aktenzeichen` | `73 IN 4/26` | Regex `\d{1,3}\s+IN\s+\d{1,4}/\d{2}` |
| `gericht` | `AMTSGERICHT MÜNSTER` | Fester Marker-Text |
| `verfahren_typ` | `BESCHLUSS` + `Insolvenzeröffnungsverfahren` | Keywords |
| `schuldner_firma` | `Andreas Mey Galabau GmbH` | Nach „Vermögen der im Handelsregister..." |
| `handelsregister` | `HRB 12594` | Regex `HR[AB]\s*\d+` |
| `hr_gericht` | `Amtsgericht Steinfurt` | Nach „eingetragenen" |
| `schuldner_adresse` | `Osnabrücker Straße 224, 48429 Rheine` | Adress-Regex |
| `vertreter_name` | `Andreas Mey` | Nach „Liquidator Herrn" |
| `vertreter_adresse` | `Rodder Damm 96, 48429 Rheine` | |
| `beschluss_datum` | `21.01.2026, um 13:23 Uhr` | Regex `\d{2}\.\d{2}\.\d{4}` |
| `rechtsgrundlage` | `§§ 21, 22 InsO` | Regex `§+\s*\d+` |
| `verwalter_name` | `Rechtsanwalt Lukas Kahl` | Nach „Insolvenzverwalter" |
| `verwalter_adresse` | `Heuerlandstraße 33, 48565 Steinfurt` | |
| `verwalter_tel` | `02552/638710` | Regex Telefon |
| `verwalter_fax` | `02552/6387111` | |

### Seite 2 — Anordnungen
- Freitext-Absätze (Zustimmungsvorbehalt, Unterlassung etc.)
- `sofortige_beschwerde_frist`: 2 Wochen

### Seite 3 — Zustellung & Unterschrift
- `richter_name`: `Brambrink`
- `ort_datum`: `Münster, 21.01.2026`

### Parser-Ansatz
1. Scan → Azure Document Intelligence (General DE-OCR)
2. Extrahierten Text → Claude API mit `extract_beschluss` Tool
3. Validierung: Aktenzeichen-Format, Datumsplausibilität
4. Human-in-the-loop: UI zeigt Extrakt + Scan side-by-side zur Freigabe

---

## 2. Rechnung (Standard-Rechnung Ziegler Treuhand)

**Sample:** `docs/samples/ausgehend/rechnungen/Rechnung_21.pdf` (3 Seiten, FPDF/Tendero-Backoffice)

### Briefkopf (wiederverwendbar als Vorlage)
- **Firma:** Ziegler Verwaltungs GmbH & Co. Treuhand KG
- **Logo:** Mitte — IHK Nord Westfalen öffentlich bestellter Sachverständiger
- **Adresse:** Enscheder Str. 19, 48599 Gronau
- **Kontakt:** Tel. 02562 / 70106-0, Fax 02562 / 70106-20, info@ziegler-treuhand.de
- **Geschäftsführer:** Jürgen Oliver Ziegler
- **Funktionen:** Öffentlich bestellter und vereidigter Auktionator / Sachverständiger / Versteigerer für Immobilien

### Fußzeile (wiederverwendbar)
- **Rechtsform:** GmbH & Co. KG - Sitz Gronau HRA 3673 Amtsgericht Coesfeld
- **Persönlich haftende Gesellschafterin:** Ziegler Verwaltungs GmbH
- **Geschäftsführer:** Jürgen Oliver Ziegler
- **Sitz Gronau:** HRB 5852 Amtsgericht Coesfeld
- **Bank:** Volksbank Gronau-Ahaus eG
- **BIC:** GENODEM1GRN
- **IBAN:** DE39 4016 4024 0139 4013 02
- **Hinweis:** „Bei Versand per E-Mail erfolgt kein postalischer Versand dieses Schriftstückes"

### Rechnungs-Block
| Feld | Beispielwert |
|------|--------------|
| `rechnungs_nr` | `3202-0021/20` (Format: `<ProjektNr>-<LfdNr>/<Jahr2>` vermutet) |
| `datum` | `26.03.26` |
| `kunden_nr` | `22478/10047` |
| `seite` | `1` von `2` (Mehrseitig) |

### Positionstabelle
Spalten: `Pos | Anzahl | Bezeichnung | MwSt | Preis`

**Beispiel-Artikelposition:**
```
Pos    7021
Anzahl 1
Bezeichnung:
  Anhänger (2-Achser) - (ALF, KA 350) - (EZ: 2 19%)  1.200,00
  Type XA 350 - EZ 700
  TÜV bis Februar 2028 (Neu)
  Mängel:
  - Holzboden eingelassen
  - Baustellen-Fahrzeug
  Hinweis:
  - Fahrzeug-Brief + Fahrzeugscheinen sind verbauten
  - ohne Papieren
  gem. Ihrem Online-Gebot am Standort:
  48477 Hörstel, Westfalenstraße 44 !!!!!!!!!
```

**Beispiel-Provisionsposition (immer als Pos 99999 erkennbar):**
```
Pos    99999
Anzahl 1
Bezeichnung: Aufgeld 18% zur Rechnung 3202-0021/20 von Netto 1.200,00 EUR
MwSt   19%
Preis  216,00 EUR
```

### Standard-Warn-Texte (in jeder Rechnung)
- Zahlungsanleitung: „Verkauf erfolgt unter Ausschluss jeglicher Gewährleistung für Sachmängel (§§ 3 Abs. 8, 4 Abs. 1 S. 3 AGB) !!!"
- „Bitte bringen Sie zur Abholung Ihre Proforma-Rechnung mit"
- Abholfenster: `Mittwoch, den 01. April 2026 von 09:00 Uhr - 09:30 Uhr !!!`
- „ACHTUNG: Eine Herausgabe der ersteigerten Position kann nur nach dem Zahlungseingang auf unserem Konto erfolgen!!!"

### Summen-Block
```
                  Netto            MwSt
Summe 19%    1.200,00 EUR    228,00 EUR
Rechnungsbetrag              1.428,00 EUR
```

### Learnings für Template-Engine
- **Briefkopf und Fußzeile** sind wiederholbare Bausteine → `<Header>`, `<Footer>` React-Komponenten
- **Seiten-Header** erscheint auf jeder Seite ab Seite 2 (dünnerer Rahmen)
- **Positions-Langtext** kann mehrere Zeilen haben → Flexbox mit Word-Wrap
- **Provisionsrechnung** wird als separate Rechnung ausgestellt (eigene Rechnungs-Nr.), referenziert aber die Hauptrechnung über Pos 99999
- **Template braucht Support für:**
  - Seitennummerierung mit Gesamtseitenzahl
  - Unterschiedliche Positionstypen (Artikel vs. Aufgeld)
  - Dynamische Fußzeile mit Standard-Warnungen
  - IBAN/BIC im Footer

---

## 3. Handschriftliche Artikelliste

**Sample:** `docs/samples/eingehend/artikellisten/WhatsApp Image 2026-04-21 at 12.50.16.jpeg`

### Struktur (implizit, ohne Spaltenköpfe)
| Spalte | Beispielinhalt | Notizen |
|--------|----------------|---------|
| Positions-Nr. | `2009`, `2010`, `2011`, ... | Fortlaufend, kreist manchmal |
| Anzahl | `1` | Fast immer 1 |
| Artikelart | `Lydi-Hammer`, `Knupp HM 600`, `Kranzer TOR 55` | Herstellername + Typ |
| Modell/Typ | `ROT AIR OC 330`, `V43` | teilweise |
| Zusatzinfo | `(3 Paletten)`, `ca. 35 Jahre`, `zerlegt` | Zustand, Zubehör |
| Preisnotiz | `200€`, `300€`, `1500€` | Startwert oder Schätzwert |

### Beispiele aus dem Sample
| Pos | Anzahl | Bezeichnung | Zusatz | Preis |
|-----|--------|-------------|--------|-------|
| 2009 | 1 | Lydi-Hammer ROT AIR OC 330 | | 200€ |
| 2010 | 1 | Wrs MontaBert V43 | (3 Paletten) zerlegt | 300€ |
| 2011 | 1 | Knupp HM 600 | ca. 35 Jahre zerlegt | — |
| 2012 | 1 | Kranzer TOR 55 | 3 Paletten zerlegt | 200€ |
| 2013 | 1 | Knupp HM 712 | zerlegt | 100€ |
| 2014 | 1 | Rammer E64 | zerlegt | 150€ |
| 2015 | 1 | Adapterplatte (Einwalt) OCO | (2x) Mr.Glove 25 sec | — |

### Parser-Ansatz
1. Foto/Scan → Claude Vision mit Prompt:
   > „Extrahiere jede Zeile der handschriftlichen Artikelliste als JSON mit Feldern `pos`, `anzahl`, `bezeichnung`, `zusatz`, `preis_eur`. Wenn ein Feld unsicher ist, setze `confidence: 'low'`."
2. Nachbearbeitung: Positionsnummer auf `int`, Preis aus Text parsen
3. Review-UI: Scan links, extrahierte Tabelle rechts mit Inline-Edit

### Learnings
- **Keine Kopfzeile** → Parser muss Spaltenreihenfolge raten oder via Position-Nr. am Zeilenanfang erkennen
- **Nummerierung ist global**, nicht projekt-lokal (2009, 2010, ... über mehrere Projekte hinweg)
- **Währungssymbol variiert:** `200€`, manchmal nur Zahl ohne Einheit
- **Abkürzungen** häufig (Wrs, MontaBert, Knupp) → Hersteller-Whitelist hilft bei Auto-Correction

---

## 4. Ableitungen für das Datenmodell

Aus den Samples ergeben sich diese zusätzlichen Felder, die wir im DB-Schema brauchen:

### Neu hinzufügen
- `projekt.richter_name`, `projekt.beschluss_text_original` (PDF-Ablage)
- `projekt.aktenzeichen_format_validated` (Bool)
- `artikel.global_pos_nr` (int, fortlaufend über alle Projekte)
- `artikel.zustand` (Enum: neu / gebraucht / zerlegt / defekt)
- `artikel.zusatzinfo_frei` (Text für „3 Paletten", „35 Jahre" etc.)
- `artikel.standort` (z. B. „48477 Hörstel, Westfalenstraße 44")
- `rechnung.pos_typ` (Enum: artikel / aufgeld / versand / …)
- `rechnung.bezug_rechnung_nr` (für Aufgeld-Rechnungen, die Hauptrechnung referenzieren)
- `rechnung.abhol_fenster_start`, `abhol_fenster_ende` (datetime)
- `firma.iban`, `firma.bic`, `firma.hra`, `firma.hrb`, `firma.ust_id` (Briefkopf-Konstanten)

### Enum-Werte erkannt
- `fahrzeug.typ`: Anhänger (2-Achser), PKW, LKW, …
- `projekt.status`: entwurf / freigabe_offen / aktiv / auktion_laeuft / abgeschlossen / archiv
- `rechnung.typ`: proforma / standard / provision
