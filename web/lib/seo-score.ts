export type ScoreColor = "green" | "yellow" | "red" | "auto" | "none";

export interface ScoreResult {
  label: string;
  color: ScoreColor;
}

export function scoreTitle(title: string | null | undefined): ScoreResult {
  const len = (title ?? "").trim().length;
  if (len === 0) return { label: "", color: "none" };
  if (len >= 50 && len <= 70) return { label: "Tốt", color: "green" };
  if (len >= 30 && len <= 90) return { label: "Khá", color: "yellow" };
  if (len < 30) return { label: "Ngắn", color: "red" };
  return { label: "Dài", color: "red" };
}

export function scoreExcerpt(excerpt: string | null | undefined): ScoreResult {
  const len = (excerpt ?? "").trim().length;
  if (len === 0) return { label: "", color: "none" };
  if (len >= 120 && len <= 160) return { label: "Tốt", color: "green" };
  if (len >= 70 && len <= 200) return { label: "Khá", color: "yellow" };
  if (len < 70) return { label: "Ngắn", color: "red" };
  return { label: "Dài", color: "yellow" };
}

export function scoreTags(tags: string | null | undefined): ScoreResult {
  const count = (tags ?? "").split(",").map((t) => t.trim()).filter(Boolean).length;
  if (count === 0) return { label: "", color: "none" };
  if (count >= 3 && count <= 7) return { label: "Tốt", color: "green" };
  if (count === 2) return { label: "Nên thêm", color: "yellow" };
  if (count === 1) return { label: "Thiếu", color: "red" };
  return { label: "Nhiều", color: "yellow" };
}

export function scoreCoverAlt(alt: string | null | undefined): ScoreResult {
  const len = (alt ?? "").trim().length;
  if (len === 0) return { label: "", color: "none" };
  if (len >= 5 && len <= 125) return { label: "Tốt", color: "green" };
  if (len > 125) return { label: "Dài", color: "yellow" };
  return { label: "Ngắn", color: "yellow" };
}

export function scoreSeoMetaTitle(metaTitle: string | null | undefined): ScoreResult {
  if (!(metaTitle ?? "").trim()) return { label: "Tự động", color: "auto" };
  return scoreTitle(metaTitle);
}

export function scoreSeoMetaDesc(metaDesc: string | null | undefined): ScoreResult {
  if (!(metaDesc ?? "").trim()) return { label: "Tự động", color: "auto" };
  return scoreExcerpt(metaDesc);
}

export function scoreSeoKeywords(keywords: string | null | undefined): ScoreResult {
  const count = (keywords ?? "").split(",").map((t) => t.trim()).filter(Boolean).length;
  if (count === 0) return { label: "Tự động", color: "auto" };
  if (count >= 3 && count <= 7) return { label: "Tốt", color: "green" };
  if (count === 2) return { label: "Nên thêm", color: "yellow" };
  if (count === 1) return { label: "Thiếu", color: "red" };
  return { label: "Nhiều", color: "yellow" };
}

export function scoreSeoOgImage(ogImage: string | null | undefined): ScoreResult {
  if (!(ogImage ?? "").trim()) return { label: "Tự động", color: "auto" };
  return { label: "Đã đặt", color: "green" };
}

const COLOR_SCORE: Record<ScoreColor, number> = { green: 100, yellow: 60, red: 20, auto: 70, none: 0 };
const WEIGHTS = { title: 20, excerpt: 15, body: 25, tags: 10, coverAlt: 8, metaTitle: 7, metaDesc: 7, seoKeywords: 5, seoOgImage: 3 };

export type SeoScoreMap = { [K in keyof typeof WEIGHTS]: ScoreResult };

export function calcTotalSeoScore(s: SeoScoreMap): number {
  let total = 0;
  for (const key of Object.keys(WEIGHTS) as Array<keyof typeof WEIGHTS>) {
    total += (WEIGHTS[key] * COLOR_SCORE[s[key].color]) / 100;
  }
  return Math.round(total);
}

export function countBodyWords(bodyHtml: string | null | undefined): number {
  const text = (bodyHtml ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
}

export function scoreBody(bodyHtml: string | null | undefined): ScoreResult {
  const words = countBodyWords(bodyHtml);
  if (words === 0) return { label: "", color: "none" };
  if (words >= 600) return { label: "Tốt", color: "green" };
  if (words >= 300) return { label: "Khá", color: "yellow" };
  return { label: "Ngắn", color: "red" };
}
