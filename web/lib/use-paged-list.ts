"use client";
// Phân trang dùng chung cho mọi trang danh sách client:
// - Desktop (≥768px): phân trang theo số trang (Pagination).
// - Mobile (<768px): KHÔNG phân trang — cuộn tới đáy thì tự nạp thêm (infinite scroll).
// Khi đổi bộ lọc, gọi reset() để về đầu danh sách.
import { useEffect, useRef, useState, type RefObject } from "react";

// Phần điều khiển phân trang (không gồm items) — đủ cho <ListPager/>.
export type PagerControls = {
  page: number;
  setPage: (p: number) => void;
  totalPages: number;
  mobile: boolean;
  sentinelRef: RefObject<HTMLDivElement | null>;
  hasMore: boolean;
};

export type PagedList<T> = PagerControls & {
  items: T[];
  reset: () => void;
};

export function usePagedList<T>(all: T[], pageSize: number): PagedList<T> {
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(pageSize); // số item đang hiện ở chế độ mobile
  const [mobile, setMobile] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Phát hiện mobile (sau khi mount để tránh lệch hydration).
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const total = all.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const hasMore = mobile && count < total;

  // Infinite scroll: tạo lại observer mỗi khi count đổi để tiếp tục nạp nếu sentinel vẫn trong tầm nhìn.
  useEffect(() => {
    if (!mobile || count >= total) return;
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setCount((c) => Math.min(c + pageSize, total));
      },
      { rootMargin: "400px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [mobile, count, total, pageSize]);

  const items = mobile
    ? all.slice(0, Math.min(count, total))
    : all.slice((safePage - 1) * pageSize, safePage * pageSize);

  const reset = () => {
    setPage(1);
    setCount(pageSize);
  };

  return { items, page: safePage, setPage, totalPages, mobile, sentinelRef, hasMore, reset };
}
