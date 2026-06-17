import { pageMetadata } from "@/lib/page-seo";
import Link from "next/link";
import {
  RULES_TITLE, RULES_INTRO, RULES_ITEMS, RULES_NOTE, RULES_OUTRO, RULES_SIGNATURE,
} from "@/lib/rules";

export async function generateMetadata() {
  return pageMetadata({
    key: "/noi-quy", path: "/noi-quy",
    title: "Nội quy & Quy định đăng bài — Quỳnh Phụ Tôi",
    description:
      "Quy định đăng bài và nội quy cộng đồng trên Cổng thông tin Quỳnh Phụ: những nội dung không được phê duyệt nhằm bảo đảm an toàn, chất lượng và quyền riêng tư của thành viên.",
  });
}

export default function NoiQuyPage() {
  return (
    <>
      <section className="qp-pagehero" aria-labelledby="nq-title">
        <span className="qp-pagehero__blob is-teal" aria-hidden />
        <span className="qp-pagehero__blob is-indigo" aria-hidden />
        <span className="qp-pagehero__art" aria-hidden />
        <div className="container-wide qp-pagehero__inner">
          <nav className="qp-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Trang chủ</Link>
            <span className="qp-breadcrumb__sep">›</span>
            <span className="qp-breadcrumb__current">Nội quy</span>
          </nav>
          <span className="type-tag qp-pagehero__eyebrow">Cộng đồng</span>
          <h1 id="nq-title" className="type-h1">{RULES_TITLE}</h1>
          <p className="qp-pagehero__lead">{RULES_INTRO}</p>
          <span className="qp-pagehero__line" aria-hidden />
        </div>
      </section>

      <section className="qp-newsmain">
        <div className="container-wide">
          <div className="qp-prose">
            <ol>
              {RULES_ITEMS.map((item, i) => <li key={i}>{item}</li>)}
            </ol>
            <blockquote>{RULES_NOTE}</blockquote>
            <p>{RULES_OUTRO}</p>
            <p><b>{RULES_SIGNATURE}</b></p>
          </div>
        </div>
      </section>
    </>
  );
}
