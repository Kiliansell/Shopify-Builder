import { join } from "path";

/**
 * Zentrale Pfad-Auflösung für alle Dateien.
 * Struktur unter `uploads/`:
 *
 *   uploads/
 *   ├── dokumente/          Scans, Beschluesse, Fahrzeugscheine, Rechnungs-PDFs
 *   └── fotos/
 *       └── projekt-<ID>/
 *           └── artikel-<ID>/
 *               └── <uuid>.<ext>
 *
 * In Produktion mappt diese Struktur 1:1 auf S3/MinIO-Keys.
 * Die Datenbank speichert nur den relativen Pfad unter `uploads/`,
 * NICHT den absoluten.
 */

const ROOT = join(process.cwd(), "uploads");

export const storageRoot = () => ROOT;

export const dokumentePfad = () => join(ROOT, "dokumente");

export function fotoOrdner(projektId: number, artikelId: number) {
  return join(ROOT, "fotos", `projekt-${projektId}`, `artikel-${artikelId}`);
}

export function fotoRelativ(
  projektId: number,
  artikelId: number,
  dateiname: string,
) {
  return join("fotos", `projekt-${projektId}`, `artikel-${artikelId}`, dateiname);
}

export function fotoEingangOrdner() {
  return join(ROOT, "fotos", "_eingang");
}

export function fotoEingangRelativ(dateiname: string) {
  return join("fotos", "_eingang", dateiname);
}

export function dokumentRelativ(dateiname: string) {
  return join("dokumente", dateiname);
}

export function absolutVonRelativ(relativ: string) {
  return join(ROOT, relativ);
}
