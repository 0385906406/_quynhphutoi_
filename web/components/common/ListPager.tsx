"use client";
// Chân danh sách: desktop hiện Pagination; mobile hiện vùng "sentinel" cho infinite scroll.
import { useEffect, useRef } from "react";
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

// anchorId: nơi cuộn tới khi sang trang 2+ (đầu danh sách). firstPageAnchorId: nơi cuộn tới khi về trang 1
// (thường cao hơn — gồm cả khối nổi bật phía trên danh sách). Thiếu thì dùng phần tử ngay trước pager.
export function ListPager({ pager, anchorId, firstPageAnchorId }: { pager: PagerControls; anchorId?: string; firstPageAnchorId?: string }) {
  // Tách field: object pager chứa ref → React Compiler coi cả object là ref nếu đọc qua pager.x.
  const { page, totalPages, setPage, mobile, sentinelRef, hasMore, settledPage, busy } = pager;
  const wrapRef = useRef<HTMLDivElement>(null);

  // Cuộn về đầu danh sách SAU KHI trang mới đã hiện (settledPage đổi cùng lúc với nội dung).
  // Trước đây đo vị trí ngay lúc bấm — lúc đó bố cục còn của trang cũ (vd khối "nổi bật" ở trang 1 sắp
  // biến mất) nên cuộn lệch, đẩy người dùng xuống đáy trang.
  const shown = settledPage ?? page;
  const prevShown = useRef(shown);
  useEffect(() => {
    if (prevShown.current === shown) return;
    prevShown.current = shown;
    if (mobile) return;
    const id = shown === 1 && firstPageAnchorId ? firstPageAnchorId : anchorId;
    const target = (id ? document.getElementById(id) : null) ?? wrapRef.current?.previousElementSibling;
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY - stickyOffset();
    if (top < window.scrollY) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: Math.max(0, top), behavior: reduce ? "auto" : "smooth" });
    }
  }, [shown, mobile, anchorId, firstPageAnchorId]);

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

  return (
    <div ref={wrapRef} aria-busy={busy || undefined}>
      <Pagination page={page} totalPages={totalPages} onPage={setPage} />
    </div>
  );
}
