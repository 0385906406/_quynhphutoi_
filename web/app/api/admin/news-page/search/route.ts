// Admin: tìm bài cho picker chọn thủ công (vùng nổi bật / đọc nhiều).
//   ?q=<từ khoá>     → tìm theo tiêu đề (rỗng ⇒ không trả gì, không đổ hết danh sách)
//   ?slugs=a,b,c     → lấy tiêu đề cho các slug đã chọn (để hiển thị chip)
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { searchNewsCandidates, newsCandidatesBySlugs } from "@/lib/news-page";

export async function GET(req: Request) {
  const g = await requireAdmin();
  if (g instanceof NextResponse) return g;
  const url = new URL(req.url);
  const slugsParam = url.searchParams.get("slugs");
  if (slugsParam !== null) {
    const items = await newsCandidatesBySlugs(slugsParam.split(",").map((s) => s.trim()).filter(Boolean));
    return NextResponse.json({ items });
  }
  const items = await searchNewsCandidates(url.searchParams.get("q") ?? "");
  return NextResponse.json({ items });
}
