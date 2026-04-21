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
    .from(schema.foto)
    .where(eq(schema.foto.id, Number(id)));
  if (!f) return new NextResponse("Not found", { status: 404 });

  const data = await readFile(absolutVonRelativ(f.dateipfad));
  const ext = f.dateipfad.split(".").pop()?.toLowerCase() ?? "";
  const mime =
    ext === "png"
      ? "image/png"
      : ext === "webp"
        ? "image/webp"
        : ext === "gif"
          ? "image/gif"
          : "image/jpeg";

  return new NextResponse(new Uint8Array(data), {
    headers: {
      "content-type": mime,
      "cache-control": "private, max-age=3600",
    },
  });
}
