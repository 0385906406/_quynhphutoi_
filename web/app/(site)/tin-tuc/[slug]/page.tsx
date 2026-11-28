import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { isBot, recordArticleView } from "@/lib/visits";
import { fmtViews, type Article } from "@/lib/news";
import { getArticleBySlug, listArticles, relatedArticles as relatedDbArticles, toNewsCardArticle, incrementViews, buildArticleMetadata, buildArticleJsonLd, buildArticleBreadcrumb, type ArticleBlock } from "@/lib/articles";
import { getSession } from "@/lib/auth";
import { isCurrentUserStaff } from "@/lib/admin";
import { newsLikeInfo, listNewsComments } from "@/lib/news-social";
import { PostInteractions } from "@/components/lostfound/PostInteractions";
import { CommentsSection, type CommentItem } from "@/components/lostfound/CommentsSection";
import { NewsCard } from "@/components/news/NewsCard";
import { AffiliateCTA } from "@/components/common/AffiliateCTA";
import { cldUrl, cldHtml } from "@/lib/cloudinary-url";
import { NewsletterForm } from "@/components/common/NewsletterForm";
import { JsonLd } from "@/components/common/JsonLd";
import { ReadingTools } from "@/components/news/ReadingTools";
import { ForYou } from "@/components/news/ForYou";
import { BookmarkButton } from "@/components/news/BookmarkButton";
import { slugify } from "@/lib/slug";
import { ArticleInterest } from "@/components/news/ArticleInterest";
import { ShareButtons } from "@/components/social/ShareButtons";

export const dynamic = "force-dynamic";

// Bài hiển thị công khai: đã xuất bản + đã duyệt + đang bật.
function isPublic(db: { status: string; approved?: boolean; active?: boolean } | null) {
  return !!db && db.status === "published" && db.approved !== false && db.active !== false;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const db = await getArticleBySlug(slug);
  if (isPublic(db) && db) return buildArticleMetadata(db); // SEO đầy đủ: canonical, OG, robots…
  return { title: "Bài viết", robots: { index: false, follow: false } };
}

function badgeClass(cat: string) {
  if (cat === "Thông báo") return " is-navy";
  if (cat === "Kinh tế") return " is-policy";
  if (cat === "Giáo dục") return " is-warning";
  return "";
}

