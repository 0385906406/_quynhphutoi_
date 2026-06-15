"use client";

// Form đăng ký nhận tin qua email — POST /api/newsletter, phản hồi bằng toast.
import { useState } from "react";
import { useToast } from "@/components/common/Toast";

export function NewsletterForm({ source = "web" }: { source?: string }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const v = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { toast.error("Email không hợp lệ."); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: v, source }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(data.error || "Đăng ký thất bại."); return; }
      setEmail("");
      toast.success(data.isNew === false ? "Email này đã đăng ký rồi." : "Đã đăng ký nhận tin. Cảm ơn bạn!");
    } catch { toast.error("Lỗi kết nối, vui lòng thử lại."); } finally { setBusy(false); }
  }

  return (
    <form className="qp-newsletter__form" onSubmit={onSubmit}>
      <input type="email" placeholder="Email của bạn" aria-label="Email" required value={email}
        onChange={(e) => setEmail(e.target.value)} />
      <button className="qp-btn-secondary on-dark" type="submit" disabled={busy}>
        {busy ? "Đang gửi…" : <>Đăng ký <span className="qp-arrow">→</span></>}
      </button>
    </form>
  );
}
