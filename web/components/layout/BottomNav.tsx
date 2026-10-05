"use client";

// Thanh điều hướng dưới đáy màn hình — CHỈ hiện trên điện thoại (≤767px, xem components.css).
// Kiểu app di động: 4 mục hay dùng + nút "Menu" mở toàn bộ danh mục (dạng bảng trượt từ dưới lên).
// Nút Menu điều khiển menu của TopBar qua sự kiện window (2 component độc lập, cùng layout).
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const MENU_TOGGLE_EVENT = "qp:toggle-menu";
export const MENU_STATE_EVENT = "qp:menu-state";

const ITEMS = [
  { href: "/", label: "Trang chủ", icon: "home" },
  { href: "/tin-tuc", label: "Tin tức", icon: "news" },
  { href: "/viec-lam", label: "Việc làm", icon: "job" },
  { href: "/mua-ban", label: "Mua bán", icon: "tag" },
] as const;

function Icon({ name }: { name: string }) {
  const p = {
    viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.9,
    strokeLinecap: "round" as const, strokeLinejoin: "round" as const, width: 24, height: 24, "aria-hidden": true,
  };
  switch (name) {
    case "home": return (<svg {...p}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" /></svg>);
    case "news": return (<svg {...p}><path d="M4 5h13a1 1 0 0 1 1 1v13a2 2 0 0 0 2-2V9h-2" /><path d="M4 5a1 1 0 0 0-1 1v12a2 2 0 0 0 2 2h13" /><path d="M7 9h7M7 13h7M7 17h4" /></svg>);
    case "job": return (<svg {...p}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18" /></svg>);
    case "tag": return (<svg {...p}><path d="M20.6 13.4 12 22l-9-9V3h10l8.6 8.6a2 2 0 0 1 0 2.8z" /><circle cx="7.5" cy="7.5" r="1.5" /></svg>);
    case "menu": return (<svg {...p}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>);
    case "close": return (<svg {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>);
    default: return null;
  }
}

const isActive = (href: string, pathname: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

export function BottomNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // TopBar báo trạng thái menu (mở/đóng do bất kỳ nguồn nào: nút này, ESC, chạm nền, đổi trang).
  useEffect(() => {
    const onState = (e: Event) => setMenuOpen(!!(e as CustomEvent<boolean>).detail);
    window.addEventListener(MENU_STATE_EVENT, onState);
    return () => window.removeEventListener(MENU_STATE_EVENT, onState);
  }, []);

  return (
    <nav className="qp-bottomnav" aria-label="Điều hướng nhanh">
      {ITEMS.map((it) => {
        const active = !menuOpen && isActive(it.href, pathname);
        return (
          <Link key={it.href} href={it.href} className={`qp-bottomnav__item${active ? " is-active" : ""}`} aria-current={active ? "page" : undefined}>
            <Icon name={it.icon} />
            <span>{it.label}</span>
          </Link>
        );
      })}
      <button
        type="button"
        data-menu-toggle
        className={`qp-bottomnav__item${menuOpen ? " is-active" : ""}`}
        aria-expanded={menuOpen}
        aria-label={menuOpen ? "Đóng menu" : "Mở menu tất cả danh mục"}
        onClick={() => window.dispatchEvent(new Event(MENU_TOGGLE_EVENT))}
      >
        <Icon name={menuOpen ? "close" : "menu"} />
        <span>{menuOpen ? "Đóng" : "Menu"}</span>
      </button>
    </nav>
  );
}
