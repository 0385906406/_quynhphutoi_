"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Giữ nguyên vị trí scroll khi chuyển trang (thay vì cuộn lên đầu mặc định).
 * Đặt component này bên trong layout — nó không render gì ra DOM.
 */
export function ScrollRestoration() {
  const pathname = usePathname();
  const lastY = useRef(0);

  // Theo dõi vị trí scroll liên tục
  useEffect(() => {
    const save = () => { lastY.current = window.scrollY; };
    window.addEventListener("scroll", save, { passive: true });
    return () => window.removeEventListener("scroll", save);
  }, []);

  // Sau khi Next.js cuộn về đầu trang, khôi phục lại vị trí cũ
  useEffect(() => {
    // rAF đảm bảo chạy sau khi Next.js đã xử lý scroll của nó
    const id = requestAnimationFrame(() => {
      window.scrollTo(0, lastY.current);
    });
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return null;
}
