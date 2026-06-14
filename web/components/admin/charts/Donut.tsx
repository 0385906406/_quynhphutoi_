// Biểu đồ tròn (donut) bằng SVG thuần + chú giải.
export type DonutItem = { label: string; value: number; color: string };

export function Donut({ items, size = 168, thickness = 24, centerLabel }: { items: DonutItem[]; size?: number; thickness?: number; centerLabel?: string }) {
  const total = items.reduce((s, i) => s + i.value, 0);
  const r = (size - thickness) / 2;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="qp-donut">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Biểu đồ tròn">
        <circle cx={c} cy={c} r={r} fill="none" stroke="var(--color-gray-border)" strokeWidth={thickness} />
        {total > 0 && items.map((it, i) => {
          const len = (it.value / total) * circ;
          const seg = (
            <circle key={i} cx={c} cy={c} r={r} fill="none" stroke={it.color} strokeWidth={thickness}
              strokeDasharray={`${len} ${circ - len}`} strokeDashoffset={-offset}
              transform={`rotate(-90 ${c} ${c})`} />
          );
          offset += len;
          return seg;
        })}
        <text x={c} y={c - 6} textAnchor="middle" className="qp-donut__num">{total.toLocaleString("vi-VN")}</text>
        <text x={c} y={c + 14} textAnchor="middle" className="qp-donut__cap">{centerLabel ?? "Tổng"}</text>
      </svg>
      <ul className="qp-chart-legend">
        {items.map((it, i) => (
          <li key={i}>
            <span className="qp-chart-legend__dot" style={{ background: it.color }} />
            <span className="qp-chart-legend__label">{it.label}</span>
            <b>{it.value.toLocaleString("vi-VN")}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}
