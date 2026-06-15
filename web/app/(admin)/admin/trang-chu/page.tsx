import type { Metadata } from "next";
import { getHomeSections, listHomeCandidates } from "@/lib/home-sections";
import { HomeSectionsManager } from "@/components/admin/HomeSectionsManager";

export const metadata: Metadata = { title: "Trang chủ — Quản trị", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminHomeSectionsPage() {
  const [config, candidates] = await Promise.all([getHomeSections(), listHomeCandidates()]);
  return (
    <>
      <div className="qp-admin-head">
        <span className="qp-admin-head__eyebrow">Hệ thống</span>
        <h1 className="type-h1">Trang chủ</h1>
        <p className="qp-admin-head__desc">Chọn cách hiển thị từng khối trên trang chủ: tự lấy mới nhất, ngẫu nhiên, hoặc chọn thủ công các bài/tin cụ thể.</p>
      </div>
      <HomeSectionsManager initialConfig={config} candidates={candidates} />
    </>
  );
}
