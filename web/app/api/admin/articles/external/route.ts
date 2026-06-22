// Admin: lấy tin từ API ngoài để xem trước (GET) và tạo nhanh hàng loạt BẢN NHÁP (POST).
// Mọi bài tạo ở đây luôn là status "draft" để admin chỉnh sửa rồi mới xuất bản.
import { NextResponse } from "next/server";
import { requirePerm } from "@/lib/admin-guard";
import { createArticle, toArticleRow } from "@/lib/articles";
import { sanitizeHtml } from "@/lib/sanitize";
import { fetchExternalNews, type ExternalNewsItem } from "@/lib/external-news";
import { logActivity } from "@/lib/activity-log";

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

// Dựng nội dung bài từ 1 tin ngoài: tóm tắt + dòng dẫn nguồn (link bài gốc).
function bodyFrom(it: ExternalNewsItem): string {
  const parts: string[] = [];
  if (it.description) parts.push(`<p>${esc(it.description)}</p>`);
  if (it.url) {
    const label = esc(it.source || it.url);
    parts.push(`<p>Nguồn: <a href="${esc(it.url)}" target="_blank" rel="noopener nofollow">${label}</a></p>`);
  }
  return parts.join("\n");
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

export async function POST(req: Request) {
  const g = await requirePerm("tin-tuc", "edit");
  if (g instanceof NextResponse) return g;
  const b = await req.json().catch(() => ({}));
  const items: ExternalNewsItem[] = Array.isArray(b.items) ? b.items : [];
  if (!items.length) return NextResponse.json({ error: "Chưa chọn tin nào." }, { status: 400 });

  const created = [];
  for (const it of items.slice(0, 50)) {
    const title = String(it?.title || "").trim();
    if (!title) continue;
    const image = typeof it.image === "string" && it.image.startsWith("http") ? it.image : "";
    const excerpt = String(it.description || "").trim().slice(0, 300);
    const doc = await createArticle({
      title,
      excerpt,
      category: "Tin tức",
      categorySlug: "tin-tuc",
      scope: "ngoai-xa",
      tags: extractKeywords(title),
      coverImage: image,
      coverAlt: title, // luôn set alt = title kể cả khi chưa có ảnh (admin thêm ảnh sau)
      author: {
        name: "Ban biên tập",
        title: it.source ? `Nguồn: ${it.source}` : "Tổng hợp",
      },
      bodyHtml: sanitizeHtml(bodyFrom(it)),
      featured: false,
      status: "draft",
      seo: {
        metaTitle: title,
        metaDescription: excerpt.slice(0, 160) || undefined,
        keywords: extractKeywords(title, it.source || undefined),
        ogImage: image || undefined,
      },
    });
    created.push(toArticleRow(doc));
  }

  if (!created.length) return NextResponse.json({ error: "Không tạo được bản nháp nào." }, { status: 400 });
  void logActivity({ userId: g.user._id!.toString(), userName: g.user.name, userEmail: g.user.email, userRole: g.user.role ?? "admin", category: "admin", action: "article.import", target: { type: "bài viết", label: `${created.length} bản nháp` }, success: true, detail: `Import từ nguồn ngoài` });
  return NextResponse.json({ ok: true, items: created });
}
