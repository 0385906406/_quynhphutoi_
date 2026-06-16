"use client";

// Bộ duyệt trường học — lọc theo cấp học (tabs), xã/thị trấn, loại hình và tìm
// kiếm; hiển thị lưới thẻ trường + phân trang. Dữ liệu nhận từ trang server.
import { useMemo, useState } from "react";
import Link from "next/link";
import { FilterBar } from "@/components/common/FilterBar";
import { ListPager } from "@/components/common/ListPager";
import { usePagedList } from "@/lib/use-paged-list";
import { Combobox } from "@/components/lostfound/Combobox";

export type SchoolItem = {
  slug: string;
  name: string;
  level: "mam-non" | "tieu-hoc" | "thcs" | "thpt";
  levels: ("mam-non" | "tieu-hoc" | "thcs" | "thpt")[];
  levelLabel: string;
  type: "cong-lap" | "tu-thuc" | "dan-lap" | "gdnn-gdtx";
  ward: string;
  wardSlug: string;
  newCommune: string | null;
  newCommuneSlug: string | null;
  address: string;
  website: string | null;
  foundedYear: number | null;
  verified: boolean;
};

type Counts = { all: number; "mam-non": number; "tieu-hoc": number; thcs: number; thpt: number };

const PAGE_SIZE = 12;

const LEVEL_TABS = [
  { key: "all", label: "Tất cả" },
  { key: "mam-non", label: "Mầm non" },
  { key: "tieu-hoc", label: "Tiểu học" },
  { key: "thcs", label: "THCS" },
  { key: "thpt", label: "THPT & GDTX" },
] as const;
type LevelKey = (typeof LEVEL_TABS)[number]["key"];

const TYPE_LABEL: Record<SchoolItem["type"], string> = {
  "cong-lap": "Công lập",
  "dan-lap": "Dân lập",
  "tu-thuc": "Tư thục",
  "gdnn-gdtx": "GDNN-GDTX",
};

