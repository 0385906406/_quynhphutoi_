// Admin duyệt / bỏ duyệt 1 bài viết do người dùng gửi.
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/admin";
import { isAdmin } from "@/lib/users";
import { approveArticle, getArticleBySlug } from "@/lib/articles";
import { notifyUser } from "@/lib/notifications";

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  if (!isAdmin(user)) return NextResponse.json({ error: "Chỉ admin mới được duyệt bài." }, { status: 403 });
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return NextResponse.json({ error: "Không tìm thấy bài viết." }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  const approved = body.approved !== false;
  await approveArticle(slug, approved);
  if (approved && article.postedBy) {
    await notifyUser(article.postedBy, { type: "post_approved", title: `Bài viết “${article.title}” của bạn đã được duyệt`, href: `/tin-tuc/${slug}`, module: "tin-tuc" });
  }
  return NextResponse.json({ ok: true, approved });
}
