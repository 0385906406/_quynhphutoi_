"use client";

// Danh sách bài đã lưu (từ localStorage) — mỗi thẻ có nút bỏ lưu.
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { NewsCard } from "@/components/news/NewsCard";
import { BOOKMARK_EVENT, getBookmarks, toggleBookmark } from "@/lib/bookmarks";
import type { Article } from "@/lib/news";

export function SavedList() {
  const [items, setItems] = useState<Article[] | null>(null);

  const load = useCallback(async () => {
    const slugs = getBookmarks();
    if (!slugs.length) { setItems([]); return; }
    try {
      const r = await fetch(`/api/news/saved?slugs=${encodeURIComponent(slugs.join(","))}`);
      const d = (await r.json()) as { items: Article[] };
      setItems(d.items ?? []);
    } catch { setItems([]); }
  }, []);

  useEffect(() => {
    // load() chỉ setState sau khi fetch xong (bất đồng bộ).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    const h = () => void load();
    window.addEventListener(BOOKMARK_EVENT, h);
    return () => window.removeEventListener(BOOKMARK_EVENT, h);
  }, [load]);

  if (items === null) return <div className="qp-foryou__skel" aria-busy="true">{[0, 1, 2, 3].map((i) => <span key={i} className="qp-skel qp-skel--card" />)}</div>;
  if (items.length === 0) {
    return (
      <div className="qp-empty">
        <div className="qp-empty__title">Chưa có bài nào được lưu</div>
        <p className="type-body-small">Khi đọc một bài, bấm “Lưu để đọc sau” để xem lại ở đây. <Link href="/tin-tuc">Đọc tin tức</Link></p>
      </div>
    );
  }
  return (
    <div className="qp-grid-news">
      {items.map((a) => (
        <div key={a.id} className="qp-foryou__item">
          <button type="button" className="qp-foryou__link" style={{ alignSelf: "flex-start" }} onClick={() => toggleBookmark(a.slug)}>✕ Bỏ lưu</button>
          <NewsCard a={a} />
        </div>
      ))}
    </div>
  );
}
