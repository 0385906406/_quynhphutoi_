"use client";

// Thanh trên cùng khu quản trị: nút menu (mobile) + tên admin + về cổng + đăng xuất.
import Link from "next/link";
import { useState } from "react";

export function AdminTopbar({ name }: { name: string }) {
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    window.location.assign("/");
  }

  return (
    <header className="qp-admin-topbar">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          type="button"
          className="qp-admin-burger"
          aria-label="Mở menu quản trị"
          onClick={() => window.dispatchEvent(new Event("qp-admin-menu"))}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24" aria-hidden><path d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <span className="qp-admin-topbar__title">Khu vực quản trị</span>
      </div>
      <div className="qp-admin-topbar__right">
        <span className="qp-admin-topbar__user">Xin chào, <b>{name}</b></span>
        <Link href="/" className="qp-btn-outline">Về cổng</Link>
        <button type="button" className="qp-btn-outline" onClick={logout} disabled={busy}>
          {busy ? "…" : "Đăng xuất"}
        </button>
      </div>
    </header>
  );
}
