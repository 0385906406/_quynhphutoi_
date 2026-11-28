// Biểu đồ thanh ngang (CSS thuần) — tên (cho xuống dòng) + giá trị/% ở trên, thanh full-width ở dưới.
export type BarItem = { label: string; value: number; color?: string };

export function BarList({ items, unit = "" }: { items: BarItem[]; unit?: string }) {
  const max   = Math.max(1, ...items.map((i) => i.value));
  const total = items.reduce((s, i) => s + i.value, 0);
  if (items.length === 0) return <p className="type-body-small text-muted">Chưa có dữ liệu.</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {items.map((it, i) => {
        const fill = Math.round((it.value / max) * 100);
        const pct  = total > 0 ? Math.round((it.value / total) * 100) : 0;
        return (
          <div key={i} style={{ display: "grid", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <span
                title={it.label}
                style={{ flex: 1, minWidth: 0, fontSize: 14, lineHeight: 1.4, color: "var(--color-navy-deep)", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflowWrap: "anywhere" }}
              >
                {it.label}
              </span>
              <span style={{ flexShrink: 0, display: "flex", alignItems: "baseline", gap: 6, whiteSpace: "nowrap" }}>
                <b style={{ fontSize: 14, fontWeight: 700, color: "var(--color-navy)", fontVariantNumeric: "tabular-nums" }}>
                  {it.value.toLocaleString("vi-VN")}{unit}
                </b>
                <span style={{ fontSize: 12, color: "var(--color-gray-text)", minWidth: 30, textAlign: "right" }}>{pct}%</span>
              </span>
            </div>
            <span style={{ height: 8, background: "var(--color-navy-pale)", borderRadius: 999, overflow: "hidden", display: "block" }}>
              <span style={{ display: "block", height: "100%", width: `${fill}%`, background: it.color ?? "var(--color-teal)", borderRadius: 999, minWidth: it.value > 0 ? 4 : 0 }} />
            </span>
          </div>
        );
      })}
    </div>
  );
}
