// Chi tiết 1 tin Tìm đồ rơi theo slug (GET) — tăng lượt xem.
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getPostBySlug, incrementViews } from "@/lib/lostfound";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post || !post.active) {
    return NextResponse.json({ error: "Không tìm thấy tin." }, { status: 404 });
  }

  // Tin chưa duyệt: chỉ chủ tin xem được.
  if (!post.approved) {
    const session = await getSession();
    if (!session || session.id !== post.postedBy.toString()) {
      return NextResponse.json({ error: "Không tìm thấy tin." }, { status: 404 });
    }
  }

  const counted = (await rateLimit(`view:lostfound:${slug}:${clientIp(req)}`, 1, 1800)).ok;
  if (counted) await incrementViews(slug);
  return NextResponse.json({ item: { ...post, views: post.views + (counted ? 1 : 0) } });
}
