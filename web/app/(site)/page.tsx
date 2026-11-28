import type { Metadata } from "next";
import Link from "next/link";
import { HeroSlider, type HeroSlide } from "@/components/home/HeroSlider";
import { type ArticleDoc } from "@/lib/articles";
import { loadHomeSections } from "@/lib/home-sections";
import { NewsCard } from "@/components/news/NewsCard";
import { ForYou } from "@/components/news/ForYou";
import { HomeModuleCard } from "@/components/home/HomeModuleCard";
import { SITE, buildMetadata, jsonLdWebSite, jsonLdOrganization } from "@/lib/seo";
import { getPageSeoConfig, type PageSeoConfig } from "@/lib/page-seo";
import { JsonLd } from "@/components/common/JsonLd";
import { NewsletterForm } from "@/components/common/NewsletterForm";
import { getSettings } from "@/lib/settings";
import { getWeather, type WeatherData } from "@/lib/weather";
import { getHomeBlocks } from "@/lib/home-blocks";
import { DailyHub } from "@/components/daily/DailyHub";
import { fmtViews } from "@/lib/news";
import { countJobs } from "@/lib/jobs";
import { schools } from "@/lib/schools";
import { health } from "@/lib/health";
import { transit } from "@/lib/transit";
import { listMarket } from "@/lib/market";
import { WARDS } from "@/lib/wards";

// SEO trang chủ — admin chỉnh ở "SEO từng trang" (key "/"); ô trống = mặc định bên dưới.
// Dùng title tuyệt đối để KHÔNG gắn hậu tố "· Tên site" cho trang gốc.
export async function generateMetadata(): Promise<Metadata> {
  const cfg: PageSeoConfig = await getPageSeoConfig().catch(() => ({}));
  const ov = cfg["/"] ?? {};
  const title = ov.title || `${SITE.name} — Tin tức, việc làm & cộng đồng Quỳnh Phụ, Thái Bình`;
  const description = ov.description || SITE.description;
  const base = buildMetadata({
    title, description, path: "/",
    image: ov.ogImage || undefined,
    noindex: ov.noindex,
    keywords: ov.keywords ? ov.keywords.split(",").map((k) => k.trim()).filter(Boolean) : undefined,
  });
  return { ...base, title: { absolute: title } };
}

/* ------------------------------ Số liệu vùng ------------------------------ */
// Vùng Quỳnh Phụ cũ sau sáp nhập 1/7/2025 (NQ 1666/NQ-UBTVQH15): 35 xã, thị trấn → 9 xã thuộc Hưng Yên.
// Diện tích 9 xã cộng lại ≈ 210 km²; dân số ≈ 241.000 (điều tra 1/4/2024), số liệu sáp nhập từng xã > 250.000.
const AREA_FACTS = [
  { num: "240.000", unit: "+", label: "Người dân vùng Quỳnh Phụ" },
  { num: "9", unit: "", label: "Xã mới (từ 35 xã, thị trấn cũ)" },
  { num: "210", unit: "km²", label: "Diện tích tự nhiên" },
];

// Số khẩn cấp quốc gia + đầu mối UBND xã Quỳnh Phụ theo Thông báo 25378/TB-UBND ngày 11/11/2026
// (số di động cán bộ do xã công khai — đổi người phụ trách thì cập nhật lại tại đây).
const HOTLINES = [
  { label: "Cấp cứu y tế", value: "115", icon: "ambulance" },
  { label: "Công an", value: "113", icon: "shield" },
  { label: "Cứu hoả, cứu nạn", value: "114", icon: "flame" },
  { label: "Văn phòng UBND xã Quỳnh Phụ", value: "0976 399 942", icon: "building" },
  { label: "Trung tâm Phục vụ hành chính công xã", value: "0985 110 981", icon: "megaphone" },
];
const HOTLINE_SOURCE = "https://quynhphu.hungyen.gov.vn/danh-ba-dien-tu.html";

