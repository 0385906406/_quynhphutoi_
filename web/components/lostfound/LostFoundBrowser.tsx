"use client";

// Bộ duyệt tin Tìm đồ rơi — lọc theo loại (tabs: tất cả / tìm đồ / nhặt được),
// danh mục, xã/thị trấn và tìm kiếm; lưới thẻ tin + phân trang. Dữ liệu từ trang server.
import { useMemo, useState } from "react";
import Link from "next/link";
import { Pagination } from "@/components/common/Pagination";
import { useRouter } from "next/navigation";
import { PostModal, type CategoryOption } from "./PostModal";
import { Combobox } from "./Combobox";
import { CardMedia } from "@/components/common/CardMedia";
import { formatDate } from "@/lib/datetime";

export type LostFoundItem = {
  slug: string;
  kind: "tim-do" | "nhat-duoc";
  title: string;
  description: string;
  categorySlug: string;
  categoryName: string;
  images: string[];
  ward: string;
  wardSlug: string;
  newCommune: string | null;  // xã mới sau sáp nhập 2025 (địa điểm hiện tại)
  occurredAt: string;   // ISO
  createdAt: string;    // ISO
  reward: string | null;
  status: "open" | "matched" | "resolved" | "closed";
  views: number;
  postedByName: string;
  phone: string | null; // null nếu người đăng ẩn SĐT
};

type Counts = { all: number; "tim-do": number; "nhat-duoc": number };

const PAGE_SIZE = 9;

const KIND_TABS = [
  { key: "all", label: "Tất cả" },
  { key: "tim-do", label: "Đang tìm đồ" },
  { key: "nhat-duoc", label: "Nhặt được đồ" },
] as const;
type ViewKey = (typeof KIND_TABS)[number]["key"] | "cho-duyet";

const KIND_LABEL: Record<LostFoundItem["kind"], string> = {
  "tim-do": "Tìm đồ",
  "nhat-duoc": "Nhặt được",
};

const STATUS_LABEL: Record<LostFoundItem["status"], string> = {
  open: "Đang mở",
  matched: "Đang xác minh",
  resolved: "Đã hoàn tất",
  closed: "Đã đóng",
};

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8.1 9.6a16 16 0 0 0 6 6l1.2-1.1a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2z" />
    </svg>
  );
}

// Icon placeholder theo loại tin (tin không có ảnh) — đặt trong media--icon.
function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}
function CalIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function KindIcon({ kind }: { kind: LostFoundItem["kind"] }) {
  if (kind === "nhat-duoc") {
    // Bàn tay đỡ món đồ — "nhặt được, giữ chờ trả".
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3 13v6a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1z" />
        <path d="M7 14h3l3.5 1.2a2 2 0 0 0 1.6-.1l4.5-2.3a1.4 1.4 0 0 0-1.2-2.5L16 11.6" />
        <path d="M16 11.6 12.7 10a3 3 0 0 0-2.2 0L7 11.4" />
        <circle cx="13" cy="5" r="2.5" />
      </svg>
    );
  }
  // Kính lúp — "đang tìm đồ bị mất".
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function LostFoundCard({ p, pending = false }: { p: LostFoundItem; pending?: boolean }) {
  const href = `/tim-do-roi/${p.slug}`;
  const badge = p.kind === "nhat-duoc" ? "is-found" : "is-lost";
  return (
    <article className={`qp-newscard${pending ? " is-pending" : ""}`}>
      <Link href={href} className={`qp-newscard__media${p.images.length ? "" : " qp-newscard__media--icon"}`} aria-label={p.title}>
        <CardMedia images={p.images} fallback={<KindIcon kind={p.kind} />} alt={p.title} />
        <span className={`qp-newscard__badge ${badge}`}>{KIND_LABEL[p.kind]}</span>
      </Link>
      <div className="qp-newscard__body">
        <div className="qp-lf-card__top">
          <span className="qp-tag-cat">{p.categoryName}</span>
          {pending ? (
            <span className="qp-lf-status is-pending">⏳ Chờ duyệt</span>
          ) : p.status !== "open" ? (
            <span className={`qp-lf-status is-${p.status}`}>{STATUS_LABEL[p.status]}</span>
          ) : null}
        </div>
        <h3 className="qp-newscard__title"><Link href={href}>{p.title}</Link></h3>
        <p className="qp-newscard__excerpt">{p.description}</p>
        {p.reward && <div className="qp-lf-card__reward">🎁 {p.reward}</div>}
        <div className="qp-newscard__meta qp-lf-meta">
          <div className="qp-lf-meta__loc">
            <PinIcon /> <span>{p.ward}{p.newCommune ? <span className="qp-lf-meta__nc"> ({p.newCommune})</span> : null}</span>
          </div>
          <div className="qp-lf-meta__sub">
            <span className="qp-lf-meta__item"><CalIcon /> {formatDate(p.occurredAt)}</span>
            <span className="qp-lf-meta__item"><EyeIcon /> {p.views} lượt xem</span>
          </div>
        </div>
        {p.phone ? (
          <a className="qp-lf-card__phone" href={`tel:${p.phone}`}><PhoneIcon /> {p.phone}</a>
        ) : (
          <span className="qp-lf-card__phone is-hidden"><PhoneIcon /> Liên hệ qua tin</span>
        )}
      </div>
    </article>
  );
}

