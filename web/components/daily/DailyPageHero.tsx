import Link from "next/link";

// Hero trang con — bám đúng markup .qp-pagehero của các trang hiện có (vd /thoi-tiet).
export function DailyPageHero({ id, crumb, eyebrow, title, lead }: {
  id: string; crumb: string; eyebrow: string; title: string; lead: string;
}) {
  return (
    <section className="qp-pagehero" aria-labelledby={id}>
      <span className="qp-pagehero__blob is-teal" aria-hidden />
      <span className="qp-pagehero__blob is-indigo" aria-hidden />
      <span className="qp-pagehero__blob is-yellow" aria-hidden />
      <span className="qp-pagehero__art" aria-hidden />
      <div className="container-wide qp-pagehero__inner">
        <nav className="qp-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Trang chủ</Link>
          <span className="qp-breadcrumb__sep">›</span>
          <span className="qp-breadcrumb__current">{crumb}</span>
        </nav>
        <span className="type-tag qp-pagehero__eyebrow">{eyebrow}</span>
        <h1 id={id} className="type-h1">{title}</h1>
        <p className="qp-pagehero__lead">{lead}</p>
        <span className="qp-pagehero__line" aria-hidden />
      </div>
    </section>
  );
}

export function DailyError({ what }: { what: string }) {
  return (
    <div className="qp-alert is-error" role="alert">
      <svg className="qp-alert__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>
      <div className="qp-alert__body"><strong>Không lấy được {what}.</strong> Vui lòng thử lại sau ít phút.</div>
    </div>
  );
}
