import { db, schema } from "./index";

async function seed() {
  console.log("Seeding Datenbank...");

  // Firma (aus Rechnungs-Briefkopf)
  await db.delete(schema.firma);
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

  // Auktion fuer den Anhaenger (laeuft bald)
  const now = new Date();
  const inTenMinutes = new Date(now.getTime() + 10 * 60_000);
  await db.insert(schema.auktion).values({
    artikel_id: anhaenger.id,
    start_ts: now,
    end_ts: inTenMinutes,
    startpreis: 1000,
    aktuelles_gebot: 1200,
    status: "laeuft",
  });

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
