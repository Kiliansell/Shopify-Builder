import Link from "next/link";
import { beendeteAuktionen, bieterPseudonym } from "@/lib/lifecycle";
import { eur, datum } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Archiv() {
  const rows = await beendeteAuktionen(100);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-10">
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-ziegler_blau-500">
          Auktions-Archiv
        </div>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-ink-300 md:text-5xl">
          Beendete Auktionen
        </h1>
        <p className="mt-4 max-w-xl text-ink-100">
          Erfolgreich abgeschlossene Versteigerungen der letzten Wochen.
          Bieter werden anonymisiert dargestellt.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-paper-300 bg-white py-20 text-center">
          <p className="text-2xl font-bold text-ink-200">
            Noch keine beendeten Auktionen
          </p>
          <p className="mt-2 text-sm text-ink-50">
            Sobald die ersten Auktionen abgeschlossen sind, erscheinen sie hier.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-paper-300 bg-white">
          <table className="min-w-full divide-y divide-paper-300 text-sm">
            <thead className="bg-paper-200 text-left text-xs uppercase tracking-[0.15em] text-ink-50">
              <tr>
                <th className="px-4 py-3 font-semibold">Pos</th>
                <th className="px-4 py-3 font-semibold">Artikel</th>
                <th className="px-4 py-3 font-semibold">Zuschlag</th>
                <th className="px-4 py-3 text-right font-semibold">Preis</th>
                <th className="px-4 py-3 font-semibold">Verkauft an</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-300">
              {rows.map((r) => (
                <tr key={r.auktion_id} className="hover:bg-paper-100">
                  <td className="px-4 py-3 font-mono text-ink-300">
                    {r.global_pos_nr}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/versteigerung/auktionen/${r.auktion_id}`}
                      className="font-semibold text-ink-300 hover:text-ziegler_blau-600"
                    >
                      {r.bezeichnung}
                    </Link>
                    {r.ist_fahrzeug && (
                      <span className="ml-2 rounded-full bg-ziegler_blau-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.15em] text-ziegler_blau-700">
                        Fahrzeug
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-100">
                    {r.zuschlag_am ? datum(r.zuschlag_am) : datum(r.end_ts)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {r.zuschlag_preis ? (
                      <span className="font-mono text-base font-bold text-ziegler_blau-700">
                        {eur(r.zuschlag_preis)}
                      </span>
                    ) : (
                      <span className="text-xs text-ink-50">
                        Kein Zuschlag
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-100">
                    {bieterPseudonym(
                      r.gewinner_kunde_id,
                      r.gewinner_bietername,
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-10 text-center">
        <Link
          href="/versteigerung/auktionen"
          className="inline-flex items-center gap-2 rounded-md bg-ziegler_blau-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-ziegler_blau-700"
        >
          Aktuelle Auktionen ansehen →
        </Link>
      </div>
    </div>
  );
}
