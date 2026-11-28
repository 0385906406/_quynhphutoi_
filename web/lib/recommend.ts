// Gợi ý bài viết theo sở thích (server): nhận "tín hiệu" ẩn danh từ trình duyệt, chấm điểm bài công khai gần đây.
// Không lưu gì về người dùng. Có thêm thống kê từ khoá tìm kiếm TỔNG HỢP (không gắn người) cho admin.
import { getDb, ensureIndexes } from "@/lib/db";
import { articles, toNewsCardArticle, type ArticleDoc } from "@/lib/articles";
import type { Article } from "@/lib/news";
import { INTERESTS, ageFromYear, type UserProfile } from "@/lib/profile-options";
import { WARDS } from "@/lib/wards";

export type RecSignals = {
  cats: [string, number][];
  tags: [string, number][];
  words: [string, number][];
  read: string[];
};
export type Rec = Article & { reason: string };

// Tín hiệu "khởi động" từ hồ sơ người dùng đã đăng nhập (và đồng ý) — giúp gợi ý đúng ngay cả khi chưa đọc bài nào.
const OCC_WORDS: Record<string, string[]> = {
  "Học sinh / sinh viên": ["học", "thi", "tuyển sinh"], "Nông dân": ["nông", "lúa", "giá"], "Công nhân": ["lao động", "việc làm", "lương"],
  "Kinh doanh / buôn bán": ["chợ", "giá", "kinh doanh"], "Giáo viên": ["trường", "giáo dục"], "Y tế": ["sức khoẻ", "y tế"],
  "Hưu trí": ["sức khoẻ", "người cao tuổi", "chính sách"], "Nội trợ": ["chợ", "sức khoẻ", "giá"],
};
export function profileSignals(p?: UserProfile | null): Pick<RecSignals, "cats" | "words"> {
  const out: Pick<RecSignals, "cats" | "words"> = { cats: [], words: [] };
  if (!p || p.personalize === false) return out;
  const nfc = (x: string) => x.normalize("NFC").toLowerCase();
  for (const k of p.interests ?? []) {
    const it = INTERESTS.find((i) => i.key === k);
    if (!it) continue;
    for (const c of it.cats) out.cats.push([nfc(c), 3]);
    for (const w of it.words) out.words.push([nfc(w), 1.2]);
  }
  const w = WARDS.find((x) => x.slug === p.wardSlug);
  if (w) out.words.push([nfc(w.name.replace(/^(Xã|Thị trấn)\s+/i, "")), 1.5]);
  for (const x of OCC_WORDS[p.occupation ?? ""] ?? []) out.words.push([nfc(x), 0.8]);
  const age = ageFromYear(p.birthYear);
  if (age !== null && age >= 60) out.words.push(["sức khoẻ", 1], ["người cao tuổi", 1.2], ["chính sách", 0.8]);
  if (age !== null && age < 25) out.words.push(["học", 1], ["việc làm", 0.8], ["thi", 0.8]);
  return out;
}

const POOL = 240;       // chỉ chấm trong N bài công khai mới nhất — đủ rộng mà rẻ
const MAX_PER_CAT = 3;  // đa dạng: tối đa 3 bài/chuyên mục trong kết quả
const norm = (s: string) => s.normalize("NFC").toLowerCase();

function score(a: ArticleDoc, sig: RecSignals, now: number) {
  const cat = sig.cats.find(([c]) => c === norm(a.category))?.[1] ?? 0;
  const tagHits = (a.tags ?? []).map((t) => sig.tags.find(([x]) => x === norm(t))).filter(Boolean) as [string, number][];
  const tag = tagHits.reduce((s, [, v]) => s + v, 0);
  const hay = norm(`${a.title} ${a.excerpt}`);
  const wordHits = sig.words.filter(([w]) => hay.includes(w));
  const word = wordHits.reduce((s, [, v]) => s + v, 0);

  const ageDays = Math.max(0, (now - (a.publishedAt ?? a.createdAt).getTime()) / 86400000);
  const fresh = Math.pow(0.5, ageDays / 10) * 2;          // bài mới được cộng, nguội dần (bán rã 10 ngày)
  const pop = Math.log10(1 + (a.views ?? 0)) * 0.6;       // phổ biến vừa phải để không lấn sở thích
  const total = cat * 1.2 + tag * 1.0 + word * 0.9 + fresh + pop;

  // Lý do hiển thị — ưu tiên tín hiệu mạnh nhất.
  let reason = "";
  if (word > 0 && word >= cat && wordHits.length) reason = `Vì bạn quan tâm “${wordHits.sort((x, y) => y[1] - x[1])[0][0]}”`;
  else if (cat > 0) reason = `Vì bạn hay đọc mục ${a.category}`;
  else if (tag > 0) reason = `Cùng chủ đề “${tagHits[0][0]}”`;
  return { total, personal: cat + tag + word, reason };
}

