// Cột 24 giờ trong ngày — biết khung giờ khách vào nhiều nhất. Giờ Việt Nam.
export function HourChart({ data, color = "var(--color-teal)" }: { data: { hour: number; n: number }[]; color?: string }) {
  const max = Math.max(1, ...data.map((d) => d.n));
  const peak = data.reduce((a, b) => (b.n > a.n ? b : a), data[0] ?? { hour: 0, n: 0 });
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 130 }} role="img" aria-label="Lượt xem theo giờ trong ngày">
        {data.map((d) => (
          <div key={d.hour} title={`${d.hour}h: ${d.n.toLocaleString("vi-VN")} lượt`} style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "flex-end", height: "100%" }}>
            <div style={{ width: "100%", height: `${Math.max(d.n ? 4 : 1, (d.n / max) * 100)}%`, borderRadius: "4px 4px 0 0", background: d.n && d.hour === peak.hour ? "var(--color-navy)" : color, opacity: d.n ? 1 : 0.25 }} />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--color-gray-text)", marginTop: 6 }}>
        {[0, 6, 12, 18, 23].map((h) => <span key={h}>{h}h</span>)}
      </div>
      {peak.n > 0 && <p className="type-body-small" style={{ margin: "10px 0 0", color: "var(--color-gray-text)" }}>Cao điểm: <b style={{ color: "var(--color-navy-deep)" }}>{peak.hour}h–{peak.hour + 1}h</b> ({peak.n.toLocaleString("vi-VN")} lượt)</p>}
    </div>
  );
}
