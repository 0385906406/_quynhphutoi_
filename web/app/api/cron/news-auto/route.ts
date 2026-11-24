// Cron hằng ngày (vercel.json → "crons"): đăng bài hẹn giờ tới hạn + tự lấy tin mới từ nguồn ngoài.
// Vercel tự gửi "Authorization: Bearer <CRON_SECRET>" khi env CRON_SECRET được đặt.
// Dịch vụ cron ngoài (cron-job.org…) gọi được với cùng header đó.
import { NextResponse } from "next/server";
import { runNewsAuto } from "@/lib/news-auto";

// Mỗi tin = tải trang gốc + 1 lượt AI (~10–30 giây) — tối đa 5 tin / lượt.
export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const run = await runNewsAuto("cron");
  return NextResponse.json(run);
}
