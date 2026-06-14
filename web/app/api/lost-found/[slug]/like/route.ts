// Bật/tắt thích 1 tin (cần đăng nhập).
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getPostBySlug } from "@/lib/lostfound";
import { toggleLike } from "@/lib/lostfound-social";
import { notifyUser } from "@/lib/notifications";
import { rateLimit, tooMany } from "@/lib/ratelimit";
import { getSettings } from "@/lib/settings";

export async function POST(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Vui lòng đăng nhập để thích tin." }, { status: 401 });

  if (!(await getSettings()).likesEnabled) return NextResponse.json({ error: "Tính năng thích đang tạm khoá." }, { status: 403 });

  const rl = await rateLimit(`like:${session.id}`, 40, 60);
  if (!rl.ok) return tooMany(rl.retryAfter, "Bạn thao tác quá nhanh.");

  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post || !post.active) return NextResponse.json({ error: "Không tìm thấy tin." }, { status: 404 });

  const result = await toggleLike(post._id!, session.id);
  // Chỉ thông báo khi vừa thích (không phải bỏ thích).
  if (result.liked) {
    await notifyUser(post.postedBy, { type: "like", title: `${session.name} đã thích tin “${post.title}” của bạn`, href: `/tim-do-roi/${post.slug}`, actorName: session.name, module: "tim-do-roi" }, session.id);
  }
  return NextResponse.json(result);
}
