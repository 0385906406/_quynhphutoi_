"use client";

// Fallback AdSense — chỉ render khi đã cấu hình NEXT_PUBLIC_ADSENSE_CLIENT (ca-pub-...).
// Chưa cấu hình → không hiện gì (slot tự thu gọn).
import { useEffect, useRef } from "react";

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

export function AdSenseUnit({ slot, className }: { slot?: string; className?: string }) {
  const ref = useRef<HTMLModElement>(null);

  useEffect(() => {
    if (!CLIENT || !ref.current) return;
    try {
      // @ts-expect-error - adsbygoogle global do script AdSense thêm vào.
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch { /* ignore */ }
  }, []);

  if (!CLIENT) return null;
  return (
    <ins
      ref={ref}
      className={`adsbygoogle ${className ?? ""}`}
      style={{ display: "block" }}
      data-ad-client={CLIENT}
      data-ad-slot={slot || process.env.NEXT_PUBLIC_ADSENSE_SLOT}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
