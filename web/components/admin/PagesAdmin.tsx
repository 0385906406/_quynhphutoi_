"use client";

// Khu "Quản lý trang" tập trung: cột trái liệt kê các trang client; chọn 1 trang →
// bên phải có 2 tab "Quản lý trang" (bố cục/cấu hình + lối tắt) và "SEO" (override từng trang).
import { useMemo, useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/common/Toast";
import { HomeSectionsManager } from "@/components/admin/HomeSectionsManager";
import { NewsPageManager } from "@/components/admin/NewsPageManager";
import type { PageSeoConfig, PageSeoOverride } from "@/lib/page-seo";
import type { NewsPageConfig } from "@/lib/news-page";
import type { HomeSectionsConfig, HomeSectionKey, HomeCandidate } from "@/lib/home-sections";

type PageKind = "home" | "news" | "content" | "static";
type PageDef = { key: string; label: string; kind: PageKind; adminHref?: string };

// 14 trang client (khớp PAGE_SEO_DEFS). adminHref = trình quản lý nội dung tương ứng (nếu có).
const PAGES: PageDef[] = [
  { key: "/", label: "Trang chủ", kind: "home" },
  { key: "/tin-tuc", label: "Tin tức", kind: "news", adminHref: "/admin/tin-tuc" },
  { key: "/viec-lam", label: "Việc làm", kind: "content", adminHref: "/admin/viec-lam" },
  { key: "/mua-ban", label: "Mua bán", kind: "content", adminHref: "/admin/mua-ban" },
  { key: "/tim-do-roi", label: "Tìm đồ rơi", kind: "content", adminHref: "/admin/tim-do-roi" },
  { key: "/truong-hoc", label: "Trường học", kind: "content", adminHref: "/admin/truong-hoc" },
  { key: "/y-te", label: "Y tế", kind: "content", adminHref: "/admin/y-te" },
  { key: "/giao-thong", label: "Giao thông", kind: "content", adminHref: "/admin/giao-thong" },
  { key: "/di-tich", label: "Di tích", kind: "content", adminHref: "/admin/di-tich" },
  { key: "/cho", label: "Chợ", kind: "content", adminHref: "/admin/cho" },
  { key: "/tong-quan", label: "Tổng quan", kind: "static" },
  { key: "/sap-nhap", label: "Sáp nhập 2025", kind: "static" },
  { key: "/lien-he", label: "Liên hệ", kind: "static", adminHref: "/admin/lien-he" },
  { key: "/quang-cao", label: "Quảng cáo", kind: "content", adminHref: "/admin/quang-cao" },
];

export function PagesAdmin({ pageSeo, newsConfig, newsTitles, homeConfig, homeCandidates }: {
  pageSeo: PageSeoConfig;
  newsConfig: NewsPageConfig;
  newsTitles: Record<string, string>;
  homeConfig: HomeSectionsConfig;
  homeCandidates: Record<HomeSectionKey, HomeCandidate[]>;
}) {
  const [activeKey, setActiveKey] = useState<string>(PAGES[0].key);
  const [tab, setTab] = useState<"manage" | "seo">("manage");
  const [cfg, setCfg] = useState<PageSeoConfig>(pageSeo);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const active = useMemo(() => PAGES.find((p) => p.key === activeKey) ?? PAGES[0], [activeKey]);

  // Trang đã tuỳ chỉnh SEO (có ít nhất 1 field) → đánh dấu chấm trong danh sách.
  const isCustomized = (key: string) => {
    const ov = cfg[key];
    return !!ov && (!!ov.title || !!ov.description || !!ov.keywords || !!ov.ogImage || !!ov.noindex);
  };

  function patchSeo(key: string, p: Partial<PageSeoOverride>) {
    setCfg((cur) => ({ ...cur, [key]: { ...cur[key], ...p } }));
  }

  async function saveSeo() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/page-seo", {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ config: cfg }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(data.error || "Lưu thất bại."); return; }
      if (data.config) setCfg(data.config);
      toast.success("Đã lưu SEO trang. Áp dụng ngay cho lượt truy cập tiếp theo.");
    } finally { setBusy(false); }
  }

  const ov = cfg[active.key] ?? {};

  return (
    <div className="qp-pagehub">
      {/* Cột trái: danh sách trang */}
      <aside className="qp-pagehub__list" aria-label="Danh sách trang">
        {PAGES.map((p) => (
          <button
            key={p.key}
            type="button"
            className={`qp-pagehub__item${p.key === activeKey ? " is-active" : ""}`}
            onClick={() => { setActiveKey(p.key); }}
          >
            <span className="qp-pagehub__item-label">{p.label}</span>
            <code className="qp-pagehub__item-key">{p.key}</code>
            {isCustomized(p.key) ? <span className="qp-tabbar__dot" aria-label="SEO đã tuỳ chỉnh" /> : null}
          </button>
        ))}
      </aside>

      {/* Cột phải: tiêu đề + 2 tab */}
      <section className="qp-pagehub__detail">
        <div className="qp-pagehub__head">
          <div>
            <h2 className="type-h3" style={{ margin: 0 }}>{active.label}</h2>
            <code className="type-body-small text-muted">{active.key}</code>
          </div>
          <a className="qp-btn-outline" href={active.key} target="_blank" rel="noopener noreferrer">↗ Xem trang</a>
        </div>

        <div className="qp-tabbar" role="tablist" aria-label="Quản lý trang">
          <button type="button" role="tab" aria-selected={tab === "manage"}
            className={`qp-tabbar__btn${tab === "manage" ? " is-active" : ""}`} onClick={() => setTab("manage")}>
            Quản lý trang
          </button>
          <button type="button" role="tab" aria-selected={tab === "seo"}
            className={`qp-tabbar__btn${tab === "seo" ? " is-active" : ""}`} onClick={() => setTab("seo")}>
            SEO
          </button>
        </div>

        {tab === "manage" && (
          <div role="tabpanel">
            {active.kind === "home" && (
              <HomeSectionsManager initialConfig={homeConfig} candidates={homeCandidates} />
            )}
            {active.kind === "news" && (
              <>
                <NewsPageManager initialConfig={newsConfig} initialTitles={newsTitles} />
                <div className="qp-acc-card" style={{ marginTop: 16 }}>
                  <p className="type-body-small text-muted" style={{ margin: 0 }}>
                    Soạn / sửa bài viết tại{" "}
                    <Link href="/admin/tin-tuc" style={{ fontWeight: 600, textDecoration: "underline" }}>Quản lý bài viết</Link>.
                  </p>
                </div>
              </>
            )}
            {active.kind === "content" && (
              <div className="qp-acc-card">
                <div className="qp-acc-card__title" style={{ marginBottom: 8 }}>Nội dung trang</div>
                <p className="qp-admin-head__desc" style={{ marginTop: 0 }}>
                  Trang này hiển thị dữ liệu do bạn nhập. Dùng các nút dưới đây để xem hoặc chỉnh sửa nội dung.
                </p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <a className="qp-btn-outline" href={active.key} target="_blank" rel="noopener noreferrer">↗ Xem trang</a>
                  {active.adminHref && (
                    <Link className="qp-btn-primary" href={active.adminHref}>Mở trình quản lý nội dung</Link>
                  )}
                </div>
              </div>
            )}
            {active.kind === "static" && (
              <div className="qp-acc-card">
                <div className="qp-acc-card__title" style={{ marginBottom: 8 }}>Trang tĩnh</div>
                <p className="qp-admin-head__desc" style={{ marginTop: 0 }}>
                  Nội dung trang này cố định trong mã nguồn — ở đây bạn chỉ chỉnh được phần <b>SEO</b> (tab bên cạnh).
                </p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <a className="qp-btn-outline" href={active.key} target="_blank" rel="noopener noreferrer">↗ Xem trang</a>
                  {active.adminHref && (
                    <Link className="qp-btn-outline" href={active.adminHref}>Mở dữ liệu liên quan</Link>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "seo" && (
          <div role="tabpanel">
            <div className="qp-acc-card" key={active.key}>
              <div className="qp-acc-card__title qp-acc-card__title--row" style={{ marginBottom: 12 }}>
                <span>SEO riêng cho trang này</span>
                <label className="qp-check" style={{ margin: 0 }}>
                  <input type="checkbox" checked={!!ov.noindex} onChange={(e) => patchSeo(active.key, { noindex: e.target.checked })} /> Ẩn khỏi Google (noindex)
                </label>
              </div>
              <p className="type-body-small text-muted" style={{ marginTop: -4, marginBottom: 12 }}>
                <b>Ô trống = dùng mặc định</b> cài sẵn của trang. Áp dụng ngay, không cần build lại.
              </p>

              <div className="qp-form-group">
                <label className="qp-label">Tiêu đề (title)</label>
                <input className="qp-input" maxLength={200} value={ov.title ?? ""} onChange={(e) => patchSeo(active.key, { title: e.target.value })} placeholder="Để trống = tiêu đề mặc định của trang" />
              </div>
              <div className="qp-form-group">
                <label className="qp-label">Mô tả (description)</label>
                <textarea className="qp-textarea" maxLength={300} value={ov.description ?? ""} onChange={(e) => patchSeo(active.key, { description: e.target.value })} placeholder="Để trống = mô tả mặc định của trang (≈160 ký tự)" />
              </div>
              <div className="qp-acc-grid2">
                <div className="qp-form-group">
                  <label className="qp-label">Từ khoá (cách nhau dấu phẩy)</label>
                  <input className="qp-input" maxLength={400} value={ov.keywords ?? ""} onChange={(e) => patchSeo(active.key, { keywords: e.target.value })} placeholder="VD: việc làm Quỳnh Phụ, tuyển dụng…" />
                </div>
                <div className="qp-form-group">
                  <label className="qp-label">Ảnh chia sẻ OG (URL)</label>
                  <input className="qp-input" maxLength={500} value={ov.ogImage ?? ""} onChange={(e) => patchSeo(active.key, { ogImage: e.target.value })} placeholder="/img/og-tin-tuc.png hoặc https://…" />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button type="button" className="qp-btn-primary" onClick={saveSeo} disabled={busy}>{busy ? "Đang lưu…" : "Lưu SEO trang"}</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
