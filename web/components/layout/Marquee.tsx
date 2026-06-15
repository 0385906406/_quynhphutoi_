import { listArticles } from "@/lib/articles";

// Server component — dải "Cập nhật mới" chạy ngang, lấy tiêu đề các bài viết mới
// xuất bản (DB). Track lặp 2 lần để CSS animation chạy loop liền mạch.
// Chưa có bài viết nào → ẩn hẳn dải (không hiển thị dữ liệu ảo).
export async function Marquee() {
  const docs = await listArticles({ status: "published", limit: 8 }).catch(() => []);
  if (docs.length === 0) return null;

  const titles = docs.map((d) => d.title);
  const items = [...titles, ...titles];
  return (
    <div className="qp-marquee" aria-label="Tin cập nhật mới">
      <div className="container-wide qp-marquee__inner">
        <span className="qp-marquee__label">Cập nhật mới</span>
        <div className="qp-marquee__viewport">
          <div className="qp-marquee__track">
            {items.map((t, i) => (
              <span className="qp-marquee__item" key={i} aria-hidden={i >= titles.length}>
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
