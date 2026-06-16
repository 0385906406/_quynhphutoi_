import type { Metadata } from "next";
import { listAllArticles, toArticleRow } from "@/lib/articles";
import { externalNewsConfigured } from "@/lib/external-news";
import { ArticlesAdmin } from "@/components/admin/ArticlesAdmin";

export const metadata: Metadata = { title: "Tin tức — Quản trị", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminArticlesPage() {
  const [docs, externalEnabled] = await Promise.all([listAllArticles(), externalNewsConfigured()]);
  const rows = docs.map(toArticleRow);
  return (
    <>
      <div className="qp-admin-head">
        <span className="qp-admin-head__eyebrow">Nội dung</span>
        <h1 className="type-h1">Tin tức</h1>
        <p className="qp-admin-head__desc">Soạn, sửa, xuất bản và gỡ bài viết. Bài ở trạng thái “Đã xuất bản” sẽ hiển thị công khai tại trang Tin tức. Bố cục trang Tin tức công khai cấu hình ở “Quản lý trang”.</p>
      </div>
      <ArticlesAdmin rows={rows} externalEnabled={externalEnabled} />
    </>
  );
}
