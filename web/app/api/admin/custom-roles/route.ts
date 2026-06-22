import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { listCustomRoles, createCustomRole, buildDefaultPerms } from "@/lib/custom-roles";
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

export async function GET() {
  const g = await requireAdmin();
  if (g instanceof NextResponse) return g;
  const roles = await listCustomRoles();
  return NextResponse.json({ roles });
}

export async function POST(req: Request) {
  const g = await requireAdmin();
  if (g instanceof NextResponse) return g;

  const b = await req.json().catch(() => ({}));
  const label = typeof b.label === "string" ? b.label.trim() : "";
  if (!label) return NextResponse.json({ error: "Tên vai trò không được để trống." }, { status: 400 });
  if (label.length > 50) return NextResponse.json({ error: "Tên vai trò không được quá 50 ký tự." }, { status: 400 });

  const perms: RolePerms = isValidPerms(b.perms) ? b.perms : buildDefaultPerms();

  try {
    const role = await createCustomRole(label, perms);
      void logActivity({ userId: g.user._id!.toString(), userName: g.user.name, userEmail: g.user.email, userRole: g.user.role ?? "admin", category: "admin", action: "custom-role.create", target: { type: "vai-tro", label: label }, success: true });
    return NextResponse.json({ role }, { status: 201 });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as { code: number }).code === 11000) {
      return NextResponse.json({ error: `Vai trò "${label}" đã tồn tại.` }, { status: 409 });
    }
    throw err;
  }
}
