"use client";

// Điều hướng trang tài khoản (sidebar) — đánh dấu mục đang mở + nút đăng xuất.
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/tai-khoan", label: "Trang cá nhân", icon: "user" },
  { href: "/tai-khoan/bai-dang", label: "Bài đăng của tôi", icon: "post" },
  { href: "/tai-khoan/cai-dat", label: "Cài đặt tài khoản", icon: "settings" },
] as const;

function Icon({ name }: { name: string }) {
  const c = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "user") return <svg viewBox="0 0 24 24" {...c} aria-hidden><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>;
  if (name === "post") return <svg viewBox="0 0 24 24" {...c} aria-hidden><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 9h10M7 13h7" /></svg>;
  if (name === "settings") return <svg viewBox="0 0 24 24" {...c} aria-hidden><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 6.8 19.4a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3 13.6 2 2 0 1 1 3 9.6h.1A1.6 1.6 0 0 0 4.6 6.8a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 9.6 3 2 2 0 1 1 13.6 3v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1.4z" /></svg>;
  return <svg viewBox="0 0 24 24" {...c} aria-hidden><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>;
}

export function AccountNav() {
  const pathname = usePathname();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    // Reload cứng về trang chủ để xoá Router Cache (tránh còn hiển thị tài khoản cũ).
    window.location.assign("/");
  }

  return (
    <nav className="qp-acc-nav" aria-label="Tài khoản">
      {ITEMS.map((it) => {
        const active = pathname === it.href;
        return (
          <Link key={it.href} href={it.href} className={`qp-acc-nav__item${active ? " is-active" : ""}`} aria-current={active ? "page" : undefined}>
            <Icon name={it.icon} /> {it.label}
          </Link>
        );
      })}
      <div className="qp-acc-nav__sep" />
      <button type="button" className="qp-acc-nav__item is-danger" onClick={logout}>
        <Icon name="logout" /> Đăng xuất
      </button>
    </nav>
  );
}
