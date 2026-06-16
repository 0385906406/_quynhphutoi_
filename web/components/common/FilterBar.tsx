"use client";
// Thanh lọc dùng chung — GIỮ NGUYÊN cấu trúc .qp-toolbar gốc (desktop không đổi).
// Chỉ thêm: 1 icon lọc đè lên cuối ô tìm kiếm; trên MOBILE bấm icon để hiện/ẩn các select.
// KHÔNG tạo khung/card mới — các select hiện ngay trong luồng toolbar gốc.
import { useState, type ReactNode } from "react";

function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 5h16M7 12h10M10 19h4" />
    </svg>
  );
}

export function FilterBar({
  className = "",
  searchInput,
  children,
  activeCount = 0,
}: {
  className?: string;        // class gốc của form (vd "qp-school-toolbar qp-lf-toolbar")
  searchInput: ReactNode;    // chỉ phần <input> tìm kiếm
  children?: ReactNode;      // các trường .qp-toolbar__field
  activeCount?: number;      // số bộ lọc đang áp (badge trên icon)
}) {
  const [open, setOpen] = useState(false);
  const hasFields = Boolean(children);

  return (
    <form
      className={`qp-toolbar ${className} qp-toolbar--filterable${open ? " is-filters-open" : ""}`.replace(/\s+/g, " ").trim()}
      role="search"
      onSubmit={(e) => e.preventDefault()}
    >
      <div className="qp-toolbar__search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
        </svg>
        {searchInput}
        {hasFields && (
          <button
            type="button"
            className={`qp-toolbar__filtericon${activeCount > 0 ? " has-active" : ""}${open ? " is-open" : ""}`}
            aria-label="Bộ lọc"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            <FilterIcon />
            {activeCount > 0 && <span className="qp-toolbar__filterdot" aria-hidden>{activeCount}</span>}
          </button>
        )}
      </div>
      {children}
    </form>
  );
}
