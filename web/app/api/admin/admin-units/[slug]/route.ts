// Admin: cập nhật (PATCH) & xoá (DELETE) một đơn vị hành chính.
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { updateAdminUnit, deleteAdminUnit, type AdminUnitInput } from "@/lib/admin-units";
import { logActivity } from "@/lib/activity-log";

export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const g = await requireAdmin();
  if (g instanceof NextResponse) return g;
  const { slug } = await params;
  const b = await req.json().catch(() => ({}));

  const patch: Partial<AdminUnitInput> = {};
  if (typeof b.name === "string") patch.name = b.name;
  if (b.prefix === "Xã" || b.prefix === "Thị trấn") patch.prefix = b.prefix;
  for (const k of ["district", "province", "newCommune", "newCommuneSlug", "newProvince"] as const)
    if (typeof b[k] === "string") patch[k] = b[k];

  const n = await updateAdminUnit(slug, patch);
  if (!n) return NextResponse.json({ error: "Không tìm thấy." }, { status: 404 });
  void logActivity({ userId: g.user._id!.toString(), userName: g.user.name, userEmail: g.user.email, userRole: g.user.role ?? "admin", category: "admin", action: "admin-units.update", target: { type: "don-vi-hanh-chinh", id: slug }, success: true });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const g = await requireAdmin();
  if (g instanceof NextResponse) return g;
  const { slug } = await params;
  const n = await deleteAdminUnit(slug);
  if (!n) return NextResponse.json({ error: "Không tìm thấy." }, { status: 404 });
  void logActivity({ userId: g.user._id!.toString(), userName: g.user.name, userEmail: g.user.email, userRole: g.user.role ?? "admin", category: "admin", action: "admin-units.delete", target: { type: "don-vi-hanh-chinh", id: slug }, success: true });
  return NextResponse.json({ ok: true });
}
