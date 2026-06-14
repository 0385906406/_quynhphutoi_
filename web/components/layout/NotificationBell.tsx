"use client";

// Chuông thông báo — lấy dữ liệu thật từ /api/notifications, mở modal danh sách.
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TimeAgo } from "@/components/common/TimeAgo";

type NotifItem = {
  id: string;
  type: "post_pending" | "post_approved" | "post_rejected" | "comment" | "like" | "announcement";
  title: string;
  href: string;
  actorName: string | null;
  module: string | null;
  read: boolean;
  createdAt: string;
};

function TypeIcon({ type }: { type: NotifItem["type"] }) {
  const p = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, width: 18, height: 18 };
  if (type === "like") return <svg {...p}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 0 0 0-7.8z" /></svg>;
  if (type === "comment") return <svg {...p}><path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 8.6 8.6 0 0 1-4-1L3 20l1-5.5a8.4 8.4 0 0 1-1-4A8.4 8.4 0 0 1 11.5 2 8.4 8.4 0 0 1 21 11.5z" /></svg>;
  if (type === "post_approved") return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.5 2.5 4.5-5" /></svg>;
  if (type === "post_rejected") return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M15 9l-6 6M9 9l6 6" /></svg>;
  return <svg {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>;
}

export function NotificationBell({ isLoggedIn }: { isLoggedIn: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotifItem[]>([]);
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items ?? []);
      setUnread(data.unread ?? 0);
    } catch { /* ignore */ }
  }, [isLoggedIn]);

  // Nạp lần đầu + tự làm mới mỗi 60s.
  useEffect(() => {
    if (!isLoggedIn) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- nạp dữ liệu lần đầu (bất đồng bộ)
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [isLoggedIn, load]);

  // ESC đóng + khoá cuộn nền khi mở modal.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open]);

  function openBell() {
    if (!isLoggedIn) { router.push("/dang-nhap"); return; }
    setOpen(true);
    load();
  }

  async function openItem(n: NotifItem) {
    setOpen(false);
    if (!n.read) {
      setItems((cur) => cur.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      setUnread((u) => Math.max(0, u - 1));
      fetch(`/api/notifications/${n.id}/read`, { method: "POST" }).catch(() => {});
    }
    router.push(n.href);
  }

  async function markAll() {
    setItems((cur) => cur.map((x) => ({ ...x, read: true })));
    setUnread(0);
    await fetch("/api/notifications/read-all", { method: "POST" }).catch(() => {});
  }

  return (
    <>
      <button
        className="qp-icon-btn qp-notif-btn"
        type="button"
        aria-label={unread > 0 ? `Thông báo (${unread} mới)` : "Thông báo"}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={openBell}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unread > 0 && <span className="qp-notif-dot" aria-hidden />}
      </button>

      {open && (
        <div className="qp-modal-overlay" onClick={() => setOpen(false)}>
          <div className="qp-modal" role="dialog" aria-modal="true" aria-label="Thông báo" onClick={(e) => e.stopPropagation()}>
            <div className="qp-modal__head">
              <h2 className="type-h3">Thông báo{unread > 0 && <span className="qp-modal__count">{unread} mới</span>}</h2>
              <button className="qp-modal__close" type="button" aria-label="Đóng" onClick={() => setOpen(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="20" height="20" aria-hidden><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>

            <div className="qp-modal__body">
              {items.length === 0 ? (
                <p className="qp-notif-empty">Chưa có thông báo nào.</p>
              ) : (
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
              )}
            </div>

            <div className="qp-modal__foot">
              <button className="qp-modal__link" type="button" onClick={markAll} disabled={unread === 0}>Đánh dấu đã đọc tất cả</button>
              <button className="qp-modal__link is-strong" type="button" onClick={() => { setOpen(false); router.push("/thong-bao"); }}>Xem tất cả</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
