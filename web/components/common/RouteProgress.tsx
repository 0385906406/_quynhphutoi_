"use client";

// Thanh tiến trình mảnh ở đầu trang khi chuyển trang (bấm link nội bộ) — cho cảm giác phản hồi tức thì.
import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function Inner() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [w, setW] = useState(0);
  const [on, setOn] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = () => { if (timer.current) { clearInterval(timer.current); timer.current = null; } };

  // Trang mới đã hiện → chạy nốt 100% rồi ẩn.
  useEffect(() => {
    stop();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- đồng bộ thanh với việc đổi route
    setW(100);
    const t = setTimeout(() => { setOn(false); setW(0); }, 260);
    return () => clearTimeout(t);
  }, [pathname, search]);

  useEffect(() => {
    function start() {
      stop(); setOn(true); setW(12);
      timer.current = setInterval(() => setW((x) => (x < 85 ? x + (90 - x) * 0.12 : x)), 220);
    }
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      let u: URL; try { u = new URL(href, location.href); } catch { return; }
      if (u.origin !== location.origin || (u.pathname === location.pathname && u.search === location.search)) return;
      start();
    }
    document.addEventListener("click", onClick);
    return () => { document.removeEventListener("click", onClick); stop(); };
  }, []);

  return (
    <div className={`qp-progress${on ? " is-on" : ""}`} role="progressbar" aria-hidden="true">
      <div className="qp-progress__bar" style={{ width: `${w}%` }} />
    </div>
  );
}

export function RouteProgress() {
  return <Suspense fallback={null}><Inner /></Suspense>;
}
