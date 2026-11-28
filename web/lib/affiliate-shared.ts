// Phần client-safe của affiliate: type + validate link. KHÔNG import mongodb
// để client component (AffiliateManager) dùng được mà không kéo driver vào bundle.

// Link riêng cho 1 trang: chữ trên nút (để trống = dùng chữ chung) + danh sách link Shopee.
export type AffiliatePageConfig = { label: string; links: string[] };

export type AffiliateConfig = {
  enabled: boolean;
  label: string;     // chữ trên nút "Xem thêm" cuối bài
  note: string;      // nhãn nhỏ (vd "Tài trợ")
  links: string[];   // danh sách link chung (dùng khi trang chưa có link riêng)
  floatEnabled: boolean; // nút nổi góc màn hình trên điện thoại
  floatLabel: string;    // chữ chung trên nút nổi
  pages: Record<string, AffiliatePageConfig>; // link riêng theo trang — key là đường dẫn trong AFFILIATE_PAGES
};

// Các trang admin gắn được link riêng. Key "/" chỉ khớp đúng trang chủ; key khác khớp cả trang con
// (vd "/tin-tuc" áp cho mọi bài /tin-tuc/...).
export const AFFILIATE_PAGES: { key: string; label: string; hint: string }[] = [
  { key: "/", label: "Trang chủ", hint: "" },
  { key: "/gia-vang", label: "Giá vàng & tỷ giá", hint: "vd: nhẫn vàng, két sắt mini, ví đựng tiền" },
  { key: "/xo-so", label: "Xổ số", hint: "" },
  { key: "/bong-da", label: "Bóng đá", hint: "vd: áo đấu, giày đá bóng, quả bóng" },
  { key: "/thoi-tiet", label: "Thời tiết", hint: "vd: áo mưa, ô dù, quạt, máy sưởi" },
  { key: "/tin-tuc", label: "Tin tức (gồm cả bài viết)", hint: "" },
  { key: "/viec-lam", label: "Việc làm", hint: "vd: balo, đồ công sở, giày bảo hộ" },
  { key: "/mua-ban", label: "Mua bán", hint: "" },
  { key: "/tim-do-roi", label: "Tìm đồ rơi", hint: "vd: thiết bị định vị, móc khoá" },
  { key: "/cho", label: "Chợ", hint: "vd: làn đi chợ, hộp đựng thực phẩm" },
  { key: "/truong-hoc", label: "Trường học", hint: "vd: cặp sách, đồ dùng học tập" },
  { key: "/y-te", label: "Y tế", hint: "vd: máy đo huyết áp, nhiệt kế, khẩu trang" },
  { key: "/giao-thong", label: "Giao thông", hint: "vd: mũ bảo hiểm, áo mưa xe máy" },
  { key: "/di-tich", label: "Di tích", hint: "" },
];

// Trang hiện tại thuộc key nào trong số các key đã có link (khớp dài nhất). null = dùng link chung.
export function matchAffiliatePage(pathname: string, keys: string[]): string | null {
  let best: string | null = null;
  for (const k of keys) {
    const hit = k === "/" ? pathname === "/" : pathname === k || pathname.startsWith(`${k}/`);
    if (hit && (!best || k.length > best.length)) best = k;
  }
  return best;
}

// Chỉ cho phép link Shopee (chống biến route redirect thành open-redirect).
export function isShopeeUrl(u: string): boolean {
  try {
    const url = new URL(u.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    const h = url.hostname.toLowerCase();
    return h === "shopee.vn" || h.endsWith(".shopee.vn") || h === "shp.ee" || h === "s.shopee.vn";
  } catch {
    return false;
  }
}
