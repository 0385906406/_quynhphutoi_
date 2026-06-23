import type { ScoreResult } from "@/lib/seo-score";

export function SeoScoreBadge({ result }: { result: ScoreResult }) {
  if (result.color === "none") return null;
  return <span className={`qp-seo-badge qp-seo-badge--${result.color}`}>{result.label}</span>;
}
