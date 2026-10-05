"use client";

// Khối nhập SEO tuỳ chọn dùng chung cho mọi form admin (quảng cáo, trường học, y tế,
// giao thông, chợ, di tích). Mirror khối "Tối ưu SEO" của ArticleManager. Tự quản lý
// chuỗi keywords nội bộ (tránh lỗi gõ khi tách dấu phẩy theo từng phím) và emit SeoFields.
import { useState } from "react";
import type { SeoFields } from "@/lib/seo-fields";
import { SerpPreview, LengthMeter } from "@/components/admin/SeoAnalysisPanel";

// Bỏ thẻ HTML + gom khoảng trắng (mô tả module có thể là HTML từ trình soạn).
const plain = (s: string) => s.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

export function SeoFieldsEditor({
  value,
  onChange,
  preview,
}: {
  value?: SeoFields;
  onChange: (v: SeoFields) => void;
  /** Nội dung tự sinh của trang (tên, mô tả, đường dẫn) → xem trước Google + thước đo độ dài. */
  preview?: { title: string; description?: string; path: string };
}) {
  const v = value ?? {};
  const [kw, setKw] = useState((v.keywords ?? []).join(", "));
  const set = (patch: Partial<SeoFields>) => onChange({ ...v, ...patch });
  // Giá trị Google thực sự thấy: ô ghi đè nếu có, không thì nội dung tự sinh.
  const effTitle = (v.metaTitle || "").trim() || (preview?.title || "").trim();
  const effDesc = (v.metaDescription || "").trim() || plain(preview?.description || "").slice(0, 300);

  return (
    <div style={{ marginTop: 8 }}>
      <div>
        <p className="type-body-small text-muted" style={{ marginTop: 0 }}>
          Để trống = tự sinh từ nội dung. Chỉ điền khi muốn ghi đè hiển thị trên Google / mạng xã hội.
        </p>
        {preview && <SerpPreview title={effTitle} description={effDesc} path={preview.path} />}
        <div className="qp-form-group">
          <label className="qp-label">Meta title{preview && <LengthMeter value={effTitle.length} min={40} max={60} hardMax={70} />}</label>
          <input className="qp-input" value={v.metaTitle ?? ""} maxLength={200}
            onChange={(e) => set({ metaTitle: e.target.value })}
            placeholder="Tiêu đề hiển thị trên Google (≈ 60 ký tự là đẹp)" />
        </div>
        <div className="qp-form-group">
          <label className="qp-label">Meta description{preview && <LengthMeter value={effDesc.length} min={120} max={160} hardMax={200} />}</label>
          <textarea className="qp-textarea" value={v.metaDescription ?? ""} maxLength={300}
            onChange={(e) => set({ metaDescription: e.target.value })}
            placeholder="Mô tả ngắn hiển thị dưới tiêu đề (≈ 160 ký tự)" />
        </div>
        <div className="qp-acc-grid2">
          <div className="qp-form-group">
            <label className="qp-label">Keywords (cách nhau dấu phẩy)</label>
            <input className="qp-input" value={kw}
              onChange={(e) => {
                setKw(e.target.value);
                set({ keywords: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) });
              }}
              placeholder="VD: trường học, Quỳnh Phụ, THPT" />
          </div>
          <div className="qp-form-group">
            <label className="qp-label">OG image URL</label>
            <input className="qp-input" value={v.ogImage ?? ""}
              onChange={(e) => set({ ogImage: e.target.value })}
              placeholder="Ảnh chia sẻ mạng xã hội (tuỳ chọn)" />
          </div>
        </div>
        <label className="qp-check">
          <input type="checkbox" checked={!!v.noindex} onChange={(e) => set({ noindex: e.target.checked })} />{" "}
          Ẩn khỏi công cụ tìm kiếm (noindex)
        </label>
      </div>
    </div>
  );
}
