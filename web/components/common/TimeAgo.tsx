"use client";

// Hiển thị thời gian tương đối ("5 phút trước") mà KHÔNG gây hydration mismatch:
//  • Lần render đầu (SSR + hydration client): hiện ngày tuyệt đối formatDate(iso) —
//    xác định, server & client khớp nhau → không cảnh báo.
//  • Sau khi mount: chuyển sang tương đối theo giờ CLIENT.
// Bọc trong <time> + title = ngày tuyệt đối (hover xem ngày chính xác).
import { useEffect, useState } from "react";
import { formatDate, relativeTime } from "@/lib/datetime";

export function TimeAgo({ iso, className }: { iso: string; className?: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); }, []);
  return (
    <time dateTime={iso} title={formatDate(iso)} className={className}>
      {now === null ? formatDate(iso) : relativeTime(iso, now)}
    </time>
  );
}
