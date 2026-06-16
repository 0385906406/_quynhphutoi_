import type { Metadata } from "next";
import { getPageSeoConfig } from "@/lib/page-seo";
import { getNewsPageConfig, newsCandidatesBySlugs } from "@/lib/news-page";
import { getHomeSections, listHomeCandidates } from "@/lib/home-sections";
import { PagesAdmin } from "@/components/admin/PagesAdmin";

export const metadata: Metadata = { title: "Quản lý trang — Quản trị", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminPagesPage() {
  const [pageSeo, newsConfig, homeConfig, homeCandidates] = await Promise.all([
    getPageSeoConfig(),
    getNewsPageConfig(),
    getHomeSections(),
    listHomeCandidates(),
  ]);
  // Tiêu đề cho các bài tin tức đã chọn thủ công (để picker hiện chip ngay, không cần search).
  const selectedSlugs = [
    newsConfig.featured.heroSlug,
    ...newsConfig.featured.manualSlugs,
    ...newsConfig.popular.manualSlugs,
  ];
  const newsTitles = Object.fromEntries(
    (await newsCandidatesBySlugs(selectedSlugs)).map((c) => [c.slug, c.title] as const),
  );

  return (
    <>
      <div className="qp-admin-head">
        <span className="qp-admin-head__eyebrow">Hệ thống</span>
        <h1 className="type-h1">Quản lý trang</h1>
        <p className="qp-admin-head__desc">Chọn một trang ở danh sách bên trái để cấu hình bố cục (tab “Quản lý trang”) và tối ưu SEO riêng (tab “SEO”). SEO chung toàn site nằm ở Cài đặt → SEO toàn site.</p>
      </div>
      <PagesAdmin
        pageSeo={pageSeo}
        newsConfig={newsConfig}
        newsTitles={newsTitles}
        homeConfig={homeConfig}
        homeCandidates={homeCandidates}
      />
    </>
  );
}