const TILES = [
  { href: "/truong-hoc", title: "Trường học", desc: "Danh bạ trường mầm non đến THPT theo xã.", icon: "school" },
  { href: "/y-te", title: "Y tế", desc: "Bệnh viện, trạm y tế, phòng khám & SĐT.", icon: "health" },
  { href: "/viec-lam", title: "Việc làm", desc: "Tin tuyển dụng địa phương, lọc theo ngành.", icon: "job" },
  { href: "/tim-do-roi", title: "Tìm đồ rơi", desc: "Đăng & tra tin nhặt được / bị mất đồ.", icon: "search" },
  { href: "/cho", title: "Chợ & Mua bán", desc: "Lịch chợ phiên, đặc sản, tin mua bán.", icon: "market" },
  { href: "/di-tich", title: "Di tích", desc: "Đình, chùa, đền và di tích lịch sử.", icon: "landmark" },
];


// Thẻ dịch vụ: số liệu đếm từ dữ liệu thật của web (truyền vào lúc render).
function buildServices(c: { schools: number; health: number; transit: number }) {
  const n = (v: number) => (v > 0 ? v.toLocaleString("vi-VN") : "—");
  return [
    {
      tone: "is-school", icon: "school", cat: "Giáo dục", title: "Trường học", href: "/truong-hoc", linkLabel: "Xem danh bạ trường học",
      desc: "Danh bạ trường mầm non đến THPT theo từng xã, kèm địa chỉ và thông tin tuyển sinh.",
      stats: [{ num: n(c.schools), label: "Trường" }, { num: "9", label: "Xã mới" }],
      tags: ["Mầm non", "Tiểu học", "THCS", "THPT"],
    },
    {
      tone: "is-health", icon: "health", cat: "Sức khoẻ", title: "Y tế", href: "/y-te", linkLabel: "Xem cơ sở y tế",
      desc: "Bệnh viện, trạm y tế và phòng khám trên địa bàn, kèm số điện thoại và giờ làm việc.",
      stats: [{ num: n(c.health), label: "Cơ sở" }, { num: "115", label: "Cấp cứu" }],
      tags: ["Bệnh viện", "Trạm y tế", "Phòng khám"],
    },
    {
      tone: "is-transit", icon: "bus", cat: "Đi lại", title: "Giao thông", href: "/giao-thong", linkLabel: "Xem tuyến xe",
      desc: "Tuyến xe buýt, xe khách và lộ trình kết nối Quỳnh Phụ với các xã, tỉnh lân cận.",
      stats: [{ num: n(c.transit), label: "Tuyến xe" }],
      tags: ["Xe buýt", "Xe khách", "Lộ trình"],
    },
  ];
}

/* ------------------------------- Icons -------------------------------- */
function Icon({ name, size = 24 }: { name: string; size?: number }) {
  const p = {
    viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2,
    strokeLinecap: "round" as const, strokeLinejoin: "round" as const, width: size, height: size,
  };
  switch (name) {
    case "school": return (<svg {...p}><path d="M22 10L12 5 2 10l10 5 10-5z" /><path d="M6 12v5c0 1 2.7 2 6 2s6-1 6-2v-5" /></svg>);
    case "health": return (<svg {...p}><path d="M3 12h4l2 5 4-10 2 5h4" /></svg>);
    case "job": return (<svg {...p}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>);
    case "search": return (<svg {...p}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>);
    case "market": return (<svg {...p}><path d="M6 2 4 6v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6l-2-4z" /><path d="M4 6h16M9 10a3 3 0 0 0 6 0" /></svg>);
    case "landmark": return (<svg {...p}><path d="M3 21h18M5 21V10M19 21V10M9 21V10M15 21V10M12 3 4 8h16z" /></svg>);
    case "bus": return (<svg {...p}><rect x="4" y="4" width="16" height="13" rx="2" /><path d="M4 11h16M8 17v2M16 17v2" /><circle cx="8.5" cy="14" r="1" /><circle cx="15.5" cy="14" r="1" /></svg>);
    case "map-pin": return (<svg {...p}><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>);
    case "clock": return (<svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>);
    case "alert": return (<svg {...p}><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>);
    case "ambulance": return (<svg {...p}><path d="M10 10H6M8 8v4" /><path d="M3 17V7a1 1 0 0 1 1-1h11v11" /><path d="M15 9h4l2 3v5h-6" /><circle cx="7" cy="19" r="2" /><circle cx="17" cy="19" r="2" /></svg>);
    case "shield": return (<svg {...p}><path d="M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z" /></svg>);
    case "megaphone": return (<svg {...p}><path d="M3 11v2a1 1 0 0 0 1 1h3l8 5V5L7 10H4a1 1 0 0 0-1 1z" /><path d="M18 9a3 3 0 0 1 0 6" /></svg>);
    case "flame": return (<svg {...p}><path d="M12 22a7 7 0 0 0 7-7c0-4-3-6.5-4-10-2 2.5-2.5 4-2.5 6-1.5-1-2.5-2.5-2.5-4C7 9.5 5 12 5 15a7 7 0 0 0 7 7z" /></svg>);
    case "building": return (<svg {...p}><path d="M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16M15 9h4a1 1 0 0 1 1 1v11M3 21h18M8 8h3M8 12h3M8 16h3" /></svg>);
    default: return null;
  }
}

