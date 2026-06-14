// Admin: đọc (GET) & cập nhật (PATCH) cấu hình hệ thống.
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { getSettings, updateSettings } from "@/lib/settings";

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
  return NextResponse.json({ ok: true, settings: next });
}
