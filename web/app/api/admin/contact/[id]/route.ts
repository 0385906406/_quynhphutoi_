// Admin: đánh dấu đã xử lý (PATCH) & xoá (DELETE) một liên hệ.
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { setContactHandled, deleteContact } from "@/lib/contact";
import { logActivity } from "@/lib/activity-log";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireAdmin();
  if (g instanceof NextResponse) return g;
  const { id } = await params;
  const b = await req.json().catch(() => ({}));
  const n = await setContactHandled(id, !!b.handled);
  if (!n) return NextResponse.json({ error: "Không tìm thấy." }, { status: 404 });
  void logActivity({ userId: g.user._id!.toString(), userName: g.user.name, userEmail: g.user.email, userRole: g.user.role ?? "admin", category: "admin", action: "contact.handle", target: { type: "lien-he", id: id }, success: true });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireAdmin();
  if (g instanceof NextResponse) return g;
  const { id } = await params;
  const n = await deleteContact(id);
  if (!n) return NextResponse.json({ error: "Không tìm thấy." }, { status: 404 });
  void logActivity({ userId: g.user._id!.toString(), userName: g.user.name, userEmail: g.user.email, userRole: g.user.role ?? "admin", category: "admin", action: "contact.delete", target: { type: "lien-he", id: id }, success: true });
  return NextResponse.json({ ok: true });
}
