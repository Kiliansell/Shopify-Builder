import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { extractFotoNummer } from "@/lib/claude";
import { absolutVonRelativ } from "@/lib/storage";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const eingangId = Number(id);

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      {
        error:
          "ANTHROPIC_API_KEY fehlt. Als Codespace Secret oder in .env.local eintragen.",
      },
      { status: 503 },
    );
  }

  const [eingang] = await db
    .select()
    .from(schema.fotoEingang)
    .where(eq(schema.fotoEingang.id, eingangId));

  if (!eingang)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  let buf: Buffer;
  try {
    buf = await readFile(absolutVonRelativ(eingang.dateipfad));
  } catch {
    return NextResponse.json(
      { error: "Foto-Datei nicht gefunden" },
      { status: 404 },
    );
  }

  try {
    const extrakt = await extractFotoNummer(
      buf,
      eingang.mime_type ?? "image/jpeg",
    );

    // Match gegen artikel.global_pos_nr (und optional lokale_pos_nr)
    let vorschlagId: number | null = null;
    if (extrakt.nummer) {
      const nummerInt = parseInt(extrakt.nummer, 10);
      if (Number.isFinite(nummerInt)) {
        const [match] = await db
          .select({ id: schema.artikel.id })
          .from(schema.artikel)
          .where(eq(schema.artikel.global_pos_nr, nummerInt));
        if (match) vorschlagId = match.id;
      }
    }

    await db
      .update(schema.fotoEingang)
      .set({
        status: "analysiert",
        erkannte_nummer: extrakt.nummer || null,
        konfidenz: extrakt.konfidenz,
        vorschlag_artikel_id: vorschlagId,
        fehler: null,
      })
      .where(eq(schema.fotoEingang.id, eingangId));

    return NextResponse.json({
      ok: true,
      erkannte_nummer: extrakt.nummer,
      konfidenz: extrakt.konfidenz,
      beschreibung: extrakt.beschreibung,
      vorschlag_artikel_id: vorschlagId,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Foto-Analyze-Fehler:", msg);
    await db
      .update(schema.fotoEingang)
      .set({ fehler: msg })
      .where(eq(schema.fotoEingang.id, eingangId));
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
