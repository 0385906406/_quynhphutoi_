// Đánh dấu đã bán — chỉ chủ tin.
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getClassifiedBySlug, markSold } from "@/lib/classifieds";
import { rateLimit, tooMany } from "@/lib/ratelimit";

export async function POST(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  const rl = await rateLimit(`act:${session.id}`, 20, 60);
  if (!rl.ok) return tooMany(rl.retryAfter, "Thao tác quá nhanh, vui lòng chậm lại.");
  const { slug } = await params;
  const ad = await getClassifiedBySlug(slug);
  if (!ad) return NextResponse.json({ error: "Không tìm thấy tin." }, { status: 404 });
  if (ad.postedBy.toString() !== session.id) return NextResponse.json({ error: "Bạn không có quyền với tin này." }, { status: 403 });
  await markSold(slug);
  return NextResponse.json({ ok: true });
}
