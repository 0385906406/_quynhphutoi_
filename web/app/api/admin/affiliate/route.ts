// Admin: đọc (GET) & cập nhật (PATCH) cấu hình affiliate Shopee (danh sách link).
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { getAffiliateConfig, setAffiliateConfig, type AffiliateConfig } from "@/lib/affiliate";
import { logActivity } from "@/lib/activity-log";

export async function GET() {
  const g = await requireAdmin();
  if (g instanceof NextResponse) return g;
  const config = await getAffiliateConfig();
  return NextResponse.json({ config });
}

export async function PATCH(req: Request) {
  const g = await requireAdmin();
  if (g instanceof NextResponse) return g;
  const b = await req.json().catch(() => ({}));
  // setAffiliateConfig tự lọc link không phải Shopee + clamp.
  const config = await setAffiliateConfig((b?.config ?? {}) as Partial<AffiliateConfig>);
  void logActivity({ userId: g.user._id!.toString(), userName: g.user.name, userEmail: g.user.email, userRole: g.user.role ?? "admin", category: "admin", action: "affiliate.update", success: true });
  return NextResponse.json({ ok: true, config });
}
