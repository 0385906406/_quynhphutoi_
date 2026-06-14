// Khối "Vị trí trên bản đồ" — card có header (icon + tiêu đề + địa chỉ + nút Mở Maps)
// và bản đồ Google Maps nhúng (responsive, lazy-load). Lấy được toạ độ → nhúng iframe;
// không thì chỉ còn header + nút mở link. Server component (không hook).
import { mapEmbedSrc } from "@/lib/map-embed";

export function MapEmbed({ url, address }: { url?: string | null; address?: string }) {
  if (!url) return null;
  const src = mapEmbedSrc(url);
  return (
    <section className="qp-map">
      <header className="qp-map__head">
        <span className="qp-map__pin" aria-hidden>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
          </svg>
        </span>
        <div className="qp-map__headtext">
          <h2 className="qp-map__title">Vị trí trên bản đồ</h2>
          {address && <p className="qp-map__addr">{address}</p>}
        </div>
        <a className="qp-map__open" href={url} target="_blank" rel="noopener noreferrer nofollow">
          Mở Maps
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M7 17 17 7M7 7h10v10" />
          </svg>
        </a>
      </header>
      {src && (
        <div className="qp-map__frame">
          <iframe src={src} title="Bản đồ vị trí" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
        </div>
      )}
    </section>
  );
}
