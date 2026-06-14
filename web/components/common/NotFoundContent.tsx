import Link from "next/link";

// Nội dung trang 404 dùng chung (giản dị).
export function NotFoundContent() {
  return (
    <section className="qp-404">
      <span className="qp-404__code" aria-hidden>404</span>
      <h1 className="type-h1">Không tìm thấy trang</h1>
      <p className="qp-404__lead">Trang bạn truy cập không tồn tại hoặc đã được di chuyển. Hãy quay về trang chủ hoặc thử tìm kiếm.</p>
      <div className="qp-404__actions">
        <Link href="/" className="qp-btn-primary">← Về trang chủ</Link>
        <Link href="/tim-kiem" className="qp-btn-outline">Tìm kiếm</Link>
      </div>
    </section>
  );
}
