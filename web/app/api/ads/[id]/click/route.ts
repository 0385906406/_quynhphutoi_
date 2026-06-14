// Đếm click rồi chuyển hướng tới link quảng cáo.
// Chống bơm: mỗi IP tối đa 20 click/10 phút cho 1 quảng cáo — vượt thì vẫn chuyển hướng nhưng không tăng đếm.
import { NextResponse } from "next/server";
import { recordClick, getAd } from "@/lib/ads";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rl = await rateLimit(`ad:click:${clientIp(req)}:${id}`, 20, 600);

  let url: string | null;
  if (rl.ok) {
    url = await recordClick(id);
  } else {
    url = (await getAd(id))?.linkUrl ?? null; // vượt ngưỡng → lấy link để redirect, không tăng click
  }
  if (!url) return NextResponse.json({ error: "Không tìm thấy quảng cáo." }, { status: 404 });
  return NextResponse.redirect(url, 302);
}
