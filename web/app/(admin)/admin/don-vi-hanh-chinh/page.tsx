import type { Metadata } from "next";
import { listAdminUnits, toAdminUnitRow } from "@/lib/admin-units";
import { AdminUnitManager } from "@/components/admin/AdminUnitManager";

export const metadata: Metadata = { title: "Đơn vị hành chính — Quản trị", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminUnitsPage() {
  const docs = await listAdminUnits();
  const rows = docs.map(toAdminUnitRow);
  return (
    <>
      <div className="qp-admin-head">
        <span className="qp-admin-head__eyebrow">Danh mục & dữ liệu</span>
        <h1 className="type-h1">Đơn vị hành chính</h1>
        <p className="qp-admin-head__desc">Bảng xã / thị trấn (cũ) và ánh xạ sang xã mới sau sáp nhập 1/7/2025. Các phân hệ khác tham chiếu xã qua đây.</p>
      </div>
      <AdminUnitManager initial={rows} />
    </>
  );
}
