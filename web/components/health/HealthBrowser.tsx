"use client";

// Bộ duyệt cơ sở y tế — lọc theo loại (tabs), xã, loại hình + tìm kiếm; lưới thẻ.
import { useMemo, useState } from "react";
import Link from "next/link";
import { Pagination } from "@/components/common/Pagination";
import { Combobox } from "@/components/lostfound/Combobox";

export type HealthItem = {
  slug: string;
  name: string;
  type: "benh-vien" | "trung-tam-y-te" | "phong-kham" | "tram-y-te" | "nha-thuoc";
  typeLabel: string;
  ownership: "cong-lap" | "tu-nhan";
  ward: string;
  wardSlug: string;
  newCommune: string | null;
  phone: string | null;
  hours: string | null;
  emergency: boolean;
  verified: boolean;
};

type Counts = { all: number } & Record<HealthItem["type"], number>;

const PAGE_SIZE = 12;
const TYPE_TABS = [
  { key: "all", label: "Tất cả" },
  { key: "benh-vien", label: "Bệnh viện" },
  { key: "trung-tam-y-te", label: "Trung tâm y tế" },
  { key: "phong-kham", label: "Phòng khám" },
  { key: "tram-y-te", label: "Trạm y tế" },
  { key: "nha-thuoc", label: "Nhà thuốc" },
] as const;
type TypeKey = (typeof TYPE_TABS)[number]["key"];

const OWNER_LABEL = { "cong-lap": "Công lập", "tu-nhan": "Tư nhân" } as const;

function IcHospital() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4 21V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14" /><path d="M2 21h20" /><path d="M12 8v6M9 11h6" /><path d="M9 21v-3a3 3 0 0 1 6 0v3" /></svg>; }
function IcCross() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M3 12h6V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6h6v4h-6v6a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-6H3z" /></svg>; }
function IcPill() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="3" y="8" width="18" height="8" rx="4" transform="rotate(45 12 12)" /><path d="M8.5 8.5 15 15" /></svg>; }
function HealthIcon({ type }: { type: HealthItem["type"] }) {
  if (type === "benh-vien" || type === "trung-tam-y-te") return <IcHospital />;
  if (type === "nha-thuoc") return <IcPill />;
  return <IcCross />;
}

function HealthCard({ h }: { h: HealthItem }) {
  const href = `/y-te/${h.slug}`;
  return (
    <article className="qp-job-card">
      <div className="qp-job-card__head">
        <span className={`qp-health-logo is-${h.type}`} aria-hidden><HealthIcon type={h.type} /></span>
        <div className="qp-job-card__head-main">
          <Link className="qp-job-card__title" href={href}>{h.name}</Link>
          <div className="qp-job-card__company">📍 {h.ward}{h.newCommune ? ` · ${h.newCommune}` : ""}</div>
        </div>
      </div>
      <div className="qp-job-card__tags">
        <span className="qp-tag-cat">{h.typeLabel}</span>
        <span className={`qp-health-own is-${h.ownership}`}>{OWNER_LABEL[h.ownership]}</span>
        {h.emergency && <span className="qp-health-emergency">Cấp cứu 24/7</span>}
      </div>
      {h.hours && <div className="qp-job-card__meta"><span>🕒 {h.hours}</span></div>}
      <div className="qp-job-card__foot">
        <Link href={href} className="qp-job-card__view">Xem chi tiết →</Link>
        {h.phone && <a className="qp-lf-card__phone" href={`tel:${h.phone.replace(/\s/g, "")}`}>☎ {h.phone}</a>}
      </div>
    </article>
  );
}

export function HealthBrowser({
  items, wards, counts,
}: {
  items: HealthItem[];
  wards: { slug: string; name: string; newCommune?: string }[];
  counts: Counts;
}) {
  const [type, setType] = useState<TypeKey>("all");
  const [ward, setWard] = useState("all");
  const [owner, setOwner] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const wardOptions = useMemo(() => [{ value: "all", label: `Tất cả xã/thị trấn (${wards.length})` }, ...wards.map((w) => ({ value: w.slug, label: w.name, hint: w.newCommune ? `Xã mới: ${w.newCommune}` : undefined }))], [wards]);
  const ownerOptions = [{ value: "all", label: "Tất cả loại hình" }, { value: "cong-lap", label: "Công lập" }, { value: "tu-nhan", label: "Tư nhân" }];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((h) => {
      const okType = type === "all" || h.type === type;
      const okWard = ward === "all" || h.wardSlug === ward;
      const okOwner = owner === "all" || h.ownership === owner;
      const okQ = !q || h.name.toLowerCase().includes(q) || h.ward.toLowerCase().includes(q);
      return okType && okWard && okOwner && okQ;
    });
  }, [items, type, ward, owner, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const reset = () => setPage(1);

  return (
    <>
      <div className="qp-tabs" role="tablist" aria-label="Lọc theo loại cơ sở">
        {TYPE_TABS.map((t) => (
          <button key={t.key} type="button" role="tab" aria-selected={type === t.key}
            className={`qp-tab${type === t.key ? " is-active" : ""}`} onClick={() => { setType(t.key); reset(); }}>
            {t.label} <span className="qp-tab__count">{counts[t.key]}</span>
          </button>
        ))}
      </div>

      <form className="qp-toolbar qp-school-toolbar qp-lf-toolbar" role="search" onSubmit={(e) => e.preventDefault()}>
        <div className="qp-toolbar__search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          <input type="search" placeholder="Tìm tên cơ sở, xã…" aria-label="Tìm cơ sở y tế" value={query} onChange={(e) => { setQuery(e.target.value); reset(); }} />
        </div>
        <div className="qp-toolbar__field"><span className="qp-toolbar__label">Xã / Thị trấn</span><Combobox options={wardOptions} value={ward} onChange={(v) => { setWard(v); reset(); }} placeholder="Tất cả xã/thị trấn" searchPlaceholder="Tìm xã…" /></div>
        <div className="qp-toolbar__field"><span className="qp-toolbar__label">Loại hình</span><Combobox options={ownerOptions} value={owner} onChange={(v) => { setOwner(v); reset(); }} placeholder="Tất cả loại hình" searchPlaceholder="Tìm…" /></div>
      </form>

      <div className="qp-newsgrid-head">
        <span className="type-tag qp-sechead__eyebrow">Danh bạ</span>
        <h2 className="type-h2">{filtered.length} cơ sở</h2>
      </div>

      {pageItems.length === 0 ? (
        <div className="qp-empty"><div className="qp-empty__title">Không tìm thấy cơ sở</div><p className="type-body-small">Thử đổi loại, xã hoặc từ khoá khác.</p></div>
      ) : (
        <div className="qp-job-grid">{pageItems.map((h) => <HealthCard key={h.slug} h={h} />)}</div>
      )}

      <Pagination page={safePage} totalPages={totalPages} onPage={setPage} />
    </>
  );
}
