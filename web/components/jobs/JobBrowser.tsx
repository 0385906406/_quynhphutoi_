"use client";

// Bộ duyệt việc làm — lọc theo ngành / loại hình / xã + tìm kiếm; lưới thẻ tin.
import { useMemo, useState } from "react";
import Link from "next/link";
import { Pagination } from "@/components/common/Pagination";
import { useRouter } from "next/navigation";
import { Combobox } from "@/components/lostfound/Combobox";
import { CardMedia } from "@/components/common/CardMedia";
import { JobPostModal } from "./JobPostModal";
import { formatDate } from "@/lib/datetime";

export type JobItem = {
  slug: string;
  title: string;
  company: string;
  industry: string;
  industryLabel: string;
  jobTypeLabel: string;
  images: string[];
  salaryText: string;
  ageText: string;            // hiển thị: "18 - 35 tuổi" / "" nếu không yêu cầu
  ageMin: number | null;      // dùng để lọc theo tuổi
  ageMax: number | null;
  ward: string;
  wardSlug: string;
  newCommune: string | null;
  quantity: number | null;
  deadline: string | null;   // ISO
  status: "open" | "closed" | "filled";
  featured: boolean;
  views: number;
  createdAt: string;         // ISO
  phone: string | null;
};

const PAGE_SIZE = 9;

function BriefcaseIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>;
}
function Pin() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>; }
function Wallet() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4z" /></svg>; }
function Clock() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>; }
function Eye() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>; }
function User() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>; }

function JobCard({ j, pending = false }: { j: JobItem; pending?: boolean }) {
  const href = `/viec-lam/${j.slug}`;
  return (
    <article className={`qp-newscard${pending ? " is-pending" : ""}`}>
      <Link href={href} className={`qp-newscard__media${j.images.length ? "" : " qp-newscard__media--icon"}`} aria-label={j.title}>
        <CardMedia images={j.images} fallback={<BriefcaseIcon />} alt={j.title} />
        <span className="qp-newscard__badge">{j.jobTypeLabel}</span>
      </Link>
      <div className="qp-newscard__body">
        <div className="qp-lf-card__top">
          <span className="qp-tag-cat">{j.industryLabel}</span>
          {pending ? <span className="qp-lf-status is-pending">⏳ Chờ duyệt</span>
            : j.status === "closed" ? <span className="qp-lf-status">Đã đóng</span>
            : j.featured ? <span className="qp-badge-g4">NỔI BẬT</span> : null}
        </div>
        <h3 className="qp-newscard__title"><Link href={href}>{j.title}</Link></h3>
        <div className="qp-job-card__salary"><Wallet /> {j.salaryText}</div>
        {j.ageText && <div className="qp-job-card__salary"><User /> {j.ageText}</div>}
        <div className="qp-newscard__meta qp-lf-meta">
          <div className="qp-lf-meta__loc">
            <Pin /> <span>{j.ward}{j.newCommune ? <span className="qp-newscard__nc"> ({j.newCommune})</span> : null}</span>
          </div>
          <div className="qp-lf-meta__sub">
            {j.deadline && <span className="qp-lf-meta__item"><Clock /> Hạn {formatDate(j.deadline)}</span>}
            <span className="qp-lf-meta__item"><Eye /> {j.views} lượt xem</span>
          </div>
        </div>
      </div>
    </article>
  );
}

