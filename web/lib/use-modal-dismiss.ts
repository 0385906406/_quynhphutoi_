import { useEffect, useRef } from "react";

// Hook dùng chung cho modal admin: khi modal mở thì
//   1) khóa cuộn nền (document.body overflow=hidden) → chống "scroll-bleed" trên điện thoại,
//   2) bấm phím Esc để đóng.
// Dùng ref cho onClose để effect chỉ chạy lại khi `open` đổi (không re-bind mỗi render
// dù caller truyền arrow inline).
export function useModalDismiss(open: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCloseRef.current(); };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);
}
