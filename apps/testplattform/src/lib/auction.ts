/**
 * Auto-Extend-Regel nach Interview:
 * - Gebot in den letzten 2 Minuten, Betrag < 500 EUR → Verlaengerung um 2 Minuten
 * - Gebot in den letzten 2 Minuten, Betrag >= 500 EUR → Verlaengerung um 1 Minute
 * - Gebot ausserhalb der 2-Minuten-Zone: keine Verlaengerung
 */
export function berechneNeueEndzeit(
  aktuelleEndzeit: Date,
  gebotsBetrag: number,
  gebotsZeit: Date = new Date(),
): Date {
  const restMs = aktuelleEndzeit.getTime() - gebotsZeit.getTime();
  if (restMs > 2 * 60_000) return aktuelleEndzeit;

  const verlaengerungMin = gebotsBetrag < 500 ? 2 : 1;
  const neueEndzeit = new Date(gebotsZeit.getTime() + verlaengerungMin * 60_000);
  return neueEndzeit > aktuelleEndzeit ? neueEndzeit : aktuelleEndzeit;
}
