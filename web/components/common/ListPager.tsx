"use client";
// Chân danh sách: desktop hiện Pagination; mobile hiện vùng "sentinel" cho infinite scroll.
import { useRef } from "react";
import { Pagination } from "@/components/common/Pagination";
import type { PagerControls } from "@/lib/use-paged-list";

// Chiều cao phần header dính (TopBar + Marquee) — để đầu danh sách không bị che.
function stickyOffset(): number {
  let h = 0;
  for (const sel of [".qp-topbar", ".qp-marquee"]) {
    const el = document.querySelector<HTMLElement>(sel);
    if (el) h += el.getBoundingClientRect().height;
  }
  return h + 16;
}

export function ListPager({ pager }: { pager: PagerControls }) {
  // Tách field: object pager chứa ref → React Compiler coi cả object là ref nếu đọc qua pager.x.
  const { page, totalPages, setPage, mobile, sentinelRef, hasMore } = pager;
  const wrapRef = useRef<HTMLDivElement>(null);

  if (mobile) {
    return (
      <div ref={sentinelRef} className="qp-infinite" aria-hidden>
        {hasMore && (
          <>
            <span className="qp-infinite__spin" />
            <span>Đang tải thêm…</span>
          </>
        )}
      </div>
    );
  }

  // Đổi trang → cuộn về đầu danh sách (lưới kết quả nằm ngay trước ListPager),
  // nếu không người dùng vẫn đứng ở đáy trang sau khi bấm số trang.
  const onPage = (p: number) => {
    setPage(p);
    const list = wrapRef.current?.previousElementSibling;
    if (!list) return;
    const top = list.getBoundingClientRect().top + window.scrollY - stickyOffset();
    if (top < window.scrollY) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
    }
  };

  return (
    <div ref={wrapRef}>
      <Pagination page={page} totalPages={totalPages} onPage={onPage} />
    </div>
  );
}
