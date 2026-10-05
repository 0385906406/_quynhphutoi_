"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FilterBar } from "@/components/common/FilterBar";
import { ListPager } from "@/components/common/ListPager";
import { usePagedList } from "@/lib/use-paged-list";
import { Combobox } from "@/components/lostfound/Combobox";
import Image from "next/image";
import { fmtViews, dateKey, SCOPE_LABEL, type Article } from "@/lib/news";
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
        <div className="qp-l2card__meta"><span>{a.date}</span><Sep /><span>{a.readTime}</span></div>
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

export function NewsBrowser({ items = [], blocks,
  isLoggedIn = false, pendingItems = [] }:
  { items?: Article[]; blocks?: Partial<Record<Scope, ScopeBlocks>>;
    isLoggedIn?: boolean; pendingItems?: Article[] }) {
  const [category, setCategory] = useState("Tất cả");
  const [sort, setSort] = useState<SortValue>("newest");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"all" | "cho-duyet">("all");
  const [scopeTab, setScopeTab] = useState<Scope>("trong-xa");
  const [postOpen, setPostOpen] = useState(false);
  const router = useRouter();
  const isPending = view === "cho-duyet";

  const countLocal = useMemo(() => items.filter((a) => a.scope !== "ngoai-xa").length, [items]);
  const countOutside = useMemo(() => items.filter((a) => a.scope === "ngoai-xa").length, [items]);
  const CATEGORIES = useMemo(() => ["Tất cả", ...Array.from(new Set(items.map((a) => a.category)))], [items]);
  const catOptions = useMemo(() => CATEGORIES.map((c) => ({ value: c, label: c })), [CATEGORIES]);
  const sortOptions = useMemo(() => SORTS.map((s) => ({ value: s.value, label: s.label })), []);

  const sorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = items.filter((a) => {
      const okCat = category === "Tất cả" || a.category === category;
      const okScope = scopeTab === "ngoai-xa" ? a.scope === "ngoai-xa" : a.scope !== "ngoai-xa";
      const okQ = !q || a.title.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q);
      return okCat && okScope && okQ;
    });
    return [...filtered].sort((x, y) => {
      if (sort === "oldest") return dateKey(x.date) - dateKey(y.date);
      if (sort === "popular") return y.views - x.views;
      return dateKey(y.date) - dateKey(x.date);
    });
  }, [items, category, scopeTab, sort, query]);

  // Vùng nổi bật & "Đọc nhiều" RIÊNG cho tab đang xem (server tính sẵn theo cấu hình admin).
  // Lọc lại theo phạm vi là lớp bảo vệ — không bao giờ lẫn bài giữa Trong xã / Ngoài xã.
  // Thiếu dữ liệu từ server → suy diễn tại client (4 mới nhất + 7 đọc nhiều).
  const inScope = useMemo(
    () => (a: Article) => (scopeTab === "ngoai-xa" ? a.scope === "ngoai-xa" : a.scope !== "ngoai-xa"),
    [scopeTab],
  );
  const scopeItems = useMemo(() => items.filter(inScope), [items, inScope]);
  const scopeBlocks = blocks?.[scopeTab];
  const featuredList = useMemo(
    () => (scopeBlocks?.featured ?? scopeItems).filter(inScope).slice(0, 4),
    [scopeBlocks, scopeItems, inScope],
  );
  const popular = useMemo(
    () => (scopeBlocks?.popular ?? [...scopeItems].sort((a, b) => b.views - a.views).slice(0, 7)).filter(inScope),
    [scopeBlocks, scopeItems, inScope],
  );

  // Vùng nổi bật được phép hiện: không lọc danh mục/từ khoá (ở cả hai tab).
  const zoneEligible = category === "Tất cả" && !query.trim();
  // Bài đã lên vùng nổi bật thì KHÔNG lặp lại ở lưới bên dưới. Loại ở mọi trang (không chỉ
  // trang 1) để phân trang ổn định — các bài này luôn nằm ở vùng nổi bật đầu trang 1.
  const gridItems = useMemo(() => {
    if (!zoneEligible || featuredList.length === 0) return sorted;
    const shown = new Set(featuredList.map((a) => a.id));
    return sorted.filter((a) => !shown.has(a.id));
  }, [sorted, zoneEligible, featuredList]);

  const pager = usePagedList(gridItems, PAGE_SIZE);
  const pageItems = pager.items;
  const reset = pager.reset;

  // Mặc định = không lọc danh mục/từ khoá, trang 1 → hiện vùng nổi bật + Đọc nhiều của tab đang xem.
  const defaultMode = zoneEligible && pager.page === 1;
  // Tiêu đề lưới: theo phạm vi đang xem / theo số kết quả khi có lọc.
  const headingTitle = category === "Tất cả" && !query.trim()
    ? `Tin ${SCOPE_LABEL[scopeTab].toLowerCase()}`
    : `${sorted.length} bài viết`;
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
      <div className="qp-lf-head">
        <div className="qp-tabs" role="tablist" aria-label="Lọc tin tức">
          <button type="button" role="tab" aria-selected={view === "all" && scopeTab === "trong-xa"} className={`qp-tab${view === "all" && scopeTab === "trong-xa" ? " is-active" : ""}`} onClick={() => { setView("all"); setScopeTab("trong-xa"); reset(); }}>
            Trong xã <span className="qp-tab__count">{countLocal}</span>
          </button>
          <button type="button" role="tab" aria-selected={view === "all" && scopeTab === "ngoai-xa"} className={`qp-tab${view === "all" && scopeTab === "ngoai-xa" ? " is-active" : ""}`} onClick={() => { setView("all"); setScopeTab("ngoai-xa"); reset(); }}>
            Ngoài xã <span className="qp-tab__count">{countOutside}</span>
          </button>
          {isLoggedIn && (
            <button type="button" role="tab" aria-selected={isPending} className={`qp-tab qp-tab--pending${isPending ? " is-active" : ""}`} onClick={() => { setView("cho-duyet"); reset(); }}>
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
            value={query} onChange={(e) => { setQuery(e.target.value); reset(); }} />
        }
      >
        <div className="qp-toolbar__field">
          <span className="qp-toolbar__label">Danh mục</span>
          <Combobox options={catOptions} value={category} onChange={(v) => { setCategory(v); reset(); }} placeholder="Tất cả" searchPlaceholder="Tìm danh mục…" />
        </div>
        <div className="qp-toolbar__field">
          <span className="qp-toolbar__label">Sắp xếp</span>
          <Combobox options={sortOptions} value={sort} onChange={(v) => { setSort(v as SortValue); reset(); }} placeholder="Mới nhất" searchPlaceholder="Tìm…" />
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
      <div className="qp-newsgrid-head qp-newsgrid-head--count">
        <span className="type-tag qp-sechead__eyebrow">{defaultMode ? "Mới cập nhật" : "Kết quả"}</span>
        <h2 className="type-h2">{headingTitle}</h2>
      </div>

      {pageItems.length === 0 ? (
        <div className="qp-empty">
          <svg className="qp-empty__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
          </svg>
          <div className="qp-empty__title">Không tìm thấy bài viết</div>
          <p className="type-body-small">Thử đổi danh mục hoặc từ khoá khác.</p>
        </div>
      ) : (
        <div className="qp-grid-news">
          {pageItems.map((a, i) => (
            <Fragment key={a.id}>
              {i === popularMobileAt && popularMobileBlock}
              <NewsCard a={a} />
            </Fragment>
          ))}
          {/* Ít hơn POPULAR_MOBILE_AFTER bài → "Đọc nhiều" ở cuối lưới */}
          {popularMobileAt === pageItems.length && popularMobileBlock}
        </div>
      )}
      </>
      )}

      <ListPager pager={pager} />
      </>
      )}

      {postOpen && <ArticleSubmitModal open onClose={() => setPostOpen(false)} isLoggedIn={isLoggedIn} onSuccess={() => router.refresh()} />}
    </>
  );
}
