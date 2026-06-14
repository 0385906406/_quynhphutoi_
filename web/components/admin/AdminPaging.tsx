"use client";

// Phân trang dùng chung cho mọi bảng admin: hook cắt trang + control chọn số dòng/trang.
import { useEffect, useMemo, useState } from "react";

export function usePagination<T>(items: T[], initialSize = 20) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialSize);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);
  // Khi danh sách/lọc/số dòng đổi làm dư trang → kéo về trang cuối hợp lệ.
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [totalPages, page]);
  const paged = useMemo(() => items.slice((safePage - 1) * pageSize, safePage * pageSize), [items, safePage, pageSize]);
  return { paged, page: safePage, setPage, pageSize, setPageSize, totalPages, total: items.length };
}

const SIZES = [10, 20, 50, 100];

export function PageSizeControl({ value, onChange, total }: { value: number; onChange: (n: number) => void; total?: number }) {
  return (
    <label className="qp-admin-pagesize">
      <span className="type-body-small text-muted">Hiển thị</span>
      <select className="qp-select" value={value} onChange={(e) => onChange(Number(e.target.value))}>
        {SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
      </select>
      <span className="type-body-small text-muted">dòng/trang{typeof total === "number" ? ` · ${total} mục` : ""}</span>
    </label>
  );
}
