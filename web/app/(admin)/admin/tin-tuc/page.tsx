import type { Metadata } from "next";
import { listAllArticles, toArticleRow } from "@/lib/articles";
import { ArticleManager } from "@/components/admin/ArticleManager";

export const metadata: Metadata = { title: "Tin tức — Quản trị", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminArticlesPage() {
  const docs = await listAllArticles();
  const rows = docs.map(toArticleRow);
  return (
    <>
      <div className="qp-admin-head">
        <span className="qp-admin-head__eyebrow">Nội dung</span>
        <h1 className="type-h1">Tin tức</h1>
        <p className="qp-admin-head__desc">Soạn, sửa, xuất bản và gỡ bài viết. Bài ở trạng thái “Đã xuất bản” sẽ hiển thị công khai tại trang Tin tức.</p>
      </div>
      <ArticleManager initial={rows} />
    </>
  );
}
