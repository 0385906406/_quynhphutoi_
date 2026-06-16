import type { Metadata } from "next";
import { getPageSeoConfig } from "@/lib/page-seo";
import { ModuleTabs } from "@/components/admin/ModuleTabs";

export const metadata: Metadata = { title: "Tổng quan — Quản trị", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminTongQuanPage() {
  const pageSeo = await getPageSeoConfig();
  return (
    <>
      <div className="qp-admin-head">
        <span className="qp-admin-head__eyebrow">Trang giới thiệu</span>
        <h1 className="type-h1">Tổng quan</h1>
        <p className="qp-admin-head__desc">Trang giới thiệu xã Quỳnh Phụ. Nội dung cố định trong mã nguồn — tại đây bạn tối ưu SEO cho trang.</p>
      </div>
      <ModuleTabs pageKey="/tong-quan" pageLabel="Tổng quan" seoInitial={pageSeo["/tong-quan"] ?? {}} />
    </>
  );
}
