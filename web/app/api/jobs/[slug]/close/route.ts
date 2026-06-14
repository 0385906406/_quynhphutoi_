// Đóng tin (đã tuyển đủ) — chỉ chủ tin.
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getJobBySlug, markClosed } from "@/lib/jobs";
import { rateLimit, tooMany } from "@/lib/ratelimit";

export async function POST(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  const rl = await rateLimit(`act:${session.id}`, 20, 60);
  if (!rl.ok) return tooMany(rl.retryAfter, "Thao tác quá nhanh, vui lòng chậm lại.");
  const { slug } = await params;
  const job = await getJobBySlug(slug);
  if (!job) return NextResponse.json({ error: "Không tìm thấy tin." }, { status: 404 });
  if (job.postedBy.toString() !== session.id) return NextResponse.json({ error: "Bạn không có quyền với tin này." }, { status: 403 });
  await markClosed(slug);
  return NextResponse.json({ ok: true });
}
