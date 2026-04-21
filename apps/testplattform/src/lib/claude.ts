import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

export const client = new Anthropic();

// ---------- Zod-Schema fuer Beschluss-Extraktion ----------
// Korrespondiert mit dem in docs/04-feldstrukturen-samples.md dokumentierten Feldkatalog.
export const BeschlussSchema = z.object({
  aktenzeichen: z
    .string()
    .describe("Aktenzeichen des Gerichts, z.B. '73 IN 4/26'."),
  gericht: z
    .string()
    .describe("Zustaendiges Amtsgericht, z.B. 'Amtsgericht Muenster'."),
  beschluss_datum: z
    .string()
    .describe("Datum des Beschlusses im ISO-Format YYYY-MM-DD."),
  richter_name: z
    .string()
    .describe("Name des unterzeichnenden Richters (Nachname reicht)."),
  schuldner_firma: z
    .string()
    .describe("Firmenname des Insolvenzschuldners."),
  schuldner_adresse: z
    .string()
    .describe("Adresse des Schuldners als 'Strasse, PLZ Ort'."),
  handelsregister: z
    .string()
    .describe("Handelsregister-Nummer, z.B. 'HRB 12594'."),
  hr_gericht: z
    .string()
    .describe("Amtsgericht, bei dem der Schuldner eingetragen ist."),
  vertreter_name: z
    .string()
    .describe("Name des gesetzlichen Vertreters / Liquidators / GF."),
  vertreter_adresse: z.string().describe("Adresse des Vertreters."),
  verwalter_name: z
    .string()
    .describe("Name des vorlaeufigen Insolvenzverwalters (inkl. Titel)."),
  verwalter_adresse: z.string().describe("Adresse des Insolvenzverwalters."),
  verwalter_tel: z.string().describe("Telefonnummer des Insolvenzverwalters."),
  verwalter_fax: z.string().describe("Faxnummer des Insolvenzverwalters."),
  konfidenz: z
    .enum(["hoch", "mittel", "niedrig"])
    .describe("Gesamt-Konfidenz der Extraktion."),
});

export type BeschlussExtrakt = z.infer<typeof BeschlussSchema>;

// ---------- Zod-Schema fuer Fahrzeugschein-Extraktion ----------
// Deckt Zulassungsbescheinigung Teil 1 (dt.) ab. Felder werden direkt
// in artikel + fahrzeug uebernommen.
export const FahrzeugscheinSchema = z.object({
  fabrikat: z.string().describe("Hersteller, z.B. 'IVECO', 'MERCEDES-BENZ'."),
  handelsbezeichnung: z
    .string()
    .describe(
      "Handelsbezeichnung des Fahrzeugs, z.B. 'Sprinter', 'Daily' oder Typ-Code wie 'IS70C12BA/TR'.",
    ),
  typ: z.string().describe("Typ / Variante / Version, z.B. 'CT11C1CC'."),
  fahrzeugklasse: z
    .string()
    .describe(
      "Fahrzeugklasse nach EU-Richtlinie, z.B. 'N2' (LKW), 'N1', 'M1', 'O1'.",
    ),
  aufbau: z
    .string()
    .describe(
      "Art des Aufbaus / Zweckbestimmung, z.B. 'BA Bergungs-/Abschleppfz'.",
    ),
  fin: z.string().describe("Fahrzeug-Identifizierungs-Nummer (FIN/VIN, 17-stellig)."),
  erstzulassung: z
    .string()
    .describe("Datum der Erstzulassung im ISO-Format YYYY-MM-DD."),
  hsn: z.string().describe("Herstellerschluesselnummer (4-stellig)."),
  tsn: z
    .string()
    .describe("Typschluesselnummer (3-stellig, manchmal mit Zusatzbuchstaben)."),
  kraftstoff: z.string().describe("Kraftstoffart, z.B. 'Diesel', 'Benzin', 'Elektro'."),
  hubraum_ccm: z
    .number()
    .describe("Hubraum in Kubikzentimeter, z.B. 2998."),
  leistung_kw: z.number().describe("Nennleistung in kW, z.B. 150."),
  leergewicht_kg: z.number().describe("Leermasse in Kilogramm."),
  zulaessige_gesamtmasse_kg: z
    .number()
    .describe("Technisch zulaessige Gesamtmasse in Kilogramm."),
  kennzeichen: z
    .string()
    .describe(
      "Amtliches Kennzeichen, falls sichtbar. Leerstring wenn nicht erkennbar.",
    ),
  beschreibung_frei: z
    .string()
    .describe(
      "Freitext-Zusatzinformationen/Ausstattung aus dem Feld 22 (z.B. 'M. SCHIEBEPLATEAU FA. TREVOR, MIT SEILWINDE').",
    ),
  konfidenz: z
    .enum(["hoch", "mittel", "niedrig"])
    .describe("Gesamt-Konfidenz der Extraktion."),
});

