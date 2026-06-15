import type { Metadata } from "next";
import { getAffiliateConfig } from "@/lib/affiliate";
import { AffiliateManager } from "@/components/admin/AffiliateManager";

export const metadata: Metadata = { title: "Affiliate Shopee — Quản trị", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminAffiliatePage() {
  const config = await getAffiliateConfig();
  return (
    <>
      <div className="qp-admin-head">
        <span className="qp-admin-head__eyebrow">Hệ thống</span>
        <h1 className="type-h1">Affiliate Shopee</h1>
        <p className="qp-admin-head__desc">Cấu hình danh sách link Shopee cho nút “Xem thêm” ở cuối bài. Mỗi lượt bấm hệ thống tự chọn ngẫu nhiên 1 link.</p>
      </div>
      <AffiliateManager initial={config} />
    </>
  );
}
