// Admin: gửi thông báo riêng tới 1 email cụ thể.
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { getDb } from "@/lib/db";
import { notifyUser } from "@/lib/notifications";
import { logActivity } from "@/lib/activity-log";

export async function POST(req: Request) {
  const g = await requireAdmin();
  if (g instanceof NextResponse) return g;

  const b = await req.json().catch(() => ({}));
  const email = String(b.email || "").trim().toLowerCase();
  const title = String(b.title || "").trim();
  const href  = String(b.href  || "").trim() || "/thong-bao";

  if (!email) return NextResponse.json({ error: "Nhập email người nhận." }, { status: 400 });
  if (!title) return NextResponse.json({ error: "Nhập nội dung thông báo." }, { status: 400 });

  const db = await getDb();
  const recipient = await db.collection("users").findOne(
    { email },
    { projection: { _id: 1, name: 1 } },
  );
  if (!recipient) return NextResponse.json({ error: `Không tìm thấy tài khoản với email "${email}".` }, { status: 404 });

  await notifyUser(recipient._id, {
    type: "announcement",
    title,
    href,
    actorName: g.user.name,
  });

  void logActivity({ userId: g.user._id!.toString(), userName: g.user.name, userEmail: g.user.email, userRole: g.user.role ?? "admin", category: "admin", action: "notification.personal", target: { type: "thong-bao", label: email }, success: true });
  return NextResponse.json({ ok: true, recipientName: recipient.name });
}
