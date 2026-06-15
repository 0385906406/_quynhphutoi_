"use client";

// Quản trị các khối trang Tin tức (/tin-tuc): vùng nổi bật & khối "Đọc nhiều".
// Vùng nổi bật tách riêng: 1 BÀI LỚN + tối đa 3 BÀI NHỎ. Chọn thủ công qua ArticlePicker
// (tìm-mới-hiện, không đổ hết danh sách).
import { useState } from "react";
import { useToast } from "@/components/common/Toast";
import { ArticlePicker } from "@/components/admin/ArticlePicker";
import type { NewsPageConfig, NewsBlockConfig, NewsBlockMode } from "@/lib/news-page";

const FEATURED_SMALL_MAX = 3;
const POPULAR_RANGE: [number, number] = [3, 10];

export function NewsPageManager({ initialConfig, initialTitles }: {
  initialConfig: NewsPageConfig;
  initialTitles: Record<string, string>;
}) {
  const [cfg, setCfg] = useState<NewsPageConfig>(initialConfig);
  const [titles, setTitles] = useState<Record<string, string>>(initialTitles);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const learnTitles = (map: Record<string, string>) => setTitles((cur) => ({ ...cur, ...map }));
  function patchFeatured(p: Partial<NewsBlockConfig>) {
    setCfg((cur) => ({ ...cur, featured: { ...cur.featured, ...p } }));
  }
  function patchPopular(p: Partial<NewsBlockConfig>) {
    setCfg((cur) => ({ ...cur, popular: { ...cur.popular, ...p } }));
  }

  async function save() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/news-page", {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ config: cfg }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(data.error || "Lưu thất bại."); return; }
      if (data.config) setCfg(data.config);
      toast.success("Đã lưu cấu hình trang Tin tức.");
    } finally { setBusy(false); }
  }

  const f = cfg.featured;
  const p = cfg.popular;

  return (
    <div className="qp-acc-page">
      {/* ───── Vùng nổi bật ───── */}
      <div className="qp-acc-card">
        <div className="qp-acc-card__title qp-acc-card__title--row" style={{ marginBottom: 4 }}>
          <span>Vùng nổi bật</span>
          <label className="qp-check" style={{ margin: 0 }}>
            <input type="checkbox" checked={f.enabled} onChange={(e) => patchFeatured({ enabled: e.target.checked })} /> Hiển thị khối
          </label>
        </div>
        <p className="type-body-small text-muted" style={{ marginBottom: 12 }}>
          Vùng đầu trang gồm 1 bài lớn và tối đa 3 bài nhỏ.
        </p>

        <div className="qp-form-group">
          <label className="qp-label">Chế độ hiển thị</label>
          <select className="qp-select" value={f.mode} onChange={(e) => patchFeatured({ mode: e.target.value as NewsBlockMode })} disabled={!f.enabled}>
            <option value="latest">Mới nhất</option>
            <option value="manual">Chọn thủ công</option>
          </select>
        </div>

        {f.enabled && f.mode === "manual" && (
          <>
            <div className="qp-form-group">
              <label className="qp-label">Bài lớn (nổi bật chính) — chọn 1 bài</label>
              <ArticlePicker
                selected={f.heroSlug ? [f.heroSlug] : []}
                max={1}
                titles={titles}
                onChange={(slugs) => patchFeatured({ heroSlug: slugs[0] ?? "" })}
                onLearnTitles={learnTitles}
              />
            </div>
            <div className="qp-form-group">
              <label className="qp-label">Bài nhỏ — tối đa {FEATURED_SMALL_MAX} bài</label>
              <ArticlePicker
                selected={f.manualSlugs}
                max={FEATURED_SMALL_MAX}
                titles={titles}
                onChange={(slugs) => patchFeatured({ manualSlugs: slugs })}
                onLearnTitles={learnTitles}
              />
            </div>
          </>
        )}
      </div>

      {/* ───── Khối "Đọc nhiều" ───── */}
      <div className="qp-acc-card">
        <div className="qp-acc-card__title qp-acc-card__title--row" style={{ marginBottom: 4 }}>
          <span>Khối “Đọc nhiều”</span>
          <label className="qp-check" style={{ margin: 0 }}>
            <input type="checkbox" checked={p.enabled} onChange={(e) => patchPopular({ enabled: e.target.checked })} /> Hiển thị khối
          </label>
        </div>
        <p className="type-body-small text-muted" style={{ marginBottom: 12 }}>Sidebar “Đọc nhiều” bên phải vùng nổi bật.</p>

        <div className="qp-acc-grid2">
          <div className="qp-form-group">
            <label className="qp-label">Chế độ hiển thị</label>
            <select className="qp-select" value={p.mode} onChange={(e) => patchPopular({ mode: e.target.value as NewsBlockMode })} disabled={!p.enabled}>
              <option value="popular">Theo lượt xem</option>
              <option value="manual">Chọn thủ công</option>
            </select>
          </div>
          <div className="qp-form-group">
            <label className="qp-label">Số lượng hiển thị</label>
            <input type="number" min={POPULAR_RANGE[0]} max={POPULAR_RANGE[1]} className="qp-input" value={p.limit}
              onChange={(e) => patchPopular({ limit: Number(e.target.value) || POPULAR_RANGE[0] })} disabled={!p.enabled} />
          </div>
        </div>

        {p.enabled && p.mode === "manual" && (
          <div className="qp-form-group">
            <label className="qp-label">Chọn bài — tối đa {p.limit} bài</label>
            <ArticlePicker
              selected={p.manualSlugs}
              max={p.limit}
              titles={titles}
              onChange={(slugs) => patchPopular({ manualSlugs: slugs })}
              onLearnTitles={learnTitles}
            />
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <button type="button" className="qp-btn-primary" onClick={save} disabled={busy}>{busy ? "Đang lưu…" : "Lưu cấu hình"}</button>
      </div>
    </div>
  );
}
