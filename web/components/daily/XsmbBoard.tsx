import { lotoByHead, type XsmbDraw } from "@/lib/daily/lottery";

// Bảng kết quả XSMB kiểu truyền thống: ĐB (đỏ, to) → G1 … G7.
export function XsmbBoard({ draw, caption }: { draw: XsmbDraw; caption?: string }) {
  return (
    <table className="qp-xsmb">
      {caption && <caption className="qp-xsmb__caption">{caption}</caption>}
      <tbody>
        <tr className="qp-xsmb__row is-special">
          <th scope="row">ĐB</th>
          <td><span className="qp-xsmb__num">{draw.special}</span></td>
        </tr>
        {draw.prizes.map((p) => (
          <tr className="qp-xsmb__row" key={p.label}>
            <th scope="row">{p.label}</th>
            <td>
              <div className={`qp-xsmb__nums is-${p.numbers.length}`}>
                {p.numbers.map((n, i) => <span className="qp-xsmb__num" key={i}>{n}</span>)}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Bảng lô tô theo đầu số (0–9): mỗi dòng liệt kê các đuôi về trong kỳ.
export function LotoTable({ draw }: { draw: XsmbDraw }) {
  const heads = lotoByHead(draw);
  return (
    <table className="qp-loto">
      <thead>
        <tr><th scope="col">Đầu</th><th scope="col">Lô tô</th></tr>
      </thead>
      <tbody>
        {heads.map((tails, h) => (
          <tr key={h}>
            <th scope="row">{h}</th>
            <td>{tails.length ? tails.map((t) => `${h}${t}`).join(", ") : "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