// View model cho bài viết (DB articles do admin tạo).
type ArticleView = {
  title: string; category: string; image: string; date: string; readTime: string;
  author: string; authorTitle: string; tags: string[]; viewsText: string;
};

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const db = await getArticleBySlug(slug);
  if (!db) notFound();

  // Phiên đăng nhập (dùng cho cả kiểm tra quyền xem trước + like/bình luận).
  const session = await getSession();
  const pub = isPublic(db);
  const isOwner = !!session && db.postedBy?.toString() === session.id;
  // Bài chưa công khai (nháp / chờ duyệt): chủ bài hoặc BAN QUẢN TRỊ xem trước được (nút
  // "Xem trước" trong trình soạn); người ngoài → 404. Trang chưa công khai luôn noindex.
  const staffPreview = !pub && !isOwner && (await isCurrentUserStaff());
  if (!pub && !isOwner && !staffPreview) notFound();
  const previewPending = !pub;

  // Chỉ đếm lượt đọc của người thật (bỏ bot/crawler); ghi cả bộ đếm theo ngày cho thống kê admin.
  if (pub && !isBot((await headers()).get("user-agent"))) {
    await Promise.all([incrementViews(slug), recordArticleView(slug)]).catch(() => {});
  }
  const dd = db.publishedAt ?? db.createdAt;
  const view: ArticleView = {
    title: db.title, category: db.category, image: db.coverImage,
    date: dd ? `${String(dd.getDate()).padStart(2, "0")}/${String(dd.getMonth() + 1).padStart(2, "0")}/${dd.getFullYear()}` : "",
    readTime: `${db.readingMinutes} phút đọc`, author: db.author?.name ?? "Ban biên tập", authorTitle: db.author?.title ?? "",
    tags: db.tags ?? [], viewsText: fmtViews((db.views ?? 0) + 1),
  };
  const body: ArticleBlock[] = db.body ?? [];
  const related: Article[] = (await relatedDbArticles(slug, 4)).map(toNewsCardArticle);
  // "Đọc nhiều" cuối bài (chỉ hiện trên điện thoại): cùng phạm vi trong/ngoài xã, bỏ bài đang đọc
  // và bài đã có ở "Bài liên quan".
  const skip = new Set([slug, ...related.map((r) => r.slug)]);
  const popular: Article[] = (await listArticles({ sort: "popular", limit: 12, scope: db.scope === "ngoai-xa" ? "ngoai-xa" : "trong-xa" }).catch(() => []))
    .filter((d) => !skip.has(d.slug))
    .slice(0, 5)
    .map(toNewsCardArticle);

  const headings = body
    .map((b, i) => (b.type === "h2" ? { id: `sec-${i}`, text: b.text } : null))
    .filter((h): h is { id: string; text: string } => h !== null);
  const initials = view.author.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const a = view; // các chỗ bên dưới dùng `a.*` → trỏ tới view model

  // Tương tác: like + bình luận (session đã lấy ở trên).
  const [{ count: likeCount, liked }, commentDocs] = await Promise.all([
    newsLikeInfo(slug, session?.id),
    listNewsComments(slug),
  ]);
  const comments: CommentItem[] = commentDocs.map((c) => ({
    id: c._id!.toString(),
    userName: c.userName,
    content: c.content,
    createdAt: c.createdAt.toISOString(),
    mine: !!session && session.id === c.userId.toString(),
  }));

  return (
    <article>
      {/* Dữ liệu có cấu trúc (SEO) — chỉ chèn khi bài đã công khai */}
      {pub && (
        <>
          <JsonLd data={buildArticleJsonLd(db)} />
          <JsonLd data={buildArticleBreadcrumb(db)} />
        </>
      )}
      {previewPending && (
        <div className="container-wide" style={{ marginTop: "var(--space-4)" }}>
          <div className="qp-alert is-warning" role="status">
            <div className="qp-alert__body">
              {staffPreview || db.status !== "published"
                ? <><strong>Bản xem trước ({db.status === "published" ? "chờ duyệt / đang ẩn" : "bản nháp"}).</strong> Chỉ ban quản trị và tác giả xem được trang này; người đọc chưa thấy cho tới khi bài được xuất bản.</>
                : <><strong>Bài đang chờ duyệt.</strong> Chỉ bạn xem được bản xem trước này; bài sẽ hiển thị công khai sau khi ban quản trị duyệt.</>}
            </div>
          </div>
        </div>
      )}
      {/* Hero đồng bộ với các trang chi tiết khác */}
      <section className="qp-pagehero qp-lf-hero is-nhat-duoc" aria-labelledby="art-title">
        <span className="qp-pagehero__blob is-teal" aria-hidden />
        <span className="qp-pagehero__blob is-indigo" aria-hidden />
        <span className="qp-pagehero__blob is-yellow" aria-hidden />
        <span className="qp-lf-hero__art" aria-hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h13a1 1 0 0 1 1 1v14a2 2 0 0 0 2-2V8h-3" /><path d="M4 4a1 1 0 0 0-1 1v13a2 2 0 0 0 2 2h12" /><path d="M7 8h7M7 12h7M7 16h4" /></svg>
        </span>
        <div className="container-wide qp-pagehero__inner">
          <nav className="qp-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Trang chủ</Link>
            <span className="qp-breadcrumb__sep">›</span>
            <Link href="/tin-tuc">Tin tức</Link>
            <span className="qp-breadcrumb__sep">›</span>
            <Link href={`/tin-tuc/chuyen-muc/${db.categorySlug}`}>{a.category}</Link>
          </nav>
          <h1 id="art-title" className="type-h1" style={{ margin: "var(--space-3) 0 0" }}>{a.title}</h1>
        </div>
      </section>

      <div className="container-wide qp-lf-body">
        {/* is-reading: trên điện thoại ảnh bìa lên TRƯỚC thân bài, thẻ thông tin/mục lục ở cột phụ ẩn đi
            (đã có bản gọn ngay đầu bài) — xem components.css "TRANG ĐỌC BÀI". */}
        <div className="qp-article-layout is-lf is-reading">
          <div className="qp-lf-main">
            {/* Dòng thông tin gọn — chỉ hiện trên điện thoại (desktop có thẻ ở cột phụ). */}
            <div className="qp-article-mmeta">
              <span className="qp-avatar-initials" aria-hidden>{initials}</span>
              <div className="qp-article-mmeta__text">
                <b><Link href={`/tac-gia/${slugify(a.author)}`}>{a.author}</Link></b>
                <span>{a.date}<span className="qp-dot-sep" aria-hidden />{a.readTime}<span className="qp-dot-sep" aria-hidden />{a.viewsText}</span>
              </div>
            </div>

            <ReadingTools targetId="article-body" minutes={db.readingMinutes ?? 0} />
            {pub && <BookmarkButton slug={slug} />}

            {headings.length > 0 && (
              <details className="qp-toc-m">
                <summary>Mục lục <span>({headings.length})</span></summary>
                <nav aria-label="Mục lục bài viết">
                  {headings.map((h) => <a href={`#${h.id}`} key={h.id}>{h.text}</a>)}
                </nav>
              </details>
            )}

            <div className="qp-article-body" id="article-body">
              {db.excerpt && <p className="qp-article-lead">{db.excerpt}</p>}
              <div className="rich-text-editor__content qp-rte-view">
              {body.map((b, i) => {
                switch (b.type) {
                  case "h2": return <h2 id={`sec-${i}`} key={i}>{b.text}</h2>;
                  case "h3": return <h3 key={i}>{b.text}</h3>;
                  case "quote": return <blockquote key={i}>{b.text}</blockquote>;
                  case "list": return b.ordered
                    ? <ol key={i}>{b.items.map((it, j) => <li key={j}>{it}</li>)}</ol>
                    : <ul key={i}>{b.items.map((it, j) => <li key={j}>{it}</li>)}</ul>;
                  case "image": return (
                    <figure key={i}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={cldUrl(b.src, { w: 900 })} alt={b.alt ?? ""} loading="lazy" />
                      {b.caption ? <figcaption>{b.caption}</figcaption> : null}
                    </figure>
                  );
                  case "html": return <div key={i} dangerouslySetInnerHTML={{ __html: cldHtml(b.html) }} />;
                  default: return <p key={i}>{b.text}</p>;
                }
              })}
              </div>

              {/* "… Xem thêm" affiliate (random link Shopee) — cuối phần mô tả; ẩn nếu admin chưa bật */}
              <AffiliateCTA page="/tin-tuc" />

              <div className="qp-tag-row mt-8">
                {a.tags.map((t) => <Link href={`/tin-tuc/tag/${slugify(t)}`} className="qp-tag" key={t}>#{t}</Link>)}
              </div>

              <div style={{ marginTop: "2rem", paddingTop: "2rem", borderTop: "1px solid var(--color-border)" }}>
                <div style={{ fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.75rem", color: "var(--color-text-secondary)" }}>
                  Chia sẻ bài viết
                </div>
                <ShareButtons
                  url={`${process.env.NEXT_PUBLIC_SITE_URL || "https://www.quynhphutoi.io.vn"}/tin-tuc/${slug}`}
                  title={a.title}
                  slug={slug}
                  variant="row"
                />
              </div>
            </div>

            <PostInteractions
              slug={slug}
              title={a.title}
              initialLiked={liked}
              initialLikeCount={likeCount}
              commentCount={comments.length}
              isLoggedIn={!!session}
              apiBase="/api/tin-tuc"
            />
          </div>

          <aside className="qp-lf-aside">
            <figure className="qp-article-hero">
              <Image src={a.image} alt={a.title} fill sizes="(max-width:900px) 100vw, 340px" priority />
            </figure>

            <div className="qp-lf-infocard qp-lf-infocard--meta">
              <div className="qp-author">
                <span className="qp-avatar-initials" aria-hidden>{initials}</span>
                <div>
                  <div className="qp-author__name"><Link href={`/tac-gia/${slugify(a.author)}`}>{a.author}</Link></div>
                  <div className="qp-author__meta">{a.authorTitle || "Quỳnh Phụ Tôi"}</div>
                </div>
              </div>
              <div className="qp-lf-spec" style={{ marginTop: 14 }}>
                <div className="qp-lf-spec__row"><span>Chuyên mục</span><b><Link href={`/tin-tuc/chuyen-muc/${db.categorySlug}`} className={`qp-category-badge${badgeClass(a.category)}`}>{a.category}</Link></b></div>
                <div className="qp-lf-spec__row"><span>Ngày đăng</span><b>{a.date}</b></div>
                <div className="qp-lf-spec__row"><span>Thời gian đọc</span><b>{a.readTime}</b></div>
                <div className="qp-lf-spec__row"><span>Lượt đọc</span><b>{a.viewsText}</b></div>
              </div>
            </div>

            {headings.length > 0 && (
              <div className="qp-lf-infocard qp-lf-infocard--toc">
                <div className="qp-lf-infocard__title">Mục lục</div>
                <nav className="qp-toc qp-toc--static">
                  {headings.map((h) => <a href={`#${h.id}`} key={h.id}>{h.text}</a>)}
                </nav>
              </div>
            )}

            <div className="qp-lf-infocard qp-lf-infocard--cta">
              <div className="qp-lf-infocard__title">Theo dõi tin huyện nhà</div>
              <p className="type-body-small" style={{ color: "var(--color-gray-text)", margin: "0 0 14px" }}>
                Tin tức, thông báo và việc làm mới — cập nhật liên tục từ Trang cộng đồng Quỳnh Phụ.
              </p>
              <Link href="/tin-tuc" className="qp-btn-primary qp-btn-block">Xem tất cả tin →</Link>
            </div>
          </aside>
        </div>

        {/* Bình luận */}
        <CommentsSection slug={slug} initial={comments} isLoggedIn={!!session} currentUserName={session?.name} apiBase="/api/tin-tuc" />

        {pub && <ArticleInterest slug={slug} category={db.category} tags={db.tags ?? []} title={db.title} />}
        {pub && <ForYou title="Có thể bạn quan tâm" eyebrow="Gợi ý cho bạn" limit={4} exclude={[slug, ...related.map((r) => r.slug)]} className="qp-foryou--article" />}

        {/* Bài liên quan */}
        <div className="qp-lf-related">
          <header className="qp-newsgrid-head">
            <span className="type-tag qp-sechead__eyebrow">Đọc thêm</span>
            <h2 className="type-h2">Bài liên quan</h2>
          </header>
          <div className="qp-grid-news">
            {related.map((r) => <NewsCard key={r.id} a={r} />)}
          </div>
        </div>

        {/* Đọc nhiều — chỉ điện thoại (desktop đã có cột phụ & "Đọc nhiều" ở trang Tin tức) */}
        {popular.length > 0 && (
          <section className="qp-popular qp-popular--m qp-popular--article" aria-label="Đọc nhiều">
            <header className="qp-popular__head"><h2 className="type-h3">Đọc nhiều</h2></header>
            <div className="qp-popular__list">
              {popular.map((p, i) => (
                <Link key={p.id} href={`/tin-tuc/${p.slug}`} className="qp-popular__item">
                  <span className="qp-popular__rank">{String(i + 1).padStart(2, "0")}</span>
                  <span className="qp-popular__body">
                    <span className="qp-popular__title">{p.title}</span>
                    <span className="qp-popular__meta"><span>{p.date}</span><span className="qp-dot-sep" aria-hidden /><span>{fmtViews(p.views)}</span></span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Newsletter */}
        <div className="qp-newsletter" style={{ marginTop: "var(--space-10)" }}>
          <h2 className="type-h2">Nhận tin huyện nhà qua email</h2>
          <p className="type-body">Tin tức, thông báo và việc làm mới — gửi gọn vào hộp thư của bạn.</p>
          <NewsletterForm source="article" />
        </div>
      </div>
    </article>
  );
}
