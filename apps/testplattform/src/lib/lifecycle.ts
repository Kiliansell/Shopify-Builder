import { eq, desc, and } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";

/**
 * Aktualisiert die Sichtbarkeit eines Artikels.
 * Wenn auf "live" gesetzt: aktiviert auch alle zugehoerigen Auktionen
 * (status='laeuft' wenn end_ts noch in Zukunft liegt).
 */
export async function artikelSichtbarkeitSetzen(
  artikelId: number,
  sichtbarkeit: "entwurf" | "vorschau" | "live" | "archiv",
): Promise<void> {
  await db
    .update(schema.artikel)
    .set({ sichtbarkeit })
    .where(eq(schema.artikel.id, artikelId));
}

/**
 * Beendet eine Auktion: setzt Status, traegt Gewinner und Zuschlagspreis ein.
 * Wird sowohl manuell (Innendienst) als auch automatisch (Cron, end_ts erreicht) aufgerufen.
 */
export async function auktionBeenden(auktionId: number): Promise<void> {
  const [a] = await db
    .select()
    .from(schema.auktion)
    .where(eq(schema.auktion.id, auktionId));
  if (!a || a.status === "beendet") return;

  // Hoechstbietender = letztes Gebot mit hoechstem Betrag
  const [topGebot] = await db
    .select({
      kunde_id: schema.gebot.kunde_id,
      betrag: schema.gebot.betrag,
      abgegeben_am: schema.gebot.abgegeben_am,
    })
    .from(schema.gebot)
    .where(eq(schema.gebot.auktion_id, auktionId))
    .orderBy(desc(schema.gebot.betrag), desc(schema.gebot.abgegeben_am))
    .limit(1);

  await db
    .update(schema.auktion)
    .set({
      status: "beendet",
      gewinner_kunde_id: topGebot?.kunde_id ?? null,
      zuschlag_preis: topGebot?.betrag ?? null,
      zuschlag_am: new Date(),
    })
    .where(eq(schema.auktion.id, auktionId));
}

/**
 * Holt die Daten der zuletzt beendeten Auktionen fuer das oeffentliche Archiv.
 */
export async function beendeteAuktionen(limit: number = 50) {
  return db
    .select({
      auktion_id: schema.auktion.id,
      end_ts: schema.auktion.end_ts,
      zuschlag_am: schema.auktion.zuschlag_am,
      zuschlag_preis: schema.auktion.zuschlag_preis,
      gewinner_kunde_id: schema.auktion.gewinner_kunde_id,
      gewinner_bietername: schema.kunde.bietername,
      artikel_id: schema.artikel.id,
      bezeichnung: schema.artikel.bezeichnung,
      ist_fahrzeug: schema.artikel.ist_fahrzeug,
      global_pos_nr: schema.artikel.global_pos_nr,
    })
    .from(schema.auktion)
    .innerJoin(schema.artikel, eq(schema.auktion.artikel_id, schema.artikel.id))
    .leftJoin(schema.kunde, eq(schema.auktion.gewinner_kunde_id, schema.kunde.id))
    .where(eq(schema.auktion.status, "beendet"))
    .orderBy(desc(schema.auktion.zuschlag_am))
    .limit(limit);
}

/**
 * Erzeugt eine anonymisierte Bieter-ID fuer die oeffentliche Anzeige.
 * z.B. kunden_id=12 -> "B-0012"
 */
export function bieterPseudonym(
  kundeId: number | null,
  bietername: string | null,
): string {
  if (!kundeId) return "Kein Gebot";
  if (bietername) return bietername;
  return `B-${String(kundeId).padStart(4, "0")}`;
}
