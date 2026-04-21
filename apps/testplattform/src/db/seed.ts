import { db, schema } from "./index";
import { copyFile, mkdir } from "fs/promises";
import { join } from "path";
import { fotoOrdner, fotoRelativ } from "@/lib/storage";

async function seed() {
  console.log("Seeding Datenbank...");

  // ---- Idempotent: alle Tabellen in Dependency-Reihenfolge leeren ----
  await db.delete(schema.gebot);
  await db.delete(schema.auktion);
  await db.delete(schema.rechnungPosition);
  await db.delete(schema.rechnung);
  await db.delete(schema.foto);
  await db.delete(schema.fotoEingang);
  await db.delete(schema.fahrzeug);
  await db.delete(schema.dokument);
  await db.delete(schema.artikel);
  await db.delete(schema.projekt);
  await db.delete(schema.kunde);
  await db.delete(schema.firma);

  // Firma (aus Rechnungs-Briefkopf)
  await db.insert(schema.firma).values({
    name: "Ziegler Verwaltungs GmbH & Co. Treuhand KG",
    strasse: "Enscheder Str. 19",
    plz: "48599",
    ort: "Gronau",
    telefon: "02562 / 70106-0",
    fax: "02562 / 70106-20",
    email: "info@ziegler-treuhand.de",
    geschaeftsfuehrer: "Juergen Oliver Ziegler",
    hra: "HRA 3673",
    hrb: "HRB 5852",
    amtsgericht: "Amtsgericht Coesfeld",
    iban: "DE39 4016 4024 0139 4013 02",
    bic: "GENODEM1GRN",
    bank_name: "Volksbank Gronau-Ahaus eG",
    funktion_text:
      "Oeffentlich bestellter und vereidigter Auktionator - Sachverstaendiger - Versteigerer fuer Immobilien",
  });

  // Projekt (aus Sample-Beschluss)
  const [p] = await db
    .insert(schema.projekt)
    .values({
      aktenzeichen: "73 IN 4/26",
      gericht: "Amtsgericht Muenster",
      beschluss_datum: "2026-01-21",
      richter_name: "Brambrink",
      verwalter_name: "Rechtsanwalt Lukas Kahl",
      verwalter_adresse: "Heuerlandstrasse 33, 48565 Steinfurt",
      verwalter_tel: "02552/638710",
      verwalter_fax: "02552/6387111",
      schuldner_firma: "Andreas Mey Galabau GmbH",
      schuldner_adresse: "Osnabruecker Strasse 224, 48429 Rheine",
      handelsregister: "HRB 12594",
      hr_gericht: "Amtsgericht Steinfurt",
      vertreter_name: "Andreas Mey",
      vertreter_adresse: "Rodder Damm 96, 48429 Rheine",
      status: "aktiv",
      notizen: "Aus Sample-Beschluss vom 21.01.2026 automatisch angelegt.",
    })
    .returning();

  // Artikel (aus handschriftlicher Sample-Liste)
  const artikelDaten = [
    { pos: 2009, bez: "Lydi-Hammer ROT AIR OC 330", startwert: 200, zustand: "gebraucht" as const },
    { pos: 2010, bez: "MontaBert V43 (Wrs)", zusatz: "3 Paletten, zerlegt", startwert: 300, zustand: "zerlegt" as const },
    { pos: 2011, bez: "Knupp HM 600", zusatz: "ca. 35 Jahre, zerlegt", startwert: null, zustand: "zerlegt" as const },
    { pos: 2012, bez: "Kranzer TOR 55", zusatz: "3 Paletten, zerlegt", startwert: 200, zustand: "zerlegt" as const },
    { pos: 2013, bez: "Knupp HM 712", zusatz: "zerlegt", startwert: 100, zustand: "zerlegt" as const },
    { pos: 2014, bez: "Rammer E64", zusatz: "zerlegt", startwert: 150, zustand: "zerlegt" as const },
    { pos: 2015, bez: "Adapterplatte (Einwalt) OCO", zusatz: "2x, Mr.Glove 25 sec", startwert: null, zustand: "gebraucht" as const },
  ];

  let lokalePos = 1;
  for (const a of artikelDaten) {
    await db.insert(schema.artikel).values({
      projekt_id: p.id,
      global_pos_nr: a.pos,
      lokale_pos_nr: lokalePos++,
      anzahl: 1,
      bezeichnung: a.bez,
      zusatzinfo: a.zusatz ?? null,
      zustand: a.zustand,
      auktionsstartwert: a.startwert,
      stilllegungswert: a.startwert ? a.startwert * 0.6 : null,
      fortfuehrungswert: a.startwert ? a.startwert * 1.2 : null,
      steuersatz: 19,
    });
  }

  // Beispiel-Fahrzeug-Artikel (aus Rechnungs-Sample)
  const [anhaenger] = await db
    .insert(schema.artikel)
    .values({
      projekt_id: p.id,
      global_pos_nr: 7021,
      lokale_pos_nr: lokalePos++,
      anzahl: 1,
      bezeichnung: "Anhaenger (2-Achser) ALF KA 350",
      langtext:
        "Type XA 350 - EZ 1994\nTUEV bis Februar 2028 (Neu)\nMaengel: Holzboden eingelassen, Baustellen-Fahrzeug\nHinweis: Fahrzeug-Brief + Fahrzeugschein sind vorhanden",
      zustand: "gebraucht",
      standort: "48477 Hoerstel, Westfalenstrasse 44",
      auktionsstartwert: 1000,
      stilllegungswert: 800,
      fortfuehrungswert: 1500,
      steuersatz: 19,
      ist_fahrzeug: true,
    })
    .returning();

  await db.insert(schema.fahrzeug).values({
    artikel_id: anhaenger.id,
    fabrikat: "ALF",
    typ: "XA 350",
    erstzulassung: "1994-02-22",
    tuev_bis: "2028-02-28",
  });

  // ------------- NEUE ARTIKEL aus hochgeladenen Samples -------------

  // Pos 28 — Gusseisen-Pfannen (Sample-Foto 1)
  const [pfannen] = await db
    .insert(schema.artikel)
    .values({
      projekt_id: p.id,
      global_pos_nr: 28,
      lokale_pos_nr: lokalePos++,
      anzahl: 2,
      bezeichnung: "Gusseisen-Pfannen (Gastro)",
      langtext:
        "Zwei Gusseisen-Pfannen aus Gastronomie-Kueche.\nGrosses Modell mit Zwischenwand.\nMit Gebrauchsspuren, voll funktionsfaehig.",
      zusatzinfo: "2 Stueck, schwere Gastro-Ausfuehrung",
      zustand: "gebraucht",
      auktionsstartwert: 30,
      stilllegungswert: 20,
      fortfuehrungswert: 60,
      steuersatz: 19,
    })
    .returning();

  // Pos 10 — Rote Diner-Sitzbaenke (Sample-Foto 2)
  const [baenke] = await db
    .insert(schema.artikel)
    .values({
      projekt_id: p.id,
      global_pos_nr: 10,
      lokale_pos_nr: lokalePos++,
      anzahl: 2,
      bezeichnung: "Diner-Sitzbank rot (Paar)",
      langtext:
        "Paar roter Diner-/Gastro-Sitzbaenke mit Riffelpolster.\nHolzunterbau, Kunstleder-Bezug.\nGebrauchsspuren, Polster gut.\n\nIdeal fuer Gastronomie, Eisdiele, Diner-Einrichtung.",
      zusatzinfo: "Paar, ca. 150 cm breit",
      zustand: "gebraucht",
      auktionsstartwert: 80,
      stilllegungswert: 60,
      fortfuehrungswert: 180,
      steuersatz: 19,
    })
    .returning();

  // Pos 7022 — IVECO LKW mit Schiebeplateau (aus hochgeladenem Fahrzeugschein)
  const [iveco] = await db
    .insert(schema.artikel)
    .values({
      projekt_id: p.id,
      global_pos_nr: 7022,
      lokale_pos_nr: lokalePos++,
      anzahl: 1,
      bezeichnung: "IVECO IS70C12BA/TR Abschlepp-LKW mit Schiebeplateau",
      langtext: [
        "Erstzulassung: 18.07.2019",
        "Fahrzeugklasse: N2 (LKW > 3,5 t)",
        "HSN/TSN: 4192 / CT11C1CC",
        "Hubraum: 2998 ccm",
        "Leistung: 150 kW (204 PS)",
        "Kraftstoff: Diesel, EURO 6",
        "Leergewicht: 2500 kg",
        "Zul. Gesamtmasse: 5350 kg",
        "Zul. Zuggesamtgewicht: 10.500 kg",
        "Reifen: 225/75R16 121/-R (vorn) / 225/75R16 -/120R (hinten)",
        "",
        "Aufbau:",
        "- Schiebeplateau FA. TREVOR, Typ ZP30-C1, Fabr.-Nr. 1903.8 (Bj. 03/19)",
        "- Mit Seilwinde FA. RAMSEY",
        "- Geeignet fuer Pannenhilfe gem. E3-2007/46, §52 Abs. 4",
        "- Aufruestung gem. Pruefbericht Nr. 11-0003-0-CC-B-WG-00 (TUEV SUED)",
        "",
        "Hersteller Aufbau: FAHRZEUGBAU MEIER GMBH",
      ].join("\n"),
      zusatzinfo: "BA Bergungs-/Abschleppfahrzeug mit Seilwinde",
      zustand: "gebraucht",
      standort: "48477 Hoerstel, Westfalenstrasse 44",
      auktionsstartwert: 18000,
      stilllegungswert: 14000,
      fortfuehrungswert: 25000,
      steuersatz: 19,
      ist_fahrzeug: true,
    })
    .returning();

  await db.insert(schema.fahrzeug).values({
    artikel_id: iveco.id,
    fabrikat: "IVECO",
    typ: "IS70C12BA/TR (CT11C1CC)",
    fin: "ZCFC170D3K5306775",
    erstzulassung: "2019-07-18",
  });

  // ---- Fotos der beiden Artikel aus dem Sample-Ordner einspielen ----
  const sampleDir = join(
    process.cwd(),
    "..",
    "..",
    "docs",
    "samples",
    "eingehend",
    "produktfotos",
  );

  async function kopiereFoto(
    sampleFile: string,
    artikelId: number,
    zielName: string,
    reihenfolge: number,
  ) {
    const quelle = join(sampleDir, sampleFile);
    const ziel = fotoOrdner(p.id, artikelId);
    await mkdir(ziel, { recursive: true });
    const zielAbsolut = join(ziel, zielName);
    try {
      await copyFile(quelle, zielAbsolut);
      await db.insert(schema.foto).values({
        artikel_id: artikelId,
        dateipfad: fotoRelativ(p.id, artikelId, zielName),
        reihenfolge,
      });
      console.log(`  Foto kopiert: ${zielName} -> Artikel #${artikelId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`  Foto uebersprungen (Sample fehlt): ${sampleFile} — ${msg}`);
    }
  }

  await kopiereFoto(
    "WhatsApp Image 2026-04-21 at 14.19.56 (1).jpeg",
    pfannen.id,
    "pfanne-28.jpeg",
    1,
  );
  await kopiereFoto(
    "WhatsApp Image 2026-04-21 at 14.19.56 (2).jpeg",
    baenke.id,
    "bank-10.jpeg",
    1,
  );

  // ------------- Ende neue Artikel -------------

  // Kunde (aus Rechnungs-Sample)
  const [k] = await db
    .insert(schema.kunde)
    .values({
      kunden_nr: "22478/10047",
      bietername: "johannes_vdl",
      anrede: "Herr",
      vorname: "Johannes",
      nachname: "van de Loo",
      email: "johannes.vdl@example.com",
      strasse: "Moylaender Allee 22",
      plz: "47551",
      ort: "Bedburg-Hau",
    })
    .returning();

  // Zweiter Kunde fuer mehr Leben in den Listen
  await db.insert(schema.kunde).values({
    kunden_nr: "22479/10048",
    bietername: "hart_marcello",
    anrede: "Herr",
    vorname: "Marcello",
    nachname: "Hart",
    email: "marcello.hart@example.com",
    telefon: "+49 151 23456789",
    strasse: "Industriestrasse 5",
    plz: "48477",
    ort: "Hoerstel",
  });

  // Auktion fuer den Anhaenger (laeuft bald)
  const now = new Date();
  const inTenMinutes = new Date(now.getTime() + 10 * 60_000);
  const inSixDays = new Date(now.getTime() + 6 * 24 * 3600 * 1000);

  await db.insert(schema.auktion).values({
    artikel_id: anhaenger.id,
    start_ts: now,
    end_ts: inTenMinutes,
    startpreis: 1000,
    aktuelles_gebot: 1200,
    status: "laeuft",
  });

  // Auktionen fuer die neuen Artikel — laufen in ein paar Tagen aus
  await db.insert(schema.auktion).values([
    {
      artikel_id: pfannen.id,
      start_ts: now,
      end_ts: new Date(inSixDays.getTime() + 30 * 1000),
      startpreis: 30,
      aktuelles_gebot: 30,
      status: "laeuft",
    },
    {
      artikel_id: baenke.id,
      start_ts: now,
      end_ts: new Date(inSixDays.getTime() + 60 * 1000),
      startpreis: 80,
      aktuelles_gebot: 80,
      status: "laeuft",
    },
    {
      artikel_id: iveco.id,
      start_ts: now,
      end_ts: new Date(inSixDays.getTime() + 90 * 1000),
      startpreis: 18000,
      aktuelles_gebot: 18000,
      status: "laeuft",
    },
  ]);

  // Rechnung (aus Sample rekonstruiert)
  const [r] = await db
    .insert(schema.rechnung)
    .values({
      rechnungs_nr: "3202-0021/20",
      typ: "standard",
      kunde_id: k.id,
      projekt_id: p.id,
      datum: "2026-03-26",
      netto: 1200,
      steuer: 228,
      brutto: 1428,
      standort: "48477 Hoerstel, Westfalenstrasse 44",
      abhol_fenster_start: new Date("2026-04-01T09:00:00"),
      abhol_fenster_ende: new Date("2026-04-01T09:30:00"),
      status: "versendet",
    })
    .returning();

  await db.insert(schema.rechnungPosition).values({
    rechnung_id: r.id,
    pos: 7021,
    anzahl: 1,
    bezeichnung:
      "Anhaenger (2-Achser) ALF KA 350\nType XA 350 - EZ 1994\nTUEV bis Februar 2028 (Neu)\nHolzboden eingelassen, Baustellen-Fahrzeug\nFahrzeugbrief und -schein vorhanden",
    mwst: 19,
    einzelpreis: 1200,
    pos_typ: "artikel",
  });

  // Provisionsrechnung
  await db.insert(schema.rechnung).values({
    rechnungs_nr: "99999-0021/20",
    typ: "provision",
    kunde_id: k.id,
    projekt_id: p.id,
    datum: "2026-03-26",
    netto: 216,
    steuer: 41.04,
    brutto: 257.04,
    bezug_rechnung_nr: "3202-0021/20",
    status: "versendet",
  });

  console.log("Fertig.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
