"use client";

// Đăng ký service worker (chỉ khi chạy thật, không phải lúc phát triển).
import { useEffect } from "react";

export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    const reg = () => navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
    if (document.readyState === "complete") reg(); else window.addEventListener("load", reg, { once: true });
  }, []);
  return null;
}
