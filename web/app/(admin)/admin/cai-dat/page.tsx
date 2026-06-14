import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { SettingsManager } from "@/components/admin/SettingsManager";

export const metadata: Metadata = { title: "Cài đặt — Quản trị", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getSettings();
  return (
    <>
      <div className="qp-admin-head">
        <span className="qp-admin-head__eyebrow">Hệ thống</span>
        <h1 className="type-h1">Cài đặt</h1>
        <p className="qp-admin-head__desc">Cấu hình chung của cổng — chỉnh tại đây và áp dụng ngay, không cần khởi động lại.</p>
      </div>
      <SettingsManager initial={settings} />
    </>
  );
}
