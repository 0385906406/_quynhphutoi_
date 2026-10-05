// Chèn structured data schema.org vào <script type="application/ld+json">.
// Server component thuần — dùng ở mọi trang chi tiết + trang chủ.

// JSON.stringify KHÔNG escape "</script>" → dữ liệu người dùng (tiêu đề, mô tả) có thể
// thoát khỏi thẻ script (XSS). Thay "<" bằng < — vẫn là JSON hợp lệ cho Google.
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      // Mảng → chèn nhiều schema trong 1 thẻ.
      dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }}
    />
  );
}
