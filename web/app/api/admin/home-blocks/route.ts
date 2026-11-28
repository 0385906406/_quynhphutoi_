// Admin: đọc (GET) & cập nhật (PATCH) bật/tắt các khối mới của trang chủ.
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { getHomeBlocks, setHomeBlocks, type HomeBlocksConfig } from "@/lib/home-blocks";
import { logActivity } from "@/lib/activity-log";

export async function GET() {
  const g = await requireAdmin();
  if (g instanceof NextResponse) return g;
  return NextResponse.json({ config: await getHomeBlocks() });
}

export async function PATCH(req: Request) {
  const g = await requireAdmin();
  if (g instanceof NextResponse) return g;
  const b = await req.json().catch(() => ({}));
  const config = await setHomeBlocks((b?.config ?? {}) as Partial<HomeBlocksConfig>);
  void logActivity({ userId: g.user._id!.toString(), userName: g.user.name, userEmail: g.user.email, userRole: g.user.role ?? "admin", category: "admin", action: "home-blocks.update", success: true });
  return NextResponse.json({ ok: true, config });
}
