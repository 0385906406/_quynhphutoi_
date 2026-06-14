"use client";

// Soạn & gửi thông báo broadcast tới người dùng (hoặc chỉ admin).
import { useState } from "react";
import { useToast } from "@/components/common/Toast";

export function NotifyComposer() {
  const [title, setTitle] = useState("");
  const [href, setHref] = useState("/thong-bao");
  const [adminsOnly, setAdminsOnly] = useState(false);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { toast.error("Nhập nội dung thông báo."); return; }
    if (!confirm(adminsOnly ? "Gửi thông báo tới tất cả admin?" : "Gửi thông báo tới TẤT CẢ người dùng?")) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), href: href.trim(), adminsOnly }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(data.error || "Không gửi được."); return; }
      toast.success(`Đã gửi tới ${data.sent} người.`);
      setTitle("");
    } finally { setBusy(false); }
  }

  return (
    <form className="qp-acc-card" onSubmit={submit} style={{ maxWidth: 640 }}>
      <div className="qp-acc-card__title">Soạn thông báo</div>
      <div className="qp-form-group">
        <label className="qp-label">Nội dung <span className="req">*</span></label>
        <input className="qp-input" value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} placeholder="VD: Cổng thông tin bảo trì tối nay 22h–23h" />
      </div>
      <div className="qp-form-group">
        <label className="qp-label">Liên kết khi bấm vào</label>
        <input className="qp-input" value={href} onChange={(e) => setHref(e.target.value)} placeholder="/thong-bao hoặc /tin-tuc/..." />
      </div>
      <label className="qp-check" style={{ marginBottom: 16 }}>
        <input type="checkbox" checked={adminsOnly} onChange={(e) => setAdminsOnly(e.target.checked)} /> Chỉ gửi cho admin
      </label>
      <div>
        <button type="submit" className="qp-btn-primary" disabled={busy}>{busy ? "Đang gửi…" : "Gửi thông báo"}</button>
      </div>
      <p className="type-body-small text-muted" style={{ marginTop: 12 }}>
        Thông báo sẽ xuất hiện ở chuông 🔔 của người nhận. Hành động này không thể thu hồi.
      </p>
    </form>
  );
}
