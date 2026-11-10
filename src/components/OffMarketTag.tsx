import { offMarket } from "@/lib/listing-status";

// "Off market" chip for a listing that is no longer for sale. With `note`, adds the date and source.
export default function OffMarketTag({ id, note = false }: { id: string; note?: boolean }) {
  const o = offMarket(id);
  if (!o) return null;
  return (
    <>
      <span className="status off-market" title={`${o.label} (${o.source_name}, checked ${o.checked})`}>Off market</span>
      {note && (
        <span className="muted" style={{ marginLeft: 8, fontSize: 13 }}>
          {o.label} (<a href={o.source_url} target="_blank" rel="noreferrer">{o.source_name}</a>, checked {o.checked}). Kept for reference; the parcel checks still apply.
        </span>
      )}
    </>
  );
}