export type FahrzeugscheinExtrakt = z.infer<typeof FahrzeugscheinSchema>;

// ---------- Zod-Schema fuer Produktfoto-Nummer-Extraktion ----------
export const FotoNummerSchema = z.object({
  nummer: z
    .string()
    .describe(
      "Die erkannte Positions-/Artikelnummer vom Schild im Foto. Nur Ziffern als String, z.B. '2009'. Leerstring wenn keine Nummer sichtbar.",
    ),
  konfidenz: z
    .enum(["hoch", "mittel", "niedrig"])
    .describe(
      "Wie sicher die Zahl-Erkennung ist. 'hoch' bei gedruckter klarer Zahl, 'niedrig' bei handschriftlicher Sauklaue oder Reflektion.",
    ),
  beschreibung: z
    .string()
    .describe(
      "Kurze Beschreibung des abgebildeten Artikels in 5-15 Woertern, z.B. 'Rammer E64 Hydraulikhammer, auf Palette'.",
    ),
});

export type FotoNummerExtrakt = z.infer<typeof FotoNummerSchema>;

const FOTO_NUMMER_SYSTEM = `Du bist ein Extraktions-Assistent fuer Auktions-Fotos.

Aufgabe: Im uebergebenen Foto befindet sich meistens ein Schild, Klebezettel oder Aufkleber mit einer Positionsnummer (z.B. '2009', '2010', '7021'). Diese Nummer muss erkannt werden, um das Foto dem richtigen Artikel zuzuordnen.

Regeln:
- Die Nummer kann gedruckt oder handschriftlich sein.
- Formate: reine Zahl ('2009'), mit Praefix ('Pos 2009', 'Nr. 7021', '#2009').
- Gib immer JSON gemaess Schema zurueck.
- Wenn keine Nummer eindeutig erkennbar: leerer String + konfidenz 'niedrig'.
- Wenn mehrere Nummern sichtbar: die prominenteste waehlen (groesstes Schild).
- 'beschreibung' ist eine kurze Kategorisierung des abgebildeten Artikels - hilft dem Menschen beim Review.`;

export async function extractFotoNummer(
  bildBuffer: Buffer,
  mimeType: string,
): Promise<FotoNummerExtrakt> {
  const base64 = bildBuffer.toString("base64");
  const modelId = process.env.ANTHROPIC_MODEL ?? "claude-opus-4-7";

  const mediaType = (
    ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(mimeType)
      ? mimeType
      : "image/jpeg"
  ) as "image/jpeg" | "image/png" | "image/webp" | "image/gif";

  const response = await client.messages.parse({
    model: modelId,
    max_tokens: 512,
    system: [
      {
        type: "text",
        text: FOTO_NUMMER_SYSTEM,
        cache_control: { type: "ephemeral" },
      },
    ],
    thinking: { type: "adaptive" },
    output_config: {
      format: zodOutputFormat(FotoNummerSchema),
    },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: base64,
            },
          },
          {
            type: "text",
            text: "Lies die Positionsnummer vom Schild / Aufkleber im Foto und beschreibe kurz was zu sehen ist.",
          },
        ],
      },
    ],
  });

  if (!response.parsed_output) {
    throw new Error(
      `Foto-Nummer-Extraktion fehlgeschlagen — stop_reason: ${response.stop_reason}`,
    );
  }
  return response.parsed_output;
}

