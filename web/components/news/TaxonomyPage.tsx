// Trang liệt kê bài theo chuyên mục / thẻ / tác giả — render hoàn toàn ở máy chủ (Google đọc được), phân trang bằng liên kết thật.
import Link from "next/link";
import { NewsCard } from "@/components/news/NewsCard";
import { JsonLd } from "@/components/common/JsonLd";
import { jsonLdBreadcrumb, SITE } from "@/lib/seo";
import type { Article } from "@/lib/news";
import type { Term, TaxoKind } from "@/lib/news-taxonomy";

const KIND_LABEL: Record<TaxoKind, string> = { category: "Chuyên mục", tag: "Chủ đề", author: "Tác giả" };

function pageHref(base: string, p: number) { return p <= 1 ? base : `${base}?trang=${p}`; }

function Pager({ base, page, totalPages }: { base: string; page: number; totalPages: number }) {
  if (totalPages <= 1) return null;
  const nums = new Set([1, totalPages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= totalPages));
  const list = [...nums].sort((a, b) => a - b);
  return (
    <nav className="qp-pagination" aria-label="Phân trang">
      {page > 1 && <Link href={pageHref(base, page - 1)} rel="prev">← Trước</Link>}
      {list.map((n, i) => (
        <span key={n} style={{ display: "contents" }}>
          {i > 0 && n - list[i - 1] > 1 && <span className="qp-pagination__dots" aria-hidden>…</span>}
          <Link href={pageHref(base, n)} className={n === page ? "is-active" : undefined} aria-current={n === page ? "page" : undefined}>{n}</Link>
        </span>
      ))}
      {page < totalPages && <Link href={pageHref(base, page + 1)} rel="next">Sau →</Link>}
    </nav>
  );
}

export function TaxonomyPage({ kind, term, items, page, totalPages, total, base, chips, chipBase, intro }: {
  kind: TaxoKind; term: Term; items: Article[]; page: number; totalPages: number; total: number; base: string;
  chips?: Term[]; chipBase?: string; intro?: { title?: string; bio?: string };
}) {
  const heading = kind === "tag" ? `#${term.name}` : term.name;
  return (
    <>
      <JsonLd data={[
        jsonLdBreadcrumb([{ name: "Trang chủ", path: "/" }, { name: "Tin tức", path: "/tin-tuc" }, { name: heading, path: base }]),
        {
          "@context": "https://schema.org", "@type": kind === "author" ? "ProfilePage" : "CollectionPage",
          name: heading, url: `${SITE.url}${base}`, inLanguage: "vi-VN",
          ...(kind === "author" ? { mainEntity: { "@type": "Person", name: term.name, ...(intro?.title ? { jobTitle: intro.title } : {}) } } : {}),
        },
      ]} />
      <section className="qp-pagehero" aria-labelledby="tx-title">
        <span className="qp-pagehero__blob is-teal" aria-hidden />
        <span className="qp-pagehero__blob is-indigo" aria-hidden />
        <span className="qp-pagehero__blob is-yellow" aria-hidden />
        <span className="qp-pagehero__art" aria-hidden />
        <div className="container-wide qp-pagehero__inner">
          <nav className="qp-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Trang chủ</Link><span className="qp-breadcrumb__sep">›</span>
            <Link href="/tin-tuc">Tin tức</Link><span className="qp-breadcrumb__sep">›</span>
            <span className="qp-breadcrumb__current">{heading}</span>
          </nav>
          <span className="type-tag qp-pagehero__eyebrow">{KIND_LABEL[kind]}</span>
          <h1 id="tx-title" className="type-h1">{heading}</h1>
          <p className="qp-pagehero__lead">
            {kind === "author" && intro?.title ? <>{intro.title} · </> : null}
            {total} bài viết{page > 1 ? ` · trang ${page}/${totalPages}` : ""}
          </p>
        </div>
      </section>

      <section className="qp-newsmain">
        <div className="container-wide">
          {chips && chips.length > 1 && chipBase && (
            <nav className="qp-foryou__chips" aria-label={kind === "category" ? "Các chuyên mục" : "Chủ đề khác"} style={{ marginBottom: "var(--space-6)" }}>
              <Link href="/tin-tuc" className="qp-foryou__chip">Tất cả</Link>
              {chips.map((c) => (
                <Link key={c.slug} href={`${chipBase}/${c.slug}`} className="qp-foryou__chip" aria-current={c.slug === term.slug ? "page" : undefined}
                  style={c.slug === term.slug ? { background: "var(--color-teal-dark, #006b5a)", color: "#fff" } : undefined}>
                  {kind === "tag" ? "#" : ""}{c.name} <span style={{ opacity: 0.7, marginLeft: 6 }}>{c.count}</span>
                </Link>
              ))}
            </nav>
          )}
          <div className="qp-grid-news">
            {items.map((a) => <NewsCard key={a.id} a={a} />)}
          </div>
          <Pager base={base} page={page} totalPages={totalPages} />
        </div>
      </section>
    </>
  );
}
