import Link from "next/link";
import { Delta } from "@/components/admin/charts/Delta";
import { Sparkline } from "@/components/admin/charts/Sparkline";
import type { trafficOverview } from "@/lib/visits";

type Overview = Awaited<ReturnType<typeof trafficOverview>>;
const n = (v: number) => v.toLocaleString("vi-VN");

function Kpi({ label, value, delta, spark, color }: { label: string; value: number; delta: React.ReactNode; spark: number[]; color: string }) {
  return (
    <div className="qp-chart-card" style={{ borderTop: `3px solid ${color}`, display: "grid", gap: 6 }}>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--color-gray-text)" }}>{label}</span>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 10 }}>
        <b style={{ fontSize: 30, lineHeight: 1, color: "var(--color-navy-deep)", fontVariantNumeric: "tabular-nums" }}>{n(value)}</b>
        <Sparkline values={spark} color={color} width={96} height={34} />
      </div>
      {delta}
    </div>
  );
}

// Khối "Lưu lượng truy cập" trên Bảng điều khiển: hôm nay vs hôm qua + bài đọc nhiều hôm nay.
export function TrafficPanel({ data }: { data: Overview }) {
  const { today, yesterday, series, live, topToday, readsToday, week, prevWeek } = data;
  const max = Math.max(1, ...topToday.map((a) => a.views));
  return (
    <section style={{ marginBottom: "var(--space-6)" }} aria-label="Lưu lượng truy cập">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: "var(--space-3)" }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--color-navy-deep)" }}>Lưu lượng truy cập</h2>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
          <span title="Số IP có truy cập trong 5 phút gần nhất" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 999, background: "var(--color-teal-pale)", color: "var(--color-teal-dark)", fontWeight: 700, fontSize: 13 }}>
            <span style={{ width: 8, height: 8, borderRadius: 99, background: "var(--color-teal)", boxShadow: "0 0 0 3px rgba(0,169,143,.25)" }} />
            {n(live)} đang online
          </span>
          <Link href="/admin/thong-ke" style={{ fontSize: 13, fontWeight: 700, color: "var(--color-teal-dark)" }}>Xem chi tiết →</Link>
        </span>
      </div>
      <div style={{ display: "grid", gap: "var(--space-4)", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", marginBottom: "var(--space-4)" }}>
        <Kpi label="Lượt xem trang hôm nay" value={today.views} color="#00A98F" spark={series.map((d) => d.views)} delta={<Delta cur={today.views} prev={yesterday.views} label="so với hôm qua" />} />
        <Kpi label="Người truy cập hôm nay (IP)" value={today.ips} color="#6366F1" spark={series.map((d) => d.ips)} delta={<Delta cur={today.ips} prev={yesterday.ips} label="so với hôm qua" />} />
        <Kpi label="Lượt xem 7 ngày qua" value={week} color="#F59E0B" spark={series.slice(7).map((d) => d.views)} delta={<Delta cur={week} prev={prevWeek} label="so với 7 ngày trước" />} />
        <Kpi label="Lượt đọc bài hôm nay" value={readsToday} color="#0F4C81" spark={[]} delta={<span style={{ fontSize: 12, color: "var(--color-gray-text)" }}>{topToday.length} bài được đọc</span>} />
      </div>
      <div className="qp-chart-card">
        <div className="qp-chart-card__head">
          <span className="qp-chart-card__title">Bài đọc nhiều hôm nay</span>
          <Link href="/admin/thong-ke" className="qp-chart-card__hint" style={{ textDecoration: "underline" }}>Theo tháng, theo ngày →</Link>
        </div>
        {topToday.length === 0 ? (
          <p className="type-body-small text-muted" style={{ margin: 0 }}>Hôm nay chưa có lượt đọc bài nào.</p>
        ) : (
          <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 12 }}>
            {topToday.map((a, i) => (
              <li key={a.slug} style={{ display: "grid", gridTemplateColumns: "28px 1fr auto", alignItems: "center", gap: 12 }}>
                <span style={{ width: 28, height: 28, borderRadius: 8, display: "grid", placeItems: "center", fontWeight: 800, fontSize: 13, background: i === 0 ? "var(--color-teal)" : "var(--color-navy-pale)", color: i === 0 ? "#fff" : "var(--color-navy)" }}>{i + 1}</span>
                <span style={{ minWidth: 0 }}>
                  <Link href={`/tin-tuc/${a.slug}`} target="_blank" style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.35, color: "var(--color-navy-deep)", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{a.title}</Link>
                  <span style={{ display: "block", height: 5, borderRadius: 99, background: "var(--color-navy-pale)", marginTop: 6 }}>
                    <span style={{ display: "block", height: "100%", width: `${Math.max(4, (a.views / max) * 100)}%`, borderRadius: 99, background: "var(--color-teal)" }} />
                  </span>
                </span>
                <b style={{ fontSize: 14, fontVariantNumeric: "tabular-nums", color: "var(--color-navy)" }}>{n(a.views)} <span style={{ fontWeight: 500, fontSize: 12, color: "var(--color-gray-text)" }}>lượt</span></b>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
