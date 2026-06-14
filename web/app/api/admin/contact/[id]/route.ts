// Admin: đánh dấu đã xử lý (PATCH) & xoá (DELETE) một liên hệ.
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { setContactHandled, deleteContact } from "@/lib/contact";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireAdmin();
  if (g instanceof NextResponse) return g;
  const { id } = await params;
  const b = await req.json().catch(() => ({}));
  const n = await setContactHandled(id, !!b.handled);
  if (!n) return NextResponse.json({ error: "Không tìm thấy." }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireAdmin();
  if (g instanceof NextResponse) return g;
  const { id } = await params;
  const n = await deleteContact(id);
  if (!n) return NextResponse.json({ error: "Không tìm thấy." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
