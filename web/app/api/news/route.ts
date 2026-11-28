// Danh sách tin tức theo trang: GET /api/news?scope=trong-xa&category=&q=&sort=newest&page=1&pageSize=8&exclude=a,b
// Công khai (chỉ bài đã xuất bản + đã duyệt). Giới hạn đầu vào chặt + rate-limit theo IP.
import { NextResponse } from "next/server";
import { queryNewsPage, toNewsCardArticle } from "@/lib/articles";
import { rateLimit, clientIp } from "@/lib/ratelimit";

const SORTS = new Set(["newest", "oldest", "popular"]);
const SLUG = /^[a-z0-9][a-z0-9-]{0,200}$/;

export async function GET(req: Request) {
  const rl = await rateLimit(`news-list:${clientIp(req)}`, 120, 60);
  if (!rl.ok) {
    return NextResponse.json({ error: "Bạn thao tác quá nhanh, vui lòng thử lại sau." }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
  }

  const sp = new URL(req.url).searchParams;
  const scope = sp.get("scope") === "ngoai-xa" ? "ngoai-xa" : "trong-xa";
  const sortRaw = sp.get("sort") ?? "newest";
  const sort = SORTS.has(sortRaw) ? (sortRaw as "newest" | "oldest" | "popular") : "newest";
  const page = Math.min(500, Math.max(1, Math.floor(Number(sp.get("page"))) || 1));
  const pageSize = Math.min(24, Math.max(1, Math.floor(Number(sp.get("pageSize"))) || 8));
  const category = (sp.get("category") ?? "").trim().slice(0, 80) || undefined;
  const search = (sp.get("q") ?? "").trim().slice(0, 80) || undefined;
  const exclude = (sp.get("exclude") ?? "").split(",").map((s) => s.trim()).filter((s) => SLUG.test(s)).slice(0, 8);

  try {
    const { docs, total, totalPages } = await queryNewsPage({ scope, category, search, sort, exclude, page, pageSize });
    return NextResponse.json(
      { items: docs.map(toNewsCardArticle), total, totalPages, page },
      // Trình duyệt dùng lại 20s (không "stale-while-revalidate": nó khiến trình duyệt tự gọi lại ngầm → gấp đôi request).
      { headers: { "Cache-Control": "public, max-age=20, s-maxage=30" } },
    );
  } catch {
    return NextResponse.json({ error: "Không tải được danh sách tin." }, { status: 500 });
  }
}
