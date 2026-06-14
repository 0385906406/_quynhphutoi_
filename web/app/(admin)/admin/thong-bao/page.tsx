import type { Metadata } from "next";
import { NotifyComposer } from "@/components/admin/NotifyComposer";

export const metadata: Metadata = { title: "Gửi thông báo — Quản trị", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function AdminNotifyPage() {
  return (
    <>
      <div className="qp-admin-head">
        <span className="qp-admin-head__eyebrow">Hệ thống</span>
        <h1 className="type-h1">Gửi thông báo</h1>
        <p className="qp-admin-head__desc">Gửi thông báo chung (broadcast) tới toàn bộ người dùng hoặc chỉ nhóm admin.</p>
      </div>
      <NotifyComposer />
    </>
  );
}
