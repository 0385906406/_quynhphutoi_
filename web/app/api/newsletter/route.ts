// Đăng ký nhận tin qua email (form công khai). Rate-limit theo IP, không cần đăng nhập.
import { NextResponse } from "next/server";
import { rateLimit, tooMany, clientIp } from "@/lib/ratelimit";
import { subscribe, isValidEmail } from "@/lib/newsletter";

export async function POST(req: Request) {
  const ip = clientIp(req);
  const rl = await rateLimit(`newsletter:ip:${ip}`, 10, 3600); // 10 lần / giờ / IP
  if (!rl.ok) return tooMany(rl.retryAfter, "Bạn thao tác quá nhiều lần. Vui lòng thử lại sau.");

  const b = await req.json().catch(() => ({}));
  const email = String(b.email ?? "").trim().toLowerCase();
  const source = String(b.source ?? "web").slice(0, 40);
  if (!email || email.length > 160 || !isValidEmail(email)) {
    return NextResponse.json({ error: "Email không hợp lệ." }, { status: 400 });
  }
  const isNew = await subscribe(email, source);
  return NextResponse.json({ ok: true, isNew });
}
