import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function DokumentAnsicht({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [d] = await db.select().from(schema.dokument).where(eq(schema.dokument.id, Number(id)));
  if (!d) notFound();

  const url = `/api/dokumente/${d.id}/file`;
  const istPdf = d.mime_type?.includes("pdf") || d.dateiname.toLowerCase().endsWith(".pdf");
  const istBild = d.mime_type?.startsWith("image/") || /\.(jpg|jpeg|png)$/i.test(d.dateiname);

  return (
    <div className="space-y-4">
      <Link href="/dokumente" className="text-sm text-neutral-500 hover:text-ziegler-accent">
        ← Dokumente
      </Link>

      <div className="rounded-lg border bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="font-medium">{d.dateiname}</div>
            <div className="text-xs text-neutral-500">
              {d.typ} · {Math.round((d.groesse_bytes ?? 0) / 1024)} KB
            </div>
          </div>
          <a
            href={url}
            download={d.dateiname}
            className="rounded-md border px-3 py-1 text-sm hover:bg-neutral-50"
          >
            Download
          </a>
        </div>

        {istPdf && (
          <iframe src={url} className="h-[80vh] w-full rounded border" title={d.dateiname} />
        )}
        {istBild && (
          <img src={url} alt={d.dateiname} className="max-h-[80vh] w-full rounded border object-contain" />
        )}
        {!istPdf && !istBild && (
          <div className="p-6 text-center text-sm text-neutral-500">
            Vorschau fuer diesen Dateityp nicht verfuegbar.
          </div>
        )}
      </div>
    </div>
  );
}
