// Admin: danh sách email đăng ký nhận tin (GET) & xoá 1 email (DELETE ?id=).
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { listSubscribers, removeSubscriber, toSubscriberRow } from "@/lib/newsletter";
import { logActivity } from "@/lib/activity-log";

export async function GET() {
  const g = await requireAdmin();
  if (g instanceof NextResponse) return g;
  const docs = await listSubscribers();
  return NextResponse.json({ items: docs.map(toSubscriberRow) });
}

export async function DELETE(req: Request) {
  const g = await requireAdmin();
  if (g instanceof NextResponse) return g;
  const id = new URL(req.url).searchParams.get("id") ?? "";
  const n = await removeSubscriber(id);
  if (!n) return NextResponse.json({ error: "Không tìm thấy." }, { status: 404 });
  void logActivity({ userId: g.user._id!.toString(), userName: g.user.name, userEmail: g.user.email, userRole: g.user.role ?? "admin", category: "admin", action: "newsletter.unsubscribe", target: { type: "newsletter", id: id }, success: true });
  return NextResponse.json({ ok: true });
}
