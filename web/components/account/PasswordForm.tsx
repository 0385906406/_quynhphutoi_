"use client";

// Form đổi mật khẩu — nhập mật khẩu hiện tại + mật khẩu mới (xác nhận lại).
import { useState } from "react";
import { useAdaptiveCaptcha } from "@/components/common/useAdaptiveCaptcha";
import { useToast } from "@/components/common/Toast";

export function PasswordForm() {
  const { toast } = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const cap = useAdaptiveCaptcha();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (next.length < 6) { toast.error("Mật khẩu mới phải có ít nhất 6 ký tự."); return; }
    if (next !== confirm) { toast.error("Xác nhận mật khẩu không khớp."); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current, next, recaptchaToken: cap.token() }),
      });
      const data = await res.json().catch(() => ({}));
      cap.reset();
      if (cap.challenged(res, data)) { toast.error("Vui lòng xác nhận reCAPTCHA rồi gửi lại."); return; }
      if (!res.ok) { toast.error(data.error || "Có lỗi xảy ra."); return; }
      toast.success("Đã đổi mật khẩu thành công.");
      setCurrent(""); setNext(""); setConfirm("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="qp-acc-form" onSubmit={submit}>
      <div className="qp-form-group">
        <label className="qp-label" htmlFor="pw-current">Mật khẩu hiện tại <span className="req">*</span></label>
        <input id="pw-current" type="password" className="qp-input" value={current} onChange={(e) => setCurrent(e.target.value)} required autoComplete="current-password" />
      </div>
      <div className="qp-form-group">
        <label className="qp-label" htmlFor="pw-next">Mật khẩu mới <span className="req">*</span></label>
        <input id="pw-next" type="password" className="qp-input" value={next} onChange={(e) => setNext(e.target.value)} required minLength={6} autoComplete="new-password" placeholder="Ít nhất 6 ký tự" />
      </div>
      <div className="qp-form-group">
        <label className="qp-label" htmlFor="pw-confirm">Xác nhận mật khẩu mới <span className="req">*</span></label>
        <input id="pw-confirm" type="password" className="qp-input" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} autoComplete="new-password" />
      </div>
      {cap.slot}
      <button type="submit" className="qp-btn-primary" disabled={busy || !current || !next || !confirm}>{busy ? "Đang đổi…" : "Đổi mật khẩu"}</button>
    </form>
  );
}
