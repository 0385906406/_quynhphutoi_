import Link from "next/link";
import { DailyIcon, type DailyIconName } from "./DailyIcon";

// Khung thẻ dùng chung cho các khối "Thông tin hôm nay": đầu thẻ (icon + tiêu đề + ghi chú) · nội dung · link xem thêm.
export function DailyCard({
  icon, title, meta, href, linkLabel = "Xem đầy đủ", children,
}: {
  icon: DailyIconName;
  title: string;
  meta?: string;
  href?: string;
  linkLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <article className="qp-daily-card">
      <header className="qp-daily-card__head">
        <span className="qp-daily-card__icon"><DailyIcon name={icon} /></span>
        <div className="qp-daily-card__titles">
          <h3 className="qp-daily-card__title">{title}</h3>
          {meta && <span className="qp-daily-card__meta">{meta}</span>}
        </div>
      </header>
      <div className="qp-daily-card__body">{children}</div>
      {href && (
        <Link className="qp-daily-card__link" href={href}>
          {linkLabel} <span aria-hidden>→</span>
        </Link>
      )}
    </article>
  );
}

export function DailyUnavailable({ what }: { what: string }) {
  return <p className="qp-daily-empty">Chưa lấy được {what}. Vui lòng thử lại sau ít phút.</p>;
}
