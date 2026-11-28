"use client";

import { Fragment, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FilterBar } from "@/components/common/FilterBar";
import { ListPager } from "@/components/common/ListPager";
import { useRemotePager, type RemoteSeed } from "@/lib/use-remote-pager";
import { Combobox } from "@/components/lostfound/Combobox";
import Image from "next/image";
import { fmtViews, SCOPE_LABEL, type Article } from "@/lib/news";
import { NewsCard } from "./NewsCard";
import { ArticleSubmitModal } from "./ArticleSubmitModal";

const PAGE_SIZE = 8;
// Điện thoại: "Đọc nhiều" chen sau N tin mới, tối đa M bài.
const POPULAR_MOBILE_AFTER = 6;
const POPULAR_MOBILE_MAX = 5;
const SORTS = [
  { value: "newest", label: "Mới nhất" },
  { value: "popular", label: "Đọc nhiều" },
  { value: "oldest", label: "Cũ nhất" },
] as const;
type SortValue = (typeof SORTS)[number]["value"];

const Sep = () => <span className="qp-dot-sep" aria-hidden />;

/* Kiểu hiển thị (lưới / danh sách) — nhớ theo trình duyệt. useSyncExternalStore để lần render đầu
   trên server luôn là "lưới", sau khi hydrate mới đọc lựa chọn đã lưu (không lệch HTML). */
