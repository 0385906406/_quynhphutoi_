"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ImageUploader } from "@/components/common/ImageUploader";
import { RichTextEditor } from "@/components/lostfound/RichTextEditor";
import { useToast } from "@/components/common/Toast";
import type { ArticleScope } from "@/lib/news";

export type ArticleForm = {
  title: string; excerpt: string; category: string; scope: ArticleScope; tags: string;
  coverImage: string; coverAlt: string; authorName: string; authorTitle: string;
  bodyHtml: string; featured: boolean; status: "draft" | "published";
  seoMetaTitle: string; seoMetaDescription: string; seoKeywords: string; seoOgImage: string; seoNoindex: boolean;
};

export const ARTICLE_FORM_EMPTY: ArticleForm = {
  title: "", excerpt: "", category: "", scope: "trong-xa", tags: "", coverImage: "", coverAlt: "",
  authorName: "Ban biên tập", authorTitle: "", bodyHtml: "", featured: false, status: "draft",
  seoMetaTitle: "", seoMetaDescription: "", seoKeywords: "", seoOgImage: "", seoNoindex: false,
};

type Props = { editingSlug?: string; initialForm: ArticleForm; categories: string[] };

function Counter({ val, max, warn = max - 20 }: { val: number; max: number; warn?: number }) {
  const cls = val >= max ? "is-full" : val >= warn ? "is-near" : "";
  return <span className={`qp-ae__fcount${cls ? " " + cls : ""}`}>{val}/{max}</span>;
}

