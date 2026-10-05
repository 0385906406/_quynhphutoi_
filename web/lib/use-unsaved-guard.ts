"use client";

// Chặn rời trang khi còn thay đổi CHƯA LƯU trong trình soạn admin:
//  • Đóng tab / tải lại / gõ URL khác → hộp cảnh báo của trình duyệt (beforeunload).
//  • Bấm link nội bộ (Next <Link> điều hướng mềm, không kích hoạt beforeunload) → hỏi lại.
// Dùng hộp xác nhận ĐỒNG BỘ của trình duyệt vì phải quyết định ngay trong sự kiện click.
import { useEffect } from "react";

const MSG = "Bạn có thay đổi chưa lưu. Rời trang sẽ mất các thay đổi này — vẫn rời đi?";

export function useUnsavedGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || (url.pathname === location.pathname && url.search === location.search)) return;
      if (!window.confirm(MSG)) { e.preventDefault(); e.stopPropagation(); }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true); // capture: chạy trước Next <Link>
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);
}

/** Hỏi trước khi rời bằng nút trong trang (vd "Huỷ") — trả true nếu được phép rời. */
export function confirmLeave(dirty: boolean): boolean {
  return !dirty || window.confirm(MSG);
}
