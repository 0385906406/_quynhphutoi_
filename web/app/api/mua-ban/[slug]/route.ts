import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getClassifiedBySlug, incrementViews } from "@/lib/classifieds";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ad = await getClassifiedBySlug(slug);
  if (!ad || !ad.active) return NextResponse.json({ error: "Không tìm thấy tin." }, { status: 404 });
  if (!ad.approved) {
    const session = await getSession();
    if (!session || session.id !== ad.postedBy.toString()) return NextResponse.json({ error: "Không tìm thấy tin." }, { status: 404 });
  }
  const counted = (await rateLimit(`view:muaban:${slug}:${clientIp(req)}`, 1, 1800)).ok;
  if (counted) await incrementViews(slug);
  return NextResponse.json({ item: { ...ad, views: ad.views + (counted ? 1 : 0) } });
}
