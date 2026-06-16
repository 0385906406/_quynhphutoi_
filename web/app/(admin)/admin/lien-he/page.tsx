import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/admin";
import { listContacts, toContactRow } from "@/lib/contact";
import { ContactManager } from "@/components/admin/ContactManager";
import { getPageSeoConfig } from "@/lib/page-seo";
import { ModuleTabs } from "@/components/admin/ModuleTabs";

export const metadata: Metadata = { title: "Liên hệ / Phản ánh — Quản trị", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminContactPage() {
  await requireAdminPage();
  const [docs, pageSeo] = await Promise.all([listContacts(), getPageSeoConfig()]);
  const rows = docs.map(toContactRow);
  return (
    <>
      <div className="qp-admin-head">
        <span className="qp-admin-head__eyebrow">Hệ thống</span>
        <h1 className="type-h1">Liên hệ / Phản ánh</h1>
        <p className="qp-admin-head__desc">Tin nhắn người dân gửi qua trang Liên hệ — xem chi tiết, đánh dấu đã xử lý, trả lời qua email hoặc xoá.</p>
      </div>
      <ModuleTabs pageKey="/lien-he" pageLabel="Liên hệ" listLabel="Phản ánh đã nhận" seoInitial={pageSeo["/lien-he"] ?? {}}>
        <ContactManager initial={rows} />
      </ModuleTabs>
    </>
  );
}