const TYPES: { value: string; label: string }[] = [
  { value: "all", label: "Tất cả loại hình" },
  { value: "cong-lap", label: "Công lập" },
  { value: "dan-lap", label: "Dân lập" },
  { value: "tu-thuc", label: "Tư thục" },
  { value: "gdnn-gdtx", label: "GDNN-GDTX" },
];

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}
function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function SchoolCard({ s }: { s: SchoolItem }) {
  const title = (
    <Link className="qp-school-card__name" href={`/truong-hoc/${s.slug}`}>{s.name}</Link>
  );
  return (
    <article className="qp-mesh-card qp-mesh-card--text qp-school-card">
      <div className="qp-mesh-card__body">
        <div className="qp-school-card__top">
          <span className="qp-tag-cat">{s.levelLabel}</span>
          <span className={`qp-school-type is-${s.type}`}>{TYPE_LABEL[s.type]}</span>
          {s.verified && (
            <span className="qp-school-card__check" title="Đã xác minh nguồn"><CheckIcon /></span>
          )}
        </div>
        {title}
        <div className="qp-school-card__row"><PinIcon /><span>{s.ward}</span></div>
        {s.newCommune && (
          <div className="qp-school-card__new">Xã mới 2025: <b>{s.newCommune}</b></div>
        )}
        <div className="qp-school-card__foot">
          {s.foundedYear && <span className="qp-school-card__year">Thành lập {s.foundedYear}</span>}
          {s.website && (
            <a className="qp-school-card__site" href={s.website} target="_blank" rel="noopener noreferrer">
              <GlobeIcon /> Website
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

export function SchoolBrowser({ items, wards, newCommunes, counts }: { items: SchoolItem[]; wards: { slug: string; name: string }[]; newCommunes: { slug: string; name: string }[]; counts: Counts }) {
  const [level, setLevel] = useState<LevelKey>("all");
  const [ward, setWard] = useState("all");
  const [newCommune, setNewCommune] = useState("all");
  const [type, setType] = useState("all");
  const [query, setQuery] = useState("");

  const wardOptions = useMemo(() => [{ value: "all", label: `Tất cả (${wards.length})` }, ...wards.map((w) => ({ value: w.slug, label: w.name }))], [wards]);
  const newCommuneOptions = useMemo(() => [{ value: "all", label: `Tất cả (${newCommunes.length})` }, ...newCommunes.map((w) => ({ value: w.slug, label: w.name }))], [newCommunes]);
  const typeOptions = useMemo(() => TYPES.map((t) => ({ value: t.value, label: t.label })), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((s) => {
      const okLevel = level === "all" || s.levels.includes(level);
      const okWard = ward === "all" || s.wardSlug === ward;
      const okNew = newCommune === "all" || s.newCommuneSlug === newCommune;
      const okType = type === "all" || s.type === type;
      const okQ = !q || s.name.toLowerCase().includes(q) || s.ward.toLowerCase().includes(q) || (s.newCommune?.toLowerCase().includes(q) ?? false);
      return okLevel && okWard && okNew && okType && okQ;
    });
  }, [items, level, ward, newCommune, type, query]);

  const pager = usePagedList(filtered, PAGE_SIZE);
  const pageItems = pager.items;
  const reset = pager.reset;

  return (
    <>
      {/* Tabs cấp học */}
      <div className="qp-tabs" role="tablist" aria-label="Lọc theo cấp học">
        {LEVEL_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={level === t.key}
            className={`qp-tab${level === t.key ? " is-active" : ""}`}
            onClick={() => { setLevel(t.key); reset(); }}
          >
            {t.label} <span className="qp-tab__count">{counts[t.key]}</span>
          </button>
        ))}
      </div>

      {/* Bộ lọc: tìm kiếm + xã + loại hình */}
      <FilterBar
        className="qp-school-toolbar"
        activeCount={(ward !== "all" ? 1 : 0) + (newCommune !== "all" ? 1 : 0) + (type !== "all" ? 1 : 0)}
        searchInput={
          <input type="search" placeholder="Tìm tên trường, xã…" aria-label="Tìm trường"
            value={query} onChange={(e) => { setQuery(e.target.value); reset(); }} />
        }
      >
        <div className="qp-toolbar__field">
          <span className="qp-toolbar__label">Xã / Thị trấn (cũ)</span>
          <Combobox options={wardOptions} value={ward} onChange={(v) => { setWard(v); reset(); }} placeholder="Tất cả" searchPlaceholder="Tìm xã…" />
        </div>
        <div className="qp-toolbar__field">
          <span className="qp-toolbar__label">Xã mới (2025)</span>
          <Combobox options={newCommuneOptions} value={newCommune} onChange={(v) => { setNewCommune(v); reset(); }} placeholder="Tất cả" searchPlaceholder="Tìm xã mới…" />
        </div>
        <div className="qp-toolbar__field">
          <span className="qp-toolbar__label">Loại hình</span>
          <Combobox options={typeOptions} value={type} onChange={(v) => { setType(v); reset(); }} placeholder="Tất cả loại hình" searchPlaceholder="Tìm…" />
        </div>
      </FilterBar>

      <div className="qp-newsgrid-head qp-newsgrid-head--count">
        <span className="type-tag qp-sechead__eyebrow">Danh bạ</span>
        <h2 className="type-h2">{filtered.length} trường</h2>
      </div>

      {pageItems.length === 0 ? (
        <div className="qp-empty">
          <svg className="qp-empty__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
          </svg>
          <div className="qp-empty__title">Không tìm thấy trường</div>
          <p className="type-body-small">Thử đổi cấp học, xã hoặc từ khoá khác.</p>
        </div>
      ) : (
        <div className="qp-school-grid">
          {pageItems.map((s) => <SchoolCard key={s.slug} s={s} />)}
        </div>
      )}

      <ListPager pager={pager} />
    </>
  );
}
