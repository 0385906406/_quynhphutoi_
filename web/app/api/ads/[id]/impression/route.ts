// Đếm lượt hiển thị (AdSlot gọi khi quảng cáo lọt vào màn hình).
// Chống bơm: mỗi IP chỉ tính tối đa 30 impression/10 phút cho 1 quảng cáo.
import { NextResponse } from "next/server";
import { recordImpression } from "@/lib/ads";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rl = await rateLimit(`ad:imp:${clientIp(req)}:${id}`, 30, 600);
  if (rl.ok) await recordImpression(id); // vượt ngưỡng → bỏ qua tăng đếm, vẫn trả ok
  return NextResponse.json({ ok: true });
}
