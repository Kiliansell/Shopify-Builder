export function countdownText(endMs: number, nowMs: number = Date.now()): string {
  const diff = endMs - nowMs;
  if (diff <= 0) return "beendet";

  const tage = Math.floor(diff / (24 * 3600_000));
  const stunden = Math.floor((diff % (24 * 3600_000)) / 3600_000);
  const minuten = Math.floor((diff % 3600_000) / 60_000);

  if (tage > 0) return `${tage}T ${stunden}h`;
  if (stunden > 0) return `${stunden}h ${minuten}min`;
  return `${minuten} min`;
}

export function kategorieVon(bezeichnung: string, istFahrzeug: boolean): string {
  if (istFahrzeug) return "Fahrzeuge";
  const b = bezeichnung.toLowerCase();
  if (/(pfanne|bank|sitz|stuhl|tisch|gastro)/.test(b)) return "Gastro";
  if (/(hammer|knupp|kranzer|rammer|montabert)/.test(b)) return "Maschinen";
  if (/(palette|adapter)/.test(b)) return "Zubehör";
  return "Sonstiges";
}

export const KATEGORIEN = [
  { id: "alle", label: "Alle Auktionen" },
  { id: "fahrzeuge", label: "Fahrzeuge" },
  { id: "maschinen", label: "Maschinen" },
  { id: "gastro", label: "Gastro & Möbel" },
  { id: "zubehoer", label: "Zubehör" },
];
