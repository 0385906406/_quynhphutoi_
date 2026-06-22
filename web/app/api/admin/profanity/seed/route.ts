// Admin: nạp/khôi phục danh sách từ cấm mặc định (chỉ thêm từ chưa có).
import { NextResponse } from "next/server";
import { requirePerm } from "@/lib/admin-guard";
import { seedProfanityWords } from "@/lib/profanity";
import { logActivity } from "@/lib/activity-log";

export async function POST() {
  const g = await requirePerm("loc-tu-ngu", "edit");
  if (g instanceof NextResponse) return g;
  const added = await seedProfanityWords();
  void logActivity({ userId: g.user._id!.toString(), userName: g.user.name, userEmail: g.user.email, userRole: g.user.role ?? "admin", category: "admin", action: "profanity.seed", success: true });
  return NextResponse.json({ ok: true, added });
}
