"use client";

// Bộ duyệt Mua bán — lọc danh mục/xã + tìm kiếm + tab "Chờ duyệt"; lưới thẻ tin.
import { useMemo, useState } from "react";
import Link from "next/link";
import { Pagination } from "@/components/common/Pagination";
import { useRouter } from "next/navigation";
import { Combobox } from "@/components/lostfound/Combobox";
import { CardMedia } from "@/components/common/CardMedia";
import { ClassifiedPostModal } from "./ClassifiedPostModal";
import { formatDate } from "@/lib/datetime";

export type ClassifiedItem = {
  slug: string;
  title: string;
  category: string;
  categoryLabel: string;
  images: string[];
  excerpt: string;
  priceText: string;
  condition: "moi" | "da-dung" | null;
  ward: string;
  wardSlug: string;
  newCommune: string | null;
  status: "open" | "sold" | "closed";
  featured: boolean;
  views: number;
  createdAt: string;
  phone: string | null;
};

const PAGE_SIZE = 12;
const COND_LABEL = { moi: "Mới", "da-dung": "Đã dùng" } as const;

function Tag() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M20.6 13.4 12 22l-9-9V3h10l8.6 8.6a2 2 0 0 1 0 2.8z" /><circle cx="7.5" cy="7.5" r="1.5" /></svg>; }
function Pin() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>; }
function Eye() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>; }
function Cal() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>; }


function AdCard({ a, pending = false }: { a: ClassifiedItem; pending?: boolean }) {
  const href = `/mua-ban/${a.slug}`;
  return (
    <article className={`qp-newscard${pending ? " is-pending" : ""}`}>
      <Link href={href} className={`qp-newscard__media${a.images.length ? "" : " qp-newscard__media--icon"}`} aria-label={a.title}>
        <CardMedia images={a.images} fallback={<Tag />} alt={a.title} />
        <span className="qp-newscard__badge">{a.categoryLabel}</span>
        {pending ? <span className="qp-newscard__badge qp-newscard__badge--tr is-lost">⏳ Chờ duyệt</span>
          : a.status === "sold" ? <span className="qp-newscard__badge qp-newscard__badge--tr">Đã bán</span>
          : a.featured ? <span className="qp-newscard__badge qp-newscard__badge--tr is-found">NỔI BẬT</span> : null}
      </Link>
      <div className="qp-newscard__body">
        <h3 className="qp-newscard__title"><Link href={href}>{a.title}</Link></h3>
        {a.excerpt && <p className="qp-newscard__excerpt">{a.excerpt}</p>}
        <div className="qp-newscard__price">
          <span className="qp-newscard__price-val">{a.priceText}</span>
          {a.condition && <span className="qp-newscard__price-cond">{COND_LABEL[a.condition]}</span>}
        </div>
        <div className="qp-newscard__meta qp-lf-meta">
          <div className="qp-lf-meta__loc">
            <Pin /> <span>{a.ward}{a.newCommune ? <span className="qp-newscard__nc"> ({a.newCommune})</span> : null}</span>
          </div>
          <div className="qp-lf-meta__sub">
            <span className="qp-lf-meta__item"><Cal /> {formatDate(a.createdAt)}</span>
            <span className="qp-lf-meta__item"><Eye /> {a.views} lượt xem</span>
          </div>
        </div>
      </div>
    </article>
  );
}

