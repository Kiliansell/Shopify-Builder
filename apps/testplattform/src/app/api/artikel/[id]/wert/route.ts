import { NextResponse } from "next/server";
import { z } from "zod";
import { artikelWertAktualisieren } from "@/lib/clone";

const Body = z.object({
  feld: z.enum([
    "stilllegungswert",
    "fortfuehrungswert",
    "auktionsstartwert",
    "neupreis",
  ]),
  wert: z.number().nullable(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const artikelId = Number(id);
  if (!Number.isFinite(artikelId)) {
    return NextResponse.json({ error: "Ungueltige ID" }, { status: 400 });
  }

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Bad request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  await artikelWertAktualisieren(artikelId, body.feld, body.wert);
  return NextResponse.json({ ok: true });
}
