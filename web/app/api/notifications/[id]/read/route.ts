// Đánh dấu đã đọc 1 thông báo.
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { markRead } from "@/lib/notifications";
import { rateLimit, tooMany } from "@/lib/ratelimit";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  const rl = await rateLimit(`notifread:${session.id}`, 60, 60);
  if (!rl.ok) return tooMany(rl.retryAfter, "Thao tác quá nhanh.");
  const { id } = await params;
  await markRead(id, session.id);
  return NextResponse.json({ ok: true });
}
