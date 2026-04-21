export function eur(v: number | null | undefined): string {
  if (v == null) return "-";
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(v);
}

export function datum(d: Date | string | null | undefined): string {
  if (!d) return "-";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("de-DE").format(date);
}

export function datumZeit(d: Date | string | null | undefined): string {
  if (!d) return "-";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}
