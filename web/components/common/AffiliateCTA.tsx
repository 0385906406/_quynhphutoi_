// Nút "Xem thêm" affiliate Shopee — server component, tự đọc cấu hình.
// Ẩn hoàn toàn nếu admin tắt hoặc chưa có link. Link trỏ qua /di/shopee (random + cloaking).
import { getAffiliateConfig } from "@/lib/affiliate";

export async function AffiliateCTA() {
  const cfg = await getAffiliateConfig().catch(() => null);
  if (!cfg || !cfg.enabled || cfg.links.length === 0) return null;
  return (
    <aside className="qp-affiliate" aria-label="Liên kết tài trợ">
      {cfg.note ? <span className="qp-affiliate__tag">{cfg.note}</span> : null}
      <a
        className="qp-btn-primary qp-affiliate__btn"
        href="/di/shopee"
        target="_blank"
        rel="sponsored nofollow noopener noreferrer"
      >
        {cfg.label} <span className="qp-arrow">→</span>
      </a>
    </aside>
  );
}
