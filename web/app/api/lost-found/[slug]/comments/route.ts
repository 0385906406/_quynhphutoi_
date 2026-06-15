// Bình luận của 1 tin: GET danh sách, POST thêm (cần đăng nhập).
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getPostBySlug } from "@/lib/lostfound";
import { addComment, listComments, commenterIds } from "@/lib/lostfound-social";
import { notifyUser, notifyMany } from "@/lib/notifications";
import { rateLimit, tooMany } from "@/lib/ratelimit";
import { verifyRecaptcha } from "@/lib/recaptcha";
import { getSettings } from "@/lib/settings";
import { scanProfanity, getActiveProfanityWords } from "@/lib/profanity";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return NextResponse.json({ items: [], count: 0 });

  const session = await getSession();
  const docs = await listComments(post._id!);
  const items = docs.map((c) => ({
    id: c._id!.toString(),
    userName: c.userName,
    content: c.content,
    createdAt: c.createdAt.toISOString(),
    mine: !!session && session.id === c.userId.toString(),
  }));
  return NextResponse.json({ items, count: items.length });
}

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Vui lòng đăng nhập để bình luận." }, { status: 401 });

  const settings = await getSettings();
  if (!settings.commentsEnabled) return NextResponse.json({ error: "Tính năng bình luận đang tạm khoá." }, { status: 403 });

  const rl = await rateLimit(`comment:${session.id}`, settings.commentMaxPerMin, 60);
  if (!rl.ok) return tooMany(rl.retryAfter, "Bạn bình luận quá nhanh. Vui lòng chậm lại.");

  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post || !post.active) return NextResponse.json({ error: "Không tìm thấy tin." }, { status: 404 });

  // Chống dội bình luận lên cùng 1 tin: tối đa 5 lần / 10 phút.
  const rlPost = await rateLimit(`comment:${session.id}:${slug}`, 5, 600);
  if (!rlPost.ok) return tooMany(rlPost.retryAfter, "Bạn bình luận quá nhiều vào tin này. Vui lòng chậm lại.");

  const body = await req.json().catch(() => ({}));
  if (!(await verifyRecaptcha(body.recaptchaToken))) {
    return NextResponse.json({ error: "Xác thực reCAPTCHA thất bại, vui lòng thử lại." }, { status: 403 });
  }
  const content = typeof body.content === "string" ? body.content : "";
  if (!content.trim()) return NextResponse.json({ error: "Nội dung bình luận trống." }, { status: 400 });
  if (content.length > settings.commentMaxLength) return NextResponse.json({ error: `Bình luận quá dài (tối đa ${settings.commentMaxLength} ký tự).` }, { status: 400 });
  if (settings.profanityFilterEnabled && scanProfanity(content, await getActiveProfanityWords()).length) {
    return NextResponse.json({ error: "Bình luận chứa từ ngữ không phù hợp. Vui lòng chỉnh sửa." }, { status: 400 });
  }

  try {
    const c = await addComment({ id: post._id!, slug: post.slug }, { id: session.id, name: session.name }, content);

    // Thông báo: chủ tin + những người đã bình luận trong tin (trừ người vừa bình luận).
    const href = `/tim-do-roi/${post.slug}#comments`;
    const ownerId = post.postedBy.toString();
    await notifyUser(ownerId, { type: "comment", title: `${session.name} đã bình luận về tin “${post.title}” của bạn`, href, actorName: session.name, module: "tim-do-roi" }, session.id);
    const others = (await commenterIds(post._id!)).filter((id) => id !== ownerId);
    await notifyMany(others, { type: "comment", title: `${session.name} cũng bình luận về tin “${post.title}”`, href, actorName: session.name, module: "tim-do-roi" }, session.id);

    return NextResponse.json({
      ok: true,
      item: { id: c._id!.toString(), userName: c.userName, content: c.content, createdAt: c.createdAt.toISOString(), mine: true },
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Gửi bình luận thất bại." }, { status: 400 });
  }
}
