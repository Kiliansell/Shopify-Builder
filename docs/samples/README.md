# Beispiel-Dokumente

In diesem Ordner sammeln wir anonymisierte Beispiele aller Dokumente, die das Tool
**empfängt** oder **erstellt**. Sie dienen als Grundlage für:

- Parser-Entwicklung (OCR / LLM-Prompts)
- PDF-Template-Design (Gutachten, Rechnungen, Abrechnungen)
- Test-Fixtures für automatisierte Tests

---

## Ordnerstruktur

```
docs/samples/
├── eingehend/              # Was kommt ins System rein
│   ├── beschluesse/        # Gerichtsbeschlüsse (E-Mail-Anhang)
│   ├── fahrzeugscheine/    # Zulassungsbescheinigung Teil 1
│   ├── artikellisten/      # Handschriftliche / gescannte Listen vom Chef
│   └── sonstige/           # Weitere Input-Dokumente
└── ausgehend/              # Was das System produziert
    ├── gutachten/          # Fortführungs- und Stilllegungswert-Gutachten
    ├── abrechnungen/       # Erlös-Abrechnung für Auftraggeber + Provision
    ├── rechnungen/         # Pro-Forma, Standard-Rechnung, Provisionsrechnung
    └── sonstige/           # Lieferscheine, Bestätigungen etc.
```

---

## Anonymisierung — Pflicht vor dem Upload

Vor dem Ablegen in diesem Ordner **immer** folgende Daten schwärzen oder ersetzen:

- Personennamen (Schuldner, Kunden, Mitarbeiter)
- Firmennamen echter Auftraggeber / Schuldner (durch `Musterfirma GmbH` ersetzen)
- Adressen (Straße, PLZ-Ort)
- Aktenzeichen (Struktur erhalten, Zahlen ersetzen: `123/24` → `999/99`)
- E-Mail-Adressen, Telefonnummern
- IBAN / Kontonummern
- KFZ-Kennzeichen, Fahrgestellnummern (FIN)
- Unterschriften und Stempel
- Geburtsdaten

**Nicht anonymisieren** (das sind die Strukturen, die wir lernen müssen):
- Layout / Position der Felder
- Feldbeschriftungen („Aktenzeichen:", „Fabrikat:", „Betrag:")
- Datumsstrukturen und Formulierungen
- Schriftarten und Formatierungen

---

## Namenskonvention

Dateinamen nach Schema: `<typ>_<variante>_<lfd-nr>.pdf`

Beispiele:
- `beschluss_amtsgericht_01.pdf`
- `beschluss_insolvenzverwalter_01.pdf`
- `fahrzeugschein_pkw_01.pdf`
- `fahrzeugschein_lkw_01.pdf`
- `artikelliste_handschrift_01.pdf`
- `artikelliste_tabellarisch_01.pdf`
- `gutachten_fortfuehrung_01.pdf`
- `gutachten_stilllegung_01.pdf`
- `rechnung_proforma_01.pdf`
- `rechnung_standard_01.pdf`
- `rechnung_provision_01.pdf`
- `abrechnung_auftraggeber_01.pdf`

---

## Was ist versionskontrolliert?

Per Default sind **alle PDFs/Bilder in diesem Ordner von Git ausgeschlossen**
(siehe `.gitignore`). Dateien werden nur committet, wenn sie explizit mit
Präfix `ANON_` beginnen — dann gilt das als Signal, dass die Anonymisierung
geprüft wurde.

Beispiel: `ANON_beschluss_amtsgericht_01.pdf` wird committed,
`beschluss_amtsgericht_01.pdf` nicht.

---

## Mindest-Sample-Set für Start (Priorität P1)

Um Sprint 1–4 gut starten zu können, brauchen wir idealerweise je Typ **3–5 Varianten**:

### Pflicht (für Parser- und Template-Entwicklung)
- [ ] 3× Gerichtsbeschlüsse (ggf. unterschiedliche Gerichte)
- [ ] 3× Fahrzeugscheine (PKW, LKW, evtl. Anhänger)
- [ ] 2× handschriftliche Artikellisten
- [ ] 1× tabellarische Artikelliste
- [ ] 2× fertige Gutachten (Fortführung + Stilllegung) als Vorbild
- [ ] 1× Abrechnung für Auftraggeber
- [ ] 1× Provisionsabrechnung
- [ ] 1× Pro-Forma-Rechnung
- [ ] 1× Standard-Rechnung
- [ ] 1× Provisionsrechnung

### Kür (für Feinschliff)
- [ ] Lieferschein
- [ ] Auktions-Bestätigungsmail (aktuelles Format)
- [ ] Zahlungserinnerung
- [ ] Unternehmens-Briefkopf als Original (hohe Auflösung, idealerweise Vektor-PDF)

---

## Wie hochladen?

1. Dateien anonymisieren
2. In den passenden Unterordner legen (siehe Struktur oben)
3. Bescheid geben — ich lese die PDFs und extrahiere Strukturen/Feldlisten
