// Phân loại tin tức có địa chỉ riêng (chuyên mục / thẻ / tác giả) + tin nóng — phục vụ SEO & điều hướng như các báo điện tử.
import type { Filter } from "mongodb";
import { articles, toNewsCardArticle, type ArticleDoc } from "@/lib/articles";
import { slugify } from "@/lib/slug";
import { getDb } from "@/lib/db";
import { vnDateKey } from "@/lib/daily/time";

const PUBLIC: Filter<ArticleDoc> = { status: "published", approved: { $ne: false }, active: { $ne: false } };
export const TAXO_PAGE_SIZE = 12;

export type Term = { name: string; slug: string; count: number };

const byCount = (a: Term, b: Term) => b.count - a.count || a.name.localeCompare(b.name, "vi");

export async function listCategories(): Promise<Term[]> {
  const rows = await (await articles()).aggregate<{ _id: { slug: string; name: string }; n: number }>([
    { $match: PUBLIC },
    { $group: { _id: { slug: "$categorySlug", name: "$category" }, n: { $sum: 1 } } },
  ]).toArray();
  return rows.filter((r) => r._id.slug && r._id.name).map((r) => ({ name: r._id.name, slug: r._id.slug, count: r.n })).sort(byCount);
}

export async function listTags(): Promise<Term[]> {
  const rows = await (await articles()).aggregate<{ _id: string; n: number }>([
    { $match: PUBLIC }, { $unwind: "$tags" }, { $group: { _id: "$tags", n: { $sum: 1 } } },
  ]).toArray();
  const m = new Map<string, Term>();
  for (const r of rows) {
    const name = String(r._id).trim(); const slug = slugify(name);
    if (!name || !slug) continue;
    const cur = m.get(slug);
    if (cur) cur.count += r.n; else m.set(slug, { name, slug, count: r.n });
  }
  return [...m.values()].sort(byCount);
}

export async function listAuthors(): Promise<Term[]> {
  const rows = await (await articles()).aggregate<{ _id: string; n: number }>([
    { $match: PUBLIC }, { $group: { _id: "$author.name", n: { $sum: 1 } } },
  ]).toArray();
  const m = new Map<string, Term>();
  for (const r of rows) {
    const name = String(r._id ?? "").trim(); const slug = slugify(name);
    if (!name || !slug) continue;
    const cur = m.get(slug);
    if (cur) cur.count += r.n; else m.set(slug, { name, slug, count: r.n });
  }
  return [...m.values()].sort(byCount);
}

export type TaxoKind = "category" | "tag" | "author";

/** Lấy 1 trang bài thuộc chuyên mục/thẻ/tác giả. Trả null nếu không có mục đó. */
export async function queryTaxonomy(kind: TaxoKind, slug: string, page: number) {
  const col = await articles();
  let term: Term | undefined;
  let filter: Filter<ArticleDoc>;
  if (kind === "category") {
    term = (await listCategories()).find((t) => t.slug === slug);
    filter = { ...PUBLIC, categorySlug: slug };
  } else if (kind === "tag") {
    const t = (await listTags()).find((x) => x.slug === slug);
    term = t;
    // Thẻ có thể viết khác hoa/thường → khớp mọi biến thể có cùng slug.
    const variants = t ? (await col.distinct("tags", PUBLIC)).filter((x: string) => slugify(String(x)) === slug) : [];
    filter = { ...PUBLIC, tags: { $in: variants } };
  } else {
    const t = (await listAuthors()).find((x) => x.slug === slug);
    term = t;
    const names = t ? (await col.distinct("author.name", PUBLIC)).filter((x: string) => slugify(String(x ?? "")) === slug) : [];
    filter = { ...PUBLIC, "author.name": { $in: names } };
  }
  if (!term) return null;
  const total = await col.countDocuments(filter);
  const totalPages = Math.max(1, Math.ceil(total / TAXO_PAGE_SIZE));
  const p = Math.min(Math.max(1, page || 1), totalPages);
  const docs = await col.find(filter).sort({ publishedAt: -1, _id: -1 }).skip((p - 1) * TAXO_PAGE_SIZE).limit(TAXO_PAGE_SIZE).toArray();
  const authorInfo = kind === "author" ? docs[0]?.author : undefined;
  return { term, page: p, total, totalPages, items: docs.map(toNewsCardArticle), authorInfo };
}

/** Tin nóng: nhiều lượt đọc nhất trong ~48 giờ gần nhất (theo ngày giờ VN); thiếu dữ liệu thì bù bằng bài đọc nhiều nói chung. */
export async function trendingArticles(n = 5) {
  const col = await articles();
  const now = Date.now();
  const days = [vnDateKey(new Date(now)), vnDateKey(new Date(now - 86400000))];
  const rows = await (await getDb()).collection<{ slug: string; day: string; views: number }>("news_views_daily").aggregate<{ _id: string; v: number }>([
    { $match: { day: { $in: days } } }, { $group: { _id: "$slug", v: { $sum: "$views" } } }, { $sort: { v: -1 } }, { $limit: n * 3 },
  ]).toArray().catch(() => []);
  const order = new Map(rows.map((r, i) => [r._id, i]));
  let docs = rows.length ? await col.find({ ...PUBLIC, slug: { $in: rows.map((r) => r._id) } }).toArray() : [];
  docs.sort((a, b) => (order.get(a.slug) ?? 99) - (order.get(b.slug) ?? 99));
  docs = docs.slice(0, n);
  if (docs.length < n) {
    const have = new Set(docs.map((d) => d.slug));
    const more = await col.find({ ...PUBLIC, slug: { $nin: [...have] } }).sort({ views: -1, publishedAt: -1 }).limit(n - docs.length).toArray();
    docs = [...docs, ...more];
  }
  return docs.map(toNewsCardArticle);
}

/** Bài trong N giờ gần nhất — cho news-sitemap của Google News. */
export async function recentForNewsSitemap(hours = 48) {
  return (await articles()).find({ ...PUBLIC, publishedAt: { $gte: new Date(Date.now() - hours * 3600 * 1000) } }).sort({ publishedAt: -1 }).limit(1000).toArray();
}
