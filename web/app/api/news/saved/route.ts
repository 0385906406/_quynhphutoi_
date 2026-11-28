// Trả thẻ bài cho danh sách slug (trang "Bài đã lưu") — chỉ bài công khai, giữ đúng thứ tự người dùng đã lưu.
import { NextResponse } from "next/server";
import { articles, toNewsCardArticle } from "@/lib/articles";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export async function GET(req: Request) {
  const rl = await rateLimit(`saved:${clientIp(req)}`, 60, 60);
  if (!rl.ok) return NextResponse.json({ items: [] });
  const slugs = (new URL(req.url).searchParams.get("slugs") || "").split(",").map((s) => s.trim().slice(0, 200)).filter(Boolean).slice(0, 60);
  if (!slugs.length) return NextResponse.json({ items: [] });
  const docs = await (await articles()).find({ slug: { $in: slugs }, status: "published", approved: { $ne: false }, active: { $ne: false } }).toArray();
  const by = new Map(docs.map((d) => [d.slug, d]));
  const items = slugs.map((s) => by.get(s)).filter((d): d is NonNullable<typeof d> => !!d).map(toNewsCardArticle);
  return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store" } });
}
