"use client";

// Hộp xác nhận thay cho window.confirm() của trình duyệt: cùng giao diện site (sáng/tối),
// nút đỏ cho thao tác nguy hiểm, Esc = huỷ, Enter = đồng ý, vừa màn hình điện thoại.
// Gọi ở bất kỳ đâu (không cần Provider):  if (!(await confirmDialog("Xoá bài X?"))) return;
import { useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";

export type ConfirmOptions = {
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;   // mặc định: tự đoán theo nội dung (Xoá / Khoá / Cấp quyền…)
};

// Câu hỏi mang tính huỷ hoại → nút đỏ + tiêu đề cảnh báo.
const DANGER_RE = /^(xoá|xóa|khoá|khóa|cấp quyền|từ chối|chắc chắn chạy)/i;

function Dialog({ message, opts, onDone }: { message: string; opts: ConfirmOptions; onDone: (ok: boolean) => void }) {
  const okRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const danger = opts.danger ?? DANGER_RE.test(message.trim());
  const [first, ...rest] = message.split("\n");
  const title = opts.title ?? (danger ? "Xác nhận thao tác" : "Xác nhận");
  const okLabel = opts.confirmLabel ?? (/^(xoá|xóa)/i.test(message.trim()) ? "Xoá" : "Đồng ý");

  useEffect(() => {
    // Thao tác nguy hiểm → con trỏ ở "Huỷ" (lỡ nhấn Enter không xoá nhầm); còn lại → "Đồng ý".
    (danger ? cancelRef : okRef).current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onDone(false); }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prevOverflow; };
  }, [onDone, danger]);

  return (
    <div className="qp-confirm" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onDone(false); }}>
      <div className={`qp-confirm__box${danger ? " is-danger" : ""}`} role="alertdialog" aria-modal="true" aria-labelledby="qp-confirm-title" aria-describedby="qp-confirm-msg">
        <div className="qp-confirm__icon" aria-hidden>{danger ? "!" : "?"}</div>
        <h2 id="qp-confirm-title" className="qp-confirm__title">{title}</h2>
        <div id="qp-confirm-msg" className="qp-confirm__msg">
          <p>{first}</p>
          {rest.filter((l) => l.trim()).map((l, i) => <p key={i} className="qp-confirm__sub">{l}</p>)}
        </div>
        <div className="qp-confirm__actions">
          <button ref={cancelRef} type="button" className="qp-btn-outline" onClick={() => onDone(false)}>{opts.cancelLabel ?? "Huỷ"}</button>
          <button ref={okRef} type="button" className={danger ? "qp-confirm__danger" : "qp-btn-primary"} onClick={() => onDone(true)}>{okLabel}</button>
        </div>
      </div>
    </div>
  );
}

export function confirmDialog(message: string, opts: ConfirmOptions = {}): Promise<boolean> {
  if (typeof document === "undefined") return Promise.resolve(false);
  return new Promise((resolve) => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    const prevFocus = document.activeElement as HTMLElement | null;
    const done = (ok: boolean) => {
      root.unmount();
      host.remove();
      prevFocus?.focus?.();
      resolve(ok);
    };
    root.render(<Dialog message={message} opts={opts} onDone={done} />);
  });
}
