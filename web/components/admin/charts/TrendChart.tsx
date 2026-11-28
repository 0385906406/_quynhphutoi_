import { useId } from "react";

// Biểu đồ vùng + đường (SVG thuần) — xu hướng theo ngày. Có tooltip khi rê chuột (title), cao điểm được đánh dấu.
export function TrendChart({ points, height = 220, color = "var(--color-teal)", unit = "" }: { points: { date: string; total: number }[]; height?: number; color?: string; unit?: string }) {
  const gid = useId().replace(/:/g, "");
  const w = 760, padL = 40, padR = 14, padT = 16, padB = 28;
  const n = points.length;
  const max = Math.max(1, ...points.map((p) => p.total));
  const innerW = w - padL - padR, innerH = height - padT - padB;
  const x = (i: number) => padL + (n <= 1 ? innerW / 2 : (i * innerW) / (n - 1));
  const y = (v: number) => padT + innerH * (1 - v / max);

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(p.total).toFixed(1)}`).join(" ");
  const area = `${line} L ${x(n - 1).toFixed(1)} ${(padT + innerH).toFixed(1)} L ${x(0).toFixed(1)} ${(padT + innerH).toFixed(1)} Z`;
  const gy = [0, 0.5, 1].map((f) => ({ v: Math.round(max * f), yy: y(max * f) }));
  const step = Math.max(1, Math.ceil(n / 7));
  const dm = (iso: string) => { const d = new Date(iso); return `${d.getDate()}/${d.getMonth() + 1}`; };
  const peakI = points.reduce((b, p, i) => (p.total > points[b].total ? i : b), 0);
  const fmt = (v: number) => v.toLocaleString("vi-VN");

  return (
    <svg className="qp-trend" viewBox={`0 0 ${w} ${height}`} role="img" aria-label="Biểu đồ xu hướng theo ngày">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {gy.map((g, i) => (
        <g key={i}>
          <line x1={padL} y1={g.yy} x2={w - padR} y2={g.yy} stroke="var(--color-gray-border)" strokeWidth="1" strokeDasharray="3 4" />
          <text x={padL - 6} y={g.yy + 3} textAnchor="end" className="qp-trend__axis">{fmt(g.v)}</text>
        </g>
      ))}
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(p.total)} r={n <= 31 ? 10 : 6} fill="transparent"><title>{`${dm(p.date)}: ${fmt(p.total)}${unit}`}</title></circle>
          {(i % step === 0 || i === n - 1) && (
            <>
              <circle cx={x(i)} cy={y(p.total)} r="3" fill="var(--surface, #fff)" stroke={color} strokeWidth="2" pointerEvents="none" />
              <text x={x(i)} y={height - 8} textAnchor="middle" className="qp-trend__axis">{dm(p.date)}</text>
            </>
          )}
        </g>
      ))}
      {max > 1 && n > 2 && (
        <g pointerEvents="none">
          <circle cx={x(peakI)} cy={y(points[peakI].total)} r="5" fill={color} stroke="var(--surface, #fff)" strokeWidth="2" />
          <text x={Math.min(Math.max(x(peakI), padL + 20), w - padR - 20)} y={Math.max(y(points[peakI].total) - 10, 10)} textAnchor="middle" className="qp-trend__axis" style={{ fontWeight: 700 }}>{fmt(points[peakI].total)}</text>
        </g>
      )}
    </svg>
  );
}
