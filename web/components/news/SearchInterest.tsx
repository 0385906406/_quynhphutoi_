"use client";

// Trang tìm kiếm: ghi nhớ từ khoá vào hồ sơ sở thích; khi chưa nhập gì thì hiện "Tìm gần đây" (xoá được).
import { useEffect, useState } from "react";
import Link from "next/link";
import { clearInterest, INTEREST_EVENT, recentSearches, recordSearch } from "@/lib/interest";

export function SearchInterest({ query }: { query: string }) {
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => { if (query.trim().length >= 2) recordSearch(query); }, [query]);

  useEffect(() => {
    const read = () => setRecent(recentSearches());
    const t = window.setTimeout(read, 0);
    window.addEventListener(INTEREST_EVENT, read);
    return () => { window.clearTimeout(t); window.removeEventListener(INTEREST_EVENT, read); };
  }, []);

  if (query.trim().length >= 2 || recent.length === 0) return null;
  return (
    <div className="qp-foryou__recent">
      <div className="qp-foryou__recent-head">
        <b>Tìm gần đây</b>
        <button type="button" className="qp-foryou__link" onClick={() => clearInterest()}>Xoá lịch sử</button>
      </div>
      <div className="qp-foryou__chips">
        {recent.map((s) => <Link key={s} href={`/tim-kiem?q=${encodeURIComponent(s)}`} className="qp-foryou__chip">{s}</Link>)}
      </div>
    </div>
  );
}
