"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { NAV_TREE, BRAND, type NavItem } from "@/lib/nav";
import { cldUrl } from "@/lib/cloudinary-url";
import { NotificationBell } from "./NotificationBell";
import { GlobalSearch } from "./GlobalSearch";

type SessionUser = { id: string; email: string; name: string; avatar?: string };

function AccIcon({ name }: { name: string }) {
  const p = {
    viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8,
    strokeLinecap: "round" as const, strokeLinejoin: "round" as const, width: 16, height: 16,
  };
  switch (name) {
    case "user": return (<svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>);
    case "post": return (<svg {...p}><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></svg>);
    case "settings": return (<svg {...p}><circle cx="12" cy="12" r="3" /><path d="M12 3v2M12 19v2M5 12H3M21 12h-2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M6.3 17.7l1.4-1.4M16.3 7.7l1.4-1.4" /></svg>);
    case "logout": return (<svg {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></svg>);
    case "shield": return (<svg {...p}><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /><path d="m9 12 2 2 4-4" /></svg>);
    default: return null;
  }
}

function isActive(href: string, pathname: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function MenuIcon({ name }: { name?: string }) {
  const p = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    width: 20,
    height: 20,
  };
  switch (name) {
    case "school": return (<svg {...p}><path d="M22 10L12 5 2 10l10 5 10-5z" /><path d="M6 12v5c0 1 2.7 2 6 2s6-1 6-2v-5" /></svg>);
    case "health": return (<svg {...p}><path d="M3 12h4l2 5 4-10 2 5h4" /></svg>);
    case "bus": return (<svg {...p}><rect x="4" y="4" width="16" height="13" rx="2" /><path d="M4 11h16M8 17v2M16 17v2" /><circle cx="8.5" cy="14" r="1" /><circle cx="15.5" cy="14" r="1" /></svg>);
    case "job": return (<svg {...p}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>);
    case "search": return (<svg {...p}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>);
    case "market": return (<svg {...p}><path d="M6 2 4 6v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6l-2-4z" /><path d="M4 6h16M9 10a3 3 0 0 0 6 0" /></svg>);
    case "info": return (<svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>);
    case "landmark": return (<svg {...p}><path d="M3 21h18M5 21V10M19 21V10M9 21V10M15 21V10M12 3 4 8h16z" /></svg>);
    case "map": return (<svg {...p}><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" /><path d="M9 4v14M15 6v14" /></svg>);
    case "tag": return (<svg {...p}><path d="M20.6 13.4 12 22l-9-9V3h10l8.6 8.6a2 2 0 0 1 0 2.8z" /><circle cx="7.5" cy="7.5" r="1.5" /></svg>);
    case "cloud": return (<svg {...p}><path d="M6.5 19h11a4 4 0 0 0 0-8 6 6 0 0 0-11.6-2A4.5 4.5 0 0 0 6.5 19z" /></svg>);
    default: return null;
  }
}

export function TopBar({ user, isAdmin = false, logo }: { user: SessionUser | null; isAdmin?: boolean; logo?: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  // Nav ở chế độ drawer điện thoại (≤1180px) — khớp breakpoint trong components.css.
  // Khi true: bỏ hover, dropdown mở/đóng bằng cách bấm (điện thoại không có hover).
  const [isMobileNav, setIsMobileNav] = useState(false);

  // Theo dõi breakpoint để quyết định mở dropdown bằng hover (desktop) hay bấm (mobile)
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1180px)");
    const apply = () => setIsMobileNav(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // Đóng mọi thứ khi đổi route (reset UI theo pathname — chủ đích)
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- reset menu khi điều hướng */
    setMobileOpen(false);
    setOpenId(null);
    setAccountOpen(false);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [pathname]);

  // ESC đóng dropdown / menu mobile / modal
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpenId(null);
        setMobileOpen(false);
        setAccountOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Click ra ngoài đóng dropdown
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const t = e.target as Node;
      if (navRef.current && !navRef.current.contains(t)) setOpenId(null);
      if (accountRef.current && !accountRef.current.contains(t)) setAccountOpen(false);
    }
    // pointerdown thay mousedown: iOS Safari không phát mousedown khi chạm vùng trống → menu không đóng.
    document.addEventListener("pointerdown", onClick);
    return () => document.removeEventListener("pointerdown", onClick);
  }, []);

  const groupActive = (children: NavItem[]) => children.some((c) => isActive(c.href, pathname));

  const initial = (user?.name?.trim()?.[0] || user?.email?.[0] || "?").toUpperCase();
  // Avatar: ảnh nếu có, không thì chữ cái đầu.
  const avatarNode = user?.avatar
    ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={cldUrl(user.avatar, { w: 96 })} alt="" />
    : initial;

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setAccountOpen(false);
    // Reload cứng: xoá sạch Router Cache (RSC) để TopBar không còn giữ tài khoản cũ
    // (router.refresh/push để lại cache → phải reload nhiều lần mới mất).
    window.location.assign("/");
  }

  return (
    <header className="qp-topbar">
      <div className="container-wide qp-topbar__inner">
        <Link className="qp-brand" href="/" aria-label={`${BRAND.name} — Trang chủ`}>
          <span className="qp-brand__mark">
            <Image src={logo || BRAND.logo} alt="" fill sizes="48px" priority />
          </span>
          <span className="qp-brand__text">
            <span className="qp-brand__name">{BRAND.name}</span>
            <span className="qp-brand__sub">{BRAND.sub}</span>
          </span>
        </Link>

        <nav
          ref={navRef}
          className={`qp-nav${mobileOpen ? " is-open" : ""}`}
          aria-label="Điều hướng chính"
        >
          {NAV_TREE.map((node) => {
            if (!node.children) {
              const active = isActive(node.href!, pathname);
              return (
                <Link
                  key={node.id}
                  href={node.href!}
                  className={`qp-nav__link${active ? " is-active" : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  {node.label}
                </Link>
              );
            }

            const open = openId === node.id;
            const active = groupActive(node.children);
            return (
              <div
                key={node.id}
                className={`qp-nav__item${open ? " is-open" : ""}`}
                onMouseEnter={isMobileNav ? undefined : () => setOpenId(node.id)}
                onMouseLeave={isMobileNav ? undefined : () => setOpenId((cur) => (cur === node.id ? null : cur))}
              >
                <button
                  type="button"
                  className={`qp-nav__btn${active ? " is-active" : ""}`}
                  aria-haspopup="true"
                  aria-expanded={open}
                  onClick={() => setOpenId((cur) => (cur === node.id ? null : node.id))}
                >
                  {node.label}
                  <svg className="qp-nav__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" aria-hidden>
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                <div className="qp-dropdown" role="menu" aria-label={node.label}>
                  {node.children.map((child) => {
                    const cActive = isActive(child.href, pathname);
                    return (
                      <Link
                        key={child.id}
                        href={child.href}
                        role="menuitem"
                        className={`qp-dropdown__item${cActive ? " is-active" : ""}`}
                        aria-current={cActive ? "page" : undefined}
                      >
                        <span className="qp-dropdown__icon">
                          <MenuIcon name={child.icon} />
                        </span>
                        <span className="qp-dropdown__text">
                          <span className="qp-dropdown__label">{child.label}</span>
                          {child.desc && <span className="qp-dropdown__desc">{child.desc}</span>}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Đăng nhập trong drawer — chỉ hiện trên điện thoại (≤767px) khi chưa đăng nhập,
              vì nút Đăng nhập ở thanh trên bị ẩn ở breakpoint đó. */}
          {!user && (
            <Link className="qp-nav__login" href="/dang-nhap">
              Đăng nhập
              <span className="qp-login__arrow" aria-hidden>→</span>
            </Link>
          )}
        </nav>

        <div className="qp-topbar__actions">
          {/* Tìm kiếm toàn cục */}
          <GlobalSearch />

          {/* Thông báo — chuông (dữ liệu thật) */}
          <NotificationBell isLoggedIn={!!user} />

          {/* Tài khoản — chưa đăng nhập: nút Đăng nhập; đã đăng nhập: tên + email + dropdown */}
          {!user ? (
            <Link className="qp-login" href="/dang-nhap">
              Đăng nhập
              <span className="qp-login__arrow" aria-hidden>→</span>
            </Link>
          ) : (
            <div className="qp-account" ref={accountRef}>
              <button
                type="button"
                className={`qp-account__btn${accountOpen ? " is-open" : ""}`}
                aria-haspopup="menu"
                aria-expanded={accountOpen}
                onClick={() => setAccountOpen((v) => !v)}
              >
                <span className="qp-account__avatar">{avatarNode}</span>
                <span className="qp-account__id">
                  <span className="qp-account__name">{user.name || "Tài khoản"}</span>
                  <span className="qp-account__email">{user.email}</span>
                </span>
                <svg className="qp-account__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" aria-hidden>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {accountOpen && (
                <div className="qp-account__menu" role="menu">
                  <div className="qp-account__head">
                    <span className="qp-account__avatar is-lg">{avatarNode}</span>
                    <span className="qp-account__id">
                      <span className="qp-account__name">{user.name || "Tài khoản"}</span>
                      <span className="qp-account__email">{user.email}</span>
                    </span>
                  </div>
                  <div className="qp-account__sep" />
                  <Link className="qp-account__item" href="/tai-khoan" role="menuitem" onClick={() => setAccountOpen(false)}>
                    <AccIcon name="user" /> Trang cá nhân
                  </Link>
                  <Link className="qp-account__item" href="/tai-khoan/bai-dang" role="menuitem" onClick={() => setAccountOpen(false)}>
                    <AccIcon name="post" /> Bài đăng của tôi
                  </Link>
                  <Link className="qp-account__item" href="/tai-khoan/cai-dat" role="menuitem" onClick={() => setAccountOpen(false)}>
                    <AccIcon name="settings" /> Cài đặt tài khoản
                  </Link>
                  {isAdmin && (
                    <>
                      <div className="qp-account__sep" />
                      <Link className="qp-account__item is-admin" href="/admin" role="menuitem" onClick={() => setAccountOpen(false)}>
                        <AccIcon name="shield" /> Quản trị
                      </Link>
                    </>
                  )}
                  <div className="qp-account__sep" />
                  <button type="button" className="qp-account__item is-danger" role="menuitem" onClick={handleLogout}>
                    <AccIcon name="logout" /> Đăng xuất
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            className="qp-hamburger"
            type="button"
            aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="22" height="22">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
        </div>
      </div>

    </header>
  );
}
