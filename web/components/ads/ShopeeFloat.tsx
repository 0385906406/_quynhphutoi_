// Nút nổi ưu đãi affiliate (chỉ điện thoại — CSS ẩn trên màn rộng). Đọc cấu hình admin; ẩn nếu admin
// tắt nút nổi/tắt affiliate hoặc không có link nào. Chỉ gửi xuống trình duyệt chữ của từng trang,
// KHÔNG gửi link — link được chọn ở route /di/shopee.
import { getAffiliateConfig } from "@/lib/affiliate";
import { ShopeeFloatButton } from "./ShopeeFloatButton";

export async function ShopeeFloat() {
  const cfg = await getAffiliateConfig().catch(() => null);
  if (!cfg || !cfg.enabled || !cfg.floatEnabled) return null;
  const pageLabels = Object.fromEntries(Object.entries(cfg.pages).map(([k, v]) => [k, v.label]));
  if (!cfg.links.length && !Object.keys(pageLabels).length) return null;
  return (
    <ShopeeFloatButton
      label={cfg.floatLabel}
      note={cfg.note}
      hasDefaultLinks={cfg.links.length > 0}
      pageLabels={pageLabels}
    />
  );
}
