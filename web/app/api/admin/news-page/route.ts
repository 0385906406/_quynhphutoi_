// Admin: đọc (GET) & cập nhật (PATCH) cấu hình các khối trang Tin tức (/tin-tuc).
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { getNewsPageConfig, setNewsPageConfig, type NewsPageConfig } from "@/lib/news-page";
import { logActivity } from "@/lib/activity-log";

export async function GET() {
  const g = await requireAdmin();
  if (g instanceof NextResponse) return g;
  const config = await getNewsPageConfig();
  return NextResponse.json({ config });
}

export async function PATCH(req: Request) {
  const g = await requireAdmin();
  if (g instanceof NextResponse) return g;
  const b = await req.json().catch(() => ({}));
  // setNewsPageConfig() tự validate/clamp từng khối, bỏ qua field lạ.
  const config = await setNewsPageConfig((b?.config ?? {}) as Partial<NewsPageConfig>);
  void logActivity({ userId: g.user._id!.toString(), userName: g.user.name, userEmail: g.user.email, userRole: g.user.role ?? "admin", category: "admin", action: "news-page.update", success: true });
  return NextResponse.json({ ok: true, config });
}
