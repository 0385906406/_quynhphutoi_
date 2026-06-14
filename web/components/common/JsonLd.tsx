// Chèn structured data schema.org vào <script type="application/ld+json">.
// Server component thuần — dùng ở mọi trang chi tiết + trang chủ.
export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      // Mảng → chèn nhiều schema trong 1 thẻ. JSON.stringify đã escape an toàn cho ld+json.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
