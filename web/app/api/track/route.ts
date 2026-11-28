// Ghi nhận 1 lượt xem trang của người thật (gọi từ <VisitTracker/> bằng sendBeacon).
// Bỏ bot, bỏ /admin, /api; giới hạn tần suất theo IP. Lỗi → im lặng (không ảnh hưởng người dùng).
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { isBot, recordVisit } from "@/lib/visits";

export async function POST(req: Request) {
  const ua = req.headers.get("user-agent");
  if (isBot(ua)) return new NextResponse(null, { status: 204 });
  const ip = clientIp(req);
  const rl = await rateLimit(`track:${ip}`, 90, 60);
  if (!rl.ok) return new NextResponse(null, { status: 204 });

  const body = (await req.json().catch(() => null)) as { path?: unknown; ref?: unknown } | null;
  const path = typeof body?.path === "string" ? body.path.split(/[?#]/)[0].slice(0, 300) : "";
  if (!path.startsWith("/") || path.startsWith("/admin") || path.startsWith("/api")) return new NextResponse(null, { status: 204 });
  let ref: string | undefined;
  if (typeof body?.ref === "string" && body.ref) {
    try { const h = new URL(body.ref).hostname; if (h && h !== new URL(req.url).hostname) ref = h.slice(0, 100); } catch {}
  }
  const session = await getSession().catch(() => null);
  await recordVisit({ ip, ua: ua!, path, ref, userId: session?.id || undefined }).catch(() => {});
  return new NextResponse(null, { status: 204 });
}
