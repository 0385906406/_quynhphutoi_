// Nhập bài viết từ URL: tải trang, extract nội dung, dùng AI viết lại thành HTML chuẩn.
// Provider: Gemini / OpenAI / Tùy chỉnh — cấu hình tại Cài đặt → AI & nội dung.
// Logic nằm ở lib/url-import.ts (dùng chung với "Viết bài ngay" ở Tạo tin từ nguồn ngoài).
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { type AiProvider } from "@/lib/ai-call";
import { importArticleFromUrl, UrlImportError } from "@/lib/url-import";
import { logActivity } from "@/lib/activity-log";

export async function POST(req: Request) {
  const g = await requireAdmin();
  if (g instanceof NextResponse) return g;

  const body = await req.json().catch(() => ({}));
  const { url, provider = "gemini" } = body as { url?: string; provider?: AiProvider };
  if (!url?.trim()) return NextResponse.json({ error: "Thiếu URL." }, { status: 400 });

  try {
    const r = await importArticleFromUrl(url, { useAi: true, provider });
    void logActivity({
      userId: g.user._id!.toString(), userName: g.user.name, userEmail: g.user.email,
      userRole: g.user.role ?? "admin", category: "admin", action: "ai.import_url",
      target: { type: "tin-tuc", label: r.hostname }, success: true,
    });
    return NextResponse.json({
      title: r.title, excerpt: r.excerpt, bodyHtml: r.bodyHtml, ogImage: r.ogImage, tags: r.tags,
      focusKeyword: r.focusKeyword, sourceUrl: r.sourceUrl, usedAi: r.usedAi, social: r.social,
    });
  } catch (e) {
    if (e instanceof UrlImportError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Không nhập được bài từ URL." }, { status: 500 });
  }
}
