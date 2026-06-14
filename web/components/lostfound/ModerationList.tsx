"use client";

// Danh sách tin chờ duyệt cho admin — mỗi tin có nút Duyệt / Từ chối, gọi API admin
// rồi gỡ khỏi danh sách ngay khi xong.
import { useState } from "react";
import { formatDateTime } from "@/lib/datetime";
import { useToast } from "@/components/common/Toast";

export type PendingItem = {
  slug: string;
  kind: "tim-do" | "nhat-duoc";
  title: string;
  description: string;
  categoryName: string;
  ward: string;
  occurredAt: string;   // ISO
  createdAt: string;    // ISO
  postedByName: string;
  phone: string;
  reward: string | null;
};

const KIND_LABEL = { "tim-do": "Tìm đồ", "nhat-duoc": "Nhặt được" } as const;

export function ModerationList({ initial }: { initial: PendingItem[] }) {
  const { toast } = useToast();
  const [items, setItems] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);

  async function approve(slug: string) {
    setBusy(slug);
    try {
      const res = await fetch(`/api/admin/lost-found/${slug}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: true }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); toast.error(d.error || "Duyệt thất bại."); return; }
      setItems((cur) => cur.filter((i) => i.slug !== slug));
    } catch { toast.error("Lỗi kết nối."); } finally { setBusy(null); }
  }

  async function reject(slug: string) {
    if (!confirm("Từ chối và xoá hẳn tin này?")) return;
    setBusy(slug);
    try {
      const res = await fetch(`/api/admin/lost-found/${slug}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json().catch(() => ({})); toast.error(d.error || "Xoá thất bại."); return; }
      setItems((cur) => cur.filter((i) => i.slug !== slug));
    } catch { toast.error("Lỗi kết nối."); } finally { setBusy(null); }
  }

  if (items.length === 0) {
    return (
      <div className="qp-empty">
        <svg className="qp-empty__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path d="M20 6 9 17l-5-5" />
        </svg>
        <div className="qp-empty__title">Không còn tin chờ duyệt</div>
        <p className="type-body-small">Mọi tin đã được xử lý. 🎉</p>
      </div>
    );
  }

  return (
    <>
      <div className="qp-mod-list">
        {items.map((p) => (
          <article key={p.slug} className="qp-mod-card">
            <div className="qp-mod-card__main">
              <div className="qp-lf-card__top">
                <span className={`qp-lf-kind is-${p.kind}`}>{KIND_LABEL[p.kind]}</span>
                <span className="qp-tag-cat">{p.categoryName}</span>
              </div>
              <h3 className="qp-mod-card__title">{p.title}</h3>
              <p className="qp-mod-card__desc">{p.description}</p>
              <div className="qp-mod-card__meta">
                <span>📍 {p.ward}</span>
                <span>📞 {p.phone}</span>
                {p.reward && <span>🎁 {p.reward}</span>}
                <span>👤 {p.postedByName}</span>
                <span>🕒 {formatDateTime(p.createdAt)}</span>
              </div>
            </div>
            <div className="qp-mod-card__actions">
              <button type="button" className="qp-btn-primary" disabled={busy === p.slug} onClick={() => approve(p.slug)}>
                {busy === p.slug ? "…" : "Duyệt"}
              </button>
              <button type="button" className="qp-mod-reject" disabled={busy === p.slug} onClick={() => reject(p.slug)}>
                Từ chối
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
