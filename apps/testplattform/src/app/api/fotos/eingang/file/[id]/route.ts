import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { absolutVonRelativ } from "@/lib/storage";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const [f] = await db
    .select()
    .from(schema.fotoEingang)
    .where(eq(schema.fotoEingang.id, Number(id)));
  if (!f) return new NextResponse("Not found", { status: 404 });

  try {
    const data = await readFile(absolutVonRelativ(f.dateipfad));
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "content-type": f.mime_type ?? "image/jpeg",
        "cache-control": "private, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("File missing", { status: 404 });
  }
}
