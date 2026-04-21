import { NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const [d] = await db.select().from(schema.dokument).where(eq(schema.dokument.id, Number(id)));
  if (!d) return new NextResponse("Not found", { status: 404 });

  const data = await readFile(join(process.cwd(), "uploads", d.dateipfad));
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "content-type": d.mime_type ?? "application/octet-stream",
      "content-disposition": `inline; filename="${d.dateiname}"`,
    },
  });
}
