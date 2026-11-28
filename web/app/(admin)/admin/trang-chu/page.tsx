import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/admin";
import { getHomeSections, listHomeCandidates } from "@/lib/home-sections";
import { getHomeBlocks } from "@/lib/home-blocks";
import { LEAGUES } from "@/lib/daily/football";
import { HomeBlocksManager } from "@/components/admin/HomeBlocksManager";
import { getPageSeoConfig } from "@/lib/page-seo";
import { HomeSectionsManager } from "@/components/admin/HomeSectionsManager";
import { ModuleTabs } from "@/components/admin/ModuleTabs";

export const metadata: Metadata = { title: "Trang chủ — Quản trị", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminHomeSectionsPage() {
  await requireAdminPage();
  const [config, candidates, pageSeo, blocks] = await Promise.all([
    getHomeSections(), listHomeCandidates(), getPageSeoConfig(), getHomeBlocks(),
  ]);
  return (
    <>
      <div className="qp-admin-head">
        <span className="qp-admin-head__eyebrow">Hệ thống</span>
        <h1 className="type-h1">Trang chủ</h1>
        <p className="qp-admin-head__desc">Cấu hình hiển thị các khối trên trang chủ (tab “Quản lý trang”) và tối ưu SEO trang chủ (tab “SEO”).</p>
      </div>
      <ModuleTabs
        pageKey="/"
        pageLabel="Trang chủ"
        seoInitial={pageSeo["/"] ?? {}}
        manage={<><HomeSectionsManager initialConfig={config} candidates={candidates} /><HomeBlocksManager initial={blocks} leagues={LEAGUES.map((l) => ({ code: l.code, name: l.name }))} /></>}
      />
    </>
  );
}
