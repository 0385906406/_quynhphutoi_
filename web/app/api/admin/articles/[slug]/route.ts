// Admin: cập nhật (PATCH) & xoá (DELETE) một bài viết.
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { updateArticle, deleteArticle, type ArticleInput, type ArticleStatus } from "@/lib/articles";
import { sanitizeHtml } from "@/lib/sanitize";

const STATUSES: ArticleStatus[] = ["draft", "published"];

export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const g = await requireAdmin();
  if (g instanceof NextResponse) return g;
  const { slug } = await params;
  const b = await req.json().catch(() => ({}));

  const patch: Partial<ArticleInput> = {};
  if (typeof b.title === "string") patch.title = b.title;
  if (typeof b.excerpt === "string") patch.excerpt = b.excerpt;
  if (typeof b.category === "string") { patch.category = b.category; if (typeof b.categorySlug === "string") patch.categorySlug = b.categorySlug; }
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
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const g = await requireAdmin();
  if (g instanceof NextResponse) return g;
  const { slug } = await params;
  const n = await deleteArticle(slug);
  if (!n) return NextResponse.json({ error: "Không tìm thấy." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
