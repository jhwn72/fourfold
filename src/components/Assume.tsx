// The quiet ASSUMPTION marker John approved: a small superscript "*" after the assumed number or text,
// plus one footnote line per panel or window. The full ASSUMPTION labels and sources live on /method.
import Link from "next/link";

export function Star() {
  return <sup className="ff-star" title="Assumption (see How it works)" aria-label="assumption">*</sup>;
}

export function AssumeNote({ style }: { style?: React.CSSProperties }) {
  return <p className="ff-footnote" style={style}>* Assumption, see <Link href="/method#sources">How it works</Link></p>;
}
