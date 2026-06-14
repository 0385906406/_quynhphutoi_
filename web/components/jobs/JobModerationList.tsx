"use client";

// Danh sách tin việc làm chờ duyệt (admin) — Duyệt / Từ chối.
import { useState } from "react";
import { formatDateTime } from "@/lib/datetime";
import { useToast } from "@/components/common/Toast";

export type PendingJob = {
  slug: string; title: string; company: string; industryLabel: string; jobTypeLabel: string;
  salaryText: string; ward: string; phone: string; postedByName: string; createdAt: string;
};

export function JobModerationList({ initial }: { initial: PendingJob[] }) {
  const { toast } = useToast();
  const [items, setItems] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);

  async function approve(slug: string) {
    setBusy(slug);
    try {
      const res = await fetch(`/api/admin/jobs/${slug}/approve`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ approved: true }) });
      if (!res.ok) { const d = await res.json().catch(() => ({})); toast.error(d.error || "Duyệt thất bại."); return; }
      setItems((c) => c.filter((i) => i.slug !== slug));
    } catch { toast.error("Lỗi kết nối."); } finally { setBusy(null); }
  }
  async function reject(slug: string) {
    if (!confirm("Từ chối và xoá hẳn tin này?")) return;
    setBusy(slug);
    try {
      const res = await fetch(`/api/admin/jobs/${slug}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json().catch(() => ({})); toast.error(d.error || "Xoá thất bại."); return; }
      setItems((c) => c.filter((i) => i.slug !== slug));
    } catch { toast.error("Lỗi kết nối."); } finally { setBusy(null); }
  }

  if (items.length === 0) {
    return <div className="qp-empty"><div className="qp-empty__title">Không còn tin chờ duyệt</div><p className="type-body-small">Mọi tin đã được xử lý. 🎉</p></div>;
  }

  return (
    <>
      <div className="qp-mod-list">
        {items.map((j) => (
          <article key={j.slug} className="qp-mod-card">
            <div className="qp-mod-card__main">
              <div className="qp-lf-card__top"><span className="qp-tag-cat">{j.industryLabel}</span><span className="qp-job-type">{j.jobTypeLabel}</span></div>
              <h3 className="qp-mod-card__title">{j.title} — {j.company}</h3>
              <div className="qp-mod-card__meta">
                <span>💰 {j.salaryText}</span><span>📍 {j.ward}</span><span>📞 {j.phone}</span>
                <span>👤 {j.postedByName}</span><span>🕒 {formatDateTime(j.createdAt)}</span>
              </div>
            </div>
            <div className="qp-mod-card__actions">
              <button type="button" className="qp-btn-primary" disabled={busy === j.slug} onClick={() => approve(j.slug)}>{busy === j.slug ? "…" : "Duyệt"}</button>
              <button type="button" className="qp-mod-reject" disabled={busy === j.slug} onClick={() => reject(j.slug)}>Từ chối</button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
