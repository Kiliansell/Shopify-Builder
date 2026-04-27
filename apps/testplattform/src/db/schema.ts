import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// ---------- Firma (Briefkopf-Stammdaten, Single-Row) ----------
export const firma = sqliteTable("firma", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  strasse: text("strasse").notNull(),
  plz: text("plz").notNull(),
  ort: text("ort").notNull(),
  telefon: text("telefon"),
  fax: text("fax"),
  email: text("email"),
  geschaeftsfuehrer: text("geschaeftsfuehrer"),
  hra: text("hra"),
  hrb: text("hrb"),
  amtsgericht: text("amtsgericht"),
  iban: text("iban"),
  bic: text("bic"),
  bank_name: text("bank_name"),
  funktion_text: text("funktion_text"),
});

// ---------- Projekt ----------
export const projekt = sqliteTable("projekt", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  aktenzeichen: text("aktenzeichen").notNull(),
  gericht: text("gericht"),
  beschluss_datum: text("beschluss_datum"),
  richter_name: text("richter_name"),
  verwalter_name: text("verwalter_name"),
  verwalter_adresse: text("verwalter_adresse"),
  verwalter_tel: text("verwalter_tel"),
  verwalter_fax: text("verwalter_fax"),
  schuldner_firma: text("schuldner_firma").notNull(),
  schuldner_adresse: text("schuldner_adresse"),
  handelsregister: text("handelsregister"),
  hr_gericht: text("hr_gericht"),
  vertreter_name: text("vertreter_name"),
  vertreter_adresse: text("vertreter_adresse"),
  status: text("status", {
    enum: ["entwurf", "freigabe_offen", "aktiv", "auktion_laeuft", "abgeschlossen", "archiv"],
  }).notNull().default("entwurf"),
  notizen: text("notizen"),
  created_at: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// ---------- Artikel ----------
export const artikel = sqliteTable("artikel", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projekt_id: integer("projekt_id").notNull().references(() => projekt.id, { onDelete: "cascade" }),
  global_pos_nr: integer("global_pos_nr").notNull(),
  lokale_pos_nr: integer("lokale_pos_nr").notNull(),
  anzahl: integer("anzahl").notNull().default(1),
  bezeichnung: text("bezeichnung").notNull(),
  langtext: text("langtext"),
  zusatzinfo: text("zusatzinfo"),
  zustand: text("zustand", {
    enum: ["neu", "gebraucht", "zerlegt", "defekt", "unbekannt"],
  }).default("gebraucht"),
  standort: text("standort"),
  stilllegungswert: real("stilllegungswert"),
  fortfuehrungswert: real("fortfuehrungswert"),
  auktionsstartwert: real("auktionsstartwert"),
  neupreis: real("neupreis"),
  steuersatz: real("steuersatz").default(19),
  ist_fahrzeug: integer("ist_fahrzeug", { mode: "boolean" }).default(false),
  // Sichtbarkeit auf der oeffentlichen Website
  // entwurf = nur intern, vorschau = via signiertem Link, live = oeffentlich
  sichtbarkeit: text("sichtbarkeit", {
    enum: ["entwurf", "vorschau", "live", "archiv"],
  }).notNull().default("entwurf"),
  created_at: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// ---------- Fahrzeug (optionale Detail-Infos, 1:1 zu Artikel) ----------
export const fahrzeug = sqliteTable("fahrzeug", {
  artikel_id: integer("artikel_id").primaryKey().references(() => artikel.id, { onDelete: "cascade" }),
  fabrikat: text("fabrikat"),
  typ: text("typ"),
  kennzeichen: text("kennzeichen"),
  fin: text("fin"),
  erstzulassung: text("erstzulassung"),
  tuev_bis: text("tuev_bis"),
  km_stand: integer("km_stand"),
  farbe: text("farbe"),
});

// ---------- Foto ----------
export const foto = sqliteTable("foto", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  artikel_id: integer("artikel_id").notNull().references(() => artikel.id, { onDelete: "cascade" }),
  dateipfad: text("dateipfad").notNull(),
  reihenfolge: integer("reihenfolge").notNull().default(0),
  created_at: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// ---------- Foto-Eingang (Bulk-Upload, wartet auf Zuordnung) ----------
export const fotoEingang = sqliteTable("foto_eingang", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  dateiname: text("dateiname").notNull(),
  dateipfad: text("dateipfad").notNull(),
  mime_type: text("mime_type"),
  groesse_bytes: integer("groesse_bytes"),
  status: text("status", {
    enum: ["neu", "analysiert", "zugewiesen", "verworfen"],
  }).notNull().default("neu"),
  erkannte_nummer: text("erkannte_nummer"),
  konfidenz: text("konfidenz", { enum: ["hoch", "mittel", "niedrig"] }),
  vorschlag_artikel_id: integer("vorschlag_artikel_id").references(
    () => artikel.id,
    { onDelete: "set null" },
  ),
  fehler: text("fehler"),
  created_at: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ---------- Dokument (generisch: Beschluss, Scan, sonstiges) ----------
export const dokument = sqliteTable("dokument", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projekt_id: integer("projekt_id").references(() => projekt.id, { onDelete: "cascade" }),
  typ: text("typ", {
    enum: ["beschluss", "fahrzeugschein", "artikelliste", "gutachten", "rechnung", "abrechnung", "sonstiges"],
  }).notNull(),
  dateiname: text("dateiname").notNull(),
  dateipfad: text("dateipfad").notNull(),
  mime_type: text("mime_type"),
  groesse_bytes: integer("groesse_bytes"),
  extrahierte_daten_json: text("extrahierte_daten_json"),
  created_at: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// ---------- Kunde / Bieter ----------
export const kunde = sqliteTable("kunde", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  kunden_nr: text("kunden_nr").unique(),
  bietername: text("bietername"),
  anrede: text("anrede"),
  vorname: text("vorname"),
  nachname: text("nachname"),
  firma: text("firma"),
  email: text("email"),
  telefon: text("telefon"),
  strasse: text("strasse"),
  plz: text("plz"),
  ort: text("ort"),
  created_at: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// ---------- Auktion ----------
export const auktion = sqliteTable("auktion", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  artikel_id: integer("artikel_id").notNull().references(() => artikel.id, { onDelete: "cascade" }),
  start_ts: integer("start_ts", { mode: "timestamp" }).notNull(),
  end_ts: integer("end_ts", { mode: "timestamp" }).notNull(),
  startpreis: real("startpreis").notNull(),
  aktuelles_gebot: real("aktuelles_gebot"),
  status: text("status", {
    enum: ["geplant", "laeuft", "beendet", "abgebrochen"],
  }).notNull().default("geplant"),
  // Bei status=beendet: wer hat gewonnen, zu welchem Preis, wann zugeschlagen
  gewinner_kunde_id: integer("gewinner_kunde_id").references(() => kunde.id),
  zuschlag_preis: real("zuschlag_preis"),
  zuschlag_am: integer("zuschlag_am", { mode: "timestamp" }),
});

// ---------- Gebot ----------
export const gebot = sqliteTable("gebot", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  auktion_id: integer("auktion_id").notNull().references(() => auktion.id, { onDelete: "cascade" }),
  kunde_id: integer("kunde_id").notNull().references(() => kunde.id),
  betrag: real("betrag").notNull(),
  abgegeben_am: integer("abgegeben_am", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// ---------- Rechnung ----------
export const rechnung = sqliteTable("rechnung", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  rechnungs_nr: text("rechnungs_nr").notNull().unique(),
  typ: text("typ", { enum: ["proforma", "standard", "provision"] }).notNull(),
  kunde_id: integer("kunde_id").notNull().references(() => kunde.id),
  projekt_id: integer("projekt_id").references(() => projekt.id),
  datum: text("datum").notNull(),
  netto: real("netto").notNull(),
  steuer: real("steuer").notNull(),
  brutto: real("brutto").notNull(),
  bezug_rechnung_nr: text("bezug_rechnung_nr"),
  abhol_fenster_start: integer("abhol_fenster_start", { mode: "timestamp" }),
  abhol_fenster_ende: integer("abhol_fenster_ende", { mode: "timestamp" }),
  standort: text("standort"),
  versendet_am: integer("versendet_am", { mode: "timestamp" }),
  bezahlt_am: integer("bezahlt_am", { mode: "timestamp" }),
  status: text("status", {
    enum: ["entwurf", "versendet", "bezahlt", "storniert"],
  }).notNull().default("entwurf"),
  created_at: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// ---------- Rechnungs-Position ----------
export const rechnungPosition = sqliteTable("rechnung_position", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  rechnung_id: integer("rechnung_id").notNull().references(() => rechnung.id, { onDelete: "cascade" }),
  pos: integer("pos").notNull(),
  anzahl: integer("anzahl").notNull().default(1),
  bezeichnung: text("bezeichnung").notNull(),
  mwst: real("mwst").notNull().default(19),
  einzelpreis: real("einzelpreis").notNull(),
  pos_typ: text("pos_typ", {
    enum: ["artikel", "aufgeld", "versand", "sonstiges"],
  }).notNull().default("artikel"),
});

// ---------- Relationen ----------
export const projektRelations = relations(projekt, ({ many }) => ({
  artikel: many(artikel),
  dokumente: many(dokument),
  rechnungen: many(rechnung),
}));

export const artikelRelations = relations(artikel, ({ one, many }) => ({
  projekt: one(projekt, { fields: [artikel.projekt_id], references: [projekt.id] }),
  fahrzeug: one(fahrzeug, { fields: [artikel.id], references: [fahrzeug.artikel_id] }),
  fotos: many(foto),
  auktion: many(auktion),
}));

export const auktionRelations = relations(auktion, ({ one, many }) => ({
  artikel: one(artikel, { fields: [auktion.artikel_id], references: [artikel.id] }),
  gebote: many(gebot),
}));

export const gebotRelations = relations(gebot, ({ one }) => ({
  auktion: one(auktion, { fields: [gebot.auktion_id], references: [auktion.id] }),
  kunde: one(kunde, { fields: [gebot.kunde_id], references: [kunde.id] }),
}));

export const rechnungRelations = relations(rechnung, ({ one, many }) => ({
  kunde: one(kunde, { fields: [rechnung.kunde_id], references: [kunde.id] }),
  projekt: one(projekt, { fields: [rechnung.projekt_id], references: [projekt.id] }),
  positionen: many(rechnungPosition),
}));

export const rechnungPositionRelations = relations(rechnungPosition, ({ one }) => ({
  rechnung: one(rechnung, { fields: [rechnungPosition.rechnung_id], references: [rechnung.id] }),
}));
