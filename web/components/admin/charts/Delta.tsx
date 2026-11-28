// Huy hiệu so sánh kỳ này với kỳ trước (▲ tăng / ▼ giảm / – không đổi).
export function Delta({ cur, prev, label = "so với kỳ trước", invert = false }: { cur: number; prev: number; label?: string; invert?: boolean }) {
  if (prev <= 0 && cur <= 0) return <span style={{ fontSize: 12, color: "var(--color-gray-muted)" }}>Chưa có dữ liệu {label}</span>;
  if (prev <= 0) return <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-teal-dark)" }}>Mới ▲ <span style={{ fontWeight: 500, color: "var(--color-gray-text)" }}>{label}</span></span>;
  const pct = Math.round(((cur - prev) / prev) * 100);
  const up = pct > 0, flat = pct === 0;
  const good = flat ? null : invert ? !up : up;
  const color = good === null ? "var(--color-gray-text)" : good ? "var(--color-teal-dark)" : "#C2410C";
  return (
    <span style={{ fontSize: 12, whiteSpace: "nowrap" }}>
      <b style={{ color, fontVariantNumeric: "tabular-nums" }}>{flat ? "–" : up ? "▲" : "▼"} {Math.abs(pct)}%</b>{" "}
      <span style={{ color: "var(--color-gray-text)" }}>{label}</span>
    </span>
  );
}
