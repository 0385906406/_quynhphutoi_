// API Tin tức (công khai): người dùng gửi bài viết (POST — cần đăng nhập).
// Bài gửi lên ở trạng thái CHỜ DUYỆT (approved=false) cho tới khi admin duyệt,
// giống luồng đăng tin Việc làm / Mua bán / Tìm đồ rơi.
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { notifyAdmins } from "@/lib/notifications";
import { sanitizeHtml } from "@/lib/sanitize";
import { stripHtml } from "@/lib/strip-html";
import { verifyRecaptcha } from "@/lib/recaptcha";
import { checkPostQuota, recordPost } from "@/lib/post-quota";
import { getSettings } from "@/lib/settings";
import { slugify } from "@/lib/slug";
import { createArticle } from "@/lib/articles";

// Chuyên mục cho phép người dùng chọn (đồng bộ với admin ArticleManager).
const CATEGORIES = ["Thông báo", "Đời sống", "Kinh tế", "Giáo dục"];

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Vui lòng đăng nhập để gửi bài." }, { status: 401 });

  const settings = await getSettings();
  if (!settings.newsPostEnabled) return NextResponse.json({ error: "Tính năng gửi bài tin tức đang tạm khoá." }, { status: 403 });

  const quota = await checkPostQuota(session.id);
  if (!quota.ok) return NextResponse.json({ error: quota.message }, { status: 429 });

  const b = await req.json().catch(() => ({}));
  if (!(await verifyRecaptcha(b.recaptchaToken))) {
    return NextResponse.json({ error: "Xác thực reCAPTCHA thất bại, vui lòng thử lại." }, { status: 403 });
  }

  const title = stripHtml(String(b.title ?? "")).trim();
  if (!title) return NextResponse.json({ error: "Vui lòng nhập tiêu đề bài viết." }, { status: 400 });
  if (title.length > 200) return NextResponse.json({ error: "Tiêu đề quá dài (tối đa 200 ký tự)." }, { status: 400 });

  const category = String(b.category ?? "").trim();
  if (!CATEGORIES.includes(category)) return NextResponse.json({ error: "Vui lòng chọn chuyên mục hợp lệ." }, { status: 400 });

  const excerpt = stripHtml(String(b.excerpt ?? "")).trim();
  if (excerpt.length > 400) return NextResponse.json({ error: "Tóm tắt quá dài (tối đa 400 ký tự)." }, { status: 400 });

  const coverImage = String(b.coverImage ?? "").trim();
  if (!coverImage) return NextResponse.json({ error: "Vui lòng tải lên ảnh bìa." }, { status: 400 });

  const bodyHtml = sanitizeHtml(typeof b.bodyHtml === "string" ? b.bodyHtml : "");
  if (!stripHtml(bodyHtml).trim()) return NextResponse.json({ error: "Vui lòng nhập nội dung bài viết." }, { status: 400 });

  const tags = Array.isArray(b.tags)
    ? b.tags.map((t: unknown) => stripHtml(String(t)).trim()).filter(Boolean).slice(0, 10)
    : [];

  try {
    const article = await createArticle({
      title, excerpt, category, categorySlug: slugify(category), tags,
      coverImage, coverAlt: stripHtml(String(b.coverAlt ?? "")).trim() || undefined,
      author: { name: session.name },
      bodyHtml,
      status: "published",                       // sẽ công khai NGAY khi được duyệt
      approved: !settings.postRequireApproval,    // mặc định chờ duyệt
      postedBy: session.id, postedByName: session.name,
    });
    await recordPost(session.id);
    await notifyAdmins(
      { type: "post_pending", title: `Bài viết mới chờ duyệt: “${article.title}”`, href: "/admin/tin-tuc", actorName: session.name, module: "tin-tuc" },
      session.id,
    );
    return NextResponse.json({ ok: true, slug: article.slug });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Gửi bài thất bại." }, { status: 400 });
  }
}