const FAHRZEUGSCHEIN_SYSTEM = `Du bist ein Extraktions-Assistent fuer deutsche Zulassungsbescheinigungen Teil 1 (Fahrzeugscheine).

Aufgabe: Extrahiere alle relevanten Fahrzeugdaten aus dem Bild.

Felder im deutschen Fahrzeugschein:
- Feld A: Amtliches Kennzeichen
- Feld B: Datum der Erstzulassung
- Feld D.1: Marke (Fabrikat)
- Feld D.2: Typ / Variante / Version
- Feld D.3: Handelsbezeichnung
- Feld E: FIN (Fahrzeug-Identifizierungs-Nummer)
- Feld J: Fahrzeugklasse (z.B. N2, N1, M1, O1)
- Feld P.1: Hubraum in ccm
- Feld P.2: Nennleistung in kW
- Feld P.3: Kraftstoffart
- Feld G: Leermasse
- Feld F.1: Technisch zulaessige Gesamtmasse
- Feld 2.1: HSN (4-stellig)
- Feld 2.2: TSN
- Feld 22: Zusatz-Beschreibung / Ausstattung

Regeln:
- Gib IMMER JSON gemaess Schema zurueck.
- Datumswerte als ISO YYYY-MM-DD.
- Massen als ganze Zahl in kg, Leistung als ganze Zahl in kW, Hubraum in ccm.
- Felder die unlesbar/nicht sichtbar sind: leerer String / 0 und 'konfidenz' herabsetzen.
- Bilder koennen aus WhatsApp stammen (niedrige Aufloesung, schraeg fotografiert) — trotzdem sorgfaeltig lesen.`;

export async function extractFahrzeugschein(
  bildBuffer: Buffer,
  mimeType: string,
): Promise<FahrzeugscheinExtrakt> {
  const base64 = bildBuffer.toString("base64");
  const modelId = process.env.ANTHROPIC_MODEL ?? "claude-opus-4-7";

  // Nur Images, die Claude Vision unterstuetzt
  const mediaType = (
    ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(mimeType)
      ? mimeType
      : "image/jpeg"
  ) as "image/jpeg" | "image/png" | "image/webp" | "image/gif";

  const response = await client.messages.parse({
    model: modelId,
    max_tokens: 2048,
    system: [
      {
        type: "text",
        text: FAHRZEUGSCHEIN_SYSTEM,
        cache_control: { type: "ephemeral" },
      },
    ],
    thinking: { type: "adaptive" },
    output_config: {
      format: zodOutputFormat(FahrzeugscheinSchema),
    },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: base64,
            },
          },
          {
            type: "text",
            text: "Extrahiere alle Felder aus diesem Fahrzeugschein gemaess Schema. Bei unlesbaren Feldern: leerer String oder 0 und Konfidenz anpassen.",
          },
        ],
      },
    ],
  });

  if (!response.parsed_output) {
    throw new Error(
      `Fahrzeugschein-Extraktion fehlgeschlagen — stop_reason: ${response.stop_reason}`,
    );
  }
  return response.parsed_output;
}

const SYSTEM_PROMPT = `Du bist ein Extraktions-Assistent fuer deutsche Insolvenz-Beschluesse.

Aufgabe: Extrahiere strukturierte Felder aus dem uebergebenen Beschluss-PDF.

Regeln:
- Gib immer JSON gemaess Schema zurueck.
- Unleserliche Felder: leerer String + 'konfidenz' auf 'niedrig' oder 'mittel'.
- Adressen als einzelner String 'Strasse X, PLZ Ort'.
- Datumswerte als ISO YYYY-MM-DD.
- Telefonnummern genau wie im Dokument (Bindestriche/Schraegstriche beibehalten).
- 'schuldner_firma' ist die Firma, gegen die das Verfahren laeuft, NICHT der Insolvenzverwalter.
- 'verwalter_name' beinhaltet Titel 'Rechtsanwalt' wenn vorhanden.
- 'richter_name' ist die Person, die den Beschluss unterschrieben hat.`;

export async function extractBeschluss(
  pdfBuffer: Buffer,
): Promise<BeschlussExtrakt> {
  const base64Pdf = pdfBuffer.toString("base64");
  const modelId = process.env.ANTHROPIC_MODEL ?? "claude-opus-4-7";

  const response = await client.messages.parse({
    model: modelId,
    max_tokens: 4096,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    thinking: { type: "adaptive" },
    output_config: {
      format: zodOutputFormat(BeschlussSchema),
    },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: base64Pdf,
            },
          },
          {
            type: "text",
            text: "Extrahiere alle Felder aus diesem Insolvenz-Beschluss gemaess dem Schema. Wenn ein Feld im Dokument nicht auffindbar ist, setze es auf einen leeren String.",
          },
        ],
      },
    ],
  });

  if (!response.parsed_output) {
    throw new Error(
      `Beschluss-Extraktion fehlgeschlagen — stop_reason: ${response.stop_reason}`,
    );
  }
  return response.parsed_output;
}
