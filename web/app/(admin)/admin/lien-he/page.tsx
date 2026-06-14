import type { Metadata } from "next";
import { listContacts, toContactRow } from "@/lib/contact";
import { ContactManager } from "@/components/admin/ContactManager";

export const metadata: Metadata = { title: "Liên hệ / Phản ánh — Quản trị", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminContactPage() {
  const docs = await listContacts();
  const rows = docs.map(toContactRow);
  return (
    <>
      <div className="qp-admin-head">
        <span className="qp-admin-head__eyebrow">Hệ thống</span>
        <h1 className="type-h1">Liên hệ / Phản ánh</h1>
        <p className="qp-admin-head__desc">Tin nhắn người dân gửi qua trang Liên hệ — xem chi tiết, đánh dấu đã xử lý, trả lời qua email hoặc xoá.</p>
      </div>
      <ContactManager initial={rows} />
    </>
  );
}
