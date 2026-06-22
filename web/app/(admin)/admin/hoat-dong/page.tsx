import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getModulePerm } from "@/lib/admin-guard";
import { ActivityLogViewer } from "@/components/admin/ActivityLogViewer";
import { AnomalyAlert } from "@/components/admin/AnomalyAlert";

export const metadata: Metadata = { title: "Nhật ký hoạt động — Quản trị", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ActivityLogPage() {
  const perm = await getModulePerm("hoat-dong");
  if (!perm || perm === "none") redirect("/admin/403");
  return (
    <>
      <div className="qp-admin-head">
        <span className="qp-admin-head__eyebrow">Hệ thống</span>
        <h1 className="type-h1">Nhật ký hoạt động</h1>
        <p className="qp-admin-head__desc">
          Lịch sử toàn bộ thao tác của người dùng và ban quản trị: đăng nhập, gửi bài, duyệt nội dung, thay đổi vai trò…
        </p>
      </div>
      <AnomalyAlert />
      <ActivityLogViewer />
    </>
  );
}
