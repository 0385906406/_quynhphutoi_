"use client";

// Công cụ đọc bài (thiết kế cho mọi lứa tuổi):
//  • thanh tiến độ đọc (dính đỉnh màn hình) + "còn ~N phút";
//  • cỡ chữ 5 mức (A− / A+), nền đọc Sáng / Giấy / Tối, giãn dòng;
// Lựa chọn lưu theo trình duyệt (localStorage) — chỉ là tiện ích cá nhân, mất cũng không sao.
import { useCallback, useEffect, useRef, useState } from "react";

const SCALES = [0.9, 1, 1.12, 1.25, 1.4];
const THEMES = [
  { id: "light", label: "Sáng" },
  { id: "paper", label: "Giấy" },
  { id: "dark", label: "Tối" },
] as const;
type ThemeId = (typeof THEMES)[number]["id"];
const SPACINGS = [1.7, 1.9, 2.15];
const KEY = { scale: "qp-read-scale", theme: "qp-read-theme", spacing: "qp-read-spacing" };
const DEFAULT = { scale: 1, theme: "light" as ThemeId, spacing: 1 };

function readInt(key: string, max: number, fallback: number) {
  try {
    const v = Number(localStorage.getItem(key));
    if (localStorage.getItem(key) !== null && Number.isInteger(v) && v >= 0 && v < max) return v;
  } catch {}
  return fallback;
}
function save(key: string, v: string | number) { try { localStorage.setItem(key, String(v)); } catch {} }

export function ReadingTools({ targetId, minutes = 0 }: { targetId: string; minutes?: number }) {
  const [scale, setScale] = useState(DEFAULT.scale);
  const [theme, setTheme] = useState<ThemeId>(DEFAULT.theme);
  const [spacing, setSpacing] = useState(DEFAULT.spacing);
  const [left, setLeft] = useState(minutes);
  const barRef = useRef<HTMLDivElement>(null);

  const target = useCallback(() => document.getElementById(targetId), [targetId]);

  // Áp dụng lựa chọn vào trang. Cỡ chữ ghi vào <html> (lead + thân bài cùng dùng); nền/giãn dòng ghi vào khung bài.
  useEffect(() => {
    document.documentElement.style.setProperty("--qp-read-scale", String(SCALES[scale]));
  }, [scale]);
  useEffect(() => {
    const el = target();
    if (!el) return;
    el.dataset.readTheme = theme;
    el.style.setProperty("--qp-read-lh", String(SPACINGS[spacing]));
  }, [theme, spacing, target]);

  // Khôi phục lựa chọn sau hydration (để server/client khớp nhau).
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- đồng bộ lựa chọn đã lưu sau hydration */
    setScale(readInt(KEY.scale, SCALES.length, 1));
    const t = (() => { try { return localStorage.getItem(KEY.theme); } catch { return null; } })();
    if (THEMES.some((x) => x.id === t)) setTheme(t as ThemeId);
    setSpacing(readInt(KEY.spacing, SPACINGS.length, 1));
    /* eslint-enable react-hooks/set-state-in-effect */
    return () => { document.documentElement.style.removeProperty("--qp-read-scale"); };
  }, []);

  // Tiến độ đọc theo phần thân bài — ghi thẳng vào style (không re-render mỗi lần cuộn).
  useEffect(() => {
    let frame = 0;
    let lastLeft = -1;
    const update = () => {
      frame = 0;
      const el = document.getElementById(targetId);
      const bar = barRef.current;
      if (!el || !bar) return;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight * 0.6;
      const p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : r.top < 0 ? 1 : 0;
      bar.style.transform = `scaleX(${p})`;
      if (minutes > 0) {
        const l = p >= 0.98 ? 0 : Math.max(1, Math.ceil(minutes * (1 - p)));
        if (l !== lastLeft) { lastLeft = l; setLeft(l); }
      }
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [targetId, minutes]);

  function changeScale(delta: number) {
    const next = Math.min(SCALES.length - 1, Math.max(0, scale + delta));
    setScale(next); save(KEY.scale, next);
  }
  function pickTheme(id: ThemeId) { setTheme(id); save(KEY.theme, id); }
  function cycleSpacing() { const n = (spacing + 1) % SPACINGS.length; setSpacing(n); save(KEY.spacing, n); }

  return (
    <>
      <div className="qp-readbar" aria-hidden><div ref={barRef} className="qp-readbar__fill" /></div>
      <div className="qp-readtools" role="toolbar" aria-label="Tuỳ chỉnh cách đọc bài">
        <div className="qp-readtools__group" role="group" aria-label="Cỡ chữ">
          <span className="qp-readtools__label">Cỡ chữ</span>
          <button type="button" onClick={() => changeScale(-1)} disabled={scale === 0} aria-label="Giảm cỡ chữ">A−</button>
          <span className="qp-readtools__val" aria-live="polite">{Math.round(SCALES[scale] * 100)}%</span>
          <button type="button" onClick={() => changeScale(1)} disabled={scale === SCALES.length - 1} aria-label="Tăng cỡ chữ">A+</button>
        </div>
        <div className="qp-readtools__group" role="group" aria-label="Màu nền khi đọc">
          <span className="qp-readtools__label">Nền</span>
          {THEMES.map((t) => (
            <button key={t.id} type="button" className={`qp-readtools__theme is-${t.id}`} aria-pressed={theme === t.id} onClick={() => pickTheme(t.id)}>{t.label}</button>
          ))}
        </div>
        <div className="qp-readtools__group">
          <button type="button" onClick={cycleSpacing} aria-label={`Giãn dòng, hiện ở mức ${spacing + 1} trên ${SPACINGS.length}. Bấm để đổi`}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M4 6h16M4 12h16M4 18h16" /></svg> Giãn dòng
          </button>
        </div>
        {minutes > 0 && <span className="qp-readtools__left" aria-live="off">{left > 0 ? `Còn ~${left} phút đọc` : "Bạn đã đọc xong ✓"}</span>}
      </div>
    </>
  );
}
