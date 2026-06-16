"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FilterBar } from "@/components/common/FilterBar";
import { ListPager } from "@/components/common/ListPager";
import { usePagedList } from "@/lib/use-paged-list";
import { Combobox } from "@/components/lostfound/Combobox";
import Image from "next/image";
import { fmtViews, dateKey, type Article } from "@/lib/news";
import { NewsCard } from "./NewsCard";
import { ArticleSubmitModal } from "./ArticleSubmitModal";

const PAGE_SIZE = 8;
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

export function NewsBrowser({ items = [], featured: featuredItems, popular: popularItems,
  isLoggedIn = false, pendingItems = [] }:
  { items?: Article[]; featured?: Article[]; popular?: Article[];
    isLoggedIn?: boolean; pendingItems?: Article[] }) {
  const [category, setCategory] = useState("Tất cả");
  const [sort, setSort] = useState<SortValue>("newest");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"all" | "cho-duyet">("all");
  const [postOpen, setPostOpen] = useState(false);
  const router = useRouter();
  const isPending = view === "cho-duyet";

  const CATEGORIES = useMemo(() => ["Tất cả", ...Array.from(new Set(items.map((a) => a.category)))], [items]);
  const catOptions = useMemo(() => CATEGORIES.map((c) => ({ value: c, label: c })), [CATEGORIES]);
  const sortOptions = useMemo(() => SORTS.map((s) => ({ value: s.value, label: s.label })), []);

  const sorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = items.filter((a) => {
      const okCat = category === "Tất cả" || a.category === category;
      const okQ = !q || a.title.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q);
      return okCat && okQ;
    });
    return [...filtered].sort((x, y) => {
      if (sort === "oldest") return dateKey(x.date) - dateKey(y.date);
      if (sort === "popular") return y.views - x.views;
      return dateKey(y.date) - dateKey(x.date);
    });
  }, [items, category, sort, query]);

  // Vùng nổi bật & "Đọc nhiều" do admin cấu hình (truyền từ server). Nếu thiếu thì suy diễn tại client.
  const featuredList = featuredItems ?? sorted.slice(0, 4);
  const popular = useMemo(
    () => popularItems ?? [...items].sort((a, b) => b.views - a.views).slice(0, 7),
    [popularItems, items],
  );

  // "Tất cả tin tức" hiển thị ĐẦY ĐỦ mọi bài (không cắt bỏ các bài đã lên vùng nổi bật).
  const pager = usePagedList(sorted, PAGE_SIZE);
  const pageItems = pager.items;
  const reset = pager.reset;

  const defaultMode = category === "Tất cả" && !query.trim() && pager.page === 1;
  const featured = defaultMode ? featuredList[0] : undefined;
  const levelTwo = defaultMode ? featuredList.slice(1, 4) : [];
  const showPopular = defaultMode && popular.length > 0;
  const showFeaturedZone = defaultMode && (!!featured || showPopular);

  return (
    <>
      {/* Tabs + nút gửi bài */}
      <div className="qp-lf-head">
        <div className="qp-tabs" role="tablist" aria-label="Lọc tin tức">
          <button type="button" role="tab" aria-selected={view === "all"} className={`qp-tab${view === "all" ? " is-active" : ""}`} onClick={() => { setView("all"); reset(); }}>
            Tất cả tin <span className="qp-tab__count">{items.length}</span>
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
            <aside className="qp-popular" aria-label="Đọc nhiều">
              <header className="qp-popular__head"><h2 className="type-h3">Đọc nhiều</h2></header>
              <div className="qp-popular__list">
                {popular.map((a, i) => <PopularItem key={a.id} a={a} rank={i + 1} />)}
              </div>
            </aside>
          )}
        </div>
      )}

      {/* Lưới tất cả tin tức */}
      <div className="qp-newsgrid-head qp-newsgrid-head--count">
        <span className="type-tag qp-sechead__eyebrow">{defaultMode ? "Mới cập nhật" : "Kết quả"}</span>
        <h2 className="type-h2">{defaultMode ? "Tất cả tin tức" : `${sorted.length} bài viết`}</h2>
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
          {pageItems.map((a) => <NewsCard key={a.id} a={a} />)}
        </div>
      )}

      <ListPager pager={pager} />
      </>
      )}

      {postOpen && <ArticleSubmitModal open onClose={() => setPostOpen(false)} isLoggedIn={isLoggedIn} onSuccess={() => router.refresh()} />}
    </>
  );
}
