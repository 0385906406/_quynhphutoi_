// Đường xu hướng mini (SVG) cho thẻ KPI.
export function Sparkline({ values, color = "var(--color-teal)", height = 36, width = 120 }: { values: number[]; color?: string; height?: number; width?: number }) {
  if (values.length < 2) return null;
  const max = Math.max(1, ...values), pad = 3;
  const x = (i: number) => pad + (i * (width - pad * 2)) / (values.length - 1);
  const y = (v: number) => pad + (height - pad * 2) * (1 - v / max);
  const line = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const last = values.length - 1;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true" style={{ display: "block", maxWidth: "100%" }}>
      <path d={`${line} L ${x(last)} ${height} L ${x(0)} ${height} Z`} fill={color} opacity="0.12" />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(last)} cy={y(values[last])} r="3" fill={color} />
    </svg>
  );
}
