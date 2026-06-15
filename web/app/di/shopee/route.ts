// Redirect trung gian cho nút "Xem thêm" affiliate Shopee.
// Mỗi lượt bấm: chọn ngẫu nhiên 1 link trong danh sách admin cấu hình rồi 302 sang Shopee.
// Cloaking (link hiển thị là domain mình) + chống cache để luôn random.
import { NextResponse } from "next/server";
import { SITE } from "@/lib/seo";
import { getAffiliateConfig, pickRandomLink, isShopeeUrl } from "@/lib/affiliate";

export const dynamic = "force-dynamic";

export async function GET() {
  const cfg = await getAffiliateConfig().catch(() => null);
  const target = cfg && cfg.enabled ? pickRandomLink(cfg.links) : null;
  // Không có link hợp lệ → quay về trang chủ thay vì lỗi.
  if (!target || !isShopeeUrl(target)) {
    return NextResponse.redirect(SITE.url, { status: 302, headers: { "Cache-Control": "no-store" } });
  }
  return NextResponse.redirect(target, { status: 302, headers: { "Cache-Control": "no-store" } });
}