type Layout = "grid" | "list";
const LAYOUT_KEY = "qp:news-layout";
const LAYOUT_EVENT = "qp:news-layout-change";
const subscribeLayout = (cb: () => void) => {
  window.addEventListener(LAYOUT_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => { window.removeEventListener(LAYOUT_EVENT, cb); window.removeEventListener("storage", cb); };
};
const readLayout = (): Layout => {
  try { return localStorage.getItem(LAYOUT_KEY) === "list" ? "list" : "grid"; } catch { return "grid"; }
};
function setLayout(next: Layout) {
  try { localStorage.setItem(LAYOUT_KEY, next); } catch { /* không lưu được thì chỉ đổi lần này */ }
  window.dispatchEvent(new Event(LAYOUT_EVENT));
}

function LayoutToggle({ layout }: { layout: Layout }) {
  const opts: { value: Layout; label: string; icon: React.ReactNode }[] = [
    { value: "grid", label: "Dạng lưới", icon: <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" /> },
    { value: "list", label: "Dạng danh sách", icon: <path d="M4 6h16M4 12h16M4 18h16" /> },
  ];
  return (
    <div className="qp-layout-toggle" role="group" aria-label="Kiểu hiển thị tin tức">
      {opts.map((o) => (
        <button
          key={o.value}
          type="button"
          className={`qp-layout-toggle__btn${layout === o.value ? " is-active" : ""}`}
          aria-pressed={layout === o.value}
          aria-label={o.label}
          onClick={() => setLayout(o.value)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden>{o.icon}</svg>
          <span>{o.label}</span>
        </button>
      ))}
    </div>
  );
}

/* Dòng tin dạng danh sách — ảnh trái, chữ phải */
function NewsListItem({ a }: { a: Article }) {
  const href = `/tin-tuc/${a.slug}`;
  return (
    <article className="qp-newsrow">
      <Link href={href} className="qp-newsrow__media" aria-label={a.title} tabIndex={-1}>
        <Image src={a.image} alt="" fill sizes="(max-width:767px) 120px, 300px" style={{ objectFit: "cover" }} />
      </Link>
      <div className="qp-newsrow__body">
        <span className="qp-tag-cat">{a.category}</span>
        <h3 className="qp-newsrow__title"><Link href={href}>{a.title}</Link></h3>
        <p className="qp-newsrow__excerpt">{a.excerpt}</p>
        <div className="qp-newsrow__meta"><span>{a.date}</span><Sep /><span>{fmtViews(a.views)}</span></div>
      </div>
    </article>
  );
}

/* Card nổi bật cấp 1 — text trái + ảnh phải */
function FeaturedCard({ a }: { a: Article }) {
  const href = `/tin-tuc/${a.slug}`;
  return (
    <article className="qp-featured">
      <Link href={href} aria-label={a.title} className="qp-featured__link" />
      <div className="qp-featured__body">
        <span className="qp-tag-cat">{a.category}</span>
        <h2 className="qp-featured__title">{a.title}</h2>
        <p className="qp-featured__excerpt">{a.excerpt}</p>
        <div className="qp-featured__meta"><span>{a.date}</span><Sep /><span>{fmtViews(a.views)}</span></div>
      </div>
      <div className="qp-featured__media">
        <Image src={a.image} alt="" fill sizes="(max-width:767px) 100vw, 50vw" style={{ objectFit: "cover" }} />
      </div>
    </article>
  );
}

/* Card cấp 2 — gọn: ảnh + title 14px + meta */
function L2Card({ a }: { a: Article }) {
  const href = `/tin-tuc/${a.slug}`;
  return (
    <article className="qp-l2card">
      <Link href={href} aria-label={a.title} className="qp-l2card__link" />
      <div className="qp-l2card__media">
        <Image src={a.image} alt="" fill sizes="(max-width:767px) 124px, 33vw" style={{ objectFit: "cover" }} />
      </div>
      <div className="qp-l2card__body">
        <h3 className="qp-l2card__title">{a.title}</h3>
        <div className="qp-l2card__meta"><span>{a.date}</span><Sep /><span>{fmtViews(a.views)}</span></div>
      </div>
    </article>
  );
}

function PopularItem({ a, rank }: { a: Article; rank: number }) {
  return (
    <Link href={`/tin-tuc/${a.slug}`} className="qp-popular__item">
      <span className="qp-popular__rank">{String(rank).padStart(2, "0")}</span>
      <span className="qp-popular__body">
        <span className="qp-popular__title">{a.title}</span>
        <span className="qp-popular__meta"><span>{a.date}</span><Sep /><span>{fmtViews(a.views)}</span></span>
      </span>
    </Link>
  );
}

type Scope = "trong-xa" | "ngoai-xa";
type ScopeBlocks = { featured: Article[]; popular: Article[] };
// Trang đầu của từng tab do máy chủ dựng sẵn (hiện ngay, không chờ API) + danh sách bài đã loại ra.
type InitialPage = { items: Article[]; total: number; totalPages: number; exclude: string[] };

const ALL = "Tất cả";
const filterKeyOf = (scope: Scope, category: string, sort: SortValue, q: string, exclude: string[]) =>
  [scope, category, sort, q, exclude.join(",")].join("|");

// Chờ người dùng gõ xong mới gọi API tìm kiếm.
function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function NewsBrowser({ blocks, initial, counts, categories = [],
  isLoggedIn = false, pendingItems = [] }:
  { blocks?: Partial<Record<Scope, ScopeBlocks>>; initial?: Partial<Record<Scope, InitialPage>>;
    counts: Record<Scope, number>; categories?: string[];
    isLoggedIn?: boolean; pendingItems?: Article[] }) {
  const [category, setCategory] = useState(ALL);
  const [sort, setSort] = useState<SortValue>("newest");
  const [query, setQuery] = useState("");
  const q = useDebounced(query.trim(), 300);
  const [view, setView] = useState<"all" | "cho-duyet">("all");
  const [scopeTab, setScopeTab] = useState<Scope>("trong-xa");
  const [postOpen, setPostOpen] = useState(false);
  const layout = useSyncExternalStore(subscribeLayout, readLayout, () => "grid" as Layout);
  const router = useRouter();
  const isPending = view === "cho-duyet";

  const countLocal = counts["trong-xa"];
  const countOutside = counts["ngoai-xa"];
  const CATEGORIES = useMemo(() => [ALL, ...categories], [categories]);
  const catOptions = useMemo(() => CATEGORIES.map((c) => ({ value: c, label: c })), [CATEGORIES]);
  const sortOptions = useMemo(() => SORTS.map((s) => ({ value: s.value, label: s.label })), []);

  // Vùng nổi bật & "Đọc nhiều" RIÊNG cho tab đang xem (server tính sẵn theo cấu hình admin).
  // Lọc lại theo phạm vi là lớp bảo vệ — không bao giờ lẫn bài giữa Trong xã / Ngoài xã.
  const inScope = useMemo(
    () => (a: Article) => (scopeTab === "ngoai-xa" ? a.scope === "ngoai-xa" : a.scope !== "ngoai-xa"),
    [scopeTab],
  );
  const scopeBlocks = blocks?.[scopeTab];
  const featuredList = useMemo(() => (scopeBlocks?.featured ?? []).filter(inScope).slice(0, 4), [scopeBlocks, inScope]);
  const popular = useMemo(() => (scopeBlocks?.popular ?? []).filter(inScope), [scopeBlocks, inScope]);

  // Vùng nổi bật được phép hiện: không lọc danh mục/từ khoá (ở cả hai tab).
  const zoneEligible = category === ALL && !q;
  // Bài đã lên vùng nổi bật thì KHÔNG lặp lại ở lưới bên dưới — máy chủ loại ra khi phân trang
  // (ở mọi trang) nên tổng số trang luôn đúng.
  const exclude = useMemo(() => (zoneEligible ? featuredList.map((a) => a.slug) : []), [zoneEligible, featuredList]);

  // Phân trang qua API /api/news: trang đã xem được lưu tạm, trang kế tiếp tải trước.
  const filterKey = filterKeyOf(scopeTab, category, sort, q, exclude);
  const seeds: RemoteSeed<Article>[] = (["trong-xa", "ngoai-xa"] as Scope[]).flatMap((s) => {
    const ini = initial?.[s];
    return ini ? [{ filterKey: filterKeyOf(s, ALL, "newest", "", ini.exclude), page: 1, data: { items: ini.items, total: ini.total, totalPages: ini.totalPages } }] : [];
  });
  const pager = useRemotePager<Article>({
    filterKey,
    seeds,
    fetchPage: async (p, signal) => {
      const sp = new URLSearchParams({ scope: scopeTab, sort, page: String(p), pageSize: String(PAGE_SIZE) });
      if (category !== ALL) sp.set("category", category);
      if (q) sp.set("q", q);
      if (exclude.length) sp.set("exclude", exclude.join(","));
      const res = await fetch(`/api/news?${sp}`, { signal });
      if (!res.ok) throw new Error(String(res.status));
      const json = await res.json();
      return { items: json.items as Article[], total: json.total as number, totalPages: json.totalPages as number };
    },
  });
  const pageItems = pager.items;

  // Mặc định = không lọc danh mục/từ khoá, trang 1 → hiện vùng nổi bật + Đọc nhiều của tab đang xem.
  // Dùng trang ĐANG HIỂN THỊ (không phải trang vừa bấm) để khối nổi bật chỉ biến mất cùng lúc với
  // nội dung mới — nếu không, bố cục co lại trước khi dữ liệu về và trang bị giật.
  const defaultMode = zoneEligible && pager.settledPage === 1;
  // Tiêu đề lưới: theo phạm vi đang xem / theo số kết quả khi có lọc.
  const headingTitle = category === ALL && !q
    ? `Tin ${SCOPE_LABEL[scopeTab].toLowerCase()}`
    : `${pager.total} bài viết`;
  const featured = defaultMode ? featuredList[0] : undefined;
  const levelTwo = defaultMode ? featuredList.slice(1, 4) : [];
  const showPopular = defaultMode && popular.length > 0;
  const showFeaturedZone = defaultMode && (!!featured || showPopular);

  // ĐIỆN THOẠI: "Đọc nhiều" không đứng trước tin mới — chen vào SAU vài tin mới cập nhật,
  // gọn 5 bài, bỏ bài đã có ở vùng nổi bật. (Bản desktop ở cột phải giữ nguyên; CSS ẩn/hiện.)
  const popularMobile = useMemo(() => {
    const shown = new Set(featuredList.map((a) => a.id));
    return popular.filter((a) => !shown.has(a.id)).slice(0, POPULAR_MOBILE_MAX);
  }, [popular, featuredList]);
  const showPopularMobile = showPopular && popularMobile.length > 0;
  const popularMobileAt = Math.min(POPULAR_MOBILE_AFTER, pageItems.length);
  const popularMobileBlock = showPopularMobile ? (
    <section className="qp-popular qp-popular--m" aria-label="Đọc nhiều">
      <header className="qp-popular__head"><h2 className="type-h3">Đọc nhiều</h2></header>
      <div className="qp-popular__list">
        {popularMobile.map((a, i) => <PopularItem key={a.id} a={a} rank={i + 1} />)}
      </div>
    </section>
  ) : null;

  return (
    <>
      {/* Tabs + nút gửi bài */}
      <div id="news-top" className="qp-lf-head">
        <div className="qp-tabs" role="tablist" aria-label="Lọc tin tức">
          <button type="button" role="tab" aria-selected={view === "all" && scopeTab === "trong-xa"} className={`qp-tab${view === "all" && scopeTab === "trong-xa" ? " is-active" : ""}`} onClick={() => { setView("all"); setScopeTab("trong-xa"); }}>
            Trong xã <span className="qp-tab__count">{countLocal}</span>
          </button>
          <button type="button" role="tab" aria-selected={view === "all" && scopeTab === "ngoai-xa"} className={`qp-tab${view === "all" && scopeTab === "ngoai-xa" ? " is-active" : ""}`} onClick={() => { setView("all"); setScopeTab("ngoai-xa"); }}>
            Ngoài xã <span className="qp-tab__count">{countOutside}</span>
          </button>
          {isLoggedIn && (
            <button type="button" role="tab" aria-selected={isPending} className={`qp-tab qp-tab--pending${isPending ? " is-active" : ""}`} onClick={() => setView("cho-duyet")}>
              ⏳ Chờ duyệt <span className="qp-tab__count">{pendingItems.length}</span>
            </button>
          )}
        </div>
        <button type="button" className="qp-btn-primary qp-lf-post-btn" aria-label="Gửi bài viết" onClick={() => setPostOpen(true)}>
          <span className="qp-postbtn-full" aria-hidden>+ Gửi bài viết</span>
          <span className="qp-postbtn-short" aria-hidden>+ Gửi</span>
        </button>
      </div>

      {isPending ? (
        <>
          <div className="qp-newsgrid-head qp-newsgrid-head--count">
            <span className="type-tag qp-sechead__eyebrow">Bài của bạn</span>
            <h2 className="type-h2">{pendingItems.length} bài chờ duyệt</h2>
          </div>
          <p className="qp-lf-pending-note">Đây là các bài bạn vừa gửi, đang chờ duyệt. Sau khi được duyệt sẽ hiển thị công khai.</p>
          {pendingItems.length === 0 ? (
            <div className="qp-empty">
              <div className="qp-empty__title">Bạn chưa có bài chờ duyệt</div>
              <p className="type-body-small">Bấm “+ Gửi bài viết” để gửi bài.</p>
            </div>
          ) : (
            <div className="qp-grid-news">{pendingItems.map((a) => <NewsCard key={a.id} a={a} />)}</div>
          )}
        </>
      ) : (
      <>
      {/* Bộ lọc */}
      <FilterBar
        className="qp-lf-toolbar"
        activeCount={(category !== "Tất cả" ? 1 : 0) + (sort !== "newest" ? 1 : 0)}
        searchInput={
          <input type="search" placeholder="Tìm bài viết, thông báo…" aria-label="Tìm bài viết"
            value={query} onChange={(e) => setQuery(e.target.value)} />
        }
      >
        <div className="qp-toolbar__field">
          <span className="qp-toolbar__label">Danh mục</span>
          <Combobox options={catOptions} value={category} onChange={setCategory} placeholder="Tất cả" searchPlaceholder="Tìm danh mục…" />
        </div>
        <div className="qp-toolbar__field">
          <span className="qp-toolbar__label">Sắp xếp</span>
          <Combobox options={sortOptions} value={sort} onChange={(v) => setSort(v as SortValue)} placeholder="Mới nhất" searchPlaceholder="Tìm…" />
        </div>
      </FilterBar>

      {/* Vùng nổi bật (chỉ ở chế độ mặc định) — cấu hình từ admin */}
      {showFeaturedZone && (
        <div className="qp-newszone">
          {featured && (
            <div className="qp-newszone__main">
              <FeaturedCard a={featured} />
              {levelTwo.length > 0 && (
                <div className="qp-grid-l2">
                  {levelTwo.map((a) => <L2Card key={a.id} a={a} />)}
                </div>
              )}
            </div>
          )}
          {showPopular && (
            <aside className="qp-popular qp-popular--d" aria-label="Đọc nhiều">
              <header className="qp-popular__head"><h2 className="type-h3">Đọc nhiều</h2></header>
              <div className="qp-popular__list">
                {popular.map((a, i) => <PopularItem key={a.id} a={a} rank={i + 1} />)}
              </div>
            </aside>
          )}
        </div>
      )}

      {/* Điện thoại: lưới trống (mọi bài đã ở vùng nổi bật) → "Đọc nhiều" ngay sau vùng nổi bật */}
      {pageItems.length === 0 && popularMobileBlock}

      {/* Lưới tất cả tin tức — ẩn hẳn khi mọi bài đã nằm ở vùng nổi bật (tránh báo "không tìm thấy"). */}
      {!(showFeaturedZone && pageItems.length === 0) && (
      <>
      <div id="news-list-top" className="qp-newsgrid-head qp-newsgrid-head--count qp-newsgrid-head--toggle">
        <div>
          <span className="type-tag qp-sechead__eyebrow">{defaultMode ? "Mới cập nhật" : "Kết quả"}</span>
          <h2 className="type-h2">{headingTitle}</h2>
        </div>
        <LayoutToggle layout={layout} />
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {pager.loading ? "Đang tải…" : `Trang ${pager.settledPage} trên ${pager.totalPages}, ${pager.total} bài viết`}
      </p>

      {pageItems.length === 0 && pager.loading ? (
        <div className="qp-infinite"><span className="qp-infinite__spin" /><span>Đang tải…</span></div>
      ) : pageItems.length === 0 ? (
        <div className="qp-empty">
          <svg className="qp-empty__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
          </svg>
          <div className="qp-empty__title">Không tìm thấy bài viết</div>
          <p className="type-body-small">Thử đổi danh mục hoặc từ khoá khác.</p>
        </div>
      ) : (
        <div className={`${layout === "list" ? "qp-newslist" : "qp-grid-news"}${pager.loading ? " is-busy" : ""}`} aria-busy={pager.loading || undefined}>
          {pageItems.map((a, i) => (
            <Fragment key={a.id}>
              {i === popularMobileAt && popularMobileBlock}
              {layout === "list" ? <NewsListItem a={a} /> : <NewsCard a={a} />}
            </Fragment>
          ))}
          {/* Ít hơn POPULAR_MOBILE_AFTER bài → "Đọc nhiều" ở cuối lưới */}
          {popularMobileAt === pageItems.length && popularMobileBlock}
        </div>
      )}
      </>
      )}

      {pager.error && (
        <div className="qp-alert is-error" role="alert">
          <div className="qp-alert__body">
            <strong>Không tải được trang tin này.</strong> Kiểm tra kết nối mạng rồi thử lại.{" "}
            <button type="button" className="qp-btn-secondary" onClick={pager.retry}>Thử lại</button>
          </div>
        </div>
      )}

      <ListPager pager={pager} anchorId="news-list-top" firstPageAnchorId="news-top" />
      </>
      )}

      {postOpen && <ArticleSubmitModal open onClose={() => setPostOpen(false)} isLoggedIn={isLoggedIn} onSuccess={() => router.refresh()} />}
    </>
  );
}