export function LostFoundBrowser({
  items, pendingItems, categories, wards, counts, categoryOptions, isLoggedIn, defaultName, maxImages,
}: {
  items: LostFoundItem[];
  pendingItems: LostFoundItem[];
  categories: { slug: string; name: string }[];
  wards: { slug: string; name: string; newCommune?: string }[];
  counts: Counts;
  categoryOptions: CategoryOption[];
  isLoggedIn: boolean;
  defaultName: string;
  maxImages: number;
}) {
  const [view, setView] = useState<ViewKey>("all");
  const [category, setCategory] = useState("all");
  const [ward, setWard] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [postOpen, setPostOpen] = useState(false);
  const router = useRouter();

  const isPending = view === "cho-duyet";

  // Option cho Combobox lọc (kèm "Tất cả"); xã có hint xã mới để tìm được theo xã mới.
  const catOptions = useMemo(
    () => [{ value: "all", label: `Tất cả danh mục (${categories.length})` }, ...categories.map((c) => ({ value: c.slug, label: c.name }))],
    [categories],
  );
  const wardOptions = useMemo(
    () => [{ value: "all", label: `Tất cả xã/thị trấn (${wards.length})` }, ...wards.map((w) => ({ value: w.slug, label: w.name, hint: w.newCommune ? `Xã mới: ${w.newCommune}` : undefined }))],
    [wards],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const source = isPending ? pendingItems : items;
    return source.filter((p) => {
      const okKind = isPending || view === "all" || p.kind === view;
      const okCat = category === "all" || p.categorySlug === category;
      const okWard = ward === "all" || p.wardSlug === ward;
      const okQ = !q || p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.ward.toLowerCase().includes(q);
      return okKind && okCat && okWard && okQ;
    });
  }, [items, pendingItems, isPending, view, category, ward, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const reset = () => setPage(1);

  return (
    <>
      {/* Tabs loại tin + nút đăng tin */}
      <div className="qp-lf-head">
        <div className="qp-tabs" role="tablist" aria-label="Lọc theo loại tin">
          {KIND_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={view === t.key}
              className={`qp-tab${view === t.key ? " is-active" : ""}`}
              onClick={() => { setView(t.key); reset(); }}
            >
              {t.label} <span className="qp-tab__count">{counts[t.key]}</span>
            </button>
          ))}
          {isLoggedIn && (
            <button
              type="button"
              role="tab"
              aria-selected={view === "cho-duyet"}
              className={`qp-tab qp-tab--pending${view === "cho-duyet" ? " is-active" : ""}`}
              onClick={() => { setView("cho-duyet"); reset(); }}
            >
              ⏳ Chờ duyệt <span className="qp-tab__count">{pendingItems.length}</span>
            </button>
          )}
        </div>
        <button type="button" className="qp-btn-primary qp-lf-post-btn" onClick={() => setPostOpen(true)}>+ Đăng tin</button>
      </div>

      {/* Toolbar: tìm kiếm + danh mục + xã */}
      <form className="qp-toolbar qp-school-toolbar qp-lf-toolbar" role="search" onSubmit={(e) => e.preventDefault()}>
        <div className="qp-toolbar__search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input type="search" placeholder="Tìm theo tiêu đề, mô tả, xã…" aria-label="Tìm tin"
            value={query} onChange={(e) => { setQuery(e.target.value); reset(); }} />
        </div>
        <div className="qp-toolbar__field">
          <span className="qp-toolbar__label">Danh mục</span>
          <Combobox options={catOptions} value={category}
            onChange={(v) => { setCategory(v); reset(); }}
            placeholder="Tất cả danh mục" searchPlaceholder="Tìm danh mục…" />
        </div>
        <div className="qp-toolbar__field">
          <span className="qp-toolbar__label">Xã / Thị trấn</span>
          <Combobox options={wardOptions} value={ward}
            onChange={(v) => { setWard(v); reset(); }}
            placeholder="Tất cả xã/thị trấn" searchPlaceholder="Tìm xã/thị trấn…" />
        </div>
      </form>

      <div className="qp-newsgrid-head">
        <span className="type-tag qp-sechead__eyebrow">{isPending ? "Tin của bạn" : "Bảng tin"}</span>
        <h2 className="type-h2">{filtered.length} tin{isPending ? " chờ duyệt" : ""}</h2>
      </div>

      {isPending && (
        <p className="qp-lf-pending-note">
          Đây là các tin bạn vừa đăng, đang chờ ban quản trị duyệt. Sau khi được duyệt, tin sẽ
          hiển thị công khai cho mọi người.
        </p>
      )}

      {pageItems.length === 0 ? (
        <div className="qp-empty">
          <svg className="qp-empty__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
          </svg>
          <div className="qp-empty__title">{isPending ? "Bạn chưa có tin chờ duyệt" : "Chưa có tin phù hợp"}</div>
          <p className="type-body-small">{isPending ? "Bấm “+ Đăng tin” để gửi tin mới." : "Thử đổi loại tin, danh mục, xã hoặc từ khoá khác."}</p>
        </div>
      ) : (
        <div className="qp-grid-news">
          {pageItems.map((p) => <LostFoundCard key={p.slug} p={p} pending={isPending} />)}
        </div>
      )}

      <Pagination page={safePage} totalPages={totalPages} onPage={setPage} />

      {/* Render có điều kiện → mỗi lần mở là component mới, form luôn sạch. */}
      {postOpen && (
        <PostModal
          open
          onClose={() => setPostOpen(false)}
          categoryOptions={categoryOptions}
          isLoggedIn={isLoggedIn}
          defaultName={defaultName}
          maxImages={maxImages}
          onSuccess={() => router.refresh()}
        />
      )}
    </>
  );
}
