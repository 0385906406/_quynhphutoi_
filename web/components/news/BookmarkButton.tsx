"use client";

// Nút "Lưu bài" ở trang đọc: lưu trên máy, xem lại ở /da-luu.
import { useEffect, useState } from "react";
import Link from "next/link";
import { BOOKMARK_EVENT, isBookmarked, toggleBookmark } from "@/lib/bookmarks";

export function BookmarkButton({ slug }: { slug: string }) {
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    const read = () => setSaved(isBookmarked(slug));
    const t = window.setTimeout(read, 0);
    window.addEventListener(BOOKMARK_EVENT, read);
    return () => { window.clearTimeout(t); window.removeEventListener(BOOKMARK_EVENT, read); };
  }, [slug]);

  return (
    <div className="qp-bookmark">
      <button type="button" className={`qp-bookmark__btn${saved ? " is-on" : ""}`} aria-pressed={saved} onClick={() => setSaved(toggleBookmark(slug))}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" /></svg>
        {saved ? "Đã lưu" : "Lưu để đọc sau"}
      </button>
      {saved && <Link href="/da-luu" className="qp-bookmark__link">Xem bài đã lưu →</Link>}
    </div>
  );
}
