"use client";

// Hệ thống toast dùng chung toàn site (admin + client). Đặt ở góc TRÊN PHẢI, tự ẩn
// sau 4s, có success / error / info. Dùng: const { toast } = useToast(); toast.success("…").
// Provider gắn 1 lần ở app/layout.tsx nên mọi component con đều gọi được.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

type ToastType = "success" | "error" | "info";
type ToastItem = { id: number; type: ToastType; text: string };

export type ToastApi = {
  success: (text: string) => void;
  error: (text: string) => void;
  info: (text: string) => void;
  show: (text: string, type?: ToastType) => void;
};

const ToastCtx = createContext<ToastApi | null>(null);

export function useToast(): { toast: ToastApi } {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast phải dùng bên trong <ToastProvider>");
  return { toast: ctx };
}

let _seq = 0;

function Icon({ type }: { type: ToastType }) {
  const p = { viewBox: "0 0 24 24", width: 20, height: 20, fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (type === "success") return (<svg {...p}><circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.5 2.5 4.5-5" /></svg>);
  if (type === "error") return (<svg {...p}><circle cx="12" cy="12" r="9" /><path d="M15 9l-6 6M9 9l6 6" /></svg>);
  return (<svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 16v-4M12 8h.01" /></svg>);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const remove = useCallback((id: number) => {
    setItems((cur) => cur.filter((t) => t.id !== id));
    const t = timers.current.get(id);
    if (t) { clearTimeout(t); timers.current.delete(id); }
  }, []);

  const show = useCallback((text: string, type: ToastType = "info") => {
    const msg = (text ?? "").trim();
    if (!msg) return;
    const id = ++_seq;
    setItems((cur) => [...cur, { id, type, text: msg }].slice(-4)); // tối đa 4 toast cùng lúc
    timers.current.set(id, setTimeout(() => remove(id), 4000));
  }, [remove]);

  // Dọn timer khi provider unmount.
  useEffect(() => {
    const map = timers.current;
    return () => { map.forEach((t) => clearTimeout(t)); map.clear(); };
  }, []);

  const api = useMemo<ToastApi>(() => ({
    success: (t) => show(t, "success"),
    error: (t) => show(t, "error"),
    info: (t) => show(t, "info"),
    show,
  }), [show]);

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="qp-toasts" role="region" aria-live="polite" aria-label="Thông báo">
        {items.map((t) => (
          <div key={t.id} className={`qp-toast is-${t.type}`} role="status">
            <span className="qp-toast__icon"><Icon type={t.type} /></span>
            <span className="qp-toast__text">{t.text}</span>
            <button type="button" className="qp-toast__close" aria-label="Đóng thông báo" onClick={() => remove(t.id)}>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
