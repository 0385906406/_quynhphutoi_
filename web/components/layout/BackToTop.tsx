"use client";

import { useEffect, useState } from "react";

const SHOW_AFTER = 300;
const R = 22; // progress ring radius
const C = 2 * Math.PI * R; // circumference ≈ 138.23

export function BackToTop() {
  const [visible, setVisible] = useState(false);
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setVisible(y > SHOW_AFTER);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setPct(max > 0 ? Math.min(100, (y / max) * 100) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toTop = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  const offset = C - (pct / 100) * C;

  return (
    <button
      type="button"
      className={`qp-totop${visible ? " is-visible" : ""}`}
      aria-label="Lên đầu trang"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      onClick={toTop}
    >
      <svg viewBox="0 0 52 52" width="52" height="52" aria-hidden fill="none">
        {/* track */}
        <circle cx="26" cy="26" r={R} stroke="var(--color-teal)" strokeWidth="2.5" opacity="0.18" />
        {/* progress */}
        <circle
          cx="26" cy="26" r={R}
          stroke="var(--color-teal)" strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={offset}
          transform="rotate(-90 26 26)"
          className="qp-totop-ring"
        />
        {/* arrow */}
        <path d="M26 34V18M19 25l7-7 7 7" stroke="var(--color-teal)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
