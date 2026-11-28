"use client";

import { useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { matchAffiliatePage } from "@/lib/affiliate-shared";

const DISMISS_KEY = "qp:shopee-float-hidden";

const noopSubscribe = () => () => {};
const readHidden = () => {
  try { return sessionStorage.getItem(DISMISS_KEY) === "1"; } catch { return false; }
};

export function ShopeeFloatButton({ label, note, hasDefaultLinks, pageLabels }: {
  label: string;
  note: string;
  hasDefaultLinks: boolean;
  pageLabels: Record<string, string>; // trang có link riêng → chữ riêng ("" = dùng chữ chung)
}) {
  const pathname = usePathname();
  // Server coi như "đã ẩn" → nút chỉ xuất hiện sau khi trình duyệt đọc sessionStorage, không nháy
  // lên rồi biến mất với người đã bấm × trước đó.
  const storedHidden = useSyncExternalStore(noopSubscribe, readHidden, () => true);
  const [dismissed, setDismissed] = useState(false);

  const page = matchAffiliatePage(pathname, Object.keys(pageLabels));
  if (storedHidden || dismissed || (!page && !hasDefaultLinks)) return null;
  const text = (page && pageLabels[page]) || label;

  function dismiss() {
    setDismissed(true);
    try { sessionStorage.setItem(DISMISS_KEY, "1"); } catch { /* không lưu được thì chỉ ẩn lần này */ }
  }

  return (
    <div className="qp-shopee-float">
      <a
        className="qp-shopee-float__link"
        href={page ? `/di/shopee?p=${encodeURIComponent(page)}` : "/di/shopee"}
        target="_blank"
        rel="sponsored nofollow noopener noreferrer"
        aria-label={note ? `${text} (${note})` : text}
      >
        <svg className="qp-shopee-float__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22" aria-hidden>
          <rect x="3" y="8" width="18" height="4" rx="1" />
          <path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
          <path d="M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5" />
        </svg>
        <span className="qp-shopee-float__text">
          <span className="qp-shopee-float__label">{text}</span>
          {note && <span className="qp-shopee-float__note">{note}</span>}
        </span>
      </a>
      <button type="button" className="qp-shopee-float__close" onClick={dismiss} aria-label="Ẩn nút ưu đãi">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="12" height="12" aria-hidden>
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
    </div>
  );
}
