// Admin: lấy tin từ API ngoài để xem trước (GET) và tạo nhanh hàng loạt BẢN NHÁP (POST).
// Mọi bài tạo ở đây luôn là status "draft" để admin chỉnh sửa rồi mới xuất bản.
import { NextResponse } from "next/server";
import { requirePerm } from "@/lib/admin-guard";
import { createArticle, toArticleRow } from "@/lib/articles";
import { sanitizeHtml } from "@/lib/sanitize";
import { fetchExternalNews, type ExternalNewsItem } from "@/lib/external-news";
import { logActivity } from "@/lib/activity-log";
import { importArticleFromUrl } from "@/lib/url-import";
import { isAdmin } from "@/lib/users";
import { listActiveCategoryOptions } from "@/lib/categories";

// Lấy toàn văn có thể mất vài chục giây (tải trang + AI) — nới thời gian chạy route.
export const maxDuration = 120;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Tự sinh keywords từ title: lấy các từ có nghĩa (≥4 ký tự, bỏ stop-words phổ biến).
const STOP = new Set(["được","không","trong","ngoài","những","cũng","đang","sẽ","đã","này","đó","các","một","và","của","cho","với","từ","trên","tại","theo","để","về","vào","như","còn","khi","sau","trước","qua","bởi","thì","mà","hay","hoặc","nhưng","vì","nên","nếu","dù","rằng","tới","tuy"]);
function extractKeywords(title: string, source?: string): string[] {
  const words = title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOP.has(w));
  const kws = [...new Set(words)].slice(0, 6);
  if (source) kws.push(source);
  return kws;
}

// Dòng dẫn nguồn (link bài gốc) — luôn có ở cuối bài nhập từ nguồn ngoài.
function sourceLine(it: ExternalNewsItem): string {
  if (!it.url) return "";
  const label = esc(it.source || it.url);
  return `<p>Nguồn: <a href="${esc(it.url)}" target="_blank" rel="noopener nofollow">${label}</a></p>`;
}

// Bản nháp NGẮN từ 1 tin ngoài: tóm tắt + dòng dẫn nguồn.
function bodyFrom(it: ExternalNewsItem): string {
  return [it.description ? `<p>${esc(it.description)}</p>` : "", sourceLine(it)].filter(Boolean).join("\n");
}

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
  const wantCat = typeof b.category === "string" ? b.category : "";
  const cat = wantCat ? (await listActiveCategoryOptions("tin-tuc")).find((c) => c.slug === wantCat) : undefined;
  const category = cat ? { name: cat.name, slug: cat.slug } : { name: "Tin tức", slug: "tin-tuc" };

  const created = [];
  const warnings: string[] = [];
  let aiCount = 0;
  for (const it of items.slice(0, 50)) {
    let title = String(it?.title || "").trim();
    if (!title) continue;
    let image = typeof it.image === "string" && it.image.startsWith("http") ? it.image : "";
    let excerpt = String(it.description || "").trim().slice(0, 300);
    let bodyHtml = bodyFrom(it);
    let tags = extractKeywords(title);
    // keywords[0] = "Từ khoá chính" trong trình soạn. Các từ đơn tự tách ("tổng", "giới"…) không
    // phải từ khoá thật → để TRỐNG cho admin tự đặt; chỉ điền khi AI gợi ý được cụm từ khoá.
    let keywords: string[] = [];

    if (full && it.url) {
      try {
        const r = await importArticleFromUrl(it.url, { useAi });
        if (r.usedAi) aiCount++;
        title = (r.title || title).trim().slice(0, 200);
        excerpt = (r.excerpt || excerpt).trim().slice(0, 300);
        if (!image && r.ogImage?.startsWith("http")) image = r.ogImage;
        const fromTags = r.tags.split(",").map((t) => t.trim()).filter(Boolean);
        if (fromTags.length) tags = fromTags.slice(0, 8);
        // Từ khoá chính (AI gợi ý) đứng đầu → trình soạn hiện ở ô "Từ khoá chính".
        if (r.focusKeyword) {
          keywords = [r.focusKeyword, ...tags].filter(Boolean)
            .filter((k, i, arr) => arr.findIndex((x) => x.toLowerCase() === k.toLowerCase()) === i);
        }
        // Luôn ghi nguồn bài gốc ở cuối bài.
        if (r.bodyHtml) bodyHtml = `${r.bodyHtml}\n${sourceLine(it)}`;
      } catch (e) {
        warnings.push(`“${title.slice(0, 60)}”: ${e instanceof Error ? e.message : "không lấy được toàn văn"} — đã tạo bản nháp ngắn.`);
      }
    }

    const doc = await createArticle({
      title,
      excerpt,
      category: category.name,
      categorySlug: category.slug,
      scope: "ngoai-xa",
      tags,
      coverImage: image,
      coverAlt: title, // luôn set alt = title kể cả khi chưa có ảnh (admin thêm ảnh sau)
      author: {
        name: "Ban biên tập",
        title: it.source ? `Nguồn: ${it.source}` : "Tổng hợp",
      },
      bodyHtml: sanitizeHtml(bodyHtml),
      featured: false,
      status: "draft",
      seo: {
        metaTitle: title,
        metaDescription: excerpt.slice(0, 160) || undefined,
        keywords,
        ogImage: image || undefined,
      },
    });
    created.push(toArticleRow(doc));
  }

  if (!created.length) return NextResponse.json({ error: "Không tạo được bản nháp nào." }, { status: 400 });
  void logActivity({ userId: g.user._id!.toString(), userName: g.user.name, userEmail: g.user.email, userRole: g.user.role ?? "admin", category: "admin", action: "article.import", target: { type: "bài viết", label: `${created.length} bản nháp` }, success: true, detail: full ? `Import toàn văn từ nguồn ngoài (AI: ${aiCount})` : `Import từ nguồn ngoài` });
  return NextResponse.json({ ok: true, items: created, warnings, full, aiCount, aiAllowed: useAi });
}
