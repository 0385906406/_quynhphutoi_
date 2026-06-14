// Admin: nạp dữ liệu mẫu cho các collection ĐANG RỖNG (Dịch vụ công + Khám phá).
// Không ghi đè dữ liệu hiện có. Dùng 1 lần sau khi deploy lên DB mới.
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { seedDemoData } from "@/lib/seed";

export async function POST() {
  const g = await requireAdmin();
  if (g instanceof NextResponse) return g;
  try {
    const report = await seedDemoData();
    return NextResponse.json({ ok: true, report });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "Nạp dữ liệu thất bại." }, { status: 500 });
  }
}
