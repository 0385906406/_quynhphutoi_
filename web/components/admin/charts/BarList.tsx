// Biểu đồ thanh ngang (CSS thuần) — danh sách label · thanh · giá trị.
export type BarItem = { label: string; value: number; color?: string };

export function BarList({ items, unit = "" }: { items: BarItem[]; unit?: string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (items.length === 0) return <p className="type-body-small text-muted">Chưa có dữ liệu.</p>;
  return (
    <div className="qp-barlist">
      {items.map((it, i) => (
        <div className="qp-barlist__row" key={i}>
          <span className="qp-barlist__label" title={it.label}>{it.label}</span>
          <span className="qp-barlist__track">
            <span className="qp-barlist__fill" style={{ width: `${Math.round((it.value / max) * 100)}%`, background: it.color ?? "var(--color-teal)" }} />
          </span>
          <span className="qp-barlist__val">{it.value.toLocaleString("vi-VN")}{unit}</span>
        </div>
      ))}
    </div>
  );
}
