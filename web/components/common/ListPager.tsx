"use client";
// Chân danh sách: desktop hiện Pagination; mobile hiện vùng "sentinel" cho infinite scroll.
import { Pagination } from "@/components/common/Pagination";
import type { PagerControls } from "@/lib/use-paged-list";

export function ListPager({ pager }: { pager: PagerControls }) {
  if (pager.mobile) {
    return (
      <div ref={pager.sentinelRef} className="qp-infinite" aria-hidden>
        {pager.hasMore && (
          <>
            <span className="qp-infinite__spin" />
            <span>Đang tải thêm…</span>
          </>
        )}
      </div>
    );
  }
  return <Pagination page={pager.page} totalPages={pager.totalPages} onPage={pager.setPage} />;
}
