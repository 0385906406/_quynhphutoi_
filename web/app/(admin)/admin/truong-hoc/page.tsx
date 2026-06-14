import type { Metadata } from "next";
import { listSchools, toSchoolRow } from "@/lib/schools";
import { SchoolsManager } from "@/components/admin/SchoolsManager";

export const metadata: Metadata = { title: "Trường học — Quản trị", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminSchoolsPage() {
  const docs = await listSchools({});
  const rows = docs.map(toSchoolRow);
  return (
    <>
      <div className="qp-admin-head">
        <span className="qp-admin-head__eyebrow">Nội dung</span>
        <h1 className="type-h1">Trường học</h1>
        <p className="qp-admin-head__desc">Quản lý danh bạ trường học trên địa bàn huyện — thêm, sửa, xoá và ẩn/hiện.</p>
      </div>
      <SchoolsManager initial={rows} />
    </>
  );
}
