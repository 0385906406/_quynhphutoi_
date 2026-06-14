import type { Metadata } from "next";
import { listRelics, toRelicRow } from "@/lib/relics";
import { RelicsManager } from "@/components/admin/RelicsManager";

export const metadata: Metadata = { title: "Di tích — Quản trị", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminRelicsPage() {
  const docs = await listRelics({});
  const rows = docs.map(toRelicRow);
  return (
    <>
      <div className="qp-admin-head">
        <span className="qp-admin-head__eyebrow">Nội dung</span>
        <h1 className="type-h1">Di tích</h1>
        <p className="qp-admin-head__desc">Quản lý di tích lịch sử - văn hoá trên địa bàn huyện — thêm, sửa, xoá và ẩn/hiện.</p>
      </div>
      <RelicsManager initial={rows} />
    </>
  );
}
