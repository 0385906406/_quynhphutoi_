"use client";

// Phân trang gọn: luôn hiện trang đầu/cuối + trang hiện tại ±1, phần giữa rút gọn "…".
type Item = number | "dots";

function buildPages(current: number, total: number, sibling = 1): Item[] {
  const left = Math.max(2, current - sibling);
  const right = Math.min(total - 1, current + sibling);
  const out: Item[] = [1];
  if (left > 2) out.push("dots");
  for (let i = left; i <= right; i++) out.push(i);
  if (right < total - 1) out.push("dots");
  if (total > 1) out.push(total);
  return out;
}

export function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }) {
  if (totalPages <= 1) return null;
  const items = buildPages(page, totalPages);

  return (
    <div className="qp-pagination">
      <button type="button" className={page === 1 ? "is-disabled" : ""} aria-label="Trang trước" disabled={page === 1} onClick={() => onPage(page - 1)}>‹</button>
      {items.map((it, i) =>
        it === "dots" ? (
          <span key={`d${i}`} className="qp-pagination__dots" aria-hidden>…</span>
        ) : (
          <button key={it} type="button" className={it === page ? "is-active" : ""} aria-current={it === page ? "page" : undefined} onClick={() => onPage(it)}>{it}</button>
        ),
      )}
      <button type="button" className={page === totalPages ? "is-disabled" : ""} aria-label="Trang sau" disabled={page === totalPages} onClick={() => onPage(page + 1)}>›</button>
    </div>
  );
}
