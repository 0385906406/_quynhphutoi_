// Cấu hình các khối trên TRANG TIN TỨC (/tin-tuc) — admin chỉnh được.
// Lưu 1 document _id="news" trong collection "news_page".
// Hai khối cấu hình được:
//   - featured : vùng nổi bật (1 bài lớn + 3 bài cấp 2). Mode latest (tự mới nhất) / manual (chọn thủ công, giữ thứ tự).
//   - popular  : khối "Đọc nhiều" (sidebar). Mode popular (theo lượt xem) / manual.
// Theo pattern repo: mongodb native driver, helper gói trong file này (giống lib/home-sections.ts).
import { getDb } from "@/lib/db";
import { articles } from "@/lib/articles";
import type { Article } from "@/lib/news";

export type NewsBlockKey = "featured" | "popular";
export type NewsBlockMode = "latest" | "popular" | "manual";

// Mỗi khối chỉ cho phép một số mode hợp lệ.
export const NEWS_BLOCK_MODES: Record<NewsBlockKey, NewsBlockMode[]> = {
  featured: ["latest", "manual"],
  popular: ["popular", "manual"],
};
export const NEWS_BLOCK_KEYS: NewsBlockKey[] = ["featured", "popular"];
export const NEWS_BLOCK_LABEL: Record<NewsBlockKey, string> = {
  featured: "Vùng nổi bật",
  popular: "Khối “Đọc nhiều”",
};

export type NewsBlockConfig = {
  enabled: boolean;
  mode: NewsBlockMode;
  heroSlug: string;        // CHỈ featured: bài lớn (nổi bật chính) khi mode = "manual"
  manualSlugs: string[];   // featured: 3 bài nhỏ; popular: danh sách bài (giữ thứ tự admin chọn)
  limit: number;           // số item hiển thị (popular). Featured cố định layout 1 + 3.
};
export type NewsPageConfig = Record<NewsBlockKey, NewsBlockConfig>;

// Vùng nổi bật: layout cố định 1 bài lớn + 3 bài cấp 2 ⇒ tối đa 4.
export const FEATURED_SMALL_MAX = 3;
const LIMIT_RANGE: Record<NewsBlockKey, [number, number]> = { featured: [4, 4], popular: [3, 10] };
const DEFAULT_LIMIT: Record<NewsBlockKey, number> = { featured: 4, popular: 7 };
// Số slug thủ công tối đa giữ lại mỗi khối.
const MANUAL_MAX: Record<NewsBlockKey, number> = { featured: FEATURED_SMALL_MAX, popular: 24 };

function defaults(): NewsPageConfig {
  return {
    featured: { enabled: true, mode: "latest", heroSlug: "", manualSlugs: [], limit: DEFAULT_LIMIT.featured },
    popular: { enabled: true, mode: "popular", heroSlug: "", manualSlugs: [], limit: DEFAULT_LIMIT.popular },
  };
}

type NewsPageDoc = { _id: string; blocks: Partial<NewsPageConfig> };

async function col() {
  const db = await getDb();
  return db.collection<NewsPageDoc>("news_page");
}