function SectionHead({ eyebrow, title, href, linkLabel = "Xem tất cả", desc }: { eyebrow: string; title: string; href?: string; linkLabel?: string; desc?: string }) {
  return (
    <header className="qp-sechead">
      <div className="qp-sechead__titles">
        <span className="type-tag qp-sechead__eyebrow">{eyebrow}</span>
        <h2 className="type-h2">{title}</h2>
        {desc && <p className="qp-sechead__desc">{desc}</p>}
      </div>
      {href && (
        <Link className="qp-sechead__link" href={href}>
          {linkLabel} <span aria-hidden>→</span>
        </Link>
      )}
    </header>
  );
}

export const dynamic = "force-dynamic";

// Bài viết DB → slide hero. Slide mặc định đã có sẵn trong HeroSlider.
function toHeroSlide(d: ArticleDoc): HeroSlide {
  const initials = (d.author?.name || "QP").split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return {
    id: d.slug,
    eyebrow: `${d.category} · Quỳnh Phụ`,
    headline: d.title,
    lead: d.excerpt,
    image: d.coverImage,
    imageAlt: d.coverAlt ?? "",
    cta: { label: "Đọc bài viết", href: `/tin-tuc/${d.slug}` },
    byline: { avatar: initials, role: d.author?.title || d.category, name: d.author?.name || "Ban biên tập", time: fmtViews(d.views ?? 0) },
  };
}

