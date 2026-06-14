"use client";

// Ảnh thẻ tin nhiều ảnh:
//  • Desktop: rê chuột (hover) tự chạy slideshow qua các ảnh.
//  • Điện thoại (không hover): chấm tròn hiện sẵn, BẤM vào chấm để lật sang ảnh đó.
// Không ảnh → fallback icon.
import { useEffect, useRef, useState, type ReactNode } from "react";

export function CardMedia({ images, fallback, alt }: { images: string[]; fallback: ReactNode; alt: string }) {
  const [idx, setIdx] = useState(0);
  const [hover, setHover] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const multi = images.length > 1;

  // Chạy slideshow khi hover; dừng + về ảnh đầu khi rời chuột.
  useEffect(() => {
    if (!hover || !multi) return;
    timer.current = setInterval(() => setIdx((i) => (i + 1) % images.length), 900);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [hover, multi, images.length]);

  if (images.length === 0) return <>{fallback}</>;

  // Bấm chấm để lật ảnh — chặn điều hướng của thẻ <a> bao ngoài thẻ tin.
  const pick = (e: { preventDefault: () => void; stopPropagation: () => void }, i: number) => {
    e.preventDefault();
    e.stopPropagation();
    setIdx(i);
  };

  return (
    <span
      className="qp-cardmedia"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setIdx(0); }}
    >
      {images.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={src}
          alt={i === 0 ? alt : ""}
          loading="lazy"
          className={`qp-cardmedia__img${i === idx ? " is-active" : ""}`}
        />
      ))}
      {multi && (
        <>
          <span className="qp-cardmedia__count" aria-hidden>{images.length} ảnh</span>
          <span className="qp-cardmedia__dots">
            {images.map((_, i) => (
              <span
                key={i}
                role="button"
                tabIndex={-1}
                aria-label={`Xem ảnh ${i + 1}`}
                className={`qp-cardmedia__dot${i === idx ? " is-active" : ""}`}
                onClick={(e) => pick(e, i)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") pick(e, i); }}
              />
            ))}
          </span>
        </>
      )}
    </span>
  );
}