export async function getNewsPageConfig(): Promise<NewsPageConfig> {
  try {
    const doc = await (await col()).findOne({ _id: "news" });
    const saved = doc?.blocks ?? {};
    const base = defaults();
    const out = {} as NewsPageConfig;
    for (const k of NEWS_BLOCK_KEYS) out[k] = { ...base[k], ...(saved[k] ?? {}) };
    return out;
  } catch {
    return defaults();
  }
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

// Lưu cấu hình — validate/clamp từng khối, bỏ qua field lạ (giống setHomeSections).
export async function setNewsPageConfig(input: Partial<NewsPageConfig>): Promise<NewsPageConfig> {
  const cur = await getNewsPageConfig();
  const next = {} as NewsPageConfig;
  for (const k of NEWS_BLOCK_KEYS) {
    const c = cur[k];
    const p: Partial<NewsBlockConfig> = input[k] ?? {};
    const allowed = NEWS_BLOCK_MODES[k];
    const mode: NewsBlockMode = allowed.includes(p.mode as NewsBlockMode) ? (p.mode as NewsBlockMode) : c.mode;
    const [lo, hi] = LIMIT_RANGE[k];
    const rawLimit = Math.round(Number(p.limit ?? c.limit));
    const limit = clamp(Number.isFinite(rawLimit) ? rawLimit : DEFAULT_LIMIT[k], lo, hi);
    const heroSlug = k === "featured"
      ? (typeof p.heroSlug === "string" ? p.heroSlug.trim() : c.heroSlug)
      : "";
    const manualSlugs = Array.isArray(p.manualSlugs)
      ? Array.from(new Set(p.manualSlugs.map((s) => String(s).trim()).filter(Boolean))).slice(0, MANUAL_MAX[k])
      : c.manualSlugs;
    const enabled = typeof p.enabled === "boolean" ? p.enabled : c.enabled;
    next[k] = { enabled, mode, heroSlug, manualSlugs, limit };
  }
  await (await col()).updateOne({ _id: "news" }, { $set: { blocks: next } }, { upsert: true });
  return next;
}

// ───────────────────────── Resolve khối từ danh sách bài đã có ─────────────────────────
// `items` là toàn bộ bài đã xuất bản (newest-first) đã map sang Article ở trang public.
// Resolve in-memory để không phát sinh thêm query.
export type ResolvedNewsBlocks = { featured: Article[]; popular: Article[] };

export function resolveNewsBlocks(cfg: NewsPageConfig, items: Article[]): ResolvedNewsBlocks {
  const byOrder = (orderedSlugs: string[], limit: number): Article[] => {
    const order = new Map(orderedSlugs.map((s, i) => [s, i] as const));
    return items
      .filter((a) => order.has(a.slug))
      .sort((a, b) => (order.get(a.slug) ?? 0) - (order.get(b.slug) ?? 0))
      .slice(0, limit);
  };

  // Featured: layout 1 bài lớn + 3 bài nhỏ. Manual ⇒ [hero, ...3 nhỏ]; latest ⇒ 4 bài mới nhất.
  let featured: Article[];
  if (!cfg.featured.enabled) featured = [];
  else if (cfg.featured.mode === "manual") {
    const ordered = [cfg.featured.heroSlug, ...cfg.featured.manualSlugs].filter(Boolean);
    featured = byOrder(ordered, 4);
  } else featured = items.slice(0, 4); // items đã newest-first

  // Popular: theo lượt xem hoặc chọn thủ công.
  let popular: Article[];
  if (!cfg.popular.enabled) popular = [];
  else if (cfg.popular.mode === "manual") popular = byOrder(cfg.popular.manualSlugs, cfg.popular.limit);
  else popular = [...items].sort((a, b) => b.views - a.views).slice(0, cfg.popular.limit);

  return { featured, popular };
}

// ───────────────────────── Ứng viên cho picker thủ công (admin) ─────────────────────────
export type NewsCandidate = { slug: string; title: string };

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Tìm bài đã xuất bản theo tiêu đề (chỉ chạy khi có từ khoá) — picker không đổ hết danh sách.
export async function searchNewsCandidates(q: string, limit = 20): Promise<NewsCandidate[]> {
  const kw = q.trim();
  if (!kw) return [];
  const rx = new RegExp(escapeRegex(kw), "i");
  return (await articles())
    .find({ status: "published", title: rx })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .project<NewsCandidate>({ _id: 0, slug: 1, title: 1 })
    .toArray();
}

// Lấy tiêu đề cho các slug đã chọn (để hiển thị chip dù không nằm trong kết quả tìm kiếm).
export async function newsCandidatesBySlugs(slugs: string[]): Promise<NewsCandidate[]> {
  const list = Array.from(new Set(slugs.map((s) => s.trim()).filter(Boolean)));
  if (list.length === 0) return [];
  return (await articles())
    .find({ slug: { $in: list } })
    .project<NewsCandidate>({ _id: 0, slug: 1, title: 1 })
    .toArray();
}
