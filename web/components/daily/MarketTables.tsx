import { fmtVnd, type GoldRow, type FxRow } from "@/lib/daily/markets";

export function GoldTable({ rows }: { rows: GoldRow[] }) {
  return (
    <table className="qp-price-table">
      <thead>
        <tr><th scope="col">Loại vàng</th><th scope="col">Mua vào</th><th scope="col">Bán ra</th></tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.code}>
            <th scope="row">{r.name}</th>
            <td>{fmtVnd(r.buy)}</td>
            <td>{fmtVnd(r.sell)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function FxTable({ rows, showTransfer = false }: { rows: FxRow[]; showTransfer?: boolean }) {
  return (
    <table className="qp-price-table">
      <thead>
        <tr>
          <th scope="col">Ngoại tệ</th>
          <th scope="col">Mua tiền mặt</th>
          {showTransfer && <th scope="col">Mua chuyển khoản</th>}
          <th scope="col">Bán ra</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.code}>
            <th scope="row"><b>{r.code}</b>{" "}<span className="qp-price-table__sub">{r.name}</span></th>
            <td>{fmtVnd(r.buy)}</td>
            {showTransfer && <td>{fmtVnd(r.transfer)}</td>}
            <td>{fmtVnd(r.sell)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