export function ClassifiedBrowser({
  items, pendingItems, categories, wards, isLoggedIn, defaultName, maxImages,
}: {
  items: ClassifiedItem[];
  pendingItems: ClassifiedItem[];
  categories: { slug: string; name: string }[];
  wards: { slug: string; name: string; newCommune?: string }[];
  isLoggedIn: boolean;
  defaultName: string;
  maxImages: number;
}) {
  const [view, setView] = useState<"all" | "cho-duyet">("all");
  const [category, setCategory] = useState("all");
  const [ward, setWard] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [postOpen, setPostOpen] = useState(false);
  const router = useRouter();
  const isPending = view === "cho-duyet";

  const catOptions = useMemo(() => [{ value: "all", label: `Tất cả danh mục (${categories.length})` }, ...categories.map((c) => ({ value: c.slug, label: c.name }))], [categories]);
  const wardOptions = useMemo(() => [{ value: "all", label: `Tất cả xã/thị trấn (${wards.length})` }, ...wards.map((w) => ({ value: w.slug, label: w.name, hint: w.newCommune ? `Xã mới: ${w.newCommune}` : undefined }))], [wards]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const src = isPending ? pendingItems : items;
    return src.filter((a) => {
      const okCat = category === "all" || a.category === category;
      const okWard = ward === "all" || a.wardSlug === ward;
      const okQ = !q || a.title.toLowerCase().includes(q) || a.ward.toLowerCase().includes(q);
      return okCat && okWard && okQ;
    });
  }, [items, pendingItems, isPending, category, ward, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const reset = () => setPage(1);

  return (
    <>
      <div className="qp-lf-head">
        <div className="qp-tabs" role="tablist" aria-label="Lọc tin">
          <button type="button" role="tab" aria-selected={view === "all"} className={`qp-tab${view === "all" ? " is-active" : ""}`} onClick={() => { setView("all"); reset(); }}>
            Tất cả tin <span className="qp-tab__count">{items.length}</span>
          </button>
          {isLoggedIn && (
            <button type="button" role="tab" aria-selected={isPending} className={`qp-tab qp-tab--pending${isPending ? " is-active" : ""}`} onClick={() => { setView("cho-duyet"); reset(); }}>
              ⏳ Chờ duyệt <span className="qp-tab__count">{pendingItems.length}</span>
            </button>
          )}
        </div>
        <button type="button" className="qp-btn-primary qp-lf-post-btn" onClick={() => setPostOpen(true)}>+ Đăng tin mua bán</button>
      </div>

      <form className="qp-toolbar qp-school-toolbar qp-lf-toolbar" role="search" onSubmit={(e) => e.preventDefault()}>
        <div className="qp-toolbar__search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          <input type="search" placeholder="Tìm món đồ, tiêu đề…" aria-label="Tìm" value={query} onChange={(e) => { setQuery(e.target.value); reset(); }} />
        </div>
        <div className="qp-toolbar__field"><span className="qp-toolbar__label">Danh mục</span><Combobox options={catOptions} value={category} onChange={(v) => { setCategory(v); reset(); }} placeholder="Tất cả danh mục" searchPlaceholder="Tìm danh mục…" /></div>
        <div className="qp-toolbar__field"><span className="qp-toolbar__label">Xã / Thị trấn</span><Combobox options={wardOptions} value={ward} onChange={(v) => { setWard(v); reset(); }} placeholder="Tất cả xã/thị trấn" searchPlaceholder="Tìm xã…" /></div>
      </form>

      <div className="qp-newsgrid-head">
        <span className="type-tag qp-sechead__eyebrow">{isPending ? "Tin của bạn" : "Tin mua bán"}</span>
        <h2 className="type-h2">{filtered.length} tin{isPending ? " chờ duyệt" : ""}</h2>
      </div>

      {isPending && <p className="qp-lf-pending-note">Đây là các tin bạn vừa đăng, đang chờ duyệt. Sau khi được duyệt sẽ hiển thị công khai.</p>}

      {pageItems.length === 0 ? (
        <div className="qp-empty">
          <div className="qp-empty__title">{isPending ? "Bạn chưa có tin chờ duyệt" : "Chưa có tin phù hợp"}</div>
          <p className="type-body-small">{isPending ? "Bấm “+ Đăng tin mua bán” để gửi tin." : "Thử đổi danh mục, xã hoặc từ khoá."}</p>
        </div>
      ) : (
        <div className="qp-grid-news">{pageItems.map((a) => <AdCard key={a.slug} a={a} pending={isPending} />)}</div>
      )}

      <Pagination page={safePage} totalPages={totalPages} onPage={setPage} />

      {postOpen && <ClassifiedPostModal open onClose={() => setPostOpen(false)} isLoggedIn={isLoggedIn} defaultName={defaultName} maxImages={maxImages} onSuccess={() => router.refresh()} />}
    </>
  );
}