export function JobBrowser({
  items, pendingItems, industries, wards, isLoggedIn, defaultName, maxImages,
}: {
  items: JobItem[];
  pendingItems: JobItem[];
  industries: { slug: string; name: string }[];
  wards: { slug: string; name: string; newCommune?: string }[];
  isLoggedIn: boolean;
  defaultName: string;
  maxImages: number;
}) {
  const [view, setView] = useState<"all" | "cho-duyet">("all");
  const [industry, setIndustry] = useState("all");
  const [jobType, setJobType] = useState("all");
  const [ward, setWard] = useState("all");
  const [age, setAge] = useState("");   // "tuổi của bạn" — lọc tin phù hợp độ tuổi
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [postOpen, setPostOpen] = useState(false);
  const router = useRouter();
  const isPending = view === "cho-duyet";

  const indOptions = useMemo(() => [{ value: "all", label: `Tất cả ngành (${industries.length})` }, ...industries.map((i) => ({ value: i.slug, label: i.name }))], [industries]);
  const typeOptions = useMemo(() => [
    { value: "all", label: "Tất cả loại hình" },
    { value: "toan-thoi-gian", label: "Toàn thời gian" }, { value: "ban-thoi-gian", label: "Bán thời gian" },
    { value: "thoi-vu", label: "Thời vụ" }, { value: "thuc-tap", label: "Thực tập" },
  ], []);
  const wardOptions = useMemo(() => [{ value: "all", label: `Tất cả xã/thị trấn (${wards.length})` }, ...wards.map((w) => ({ value: w.slug, label: w.name, hint: w.newCommune ? `Xã mới: ${w.newCommune}` : undefined }))], [wards]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const ageNum = age.trim() ? Number(age) : null;
    const src = isPending ? pendingItems : items;
    return src.filter((j) => {
      const okInd = industry === "all" || j.industry === industry;
      const okType = jobType === "all" || j.jobTypeLabel === typeOptions.find((t) => t.value === jobType)?.label;
      const okWard = ward === "all" || j.wardSlug === ward;
      // Lọc theo tuổi: tin phù hợp nếu tuổi của bạn nằm trong khoảng yêu cầu (hoặc tin không yêu cầu tuổi).
      const okAge = ageNum === null || Number.isNaN(ageNum)
        || ((j.ageMin === null || ageNum >= j.ageMin) && (j.ageMax === null || ageNum <= j.ageMax));
      const okQ = !q || j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q) || j.ward.toLowerCase().includes(q);
      return okInd && okType && okWard && okAge && okQ;
    });
  }, [items, pendingItems, isPending, industry, jobType, ward, age, query, typeOptions]);

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
        <button type="button" className="qp-btn-primary qp-lf-post-btn" onClick={() => setPostOpen(true)}>+ Đăng tin tuyển dụng</button>
      </div>

      <form className="qp-toolbar qp-school-toolbar qp-lf-toolbar" role="search" onSubmit={(e) => e.preventDefault()}>
        <div className="qp-toolbar__search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          <input type="search" placeholder="Tìm vị trí, công ty…" aria-label="Tìm việc" value={query} onChange={(e) => { setQuery(e.target.value); reset(); }} />
        </div>
        <div className="qp-toolbar__field"><span className="qp-toolbar__label">Ngành nghề</span><Combobox options={indOptions} value={industry} onChange={(v) => { setIndustry(v); reset(); }} placeholder="Tất cả ngành" searchPlaceholder="Tìm ngành…" /></div>
        <div className="qp-toolbar__field"><span className="qp-toolbar__label">Loại hình</span><Combobox options={typeOptions} value={jobType} onChange={(v) => { setJobType(v); reset(); }} placeholder="Tất cả loại hình" searchPlaceholder="Tìm…" /></div>
        <div className="qp-toolbar__field"><span className="qp-toolbar__label">Xã / Thị trấn</span><Combobox options={wardOptions} value={ward} onChange={(v) => { setWard(v); reset(); }} placeholder="Tất cả xã/thị trấn" searchPlaceholder="Tìm xã…" /></div>
        <div className="qp-toolbar__field"><span className="qp-toolbar__label">Tuổi của bạn</span><input type="number" inputMode="numeric" min={0} max={100} className="qp-input" value={age} onChange={(e) => { setAge(e.target.value); reset(); }} placeholder="VD: 25" aria-label="Lọc theo tuổi của bạn" /></div>
      </form>

      <div className="qp-newsgrid-head">
        <span className="type-tag qp-sechead__eyebrow">{isPending ? "Tin của bạn" : "Tin tuyển dụng"}</span>
        <h2 className="type-h2">{filtered.length} tin{isPending ? " chờ duyệt" : ""}</h2>
      </div>

      {isPending && <p className="qp-lf-pending-note">Đây là các tin bạn vừa đăng, đang chờ duyệt. Sau khi được duyệt sẽ hiển thị công khai.</p>}

      {pageItems.length === 0 ? (
        <div className="qp-empty">
          <div className="qp-empty__title">{isPending ? "Bạn chưa có tin chờ duyệt" : "Chưa có tin phù hợp"}</div>
          <p className="type-body-small">{isPending ? "Bấm “+ Đăng tin tuyển dụng” để gửi tin." : "Thử đổi ngành, loại hình, xã hoặc từ khoá."}</p>
        </div>
      ) : (
        <div className="qp-grid-news">{pageItems.map((j) => <JobCard key={j.slug} j={j} pending={isPending} />)}</div>
      )}

      <Pagination page={safePage} totalPages={totalPages} onPage={setPage} />

      {postOpen && <JobPostModal open onClose={() => setPostOpen(false)} isLoggedIn={isLoggedIn} defaultName={defaultName} maxImages={maxImages} onSuccess={() => router.refresh()} />}
    </>
  );
}
