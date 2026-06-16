import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/admin";
import { listSubscribers, toSubscriberRow } from "@/lib/newsletter";
import { NewsletterManager } from "@/components/admin/NewsletterManager";

export const metadata: Metadata = { title: "Đăng ký nhận tin — Quản trị", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminNewsletterPage() {
  await requireAdminPage();
  const docs = await listSubscribers();
  const rows = docs.map(toSubscriberRow);
  return (
    <>
      <div className="qp-admin-head">
        <span className="qp-admin-head__eyebrow">Hệ thống</span>
        <h1 className="type-h1">Đăng ký nhận tin</h1>
        <p className="qp-admin-head__desc">Hiện có <b>{rows.length}</b> email đăng ký nhận tin qua form ở trang chủ và cuối bài viết. Có thể xuất CSV để gửi bản tin.</p>
      </div>
      <NewsletterManager initial={rows} />
    </>
  );
}
