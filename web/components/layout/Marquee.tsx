import { TICKER } from "@/lib/nav";

// Server component — track lặp 2 lần để CSS animation chạy loop liền mạch.
export function Marquee() {
  const items = [...TICKER, ...TICKER];
  return (
    <div className="qp-marquee" aria-label="Tin cập nhật mới">
      <div className="container-wide qp-marquee__inner">
        <span className="qp-marquee__label">Cập nhật mới</span>
        <div className="qp-marquee__viewport">
          <div className="qp-marquee__track">
            {items.map((t, i) => (
              <span className="qp-marquee__item" key={i} aria-hidden={i >= TICKER.length}>
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
