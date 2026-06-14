// Admin: gửi thông báo (broadcast) tới toàn bộ người dùng hoặc chỉ admin.
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { broadcastToAll } from "@/lib/notifications";

export async function POST(req: Request) {
  const g = await requireAdmin();
  if (g instanceof NextResponse) return g;
  const b = await req.json().catch(() => ({}));

  const title = String(b.title || "").trim();
  if (!title) return NextResponse.json({ error: "Nhập nội dung thông báo." }, { status: 400 });
  const href = String(b.href || "").trim() || "/thong-bao";
  const adminsOnly = !!b.adminsOnly;

  const sent = await broadcastToAll(
    { type: "announcement", title, href, actorName: g.user.name },
    { adminsOnly },
    g.user._id!.toString(),
  );
  return NextResponse.json({ ok: true, sent });
}
