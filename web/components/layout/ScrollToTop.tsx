"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Mỗi lần pathname thay đổi (chuyển trang) → cuộn lên đầu ngay lập tức. */
export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    // Gán trực tiếp tránh bị scroll-behavior: smooth trong CSS ghi đè
    document.documentElement.scrollTop = 0;
  }, [pathname]);

  return null;
}
