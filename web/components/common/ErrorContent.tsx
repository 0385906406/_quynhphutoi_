"use client";

import Link from "next/link";

// Nội dung trang lỗi 500 dùng chung (giản dị) — kèm nút thử lại.
export function ErrorContent({ reset }: { reset?: () => void }) {
  return (
    <section className="qp-404">
      <span className="qp-404__code" aria-hidden>500</span>
      <h1 className="type-h1">Đã có lỗi xảy ra</h1>
      <p className="qp-404__lead">Hệ thống gặp sự cố khi xử lý yêu cầu của bạn. Vui lòng thử lại sau giây lát hoặc quay về trang chủ.</p>
      <div className="qp-404__actions">
        {reset && <button type="button" className="qp-btn-primary" onClick={reset}>↻ Thử lại</button>}
        <Link href="/" className="qp-btn-outline">Về trang chủ</Link>
      </div>
    </section>
  );
}
