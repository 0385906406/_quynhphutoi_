// Admin: nạp từ điển tục từ thư viện ngoài (leo-profanity + bad-words) vào DB.
import { NextResponse } from "next/server";
import { requirePerm } from "@/lib/admin-guard";
import { importLibraryWords } from "@/lib/profanity";
import { logActivity } from "@/lib/activity-log";

export async function POST() {
  const g = await requirePerm("loc-tu-ngu", "edit");
  if (g instanceof NextResponse) return g;
  try {
    const { added, scanned } = await importLibraryWords();
      void logActivity({ userId: g.user._id!.toString(), userName: g.user.name, userEmail: g.user.email, userRole: g.user.role ?? "admin", category: "admin", action: "profanity.import", success: true });
    return NextResponse.json({ ok: true, added, scanned });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Không nạp được thư viện." }, { status: 500 });
  }
}
