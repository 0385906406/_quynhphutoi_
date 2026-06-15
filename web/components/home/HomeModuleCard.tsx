import Link from "next/link";
import Image from "next/image";
import type { HomeCard } from "@/lib/home-sections";

// Card dùng chung cho các khối module trên trang chủ (Việc làm / Tìm đồ rơi / Mua bán).
// Tái dùng class .qp-newscard sẵn có. Không có ảnh → ô icon (qp-newscard__media--icon).
export function HomeModuleCard({ card }: { card: HomeCard }) {
  const badgeClass = card.badgeTone === "lost" ? " is-lost" : card.badgeTone === "found" ? " is-found" : "";
  return (
    <article className="qp-newscard">
      <Link href={card.href} className={`qp-newscard__media${card.image ? "" : " qp-newscard__media--icon"}`} aria-label={card.title}>
        {card.image ? (
          <Image src={card.image} alt="" fill sizes="(max-width:767px) 100vw, (max-width:1023px) 50vw, 25vw" style={{ objectFit: "cover" }} />
        ) : (
          <svg viewBox="0 0 24 24" width="46" height="46" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 15l5-5 4 4 3-3 6 6" /><circle cx="8.5" cy="8.5" r="1.5" />
          </svg>
        )}
        <span className={`qp-newscard__badge${badgeClass}`}>{card.badge}</span>
      </Link>
      <div className="qp-newscard__body">
        <h3 className="qp-newscard__title"><Link href={card.href}>{card.title}</Link></h3>
        {card.excerpt && <p className="qp-newscard__excerpt">{card.excerpt}</p>}
        {card.meta && (
          <div className="qp-newscard__meta"><span>{card.meta}</span></div>
        )}
      </div>
    </article>
  );
}
