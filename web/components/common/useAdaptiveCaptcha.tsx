"use client";

// reCAPTCHA "thích nghi" cho các form công khai (trừ đăng ký / quên / đặt lại mật khẩu).
// Mặc định KHÔNG hiện ô tick và không gửi token. Khi server thấy khả nghi (vượt ngưỡng
// rate-limit) sẽ trả 428 + { recaptchaRequired: true } → hook bật ô tick để người dùng
// xác nhận rồi gửi lại.
//
// Cách dùng trong form:
//   const cap = useAdaptiveCaptcha();
//   ...
//   const res = await fetch(url, { ..., body: JSON.stringify({ ..., recaptchaToken: cap.token() }) });
//   const data = await res.json().catch(() => ({}));
//   cap.reset();
//   if (cap.challenged(res, data)) { toast.error("Vui lòng xác nhận reCAPTCHA rồi gửi lại."); return; }
//   if (!res.ok) { ... }
//   ...
//   {cap.slot}   // chèn vào JSX nơi muốn hiện ô tick
import { useRef, useState, type ReactNode } from "react";
import { Recaptcha, type RecaptchaHandle } from "@/components/common/Recaptcha";

export function useAdaptiveCaptcha() {
  const ref = useRef<RecaptchaHandle>(null);
  const [need, setNeed] = useState(false);

  const slot: ReactNode = need ? (
    <div className="qp-recaptcha-gate">
      <p className="type-body-small text-muted" style={{ marginBottom: "var(--space-2)" }}>
        Hệ thống phát hiện thao tác bất thường. Vui lòng xác nhận “Tôi không phải robot” để tiếp tục.
      </p>
      <Recaptcha ref={ref} className="qp-recaptcha" />
    </div>
  ) : null;

  return {
    /** true nếu đang yêu cầu reCAPTCHA (ô tick đang hiện). */
    need,
    /** Token gửi kèm body — rỗng khi chưa cần. */
    token: () => (need ? ref.current?.getToken() ?? "" : ""),
    /** Xoá tick để lấy token mới (token v2 dùng 1 lần). */
    reset: () => ref.current?.reset(),
    /** Gọi sau fetch: nếu server đòi reCAPTCHA → bật ô tick, trả true để form dừng luồng success. */
    challenged: (res: Response, data?: { recaptchaRequired?: boolean }) => {
      if (res.status === 428 || data?.recaptchaRequired) { setNeed(true); return true; }
      return false;
    },
    /** JSX ô tick (null khi chưa cần) — chèn vào form. */
    slot,
  };
}
