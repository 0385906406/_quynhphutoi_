import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { getRolePermissions, saveRolePermissions, type PermConfig } from "@/lib/role-permissions";
import { logActivity } from "@/lib/activity-log";

export async function GET() {
  const g = await requireAdmin();
  if (g instanceof NextResponse) return g;
  const config = await getRolePermissions();
  return NextResponse.json({ config });
}

export async function PUT(req: Request) {
  const g = await requireAdmin();
  if (g instanceof NextResponse) return g;
  const body = await req.json().catch(() => null);
  if (!body?.config) return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
  await saveRolePermissions(body.config as PermConfig);
  void logActivity({ userId: g.user._id!.toString(), userName: g.user.name, userEmail: g.user.email, userRole: g.user.role ?? "admin", category: "admin", action: "role-permissions.update", success: true });
  return NextResponse.json({ ok: true });
}
