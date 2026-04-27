import { eq, max, sql } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";

/**
 * Klont ein Projekt: kopiert Projekt-Stammdaten + alle Artikel + Fahrzeug-Details.
 * Was NICHT kopiert wird:
 *   - Fotos (artikel-spezifisch, manuell zuweisen)
 *   - Auktionen + Gebote
 *   - Rechnungen + Dokumente
 *   - status (neue Klone starten in 'entwurf')
 */
export async function projektKlonen(
  projektId: number,
  optionen: { neueAktenzeichen?: string; bezeichnungSuffix?: string } = {},
): Promise<number> {
  const [orig] = await db
    .select()
    .from(schema.projekt)
    .where(eq(schema.projekt.id, projektId));
  if (!orig) throw new Error("Projekt nicht gefunden");

  const [neuP] = await db
    .insert(schema.projekt)
    .values({
      aktenzeichen:
        optionen.neueAktenzeichen ?? `${orig.aktenzeichen} (Kopie)`,
      gericht: orig.gericht,
      beschluss_datum: orig.beschluss_datum,
      richter_name: orig.richter_name,
      verwalter_name: orig.verwalter_name,
      verwalter_adresse: orig.verwalter_adresse,
      verwalter_tel: orig.verwalter_tel,
      verwalter_fax: orig.verwalter_fax,
      schuldner_firma: optionen.bezeichnungSuffix
        ? `${orig.schuldner_firma}${optionen.bezeichnungSuffix}`
        : orig.schuldner_firma,
      schuldner_adresse: orig.schuldner_adresse,
      handelsregister: orig.handelsregister,
      hr_gericht: orig.hr_gericht,
      vertreter_name: orig.vertreter_name,
      vertreter_adresse: orig.vertreter_adresse,
      status: "entwurf",
      notizen: `Geklont aus Projekt #${orig.id} (${orig.aktenzeichen})`,
    })
    .returning();

  const artikel = await db
    .select()
    .from(schema.artikel)
    .where(eq(schema.artikel.projekt_id, projektId));

  let lokalePos = 1;
  const [maxGlobal] = await db
    .select({ m: max(schema.artikel.global_pos_nr) })
    .from(schema.artikel);
  let nextGlobal = (maxGlobal?.m ?? 2000) + 1;

  for (const a of artikel) {
    const [neuA] = await db
      .insert(schema.artikel)
      .values({
        projekt_id: neuP.id,
        global_pos_nr: nextGlobal++,
        lokale_pos_nr: lokalePos++,
        anzahl: a.anzahl,
        bezeichnung: a.bezeichnung,
        langtext: a.langtext,
        zusatzinfo: a.zusatzinfo,
        zustand: a.zustand,
        standort: a.standort,
        stilllegungswert: a.stilllegungswert,
        fortfuehrungswert: a.fortfuehrungswert,
        auktionsstartwert: a.auktionsstartwert,
        neupreis: a.neupreis,
        steuersatz: a.steuersatz,
        ist_fahrzeug: a.ist_fahrzeug,
      })
      .returning();

    if (a.ist_fahrzeug) {
      const [fz] = await db
        .select()
        .from(schema.fahrzeug)
        .where(eq(schema.fahrzeug.artikel_id, a.id));
      if (fz) {
        await db.insert(schema.fahrzeug).values({
          artikel_id: neuA.id,
          fabrikat: fz.fabrikat,
          typ: fz.typ,
          kennzeichen: fz.kennzeichen,
          fin: fz.fin,
          erstzulassung: fz.erstzulassung,
          tuev_bis: fz.tuev_bis,
          km_stand: fz.km_stand,
          farbe: fz.farbe,
        });
      }
    }
  }

  return neuP.id;
}

/**
 * Klont einen Artikel innerhalb desselben Projekts.
 * Was kopiert wird: alle Stammdaten + Fahrzeug-Details. Fotos und Auktionen NICHT.
 */
export async function artikelKlonen(artikelId: number): Promise<number> {
  const [orig] = await db
    .select()
    .from(schema.artikel)
    .where(eq(schema.artikel.id, artikelId));
  if (!orig) throw new Error("Artikel nicht gefunden");

  const [maxLokal] = await db
    .select({ m: max(schema.artikel.lokale_pos_nr) })
    .from(schema.artikel)
    .where(eq(schema.artikel.projekt_id, orig.projekt_id));
  const [maxGlobal] = await db
    .select({ m: max(schema.artikel.global_pos_nr) })
    .from(schema.artikel);

  const [neuA] = await db
    .insert(schema.artikel)
    .values({
      projekt_id: orig.projekt_id,
      global_pos_nr: (maxGlobal?.m ?? 2000) + 1,
      lokale_pos_nr: (maxLokal?.m ?? 0) + 1,
      anzahl: orig.anzahl,
      bezeichnung: orig.bezeichnung,
      langtext: orig.langtext,
      zusatzinfo: orig.zusatzinfo,
      zustand: orig.zustand,
      standort: orig.standort,
      stilllegungswert: orig.stilllegungswert,
      fortfuehrungswert: orig.fortfuehrungswert,
      auktionsstartwert: orig.auktionsstartwert,
      neupreis: orig.neupreis,
      steuersatz: orig.steuersatz,
      ist_fahrzeug: orig.ist_fahrzeug,
    })
    .returning();

  if (orig.ist_fahrzeug) {
    const [fz] = await db
      .select()
      .from(schema.fahrzeug)
      .where(eq(schema.fahrzeug.artikel_id, orig.id));
    if (fz) {
      await db.insert(schema.fahrzeug).values({
        artikel_id: neuA.id,
        fabrikat: fz.fabrikat,
        typ: fz.typ,
        kennzeichen: fz.kennzeichen,
        fin: fz.fin,
        erstzulassung: fz.erstzulassung,
        tuev_bis: fz.tuev_bis,
        km_stand: fz.km_stand,
        farbe: fz.farbe,
      });
    }
  }

  return neuA.id;
}

/**
 * Aktualisiert einen einzelnen Wert in artikel ueber inline-edit.
 */
export async function artikelWertAktualisieren(
  artikelId: number,
  feld:
    | "stilllegungswert"
    | "fortfuehrungswert"
    | "auktionsstartwert"
    | "neupreis",
  wert: number | null,
): Promise<void> {
  await db
    .update(schema.artikel)
    .set({ [feld]: wert })
    .where(eq(schema.artikel.id, artikelId));
}
