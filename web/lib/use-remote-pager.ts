"use client";
// Phân trang qua API (thay cho usePagedList khi dữ liệu nằm trên máy chủ).
// - Desktop: hiện 1 trang; đổi trang → gọi API, trong lúc chờ GIỮ NGUYÊN nội dung cũ (làm mờ) để trang
//   không co/nhảy; nội dung mới và `settledPage` đổi cùng 1 lần vẽ → ListPager cuộn đúng chỗ sau khi vẽ.
// - Trang đã tải được lưu tạm (quay lại tức thì) và trang kế tiếp được tải trước.
// - Mobile: cuộn tới đáy thì tự gọi trang tiếp theo (nối thêm vào danh sách).
// - Đổi bộ lọc (filterKey khác) → tự về trang 1, không cần gọi reset.
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

export type RemotePage<T> = { items: T[]; total: number; totalPages: number };
export type RemoteSeed<T> = { filterKey: string; page: number; data: RemotePage<T> };

type Shown<T> = { filterKey: string; page: number; data: RemotePage<T> };

const MQ = "(max-width: 767px)";
const subscribeMq = (cb: () => void) => {
  const mq = window.matchMedia(MQ);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const readMq = () => window.matchMedia(MQ).matches;

const CACHE_MAX = 80;
function withEntry<T>(prev: Map<string, RemotePage<T>>, key: string, data: RemotePage<T>) {
  const next = new Map(prev);
  next.delete(key);
  next.set(key, data);
  while (next.size > CACHE_MAX) next.delete(next.keys().next().value as string);
  return next;
}

export function useRemotePager<T>({ filterKey, fetchPage, seeds = [] }: {
  filterKey: string;
  fetchPage: (page: number, signal: AbortSignal) => Promise<RemotePage<T>>;
  seeds?: RemoteSeed<T>[];
}) {
  const mobile = useSyncExternalStore(subscribeMq, readMq, () => false);
  const [cache, setCache] = useState(() => new Map(seeds.map((s) => [`${s.filterKey}|${s.page}`, s.data])));
  const [nav, setNav] = useState({ key: filterKey, page: 1 });
  const [attempt, setAttempt] = useState(0);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const [last, setLast] = useState<Shown<T> | null>(() => {
    const s = seeds.find((x) => x.filterKey === filterKey && x.page === 1);
    return s ? { filterKey, page: 1, data: s.data } : null;
  });

  const page = nav.key === filterKey ? nav.page : 1; // đổi bộ lọc → về trang 1
  const setPage = (p: number) => setNav({ key: filterKey, page: p });
  const curKey = `${filterKey}|${page}`;
  const cur = cache.get(curKey);
  const hit = !!cur;

  // Trang đang yêu cầu đã có dữ liệu → đó là trang "đang hiển thị" (điều chỉnh state ngay khi render).
  if (cur && (last?.filterKey !== filterKey || last.page !== page || last.data !== cur)) {
    setLast({ filterKey, page, data: cur });
  }

  const fetchRef = useRef(fetchPage);
  useEffect(() => { fetchRef.current = fetchPage; });

  // Tải trang đang yêu cầu nếu chưa có.
  useEffect(() => {
    if (hit) return;
    const ctrl = new AbortController();
    fetchRef.current(page, ctrl.signal).then(
      (data) => setCache((prev) => withEntry(prev, curKey, data)),
      () => { if (!ctrl.signal.aborted) setFailedKey(curKey); },
    );
    return () => ctrl.abort();
  }, [hit, curKey, page, attempt]);

  // Desktop: tải trước trang kế tiếp để bấm "trang sau" gần như tức thì.
  const nextKey = `${filterKey}|${page + 1}`;
  const nextHit = cache.has(nextKey);
  const curPages = cur?.totalPages ?? 0;
  useEffect(() => {
    if (!hit || mobile || nextHit || page >= curPages) return;
    const ctrl = new AbortController();
    // Chờ 300ms: tránh tải thừa khi đang đổi bộ lọc liên tục, và khi vừa vào trang trên điện thoại
    // (cờ `mobile` chỉ đúng sau lần hydrate đầu).
    const t = setTimeout(() => {
      fetchRef.current(page + 1, ctrl.signal).then(
        (data) => setCache((prev) => withEntry(prev, nextKey, data)),
        () => { /* tải trước lỗi thì bỏ qua — bấm sang trang đó sẽ tải lại */ },
      );
    }, 300);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [hit, mobile, nextHit, page, curPages, nextKey]);

  const loading = !hit && failedKey !== curKey;
  const error = !hit && failedKey === curKey;
  const retry = () => { setFailedKey(null); setAttempt((a) => a + 1); };

  // Nội dung đang hiển thị: desktop = 1 trang; mobile = nối các trang 1..last.page.
  const items: T[] = !last
    ? []
    : mobile
      ? Array.from({ length: last.page }, (_, i) => cache.get(`${last.filterKey}|${i + 1}`)?.items ?? []).flat()
      : last.data.items;
  const total = last?.data.total ?? 0;
  const totalPages = last?.data.totalPages ?? 1;
  const hasMore = mobile && !!last && last.page < last.data.totalPages;

  // Mobile: sentinel ở đáy → nạp trang tiếp theo.
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!mobile || !hasMore || loading) return;
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting && last) setNav({ key: filterKey, page: last.page + 1 }); },
      { rootMargin: "400px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [mobile, hasMore, loading, filterKey, last]);

  return {
    items, total, totalPages, page, setPage, mobile, sentinelRef, hasMore,
    settledPage: last?.page ?? 1, busy: loading, loading, error, retry,
  };
}