export default async function HomePage() {
  // Các khối trang chủ (Tin tức / Việc làm / Tìm đồ rơi / Mua bán) — đọc theo cấu hình admin.
  const [home, settings, openJobs, counts, markets, blocks] = await Promise.all([
    loadHomeSections(),
    getSettings(),
    countJobs({ status: "open" }).catch(() => 0),
    Promise.all([
      schools().then((c) => c.countDocuments({ active: true })),
      health().then((c) => c.countDocuments({ active: true })),
      transit().then((c) => c.countDocuments({ active: true })),
    ]).then(([s, h, t]) => ({ schools: s, health: h, transit: t })).catch(() => ({ schools: 0, health: 0, transit: 0 })),
    listMarket({ activeOnly: true }).catch(() => []),
    getHomeBlocks(),
  ]);
  const kpis = [...AREA_FACTS, { num: openJobs.toLocaleString("vi-VN"), unit: "", label: "Tin việc làm đang tuyển" }];
  const services = buildServices(counts);
  // Lịch chợ phiên thật (mục Chợ có ghi lịch họp) thay cho sự kiện gõ tay.
  const marketDays = markets.filter((m) => m.schedule?.trim()).slice(0, 3);
  const weather: WeatherData | null =
    blocks.daily && blocks.weather && settings.weatherEnabled && settings.weatherShowOnHome ? await getWeather(settings).catch(() => null) : null;

  const heroSlides: HeroSlide[] = home.sliderDocs.map(toHeroSlide);
  return (
    <>
      <JsonLd data={[jsonLdWebSite(), jsonLdOrganization(settings)]} />
      <HeroSlider articleSlides={heroSlides} />

      {/* THÔNG TIN HÔM NAY — xổ số, bóng đá, giá vàng, tỷ giá + thời tiết */}
      <DailyHub weather={weather} cfg={blocks} />

      {/* TRUY CẬP NHANH — lưới icon gọn: 6 cột desktop · 3 cột tablet · 2 cột điện thoại */}
      {blocks.quick && (
      <section className="section section-alt qp-quick">
        <div className="container-wide">
          <SectionHead eyebrow="Tiện ích" title="Truy cập nhanh" desc="Các mục thông tin được người dân quan tâm nhất." />
          <div className="qp-quick__grid">
            {TILES.map((t) => (
              <Link className="qp-tile qp-tile--compact" href={t.href} key={t.href}>
                <span className="qp-tile__icon"><Icon name={t.icon} /></span>
                <span className="qp-tile__title">{t.title}</span>
                <span className="qp-tile__desc">{t.desc}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      )}

      {/* KPI STRIP */}
      {blocks.kpi && (
      <section className="qp-kpi-strip">
        <div className="container-wide qp-kpi-grid">
          {kpis.map((k) => (
            <div className="qp-kpi" key={k.label}>
              <div className="qp-kpi__value">
                <span className="num">{k.num}</span>
                {k.unit && <span className="unit">{k.unit}</span>}
              </div>
              <span className="qp-kpi__label">{k.label}</span>
            </div>
          ))}
        </div>
      </section>

      )}

      {/* TIN TỨC & THÔNG BÁO — theo cấu hình admin (Trang chủ) */}
      {home.news.length > 0 && (
        <section className="section section-alt qp-section--news-bg">
          <div className="container-wide">
            <SectionHead eyebrow="Cập nhật" title="Tin tức & thông báo" href="/tin-tuc" linkLabel="Xem tất cả tin tức" />
            <div className="qp-grid-news qp-scroller">
              {home.news.map((a) => (
                <NewsCard key={a.id} a={a} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* GỢI Ý THEO SỞ THÍCH — tự ẩn nếu chưa có bài */}
      <section className="section">
        <div className="container-wide">
          <ForYou limit={4} exclude={home.news.map((n) => n.slug)} />
        </div>
      </section>

      {/* VIỆC LÀM — theo cấu hình admin */}
      {home.jobs.length > 0 && (
        <section className="section">
          <div className="container-wide">
            <SectionHead eyebrow="Tuyển dụng" title="Việc làm mới nhất" href="/viec-lam" linkLabel="Xem tất cả việc làm" />
            <div className="qp-grid-news qp-scroller">
              {home.jobs.map((c) => <HomeModuleCard key={c.slug} card={c} />)}
            </div>
          </div>
        </section>
      )}

      {/* TÌM ĐỒ RƠI — theo cấu hình admin */}
      {home.lostfound.length > 0 && (
        <section className="section section-alt">
          <div className="container-wide">
            <SectionHead eyebrow="Cộng đồng" title="Tìm đồ rơi gần đây" href="/tim-do-roi" linkLabel="Xem tất cả tin tìm đồ" />
            <div className="qp-grid-news qp-scroller">
              {home.lostfound.map((c) => <HomeModuleCard key={c.slug} card={c} />)}
            </div>
          </div>
        </section>
      )}

      {/* MUA BÁN — theo cấu hình admin */}
      {home.classifieds.length > 0 && (
        <section className="section">
          <div className="container-wide">
            <SectionHead eyebrow="Rao vặt" title="Mua bán mới nhất" href="/mua-ban" linkLabel="Xem tất cả tin mua bán" />
            <div className="qp-grid-news qp-scroller">
              {home.classifieds.map((c) => <HomeModuleCard key={c.slug} card={c} />)}
            </div>
          </div>
        </section>
      )}

      {/* LỊCH CHỢ PHIÊN — từ dữ liệu mục Chợ (chợ có ghi lịch họp); chưa có thì ẩn cả khối */}
      {blocks.market && marketDays.length > 0 && (
        <section className="section">
          <div className="container-wide">
            <SectionHead eyebrow="Chợ quê" title="Lịch chợ phiên" href="/cho" linkLabel="Xem tất cả chợ" />
            <div className="grid grid-3">
              {marketDays.map((m) => (
                <Link className="qp-event-card" href={`/cho/${m.slug}`} key={m.slug}>
                  <div className="qp-event-card__date" aria-hidden>
                    <div className="qp-event-card__day"><Icon name="market" size={26} /></div>
                    <div className="qp-event-card__month">Chợ</div>
                  </div>
                  <div className="qp-event-card__body">
                    <span className="qp-category-badge">{m.categoryLabel}</span>
                    <h3 className="qp-event-card__title">{m.name}</h3>
                    <div className="qp-event-card__meta">
                      <span><Icon name="clock" size={14} />{m.schedule}</span>
                      {(m.address || WARDS.find((w) => w.slug === m.wardSlug)?.name) && (
                        <span><Icon name="map-pin" size={14} />{m.address || WARDS.find((w) => w.slug === m.wardSlug)?.name}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TIỆN ÍCH & DỊCH VỤ THIẾT YẾU */}
      {blocks.services && (
      <section className="section section-alt">
        <div className="container-wide">
          <SectionHead
            eyebrow="Dịch vụ địa phương"
            title="Tiện ích & dịch vụ thiết yếu"
            desc="Tra cứu nhanh trường học, cơ sở y tế và giao thông trên địa bàn xã Quỳnh Phụ — kèm địa chỉ, số điện thoại và giờ làm việc."
          />
          <div className="grid grid-3">
            {services.map((s) => (
              <article className="qp-service-card" key={s.title}>
                <div className="qp-service-card__top">
                  <span className={`qp-service-card__icon ${s.tone}`}><Icon name={s.icon} size={26} /></span>
                  <div>
                    <span className="type-tag qp-service-card__cat">{s.cat}</span>
                    <div className="qp-service-card__title">{s.title}</div>
                  </div>
                </div>
                <p className="qp-service-card__desc">{s.desc}</p>
                <div className="qp-service-card__stats">
                  {s.stats.map((st) => (
                    <div className="qp-service-stat" key={st.label}>
                      <b>{st.num}</b>
                      <span>{st.label}</span>
                    </div>
                  ))}
                </div>
                <div className="qp-service-card__tags">
                  {s.tags.map((t) => <span className="qp-tag" key={t}>{t}</span>)}
                </div>
                <Link className="qp-service-card__link" href={s.href}>
                  {s.linkLabel} <span aria-hidden>→</span>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      )}

      {/* HOTLINE BAND */}
      {blocks.hotline && (
      <section className="section">
        <div className="container-wide">
          <div className="qp-cta-band">
            <h2 className="qp-cta-band__title">Đường dây nóng & liên hệ khẩn cấp</h2>
            {HOTLINES.map((h) => (
              <div className="qp-cta-item" key={h.label}>
                <span className="qp-cta-item__icon"><Icon name={h.icon} size={24} /></span>
                <div>
                  <div className="qp-cta-item__label">{h.label}</div>
                  <a className="qp-cta-item__value" href={`tel:${h.value.replace(/\s/g, "")}`}>{h.value}</a>
                </div>
              </div>
            ))}
            <p className="qp-cta-band__note">
              Số của UBND xã Quỳnh Phụ theo thông báo ngày 11/11/2026 — nhận phản ánh trong giờ hành chính.{" "}
              <a href={HOTLINE_SOURCE} target="_blank" rel="noopener noreferrer">Xem danh bạ đầy đủ trên cổng thông tin xã</a>
            </p>
          </div>
        </div>
      </section>

      )}

      {/* NEWSLETTER */}
      <section className="section section-alt">
        <div className="container-wide">
          <div className="qp-newsletter">
            <h2 className="type-h2">Nhận tin quê nhà qua email</h2>
            <p className="type-body">Tin tức, thông báo và việc làm mới — gửi gọn vào hộp thư của bạn.</p>
            <NewsletterForm source="home" />
          </div>
        </div>
      </section>
    </>
  );
}
