"use client";

// Công cụ đọc bài: thanh tiến độ đọc (dính đỉnh màn hình) + chỉnh cỡ chữ A− / A+.
// Cỡ chữ lưu theo trình duyệt (localStorage) — chỉ là tiện ích cá nhân, mất cũng không sao.
import { useEffect, useRef, useState } from "react";

const SCALES = [0.9, 1, 1.12, 1.25, 1.4];
const DEFAULT_IDX = 1;
const STORE_KEY = "qp-read-scale";

function applyScale(idx: number) {
  document.documentElement.style.setProperty("--qp-read-scale", String(SCALES[idx]));
}

export function ReadingTools({ targetId }: { targetId: string }) {
  const [idx, setIdx] = useState(DEFAULT_IDX);
  const barRef = useRef<HTMLDivElement>(null);

  // Khôi phục cỡ chữ đã chọn (sau hydration để server/client khớp nhau).
  useEffect(() => {
    let saved = DEFAULT_IDX;
    try {
      const v = Number(localStorage.getItem(STORE_KEY));
      if (Number.isInteger(v) && v >= 0 && v < SCALES.length) saved = v;
    } catch {}
    applyScale(saved);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- đồng bộ lựa chọn đã lưu sau hydration
    setIdx(saved);
    return () => { document.documentElement.style.removeProperty("--qp-read-scale"); };
  }, []);

  // Tiến độ đọc theo phần thân bài — ghi thẳng vào style (không re-render mỗi lần cuộn).
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = document.getElementById(targetId);
      const bar = barRef.current;
      if (!el || !bar) return;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight * 0.6;
      const p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : r.top < 0 ? 1 : 0;
      bar.style.transform = `scaleX(${p})`;
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
  }, [targetId]);

  function change(delta: number) {
    const next = Math.min(SCALES.length - 1, Math.max(0, idx + delta));
    setIdx(next);
    applyScale(next);
    try { localStorage.setItem(STORE_KEY, String(next)); } catch {}
  }

  return (
    <>
      <div className="qp-readbar" aria-hidden><div ref={barRef} className="qp-readbar__fill" /></div>
      <div className="qp-readtools" role="group" aria-label="Cỡ chữ bài viết">
        <span className="qp-readtools__label">Cỡ chữ</span>
        <button type="button" onClick={() => change(-1)} disabled={idx === 0} aria-label="Giảm cỡ chữ">A−</button>
        <button type="button" onClick={() => change(1)} disabled={idx === SCALES.length - 1} aria-label="Tăng cỡ chữ">A+</button>
      </div>
    </>
  );
}
