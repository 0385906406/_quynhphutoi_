// Admin: cập nhật (PATCH) & xoá (DELETE) một danh mục.
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { updateCategory, deleteCategory, type CategoryPatch } from "@/lib/categories";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireAdmin();
  if (g instanceof NextResponse) return g;
  const { id } = await params;
  const b = await req.json().catch(() => ({}));

  const patch: CategoryPatch = {};
  if (typeof b.name === "string") patch.name = b.name;
  if (b.order !== undefined) patch.order = Number(b.order) || 0;
  if (typeof b.icon === "string") patch.icon = b.icon;
  if (typeof b.href === "string") patch.href = b.href;
  if (typeof b.description === "string") patch.description = b.description;
  if (typeof b.active === "boolean") patch.active = b.active;

  const n = await updateCategory(id, patch);
  if (!n) return NextResponse.json({ error: "Không tìm thấy." }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireAdmin();
  if (g instanceof NextResponse) return g;
  const { id } = await params;
  const res = await deleteCategory(id);
  if (!res.ok) {
    if (res.reason === "has-children") return NextResponse.json({ error: "Danh mục còn danh mục con — xoá/di chuyển con trước." }, { status: 409 });
    return NextResponse.json({ error: "Không tìm thấy." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
