// Admin: đổi vai trò / xác minh (PATCH) & xoá (DELETE) người dùng.
// An toàn: không cho tự gỡ quyền admin của chính mình, không cho tự xoá.
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { setUserRole, setUserVerified, deleteUser } from "@/lib/users";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireAdmin();
  if (g instanceof NextResponse) return g;
  const { id } = await params;
  const b = await req.json().catch(() => ({}));
  const isSelf = g.user._id!.toString() === id;

  if (b.role !== undefined) {
    if (b.role !== "admin" && b.role !== "user") return NextResponse.json({ error: "Vai trò không hợp lệ." }, { status: 400 });
    if (isSelf && b.role !== "admin") return NextResponse.json({ error: "Không thể tự gỡ quyền admin của chính mình." }, { status: 400 });
    const n = await setUserRole(id, b.role);
    if (!n) return NextResponse.json({ error: "Không tìm thấy." }, { status: 404 });
  }
  if (typeof b.verified === "boolean") {
    const n = await setUserVerified(id, b.verified);
    if (!n) return NextResponse.json({ error: "Không tìm thấy." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireAdmin();
  if (g instanceof NextResponse) return g;
  const { id } = await params;
  if (g.user._id!.toString() === id) return NextResponse.json({ error: "Không thể tự xoá tài khoản của mình." }, { status: 400 });
  const n = await deleteUser(id);
  if (!n) return NextResponse.json({ error: "Không tìm thấy." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
