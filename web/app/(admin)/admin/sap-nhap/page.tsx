import type { Metadata } from "next";
import { getPageSeoConfig } from "@/lib/page-seo";
import { ModuleTabs } from "@/components/admin/ModuleTabs";

export const metadata: Metadata = { title: "Sáp nhập 2025 — Quản trị", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminSapNhapPage() {
  const pageSeo = await getPageSeoConfig();
  return (
    <>
      <div className="qp-admin-head">
        <span className="qp-admin-head__eyebrow">Trang giới thiệu</span>
        <h1 className="type-h1">Sáp nhập 2025</h1>
        <p className="qp-admin-head__desc">Trang giải thích sáp nhập đơn vị hành chính 2025. Nội dung cố định trong mã nguồn — tại đây bạn tối ưu SEO cho trang.</p>
      </div>
      <ModuleTabs pageKey="/sap-nhap" pageLabel="Sáp nhập 2025" seoInitial={pageSeo["/sap-nhap"] ?? {}} />
    </>
  );
}
