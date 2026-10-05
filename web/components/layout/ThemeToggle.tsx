"use client";

// Nút chuyển giao diện sáng / tối. Trạng thái nằm ở <html data-theme> (script đầu trang đặt
// trước khi vẽ → không nháy trắng); lựa chọn lưu localStorage "qp-theme".
// Chưa chọn lần nào → theo cài đặt hệ điều hành (và tự đổi khi hệ điều hành đổi).
import { useEffect, useSyncExternalStore } from "react";
import { THEME_KEY } from "@/lib/theme";

type Theme = "light" | "dark";

function subscribe(cb: () => void) {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => mo.disconnect();
}
const getSnapshot = (): Theme => (document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");
const getServerSnapshot = (): Theme | null => null;

function setTheme(t: Theme, persist: boolean) {
  document.documentElement.setAttribute("data-theme", t);
  if (persist) { try { localStorage.setItem(THEME_KEY, t); } catch {} }
}

// withLabel: kèm chữ "Giao diện tối/sáng" (dùng trong menu điện thoại). Cả 2 nhãn luôn render,
// CSS theo data-theme chỉ hiện 1 → không lệch hydration.
export function ThemeToggle({ className = "qp-icon-btn", withLabel = false }: { className?: string; withLabel?: boolean }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Chưa có lựa chọn riêng → bám theo hệ điều hành khi nó đổi (vd tự tối lúc chiều tối).
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      let saved: string | null = null;
      try { saved = localStorage.getItem(THEME_KEY); } catch {}
      if (saved !== "light" && saved !== "dark") setTheme(mq.matches ? "dark" : "light", false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const isDark = theme === "dark";
  return (
    <button
      type="button"
      className={`${className} qp-theme-toggle`}
      aria-label={isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
      title={isDark ? "Giao diện sáng" : "Giao diện tối"}
      aria-pressed={theme === null ? undefined : isDark}
      onClick={() => setTheme(isDark ? "light" : "dark", true)}
    >
      {/* Trước hydration (theme=null) hiện cả 2 icon, CSS chỉ cho thấy icon đúng theo data-theme. */}
      <svg className="qp-theme-toggle__moon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
      <svg className="qp-theme-toggle__sun" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
      {withLabel && (
        <>
          <span className="qp-theme-toggle__moon">Giao diện tối</span>
          <span className="qp-theme-toggle__sun">Giao diện sáng</span>
        </>
      )}
    </button>
  );
}
