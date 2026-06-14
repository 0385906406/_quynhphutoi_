// Bình luận của 1 mục: GET danh sách, POST thêm (cần đăng nhập).
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isSocialType, addSocialComment, listSocialComments, socialCommenterIds, socialTargetExists, SOCIAL_LABEL, type SocialType } from "@/lib/social";
import { notifyMany } from "@/lib/notifications";
import { rateLimit, tooMany } from "@/lib/ratelimit";
import { verifyRecaptcha } from "@/lib/recaptcha";
import { getSettings } from "@/lib/settings";

export async function GET(_req: Request, { params }: { params: Promise<{ type: string; slug: string }> }) {
  const { type, slug } = await params;
  if (!isSocialType(type)) return NextResponse.json({ items: [], count: 0 });

  const session = await getSession();
  const docs = await listSocialComments(type, slug);
  const items = docs.map((c) => ({
    id: c._id!.toString(),
    userName: c.userName,
    content: c.content,
    createdAt: c.createdAt.toISOString(),
    mine: !!session && session.id === c.userId.toString(),
  }));
  return NextResponse.json({ items, count: items.length });
}

export async function POST(req: Request, { params }: { params: Promise<{ type: string; slug: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Vui lòng đăng nhập để bình luận." }, { status: 401 });

  const settings = await getSettings();
  if (!settings.commentsEnabled) return NextResponse.json({ error: "Tính năng bình luận đang tạm khoá." }, { status: 403 });

  const rl = await rateLimit(`comment:${session.id}`, settings.commentMaxPerMin, 60);
  if (!rl.ok) return tooMany(rl.retryAfter, "Bạn bình luận quá nhanh. Vui lòng chậm lại.");

  const { type, slug } = await params;
  if (!isSocialType(type)) return NextResponse.json({ error: "Không hợp lệ." }, { status: 400 });
  if (!(await socialTargetExists(type, slug))) return NextResponse.json({ error: "Không tìm thấy mục này." }, { status: 404 });

  const rlPost = await rateLimit(`comment:${session.id}:${type}:${slug}`, 5, 600);
  if (!rlPost.ok) return tooMany(rlPost.retryAfter, "Bạn bình luận quá nhiều vào mục này. Vui lòng chậm lại.");

  const body = await req.json().catch(() => ({}));
  if (!(await verifyRecaptcha(body.recaptchaToken))) {
    return NextResponse.json({ error: "Xác thực reCAPTCHA thất bại, vui lòng thử lại." }, { status: 403 });
  }
  const content = typeof body.content === "string" ? body.content : "";
  if (!content.trim()) return NextResponse.json({ error: "Nội dung bình luận trống." }, { status: 400 });
  if (content.length > settings.commentMaxLength) return NextResponse.json({ error: `Bình luận quá dài (tối đa ${settings.commentMaxLength} ký tự).` }, { status: 400 });

  try {
    const c = await addSocialComment(type, slug, { id: session.id, name: session.name }, content);

    // Thông báo cho những người đã bình luận trong mục (trừ người vừa bình luận).
    const participants = await socialCommenterIds(type, slug);
    await notifyMany(
      participants,
      { type: "comment", title: `${session.name} đã bình luận mục ${SOCIAL_LABEL[type as SocialType]} bạn đã tham gia`, href: `/${type}/${slug}#comments`, actorName: session.name, module: type },
      session.id,
    );

    return NextResponse.json({
      ok: true,
      item: { id: c._id!.toString(), userName: c.userName, content: c.content, createdAt: c.createdAt.toISOString(), mine: true },
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Gửi bình luận thất bại." }, { status: 400 });
  }
}
