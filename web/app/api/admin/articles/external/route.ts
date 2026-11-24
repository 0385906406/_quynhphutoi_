// Admin: lấy tin từ API ngoài để xem trước (GET) và tạo nhanh hàng loạt BẢN NHÁP (POST).
// Mọi bài tạo ở đây luôn là status "draft" để admin chỉnh sửa rồi mới xuất bản.
import { NextResponse } from "next/server";
import { requirePerm } from "@/lib/admin-guard";
import { createArticle, toArticleRow } from "@/lib/articles";
import { fetchExternalNews, type ExternalNewsItem } from "@/lib/external-news";
import { logActivity } from "@/lib/activity-log";
import { isAdmin } from "@/lib/users";
import { buildExternalArticle, resolveNewsCategory } from "@/lib/news-auto";

// Lấy toàn văn có thể mất vài chục giây (tải trang + AI) — nới thời gian chạy route.
export const maxDuration = 120;

export async function GET(req: Request) {
  const g = await requirePerm("tin-tuc", "edit");
  if (g instanceof NextResponse) return g;
  const q = new URL(req.url).searchParams.get("q") || "";
  try {
    const items = await fetchExternalNews(q);
    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Không lấy được tin." }, { status: 400 });
  }
}

// Lấy toàn văn tối đa N tin / lần (mỗi tin = tải trang + 1 lượt AI, ~10–30 giây).
const FULL_MAX = 5;

export async function POST(req: Request) {
  const g = await requirePerm("tin-tuc", "edit");
  if (g instanceof NextResponse) return g;
  const b = await req.json().catch(() => ({}));
  const items: ExternalNewsItem[] = Array.isArray(b.items) ? b.items : [];
  if (!items.length) return NextResponse.json({ error: "Chưa chọn tin nào." }, { status: 400 });
  // full=true → tải bài gốc + viết lại đầy đủ (thay vì bản nháp chỉ có mô tả ngắn).
  // AI chỉ dành cho admin (giống các API /api/admin/ai/*); biên tập viên nhận văn bản thô.
  const full = b.full === true;
  if (full && items.length > FULL_MAX) {
    return NextResponse.json({ error: `Lấy toàn văn tối đa ${FULL_MAX} tin mỗi lần.` }, { status: 400 });
  }
  const useAi = full && isAdmin(g.user);
  // Chuyên mục admin chọn — chỉ nhận slug có thật trong danh mục Tin tức đang bật; sai/thiếu → "Tin tức".
  const category = await resolveNewsCategory(typeof b.category === "string" ? b.category : "");

  const created = [];
  const warnings: string[] = [];
  let aiCount = 0;
  for (const it of items.slice(0, 50)) {
    const built = await buildExternalArticle(it, { full, useAi, category });
    if (!built) continue;
    if (built.usedAi) aiCount++;
    if (built.warning) warnings.push(built.warning);
    created.push(toArticleRow(await createArticle(built.input)));
  }

  if (!created.length) return NextResponse.json({ error: "Không tạo được bản nháp nào." }, { status: 400 });
  void logActivity({ userId: g.user._id!.toString(), userName: g.user.name, userEmail: g.user.email, userRole: g.user.role ?? "admin", category: "admin", action: "article.import", target: { type: "bài viết", label: `${created.length} bản nháp` }, success: true, detail: full ? `Import toàn văn từ nguồn ngoài (AI: ${aiCount})` : `Import từ nguồn ngoài` });
  return NextResponse.json({ ok: true, items: created, warnings, full, aiCount, aiAllowed: useAi });
}
