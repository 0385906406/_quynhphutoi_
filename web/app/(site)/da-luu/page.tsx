import type { Metadata } from "next";
import Link from "next/link";
import { SavedList } from "@/components/news/SavedList";

export const metadata: Metadata = { title: "Bài đã lưu", robots: { index: false, follow: false } };

export default function SavedPage() {
  return (
    <section className="qp-newsmain">
      <div className="container-wide">
        <nav className="qp-breadcrumb" aria-label="Breadcrumb" style={{ marginBottom: "var(--space-4)" }}>
          <Link href="/">Trang chủ</Link><span className="qp-breadcrumb__sep">›</span><span className="qp-breadcrumb__current">Bài đã lưu</span>
        </nav>
        <h1 className="type-h1">Bài đã lưu</h1>
        <p className="type-body-small text-muted" style={{ margin: "6px 0 var(--space-6)" }}>Các bài bạn lưu để đọc sau — được ghi nhớ trên máy này, không cần đăng nhập.</p>
        <SavedList />
      </div>
    </section>
  );
}
