"use client";

// Modal gửi bài Tin tức — POST /api/articles (cần đăng nhập). Bài chờ admin duyệt.
import { useEffect, useState } from "react";
import Link from "next/link";
import { RichTextEditor } from "@/components/lostfound/RichTextEditor";
import { ImageUploader } from "@/components/common/ImageUploader";
import { CharCount } from "@/components/common/CharCount";
import { useAdaptiveCaptcha } from "@/components/common/useAdaptiveCaptcha";
import { useToast } from "@/components/common/Toast";
import type { ArticleScope } from "@/lib/news";

const CATEGORIES = ["Thông báo", "Đời sống", "Kinh tế", "Giáo dục"];

type Props = { open: boolean; onClose: () => void; isLoggedIn: boolean; onSuccess?: () => void };

export function ArticleSubmitModal({ open, onClose, isLoggedIn, onSuccess }: Props) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [scope, setScope] = useState<ArticleScope>("trong-xa");
  const [excerpt, setExcerpt] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [tags, setTags] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");

  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { toast } = useToast();
  const cap = useAdaptiveCaptcha();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!title.trim()) { toast.error("Vui lòng nhập tiêu đề bài viết."); return; }
    if (!coverImage) { toast.error("Vui lòng tải lên ảnh bìa."); return; }
    if (!bodyHtml.trim()) { toast.error("Vui lòng nhập nội dung bài viết."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/articles", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(), category, scope, excerpt: excerpt.trim(), coverImage,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
          bodyHtml, recaptchaToken: cap.token(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      cap.reset();
      if (cap.challenged(res, data)) { toast.error("Vui lòng xác nhận reCAPTCHA rồi gửi lại."); return; }
      if (!res.ok) { toast.error(data.error || "Gửi bài thất bại."); return; }
      setDone(true);
      onSuccess?.();
    } catch { toast.error("Lỗi kết nối, vui lòng thử lại."); } finally { setLoading(false); }
  }

  const Close = (
    <button className="qp-modal__close" type="button" aria-label="Đóng" onClick={onClose}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="20" height="20" aria-hidden><path d="M6 6l12 12M18 6L6 18" /></svg>
    </button>
  );

  return (
    <div className="qp-modal-overlay" onClick={onClose}>
      <div className="qp-modal qp-modal--wide" role="dialog" aria-modal="true" aria-label="Gửi bài tin tức" onClick={(e) => e.stopPropagation()}>
        <div className="qp-modal__head"><h2 className="type-h3">Gửi bài tin tức</h2>{Close}</div>

        {!isLoggedIn ? (
          <div className="qp-modal__body qp-lf-modal__auth">
            <p className="type-body">Bạn cần <b>đăng nhập</b> để gửi bài viết.</p>
            <div className="qp-lf-modal__authbtns">
              <Link href="/dang-nhap" className="qp-btn-primary">Đăng nhập</Link>
              <Link href="/dang-ky" className="qp-btn-secondary">Đăng ký</Link>
            </div>
          </div>
        ) : done ? (
          <div className="qp-modal__body qp-lf-modal__done">
            <div className="qp-alert is-success" role="status">
              <svg className="qp-alert__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M20 6 9 17l-5-5" /></svg>
              <div className="qp-alert__body"><strong>Đã gửi bài!</strong>Bài viết đang chờ ban quản trị duyệt trước khi hiển thị công khai.</div>
            </div>
            <button type="button" className="qp-btn-primary qp-btn-block" onClick={onClose}>Đóng</button>
          </div>
        ) : (
          <form className="qp-modal__body qp-lf-modal__form" onSubmit={onSubmit}>
            <div className="qp-form-group">
              <label className="qp-label" htmlFor="ar-title">Tiêu đề <span className="req">*</span><CharCount value={title} max={200} /></label>
              <input id="ar-title" className="qp-input" required maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tiêu đề bài viết" />
            </div>

            <div className="qp-form-group">
              <label className="qp-label" htmlFor="ar-cat">Chuyên mục <span className="req">*</span></label>
              <select id="ar-cat" className="qp-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="qp-form-group">
              <span className="qp-label">Phạm vi <span className="req">*</span></span>
              <div style={{ display: "flex", gap: 20 }}>
                <label className="qp-check"><input type="radio" name="ar-scope" checked={scope === "trong-xa"} onChange={() => setScope("trong-xa")} /> Trong xã</label>
                <label className="qp-check"><input type="radio" name="ar-scope" checked={scope === "ngoai-xa"} onChange={() => setScope("ngoai-xa")} /> Ngoài xã</label>
              </div>
            </div>

            <div className="qp-form-group">
              <label className="qp-label" htmlFor="ar-excerpt">Tóm tắt (sapo)<CharCount value={excerpt} max={400} /></label>
              <textarea id="ar-excerpt" className="qp-textarea" maxLength={400} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Tóm tắt ngắn hiển thị ở danh sách" />
            </div>

            <div className="qp-form-group">
              <span className="qp-label">Ảnh bìa <span className="req">*</span></span>
              <ImageUploader value={coverImage ? [coverImage] : []} onChange={(arr) => setCoverImage(arr[0] ?? "")} max={1} />
            </div>

            <div className="qp-form-group">
              <span className="qp-label">Nội dung <span className="req">*</span></span>
              <RichTextEditor value={bodyHtml} onChange={setBodyHtml} placeholder="Soạn nội dung bài viết…" />
            </div>

            <div className="qp-form-group">
              <label className="qp-label" htmlFor="ar-tags">Thẻ (cách nhau dấu phẩy)</label>
              <input id="ar-tags" className="qp-input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="VD: Quỳnh Phụ, Nông nghiệp" />
            </div>

            {cap.slot}

            <button className="qp-btn-primary qp-btn-block mt-6" type="submit" disabled={loading}>
              {loading ? "Đang gửi…" : <>Gửi bài <span className="qp-arrow">→</span></>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
