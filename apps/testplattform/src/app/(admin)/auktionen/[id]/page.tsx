import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { eur, datumZeit } from "@/lib/format";
import { berechneNeueEndzeit } from "@/lib/auction";
import { Countdown } from "./countdown";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function gebotAbgeben(form: FormData) {
  "use server";
  const auktion_id = Number(form.get("auktion_id"));
  const betrag = Number(form.get("betrag"));
  const kunden_nr = String(form.get("kunden_nr") ?? "").trim();

  if (!betrag || !kunden_nr) return;

  const [a] = await db.select().from(schema.auktion).where(eq(schema.auktion.id, auktion_id));
  if (!a || a.status !== "laeuft") return;
  if (betrag <= (a.aktuelles_gebot ?? a.startpreis)) return;

  let [k] = await db.select().from(schema.kunde).where(eq(schema.kunde.kunden_nr, kunden_nr));
  if (!k) {
    const inserted = await db
      .insert(schema.kunde)
      .values({ kunden_nr, bietername: kunden_nr })
      .returning();
    k = inserted[0];
  }

  const jetzt = new Date();
  const neueEndzeit = berechneNeueEndzeit(a.end_ts, betrag, jetzt);

  await db.insert(schema.gebot).values({
    auktion_id,
    kunde_id: k.id,
    betrag,
    abgegeben_am: jetzt,
  });

  await db
    .update(schema.auktion)
    .set({ aktuelles_gebot: betrag, end_ts: neueEndzeit })
    .where(eq(schema.auktion.id, auktion_id));

  revalidatePath(`/auktionen/${auktion_id}`);
}

export default async function AuktionDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auktionId = Number(id);

  const [row] = await db
    .select({
      auktion: schema.auktion,
      artikel: schema.artikel,
    })
    .from(schema.auktion)
    .innerJoin(schema.artikel, eq(schema.auktion.artikel_id, schema.artikel.id))
    .where(eq(schema.auktion.id, auktionId));

  if (!row) notFound();

  const gebote = await db
    .select({
      id: schema.gebot.id,
      betrag: schema.gebot.betrag,
      abgegeben_am: schema.gebot.abgegeben_am,
      bietername: schema.kunde.bietername,
    })
    .from(schema.gebot)
    .innerJoin(schema.kunde, eq(schema.gebot.kunde_id, schema.kunde.id))
    .where(eq(schema.gebot.auktion_id, auktionId))
    .orderBy(desc(schema.gebot.abgegeben_am));

  const { auktion, artikel } = row;
  const minGebot = (auktion.aktuelles_gebot ?? auktion.startpreis) + 10;

  return (
    <div className="space-y-6">
      <Link href="/auktionen" className="text-sm text-neutral-500 hover:text-ziegler-accent">
        ← Auktionen
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border bg-white p-6">
            <div className="text-sm text-neutral-500">Pos {artikel.global_pos_nr}</div>
            <h1 className="text-2xl font-semibold">{artikel.bezeichnung}</h1>
            {artikel.zusatzinfo && <p className="mt-2 text-neutral-700">{artikel.zusatzinfo}</p>}
            {artikel.langtext && (
              <pre className="mt-3 whitespace-pre-wrap rounded bg-neutral-50 p-3 font-mono text-sm text-neutral-700">
                {artikel.langtext}
              </pre>
            )}
            {artikel.standort && (
              <div className="mt-3 text-sm">
                <span className="text-neutral-500">Standort:</span> {artikel.standort}
              </div>
            )}
          </div>

          <div className="rounded-lg border bg-white p-6">
            <h2 className="mb-3 text-lg font-semibold">Gebotshistorie</h2>
            <ul className="divide-y text-sm">
              {gebote.map((g) => (
                <li key={g.id} className="flex justify-between py-2">
                  <div>
                    <div className="font-medium">{g.bietername}</div>
                    <div className="text-xs text-neutral-500">{datumZeit(g.abgegeben_am)}</div>
                  </div>
                  <div className="font-mono">{eur(g.betrag)}</div>
                </li>
              ))}
              {gebote.length === 0 && (
                <li className="py-3 text-center text-neutral-500">Noch keine Gebote.</li>
              )}
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border bg-ziegler-dark p-6 text-white">
            <div className="text-xs uppercase tracking-wide text-neutral-400">Aktuelles Gebot</div>
            <div className="mt-1 font-mono text-4xl">{eur(auktion.aktuelles_gebot ?? auktion.startpreis)}</div>
            <div className="mt-4 text-xs uppercase tracking-wide text-neutral-400">Endet in</div>
            <Countdown endMs={auktion.end_ts.getTime()} />
            <div className="mt-3 text-xs text-neutral-400">Ende: {datumZeit(auktion.end_ts)}</div>
          </div>

          {auktion.status === "laeuft" && (
            <form action={gebotAbgeben} className="space-y-3 rounded-lg border bg-white p-6">
              <h3 className="font-semibold">Gebot abgeben</h3>
              <input type="hidden" name="auktion_id" value={auktion.id} />
              <label className="block">
                <span className="mb-1 block text-xs text-neutral-500">Kunden-/Bieter-Nr.</span>
                <input
                  name="kunden_nr"
                  required
                  placeholder="22478/10047"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-neutral-500">
                  Betrag (EUR, min. {eur(minGebot)})
                </span>
                <input
                  name="betrag"
                  type="number"
                  step="1"
                  min={minGebot}
                  required
                  className="w-full rounded-md border px-3 py-2 text-sm font-mono"
                />
              </label>
              <button
                type="submit"
                className="w-full rounded-md bg-ziegler-accent py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Gebot abgeben
              </button>
              <p className="text-xs text-neutral-500">
                Auto-Extend: &lt; 500 EUR ⇒ 2 Min, ab 500 EUR ⇒ 1 Min
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
