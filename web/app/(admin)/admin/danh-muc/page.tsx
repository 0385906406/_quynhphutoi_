import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/admin";
import { CategoryManager } from "@/components/admin/CategoryManager";

export const metadata: Metadata = { title: "Danh mục — Quản trị", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  await requireAdminPage();
  return (
    <>
      <div className="qp-admin-head">
        <span className="qp-admin-head__eyebrow">Danh mục & dữ liệu</span>
        <h1 className="type-h1">Danh mục</h1>
        <p className="qp-admin-head__desc">Quản lý cây danh mục phân cấp cho từng phân hệ (module): thêm danh mục con, sửa, ẩn/hiện, xoá.</p>
      </div>
      <CategoryManager />
    </>
  );
}
