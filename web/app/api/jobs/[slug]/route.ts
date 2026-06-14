// Chi tiết 1 tin việc làm (GET) — tăng lượt xem.
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getJobBySlug, incrementViews } from "@/lib/jobs";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const job = await getJobBySlug(slug);
  if (!job || !job.active) return NextResponse.json({ error: "Không tìm thấy tin." }, { status: 404 });
  if (!job.approved) {
    const session = await getSession();
    if (!session || session.id !== job.postedBy.toString()) {
      return NextResponse.json({ error: "Không tìm thấy tin." }, { status: 404 });
    }
  }
  // Mỗi IP chỉ tính 1 lượt xem / 30 phút cho 1 tin (chống bơm view).
  const counted = (await rateLimit(`view:jobs:${slug}:${clientIp(req)}`, 1, 1800)).ok;
  if (counted) await incrementViews(slug);
  return NextResponse.json({ item: { ...job, views: job.views + (counted ? 1 : 0) } });
}
