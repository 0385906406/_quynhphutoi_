// Link "… Xem thêm" affiliate Shopee — kiểu "đọc tiếp" inline đặt cuối phần mô tả,
// KHÔNG phải box. Server component, tự đọc cấu hình; ẩn nếu admin tắt/chưa có link.
// `page` = key trang trong AFFILIATE_PAGES → dùng link/chữ riêng của trang đó nếu admin đã đặt.
import { getAffiliateConfig, linksForPage } from "@/lib/affiliate";

export async function AffiliateCTA({ page }: { page: string }) {
  const cfg = await getAffiliateConfig().catch(() => null);
  if (!cfg || !cfg.enabled || linksForPage(cfg, page).length === 0) return null;
  const label = cfg.pages[page]?.label || cfg.label;
  return (
    <p className="qp-affiliate-more">
      <span className="qp-affiliate-more__dots" aria-hidden>… </span>
      <a
        className="qp-affiliate-more__link"
        href={`/di/shopee?p=${encodeURIComponent(page)}`}
        target="_blank"
        rel="sponsored nofollow noopener noreferrer"
      >
        {label}
      </a>
      {cfg.note ? <span className="qp-affiliate-more__note"> · {cfg.note}</span> : null}
    </p>
  );
}
