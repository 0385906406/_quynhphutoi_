// Phần client-safe của affiliate: type + validate link. KHÔNG import mongodb
// để client component (AffiliateManager) dùng được mà không kéo driver vào bundle.

export type AffiliateConfig = {
  enabled: boolean;
  label: string;     // chữ trên nút
  note: string;      // nhãn nhỏ (vd "Tài trợ")
  links: string[];   // danh sách link Shopee (đã lọc hợp lệ)
};

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
