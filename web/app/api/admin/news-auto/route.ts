// Admin: xem lượt tự động gần nhất (GET) & chạy ngay một lượt (POST) — không cần đợi cron.
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { getNewsAutoLastRun, runNewsAuto } from "@/lib/news-auto";

export const maxDuration = 300;

export async function GET() {
  const g = await requireAdmin();
  if (g instanceof NextResponse) return g;
  return NextResponse.json({ run: await getNewsAutoLastRun() });
}

export async function POST() {
  const g = await requireAdmin();
  if (g instanceof NextResponse) return g;
  // force: admin bấm "Chạy ngay" để thử cả khi công tắc tự động đang tắt.
  const run = await runNewsAuto("manual", { force: true });
  return NextResponse.json({ run }, { status: run.error ? 400 : 200 });
}
