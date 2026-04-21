# Produktfoto-Samples

Fotos von Artikeln vor Ort, jedes mit einem Schild/Klebezettel, auf dem die
Positionsnummer steht (z. B. `2009`, `2010`, `7021`).

Der Bulk-Upload in der Testplattform liest die Nummer automatisch vom Schild
und ordnet das Foto dem passenden Artikel zu.

## Hochladen via GitHub-Web

Direkt-Link zum Upload in diesen Ordner auf dem Feature-Branch:

https://github.com/kiliansell/shopify-builder/upload/claude/automate-manual-processes-s9Mgt/docs/samples/eingehend/produktfotos

Einfach alle Produktfotos dorthin ziehen und unten „Commit directly" klicken.

## Anonymisierung

Vor Upload ueberpruefen:

- Firmenlogos der Schuldner schwaerzen (falls sichtbar auf Geraeten)
- Keine Klarnamen / Gesichter im Bild
- Kennzeichen bei Fahrzeugen schwaerzen
- Nur das Schild mit der Positionsnummer muss klar lesbar sein

## Was Claude auf dem Schild erkennt

- Zahlen allein: `2009`, `7021`
- Mit Praefix: `Pos 2009`, `Nr. 7021`
- Handschriftlich auf Klebezettel: meist ja, bei Sauklaue niedrige Konfidenz
- Mehrere Nummern im Bild: Claude waehlt die prominenteste

## Namenskonvention (optional)

Kein Muss, aber hilfreich zum Debuggen:

- `produkt-{pos-nr}.jpg` — z. B. `produkt-2009.jpg`
- WhatsApp-Dateinamen wie `WhatsApp Image 2026-04-21 at 14.19.56.jpeg` gehen
  auch — die Nummer wird ja aus dem Bildinhalt gelesen

## Wichtig

Dieser Ordner ist **nicht** das Produktivlager. Die Plattform speichert die
Fotos im Ziel-Upload:

```
uploads/fotos/projekt-{id}/artikel-{id}/{uuid}.jpg
```

Der GitHub-Ordner hier dient nur als Sammelort fuer anonymisierte Testbilder,
die ich lesen kann, um den Parser zu verbessern.
