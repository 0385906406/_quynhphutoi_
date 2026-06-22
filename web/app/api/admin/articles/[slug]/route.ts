// Admin: cập nhật (PATCH) & xoá (DELETE) một bài viết.
import { NextResponse } from "next/server";
import { requirePerm } from "@/lib/admin-guard";
import { updateArticle, deleteArticle, getArticleBySlug, type ArticleInput, type ArticleStatus } from "@/lib/articles";
import { sanitizeHtml } from "@/lib/sanitize";
import { notifyUser } from "@/lib/notifications";
import { logActivity } from "@/lib/activity-log";

const STATUSES: ArticleStatus[] = ["draft", "published"];

export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const g = await requirePerm("tin-tuc", "edit");
  if (g instanceof NextResponse) return g;
  const { slug } = await params;
  const b = await req.json().catch(() => ({}));

  const patch: Partial<ArticleInput> = {};
  if (typeof b.title === "string") patch.title = b.title;
  if (typeof b.excerpt === "string") patch.excerpt = b.excerpt;
  if (typeof b.category === "string") { patch.category = b.category; if (typeof b.categorySlug === "string") patch.categorySlug = b.categorySlug; }
  if (b.scope === "trong-xa" || b.scope === "ngoai-xa") patch.scope = b.scope;
  if (Array.isArray(b.tags)) patch.tags = b.tags.map((t: unknown) => String(t).trim()).filter(Boolean);
  if (typeof b.coverImage === "string") patch.coverImage = b.coverImage;
  if (typeof b.coverAlt === "string") patch.coverAlt = b.coverAlt;
  if (b.authorName !== undefined) patch.author = { name: String(b.authorName || "").trim(), title: b.authorTitle || undefined, avatarUrl: b.authorAvatar || undefined };
  if (typeof b.bodyHtml === "string") patch.bodyHtml = sanitizeHtml(b.bodyHtml);
  if (typeof b.featured === "boolean") patch.featured = b.featured;
  if (b.status !== undefined && STATUSES.includes(b.status)) patch.status = b.status;
  if (b.seoMetaTitle !== undefined || b.seoMetaDescription !== undefined || b.seoOgImage !== undefined || b.seoNoindex !== undefined || b.seoKeywords !== undefined) {
    patch.seo = {
      metaTitle: b.seoMetaTitle || undefined, metaDescription: b.seoMetaDescription || undefined,
      keywords: Array.isArray(b.seoKeywords) ? b.seoKeywords : undefined,
      ogImage: b.seoOgImage || undefined, noindex: !!b.seoNoindex,
    };
  }

  const n = await updateArticle(slug, patch);
  if (!n) return NextResponse.json({ error: "Không tìm thấy." }, { status: 404 });
  const details: string[] = [];
  if (patch.status) details.push(`Trạng thái: ${patch.status}`);
  if (patch.featured !== undefined) details.push(patch.featured ? "Đánh dấu nổi bật" : "Bỏ nổi bật");
  void logActivity({ userId: g.user._id!.toString(), userName: g.user.name, userEmail: g.user.email, userRole: g.user.role ?? "admin", category: "admin", action: "article.update", target: { type: "bài viết", id: slug, label: patch.title ?? slug }, success: true, detail: details.join(" · ") || undefined });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const g = await requirePerm("tin-tuc", "edit");
  if (g instanceof NextResponse) return g;
  const { slug } = await params;
  // Lấy trước để báo cho người gửi nếu đây là bài người dùng đang chờ duyệt.
  const article = await getArticleBySlug(slug);
  const n = await deleteArticle(slug);
  if (!n) return NextResponse.json({ error: "Không tìm thấy." }, { status: 404 });
  if (article?.postedBy && article.approved === false) {
    await notifyUser(article.postedBy, { type: "post_rejected", title: `Bài viết "${article.title}" của bạn chưa được duyệt`, href: "/tai-khoan/bai-dang", module: "tin-tuc" });
  }
  void logActivity({ userId: g.user._id!.toString(), userName: g.user.name, userEmail: g.user.email, userRole: g.user.role ?? "admin", category: "admin", action: "article.delete", target: { type: "bài viết", id: slug, label: article?.title ?? slug }, success: true });
  return NextResponse.json({ ok: true });
}
