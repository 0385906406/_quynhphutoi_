// Thống kê quan tâm của người dân (tổng hợp, ẩn danh): từ khoá tìm nhiều, từ khoá không có kết quả, chuyên mục được đọc nhiều.
import { BarList } from "@/components/admin/charts/BarList";
import { topSearchTerms, topReadCategories } from "@/lib/recommend";

export async function InterestPanel() {
  const [terms, cats] = await Promise.all([topSearchTerms(12), topReadCategories(6)]);
  const card = { cursor: "default" as const, gap: "var(--space-3)" };
  return (
    <div style={{ display: "grid", gap: "var(--space-4)", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", marginBottom: "var(--space-6)" }}>
      <section className="qp-admin-card" style={card}>
        <div className="qp-admin-card__label">Người dân hay tìm gì</div>
        <p className="qp-admin-card__desc">Từ khoá được tìm nhiều nhất — gợi ý chủ đề để viết bài.</p>
        <BarList items={terms.top.map((t) => ({ label: t.term, value: t.count }))} unit=" lượt" />
      </section>
      <section className="qp-admin-card" style={card}>
        <div className="qp-admin-card__label">Tìm mà chưa có bài</div>
        <p className="qp-admin-card__desc">Từ khoá không ra kết quả — người dân cần nhưng web chưa có.</p>
        <BarList items={terms.missing.map((t) => ({ label: t.term, value: t.count, color: "var(--color-warning, #d97706)" }))} unit=" lần" />
      </section>
      <section className="qp-admin-card" style={card}>
        <div className="qp-admin-card__label">Chuyên mục được quan tâm</div>
        <p className="qp-admin-card__desc">Tổng lượt đọc theo chuyên mục.</p>
        <BarList items={cats.map((c) => ({ label: `${c.label} (${c.posts} bài)`, value: c.value }))} unit=" lượt" />
      </section>
    </div>
  );
}
