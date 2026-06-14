"use client";

// Danh sách thông báo đầy đủ (trang /thong-bao) — bấm để mở + đánh dấu đã đọc.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { TimeAgo } from "@/components/common/TimeAgo";

export type NotifItem = {
  id: string;
  type: "post_pending" | "post_approved" | "post_rejected" | "comment" | "like" | "announcement";
  title: string;
  href: string;
  read: boolean;
  createdAt: string;
};

function TypeIcon({ type }: { type: NotifItem["type"] }) {
  const p = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, width: 18, height: 18 };
  if (type === "like") return <svg {...p}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 0 0 0-7.8z" /></svg>;
  if (type === "comment") return <svg {...p}><path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 8.6 8.6 0 0 1-4-1L3 20l1-5.5a8.4 8.4 0 0 1-1-4A8.4 8.4 0 0 1 11.5 2 8.4 8.4 0 0 1 21 11.5z" /></svg>;
  if (type === "post_approved") return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.5 2.5 4.5-5" /></svg>;
  if (type === "post_rejected") return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M15 9l-6 6M9 9l6 6" /></svg>;
  if (type === "announcement") return <svg {...p}><path d="M3 11v2a1 1 0 0 0 1 1h2l9 5V5L6 10H4a1 1 0 0 0-1 1Z" /><path d="M19 9a4 4 0 0 1 0 6" /></svg>;
  return <svg {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>;
}

export function NotifList({ initial }: { initial: NotifItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState<NotifItem[]>(initial);
  const unread = items.filter((n) => !n.read).length;

  function openItem(n: NotifItem) {
    if (!n.read) {
      setItems((cur) => cur.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      fetch(`/api/notifications/${n.id}/read`, { method: "POST" }).catch(() => {});
    }
    router.push(n.href);
  }

  async function markAll() {
    setItems((cur) => cur.map((x) => ({ ...x, read: true })));
    await fetch("/api/notifications/read-all", { method: "POST" }).catch(() => {});
  }

  if (items.length === 0) {
    return (
      <div className="qp-empty">
        <div className="qp-empty__title">Chưa có thông báo nào</div>
        <p className="type-body-small">Khi có hoạt động liên quan tới bạn, thông báo sẽ xuất hiện ở đây.</p>
      </div>
    );
  }

  return (
    <div className="qp-acc-card" style={{ padding: 0, overflow: "hidden" }}>
      <div className="qp-notif-page__head">
        <span>{unread > 0 ? `${unread} thông báo chưa đọc` : "Đã đọc tất cả"}</span>
        <button type="button" className="qp-acc-card__more" onClick={markAll} disabled={unread === 0}>Đánh dấu đã đọc tất cả</button>
      </div>
      <ul className="qp-notif-list">
        {items.map((n) => (
          <li key={n.id}>
            <button type="button" className={`qp-notif-item is-btn${n.read ? "" : " is-unread"}`} onClick={() => openItem(n)}>
              <span className={`qp-notif-item__icon is-${n.type}`}><TypeIcon type={n.type} /></span>
              <span className="qp-notif-item__text">
                <span className="qp-notif-item__title">{n.title}</span>
                <TimeAgo iso={n.createdAt} className="qp-notif-item__time" />
              </span>
              {!n.read && <span className="qp-notif-item__dot" aria-label="Chưa đọc" />}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
