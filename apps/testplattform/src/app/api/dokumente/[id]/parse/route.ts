import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { extractBeschluss } from "@/lib/claude";

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
          "ANTHROPIC_API_KEY fehlt. In apps/testplattform/.env.local eintragen.",
      },
      { status: 503 },
    );
  }

  const [dok] = await db
    .select()
    .from(schema.dokument)
    .where(eq(schema.dokument.id, dokId));

  if (!dok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (dok.typ !== "beschluss") {
    return NextResponse.json(
      { error: `Dokument-Typ ${dok.typ} wird noch nicht unterstuetzt.` },
      { status: 400 },
    );
  }

  try {
    const buf = await readFile(join(process.cwd(), "uploads", dok.dateipfad));
    const extrakt = await extractBeschluss(buf);

    await db
      .update(schema.dokument)
      .set({ extrahierte_daten_json: JSON.stringify(extrakt) })
      .where(eq(schema.dokument.id, dokId));

    return NextResponse.json({ ok: true, extrakt });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Beschluss-Parse-Fehler:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
