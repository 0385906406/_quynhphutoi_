// Admin: đọc (GET) & cập nhật (PATCH) cấu hình hệ thống.
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { getSettings, updateSettings } from "@/lib/settings";
import { logActivity } from "@/lib/activity-log";

export async function GET() {
  const g = await requireAdmin();
  if (g instanceof NextResponse) return g;
  return NextResponse.json({ settings: await getSettings() });
}

export async function PATCH(req: Request) {
  const g = await requireAdmin();
  if (g instanceof NextResponse) return g;
  const b = await req.json().catch(() => ({}));
  // Chuyển toàn bộ body — updateSettings() đã tự validate/clamp từng trường, bỏ qua trường lạ.
  const next = await updateSettings(b);
  void logActivity({ userId: g.user._id!.toString(), userName: g.user.name, userEmail: g.user.email, userRole: g.user.role ?? "admin", category: "admin", action: "settings.update", success: true });
  return NextResponse.json({ ok: true, settings: next });
}
