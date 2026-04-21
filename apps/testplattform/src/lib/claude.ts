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