export async function recommend(sig: RecSignals, opts: { limit?: number; exclude?: string[]; scope?: "trong-xa" | "ngoai-xa" } = {}): Promise<{ items: Rec[]; personalized: boolean }> {
  const limit = Math.min(opts.limit ?? 6, 12);
  const col = await articles();
  const filter: Record<string, unknown> = { status: "published", approved: { $ne: false }, active: { $ne: false } };
  if (opts.scope) filter.scope = opts.scope === "ngoai-xa" ? "ngoai-xa" : { $ne: "ngoai-xa" };
  const pool = await col.find(filter).sort({ publishedAt: -1 }).limit(POOL).toArray();

  const skip = new Set([...(opts.exclude ?? []), ...sig.read]);
  const now = Date.now();
  const scored = pool.filter((a) => !skip.has(a.slug)).map((a) => ({ a, ...score(a, sig, now) })).sort((x, y) => y.total - x.total);
  const personalized = scored.some((s) => s.personal > 0.5);

  // Chọn có đa dạng: giới hạn mỗi chuyên mục; chừa 1 chỗ "khám phá" (bài hay nằm ngoài sở thích) khi đã có hồ sơ.
  const picked: typeof scored = [];
  const perCat = new Map<string, number>();
  const wantExplore = personalized && limit >= 5 ? 1 : 0;
  for (const s of scored) {
    if (picked.length >= limit - wantExplore) break;
    const c = perCat.get(s.a.categorySlug) ?? 0;
    if (c >= MAX_PER_CAT) continue;
    picked.push(s); perCat.set(s.a.categorySlug, c + 1);
  }
  if (wantExplore) {
    const chosen = new Set(picked.map((p) => p.a.slug));
    const explore = scored.filter((s) => !chosen.has(s.a.slug) && s.personal <= 0.5 && !perCat.has(s.a.categorySlug)).sort((x, y) => (y.a.views ?? 0) - (x.a.views ?? 0))[0]
      ?? scored.find((s) => !chosen.has(s.a.slug));
    if (explore) picked.push({ ...explore, reason: "Có thể bạn chưa biết" });
  }
  // Người mới (chưa có hồ sơ): hiển thị theo mới + phổ biến, không gán lý do cá nhân.
  const items = picked.map((p) => ({ ...toNewsCardArticle(p.a), reason: personalized && p.reason ? p.reason : "Đang được quan tâm" }));
  return { items, personalized };
}

// ───────── Từ khoá tìm kiếm tổng hợp (admin xem người dân đang cần gì) ─────────
type TermDoc = { _id: string; term: string; count: number; lastAt: Date; empty: number };
async function termsCol() {
  const col = (await getDb()).collection<TermDoc>("search_terms");
  await ensureIndexes("search_terms", () => col.createIndex({ count: -1 }));
  return col;
}

export async function recordSearchTerm(raw: string, hadResults: boolean) {
  const term = raw.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 60);
  if (term.length < 2) return;
  await (await termsCol()).updateOne(
    { _id: term },
    { $inc: { count: 1, empty: hadResults ? 0 : 1 }, $set: { lastAt: new Date() }, $setOnInsert: { term } },
    { upsert: true },
  );
}

export async function topSearchTerms(n = 15) {
  const rows = await (await termsCol()).find({}).sort({ count: -1, lastAt: -1 }).limit(n).toArray();
  const missing = await (await termsCol()).find({ empty: { $gt: 0 } }).sort({ empty: -1 }).limit(8).toArray();
  return {
    top: rows.map((r) => ({ term: r.term, count: r.count })),
    // Từ khoá hay bị tìm mà không có kết quả → gợi ý chủ đề nên viết
    missing: missing.map((r) => ({ term: r.term, count: r.empty })),
  };
}

export async function topReadCategories(n = 6) {
  const col = await articles();
  const rows = await col.aggregate<{ _id: string; views: number; posts: number }>([
    { $match: { status: "published", approved: { $ne: false }, active: { $ne: false } } },
    { $group: { _id: "$category", views: { $sum: "$views" }, posts: { $sum: 1 } } },
    { $sort: { views: -1 } }, { $limit: n },
  ]).toArray();
  return rows.map((r) => ({ label: r._id || "Khác", value: r.views, posts: r.posts }));
}
