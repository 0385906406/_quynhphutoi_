"use client";

// Danh sách tin mua bán chờ duyệt (admin) — Duyệt / Từ chối.
import { useState } from "react";
import { formatDateTime } from "@/lib/datetime";
import { useToast } from "@/components/common/Toast";

export type PendingAd = { slug: string; title: string; categoryLabel: string; priceText: string; ward: string; phone: string; postedByName: string; createdAt: string };

export function ClassifiedModerationList({ initial }: { initial: PendingAd[] }) {
  const { toast } = useToast();
  const [items, setItems] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);

  async function approve(slug: string) {
    setBusy(slug);
    try {
      const res = await fetch(`/api/admin/mua-ban/${slug}/approve`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ approved: true }) });
      if (!res.ok) { const d = await res.json().catch(() => ({})); toast.error(d.error || "Duyệt thất bại."); return; }
      setItems((c) => c.filter((i) => i.slug !== slug));
    } catch { toast.error("Lỗi kết nối."); } finally { setBusy(null); }
  }
  async function reject(slug: string) {
    if (!confirm("Từ chối và xoá hẳn tin này?")) return;
    setBusy(slug);
    try {
      const res = await fetch(`/api/admin/mua-ban/${slug}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json().catch(() => ({})); toast.error(d.error || "Xoá thất bại."); return; }
      setItems((c) => c.filter((i) => i.slug !== slug));
    } catch { toast.error("Lỗi kết nối."); } finally { setBusy(null); }
  }

  if (items.length === 0) return <div className="qp-empty"><div className="qp-empty__title">Không còn tin chờ duyệt</div><p className="type-body-small">Mọi tin đã được xử lý. 🎉</p></div>;

  return (
    <>
      <div className="qp-mod-list">
        {items.map((a) => (
          <article key={a.slug} className="qp-mod-card">
            <div className="qp-mod-card__main">
              <div className="qp-lf-card__top"><span className="qp-tag-cat">{a.categoryLabel}</span></div>
              <h3 className="qp-mod-card__title">{a.title}</h3>
              <div className="qp-mod-card__meta"><span>💰 {a.priceText}</span><span>📍 {a.ward}</span><span>📞 {a.phone}</span><span>👤 {a.postedByName}</span><span>🕒 {formatDateTime(a.createdAt)}</span></div>
            </div>
            <div className="qp-mod-card__actions">
              <button type="button" className="qp-btn-primary" disabled={busy === a.slug} onClick={() => approve(a.slug)}>{busy === a.slug ? "…" : "Duyệt"}</button>
              <button type="button" className="qp-mod-reject" disabled={busy === a.slug} onClick={() => reject(a.slug)}>Từ chối</button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
