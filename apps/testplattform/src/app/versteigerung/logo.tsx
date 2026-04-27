/**
 * Ziegler-Wordmark, Spirit aus dem Original-Logo:
 * - "ZIEGLER" Bold Sans-Serif
 * - Blauer Pfeil als Trenner zur Unterzeile
 * - "Verwaltungs GmbH & Co. Treuhand KG" zweizeilig
 *
 * Modernisiert: feinere Letter-Spacing, klare Hierarchie, kein Drop-Shadow.
 * Sobald Vektor-Asset (SVG) verfuegbar ist, durch <Image> ersetzen.
 */
export function Logo() {
  return (
    <span className="flex items-center gap-3">
      <span className="text-2xl font-extrabold tracking-tight text-ink-300 md:text-[28px]">
        ZIEGLER
      </span>
      <span className="text-2xl font-bold leading-none text-ziegler_blau-500 md:text-[28px]">
        ›
      </span>
      <span className="hidden flex-col leading-tight md:flex">
        <span className="text-[13px] font-semibold text-ink-200">
          Verwaltungs GmbH &amp; Co.
        </span>
        <span className="text-[13px] font-semibold text-ink-200">
          Treuhand KG
        </span>
      </span>
    </span>
  );
}
