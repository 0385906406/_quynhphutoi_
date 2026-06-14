// Đánh dấu đã đọc tất cả thông báo của người dùng hiện tại.
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { markAllRead } from "@/lib/notifications";
import { rateLimit, tooMany } from "@/lib/ratelimit";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  const rl = await rateLimit(`notifreadall:${session.id}`, 10, 60);
  if (!rl.ok) return tooMany(rl.retryAfter, "Thao tác quá nhanh.");
  const n = await markAllRead(session.id);
  return NextResponse.json({ ok: true, updated: n });
}
