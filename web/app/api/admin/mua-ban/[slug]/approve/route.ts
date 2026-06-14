import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/admin";
import { isAdmin } from "@/lib/users";
import { approveClassified, getClassifiedBySlug } from "@/lib/classifieds";
import { notifyUser } from "@/lib/notifications";

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  if (!isAdmin(user)) return NextResponse.json({ error: "Chỉ admin mới được duyệt tin." }, { status: 403 });
  const { slug } = await params;
  const ad = await getClassifiedBySlug(slug);
  if (!ad) return NextResponse.json({ error: "Không tìm thấy tin." }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  const approved = body.approved !== false;
  await approveClassified(slug, approved);
  if (approved) {
    await notifyUser(ad.postedBy, { type: "post_approved", title: `Tin mua bán “${ad.title}” của bạn đã được duyệt`, href: `/mua-ban/${slug}`, module: "mua-ban" });
  }
  return NextResponse.json({ ok: true, approved });
}
