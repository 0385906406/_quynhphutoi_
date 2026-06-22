// Admin duyệt / bỏ duyệt 1 tin. POST body { approved?: boolean } (mặc định true).
import { NextResponse } from "next/server";
import { requirePerm } from "@/lib/admin-guard";
import { approvePost, getPostBySlug } from "@/lib/lostfound";
import { notifyUser } from "@/lib/notifications";
import { logActivity } from "@/lib/activity-log";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const g = await requirePerm("tim-do-roi", "edit");
  if (g instanceof NextResponse) return g;

  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) {
    return NextResponse.json({ error: "Không tìm thấy tin." }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const approved = body.approved !== false; // mặc định duyệt
  await approvePost(slug, approved, approved ? { id: g.user._id!.toString(), name: g.user.name } : undefined);

  if (approved) {
    await notifyUser(post.postedBy, {
      type: "post_approved",
      title: `Tin "${post.title}" của bạn đã được duyệt`,
      href: `/tim-do-roi/${slug}`,
      module: "tim-do-roi",
    });
  }
  void logActivity({ userId: g.user._id!.toString(), userName: g.user.name, userEmail: g.user.email, userRole: g.user.role ?? "admin", category: "admin", action: approved ? "lost-found.approve" : "lost-found.reject", target: { type: "tìm đồ rơi", id: slug, label: post.title }, success: true });
  return NextResponse.json({ ok: true, approved });
}
