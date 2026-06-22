import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { getCustomRoleById, updateCustomRole, deleteCustomRole } from "@/lib/custom-roles";
import { clearCustomRoleFromUsers } from "@/lib/users";
import type { RolePerms } from "@/lib/role-permissions";
import { PERM_MODULES } from "@/lib/role-permissions";
import { logActivity } from "@/lib/activity-log";

const MODULE_KEYS = PERM_MODULES.map((m) => m.key);

function isValidPerms(perms: unknown): perms is RolePerms {
  if (!perms || typeof perms !== "object") return false;
  for (const key of MODULE_KEYS) {
    const v = (perms as Record<string, unknown>)[key];
    if (!["none", "view", "edit", "full"].includes(v as string)) return false;
  }
  return true;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireAdmin();
  if (g instanceof NextResponse) return g;

  const { id } = await params;
  const existing = await getCustomRoleById(id);
  if (!existing) return NextResponse.json({ error: "Không tìm thấy vai trò." }, { status: 404 });

  const b = await req.json().catch(() => ({}));
  const update: Partial<{ label: string; perms: RolePerms }> = {};

  if (typeof b.label === "string") {
    const label = b.label.trim();
    if (!label) return NextResponse.json({ error: "Tên vai trò không được để trống." }, { status: 400 });
    if (label.length > 50) return NextResponse.json({ error: "Tên vai trò không được quá 50 ký tự." }, { status: 400 });
    update.label = label;
  }
  if (b.perms !== undefined) {
    if (!isValidPerms(b.perms)) return NextResponse.json({ error: "Cấu hình quyền không hợp lệ." }, { status: 400 });
    update.perms = b.perms;
  }

  if (Object.keys(update).length === 0) return NextResponse.json({ error: "Không có thông tin cập nhật." }, { status: 400 });

  try {
    await updateCustomRole(id, update);
      void logActivity({ userId: g.user._id!.toString(), userName: g.user.name, userEmail: g.user.email, userRole: g.user.role ?? "admin", category: "admin", action: "custom-role.update", target: { type: "vai-tro", id: id }, success: true });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as { code: number }).code === 11000) {
      return NextResponse.json({ error: `Tên vai trò "${update.label}" đã tồn tại.` }, { status: 409 });
    }
    throw err;
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireAdmin();
  if (g instanceof NextResponse) return g;

  const { id } = await params;
  const existing = await getCustomRoleById(id);
  if (!existing) return NextResponse.json({ error: "Không tìm thấy vai trò." }, { status: 404 });

  // Reset tất cả user đang dùng role này về "user" trước khi xóa
  await clearCustomRoleFromUsers(id);
  await deleteCustomRole(id);

  void logActivity({ userId: g.user._id!.toString(), userName: g.user.name, userEmail: g.user.email, userRole: g.user.role ?? "admin", category: "admin", action: "custom-role.delete", target: { type: "vai-tro", id: id }, success: true });
  return NextResponse.json({ ok: true });
}