export function ArticleEditorPage({ editingSlug, initialForm, categories }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState<ArticleForm>(initialForm);
  const [busy, setBusy] = useState(false);
  const [seoOpen, setSeoOpen] = useState(false);

  function set<K extends keyof ArticleForm>(k: K, v: ArticleForm[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const catList = useMemo(() => {
    const base = categories ?? [];
    return form.category && !base.includes(form.category) ? [...base, form.category] : base;
  }, [categories, form.category]);

  function buildPayload(f: ArticleForm) {
    return {
      title: f.title, excerpt: f.excerpt, category: f.category, scope: f.scope,
      tags: f.tags.split(",").map((t) => t.trim()).filter(Boolean),
      coverImage: f.coverImage, coverAlt: f.coverAlt,
      authorName: f.authorName, authorTitle: f.authorTitle,
      bodyHtml: f.bodyHtml, featured: f.featured, status: f.status,
      seoMetaTitle: f.seoMetaTitle, seoMetaDescription: f.seoMetaDescription,
      seoKeywords: f.seoKeywords.split(",").map((t) => t.trim()).filter(Boolean),
      seoOgImage: f.seoOgImage, seoNoindex: f.seoNoindex,
    };
  }

  async function save(forcedStatus?: "draft" | "published") {
    const f = forcedStatus ? { ...form, status: forcedStatus } : form;
    if (!f.title.trim()) { toast.error("Nhập tiêu đề bài viết."); return; }
    if (!f.coverImage) { toast.error("Cần chọn ảnh bìa."); return; }
    setBusy(true);
    try {
      const res = await fetch(
        editingSlug ? `/api/admin/articles/${editingSlug}` : "/api/admin/articles",
        { method: editingSlug ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(buildPayload(f)) },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(data.error || "Có lỗi xảy ra."); return; }
      toast.success(editingSlug ? "Đã cập nhật bài viết." : "Đã tạo bài viết.");
      router.push("/admin/tin-tuc");
      router.refresh();
    } finally { setBusy(false); }
  }

  return (
    <div className="qp-ae">

      {/* ── Topbar ── */}
      <div className="qp-ae__topbar">
        <div className="qp-ae__breadcrumb">
          <Link href="/admin/tin-tuc" className="qp-ae__back">
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Tin tức
          </Link>
          <span className="qp-ae__pagetitle">
            {editingSlug ? (form.title ? `Sửa: ${form.title}` : "Sửa bài viết") : "Viết bài mới"}
          </span>
        </div>
        <div className="qp-ae__headeractions">
          <button type="button" className="qp-btn-outline" onClick={() => router.push("/admin/tin-tuc")} disabled={busy}>Huỷ</button>
          <button type="button" className="qp-btn-outline" onClick={() => save("draft")} disabled={busy}>
            {busy ? "Đang lưu…" : "Lưu nháp"}
          </button>
          <button type="button" className="qp-btn-primary" onClick={() => save("published")} disabled={busy}>
            {busy ? "Đang lưu…" : editingSlug ? "Lưu thay đổi" : "Xuất bản"}
          </button>
        </div>
      </div>

      {/* ── Two-column workspace ── */}
      <div className="qp-ae__workspace">

        {/* Main: tiêu đề + sapo + nội dung */}
        <div className="qp-ae__main">
          <div className="qp-ae__main-card">
            <div className="qp-ae__field">
              <label className="qp-ae__flabel">Tiêu đề <span className="req">*</span></label>
              <textarea
                className="qp-ae__title-input"
                value={form.title ?? ""}
                maxLength={200}
                rows={2}
                onChange={(e) => set("title", e.target.value)}
                placeholder="Nhập tiêu đề bài viết…"
              />
              <div className="qp-ae__ffoot">
                <Counter val={(form.title ?? "").length} max={200} warn={160} />
              </div>
            </div>
            <div className="qp-ae__field qp-ae__field--last">
              <label className="qp-ae__flabel">Tóm tắt (sapo)</label>
              <textarea className="qp-textarea" rows={3} value={form.excerpt ?? ""}
                onChange={(e) => set("excerpt", e.target.value)}
                placeholder="Tóm tắt ngắn hiển thị ở danh sách bài & SEO description" />
              <div className="qp-ae__ffoot">
                <Counter val={(form.excerpt ?? "").length} max={300} warn={260} />
              </div>
            </div>
          </div>

          <div className="qp-ae__main-card qp-ae__main-card--editor">
            <div className="qp-ae__editor-header">
              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              Nội dung bài viết
            </div>
            <RichTextEditor value={form.bodyHtml} onChange={(html) => set("bodyHtml", html)}
              placeholder="Soạn nội dung bài viết…" />
          </div>
        </div>

        {/* ── Sidebar ── */}
        <aside className="qp-ae__sidebar">

          {/* Xuất bản */}
          <div className="qp-ae__scard">
            <div className="qp-ae__scard-head">
              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
              </svg>
              Xuất bản
            </div>
            <div className="qp-ae__scard-body">
              <div className="qp-ae__field">
                <span className="qp-ae__flabel">Trạng thái</span>
                <div className="qp-ae__seg">
                  <button type="button" className={`qp-ae__seg-btn${form.status === "draft" ? " is-draft" : ""}`} onClick={() => set("status", "draft")}>Bản nháp</button>
                  <button type="button" className={`qp-ae__seg-btn${form.status === "published" ? " is-pub" : ""}`} onClick={() => set("status", "published")}>Xuất bản</button>
                </div>
              </div>
              <hr className="qp-ae__scard-divider" />
              <div
                className="qp-ae__toggle-row"
                onClick={() => set("featured", !form.featured)}
                role="button" tabIndex={0}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && set("featured", !form.featured)}
              >
                <div className="qp-ae__toggle-info">
                  <span className="qp-ae__toggle-title">Bài nổi bật</span>
                  <span className="qp-ae__toggle-sub">Hiển thị ở vị trí ưu tiên</span>
                </div>
                <div className={`qp-ae__switch${form.featured ? " is-on" : ""}`} aria-hidden="true">
                  <span className="qp-ae__switch-thumb" />
                </div>
              </div>
            </div>
          </div>

          {/* Ảnh bìa */}
          <div className="qp-ae__scard">
            <div className="qp-ae__scard-head">
              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
              Ảnh bìa <span className="req">*</span>
            </div>
            <div className="qp-ae__scard-body">
              <ImageUploader
                value={form.coverImage ? [form.coverImage] : []}
                onChange={(arr) => set("coverImage", arr[0] ?? "")}
                max={1}
              />
              <div className="qp-ae__field" style={{ marginTop: 12, marginBottom: 0 }}>
                <label className="qp-ae__flabel">Mô tả ảnh (alt)</label>
                <input className="qp-input" value={form.coverAlt}
                  onChange={(e) => set("coverAlt", e.target.value)}
                  placeholder="Mô tả ngắn cho ảnh bìa" />
              </div>
              <p className="qp-ae__cover-hint">Khuyến nghị 16:9 · tối thiểu 800×450 px.</p>
            </div>
          </div>

          {/* Phân loại */}
          <div className="qp-ae__scard">
            <div className="qp-ae__scard-head">
              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
              </svg>
              Phân loại
            </div>
            <div className="qp-ae__scard-body">
              <div className="qp-ae__field">
                <label className="qp-ae__flabel">Chuyên mục <span className="req">*</span></label>
                <select className="qp-select" value={form.category} onChange={(e) => set("category", e.target.value)}>
                  {catList.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="qp-ae__field">
                <label className="qp-ae__flabel">Phạm vi <span className="req">*</span></label>
                <div className="qp-ae__seg">
                  <button type="button" className={`qp-ae__seg-btn${form.scope === "trong-xa" ? " is-draft" : ""}`} onClick={() => set("scope", "trong-xa")}>Trong xã</button>
                  <button type="button" className={`qp-ae__seg-btn${form.scope === "ngoai-xa" ? " is-draft" : ""}`} onClick={() => set("scope", "ngoai-xa")}>Ngoài xã</button>
                </div>
              </div>
              <div className="qp-ae__field qp-ae__field--last">
                <label className="qp-ae__flabel">Thẻ (cách nhau dấu phẩy)</label>
                <input className="qp-input" value={form.tags} onChange={(e) => set("tags", e.target.value)}
                  placeholder="VD: Việc làm, Thông báo" />
              </div>
            </div>
          </div>

          {/* Tác giả */}
          <div className="qp-ae__scard">
            <div className="qp-ae__scard-head">
              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              Tác giả
            </div>
            <div className="qp-ae__scard-body">
              <div className="qp-ae__field">
                <label className="qp-ae__flabel">Tên tác giả</label>
                <input className="qp-input" value={form.authorName} onChange={(e) => set("authorName", e.target.value)} />
              </div>
              <div className="qp-ae__field qp-ae__field--last">
                <label className="qp-ae__flabel">Chức danh / đơn vị</label>
                <input className="qp-input" value={form.authorTitle} onChange={(e) => set("authorTitle", e.target.value)} />
              </div>
            </div>
          </div>

          {/* SEO collapsible */}
          <div className={`qp-ae__scard qp-ae__scard--collapsible${seoOpen ? " is-open" : ""}`}>
            <button type="button" className="qp-ae__scard-head qp-ae__scard-toggle" onClick={() => setSeoOpen((o) => !o)}>
              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              SEO & nâng cao
              <svg className="qp-ae__scard-chevron" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            {seoOpen && (
              <div className="qp-ae__scard-body">
                <div className="qp-ae__field">
                  <label className="qp-ae__flabel">Meta title</label>
                  <input className="qp-input" value={form.seoMetaTitle} onChange={(e) => set("seoMetaTitle", e.target.value)} placeholder="Để trống → dùng tiêu đề bài viết" />
                </div>
                <div className="qp-ae__field">
                  <label className="qp-ae__flabel">Meta description</label>
                  <textarea className="qp-textarea" rows={2} value={form.seoMetaDescription} onChange={(e) => set("seoMetaDescription", e.target.value)} placeholder="Để trống → dùng tóm tắt (sapo)" />
                </div>
                <div className="qp-ae__field">
                  <label className="qp-ae__flabel">Keywords (dấu phẩy)</label>
                  <input className="qp-input" value={form.seoKeywords} onChange={(e) => set("seoKeywords", e.target.value)} />
                </div>
                <div className="qp-ae__field">
                  <label className="qp-ae__flabel">OG image URL</label>
                  <input className="qp-input" value={form.seoOgImage} onChange={(e) => set("seoOgImage", e.target.value)} placeholder="Để trống → dùng ảnh bìa" />
                </div>
                <div
                  className="qp-ae__toggle-row"
                  onClick={() => set("seoNoindex", !form.seoNoindex)}
                  role="button" tabIndex={0}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && set("seoNoindex", !form.seoNoindex)}
                >
                  <div className="qp-ae__toggle-info">
                    <span className="qp-ae__toggle-title">Ẩn khỏi Google</span>
                    <span className="qp-ae__toggle-sub">Thêm thẻ noindex</span>
                  </div>
                  <div className={`qp-ae__switch${form.seoNoindex ? " is-on" : ""}`} aria-hidden="true">
                    <span className="qp-ae__switch-thumb" />
                  </div>
                </div>
              </div>
            )}
          </div>

        </aside>
      </div>
    </div>
  );
}
