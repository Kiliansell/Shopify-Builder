import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { extractBeschluss, extractFahrzeugschein } from "@/lib/claude";
import { absolutVonRelativ } from "@/lib/storage";
import { join } from "path";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const dokId = Number(id);

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      {
        error:
          "ANTHROPIC_API_KEY fehlt. Als Codespace Secret oder in .env.local eintragen.",
      },
      { status: 503 },
    );
  }

  const [dok] = await db
    .select()
    .from(schema.dokument)
    .where(eq(schema.dokument.id, dokId));

  if (!dok) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Legacy-Pfad: alte Dokumente liegen noch unter uploads/ direkt; neue
  // koennten unter uploads/dokumente/ liegen. Beide Pfade probieren.
  const pfadKandidaten = [
    absolutVonRelativ(dok.dateipfad),
    join(process.cwd(), "uploads", dok.dateipfad),
  ];
  let buf: Buffer | null = null;
  for (const p of pfadKandidaten) {
    try {
      buf = await readFile(p);
      break;
    } catch {
      // naechsten probieren
    }
  }
  if (!buf) {
    return NextResponse.json(
      { error: `Datei nicht gefunden: ${dok.dateipfad}` },
      { status: 404 },
    );
  }

  try {
    let extrakt: unknown;
    switch (dok.typ) {
      case "beschluss":
        extrakt = await extractBeschluss(buf);
        break;
      case "fahrzeugschein":
        extrakt = await extractFahrzeugschein(
          buf,
          dok.mime_type ?? "image/jpeg",
        );
        break;
      default:
        return NextResponse.json(
          {
            error: `Dokument-Typ '${dok.typ}' wird noch nicht unterstuetzt.`,
          },
          { status: 400 },
        );
    }

    await db
      .update(schema.dokument)
      .set({ extrahierte_daten_json: JSON.stringify(extrakt) })
      .where(eq(schema.dokument.id, dokId));

    return NextResponse.json({ ok: true, extrakt });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[${dok.typ}] Parse-Fehler:`, msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
