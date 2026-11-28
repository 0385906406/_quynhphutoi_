// Redirect trung gian cho nút affiliate Shopee (nút "Xem thêm" cuối bài + nút nổi trên điện thoại).
// ?p=<trang> → chọn ngẫu nhiên 1 link riêng của trang đó (chưa có thì dùng link chung) rồi 302 sang Shopee.
// Chống cache để luôn random.
import { NextResponse } from "next/server";
import { SITE } from "@/lib/seo";
import { getAffiliateConfig, pickRandomLink, isShopeeUrl, linksForPage } from "@/lib/affiliate";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const cfg = await getAffiliateConfig().catch(() => null);
  const page = new URL(req.url).searchParams.get("p");
  const target = cfg && cfg.enabled ? pickRandomLink(linksForPage(cfg, page)) : null;
  // Không có link hợp lệ → quay về trang chủ thay vì lỗi.
  if (!target || !isShopeeUrl(target)) {
    return NextResponse.redirect(SITE.url, { status: 302, headers: { "Cache-Control": "no-store" } });
  }
  return NextResponse.redirect(target, { status: 302, headers: { "Cache-Control": "no-store" } });
}
