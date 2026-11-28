"use client";

// Gửi 1 tín hiệu nhẹ mỗi khi người dùng mở/chuyển sang một trang (kể cả điều hướng mềm của Next).
// Dùng sendBeacon: không chặn trang, không đọc phản hồi.
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function VisitTracker() {
  const pathname = usePathname();
  useEffect(() => {
    try {
      const body = JSON.stringify({ path: pathname, ref: document.referrer });
      if (!navigator.sendBeacon?.("/api/track", new Blob([body], { type: "application/json" }))) {
        void fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true });
      }
    } catch {}
  }, [pathname]);
  return null;
}
