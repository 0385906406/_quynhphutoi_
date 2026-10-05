"use client";

// Nút + modal "Tạo tin từ nguồn ngoài": gọi API ngoài (NewsAPI/RSS) lấy tin Quỳnh Phụ.
//  • "✨ Viết bài ngay" (từng tin): tải bài gốc + AI viết lại đầy đủ → MỞ THẲNG trình soạn
//    (thay cho chuỗi: tạo nháp → tìm → Sửa → copy bài gốc → dán vào "Viết lại bằng AI").
//  • Tick nhiều tin → tạo HÀNG LOẠT bản nháp (tuỳ chọn lấy toàn văn, tối đa 5 tin/lần).
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useModalDismiss } from "@/lib/use-modal-dismiss";
import { useToast } from "@/components/common/Toast";
import { formatDate } from "@/lib/datetime";
import type { ArticleRow } from "@/lib/articles";

type ExternalItem = {
  id: string; title: string; description: string; url: string; image: string; source: string; publishedAt: string;
};
type ImportResponse = { items?: ArticleRow[]; warnings?: string[]; aiCount?: number; aiAllowed?: boolean; error?: string };

const FULL_MAX = 5; // khớp giới hạn ở API /api/admin/articles/external

export function ExternalNewsImport({ onImported, categories = [], aiWriting = false }: {
  onImported: (rows: ArticleRow[]) => void;
  categories?: { slug: string; name: string }[];  // chuyên mục gán cho bài nhập
  aiWriting?: boolean;                             // true = admin + đã cấu hình AI → AI viết lại
}) {
  const [show, setShow] = useState(false);
  useModalDismiss(show, () => setShow(false));
  const [q, setQ] = useState("");
  const [items, setItems] = useState<ExternalItem[]>([]);
  const [sel, setSel] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [full, setFull] = useState(true);
  // Chuyên mục gán cho bài nhập (trước đây gán cứng "Tin tức").
  const [category, setCategory] = useState(() => categories.find((c) => c.slug === "tin-tuc")?.slug ?? ""); // "" = Tin tức (chung)              // tạo hàng loạt: lấy toàn văn?
  const [writingId, setWritingId] = useState<string | null>(null); // tin đang "Viết bài ngay"
  const { toast } = useToast();
  const router = useRouter();

  const selected = items.filter((i) => sel[i.id]);
  const fullAllowed = selected.length <= FULL_MAX;
  const busy = creating || writingId !== null;

  async function postImport(list: ExternalItem[], wantFull: boolean): Promise<ImportResponse | null> {
    const res = await fetch("/api/admin/articles/external", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: list, full: wantFull, category: category || undefined }),
    });
    const data: ImportResponse = await res.json().catch(() => ({}));
    if (!res.ok) { toast.error(data.error || "Tạo bài thất bại."); return null; }
    (data.warnings ?? []).forEach((w) => toast.error(w));
    return data;
  }

  // 1 chạm: tạo bài đầy đủ rồi mở thẳng trình soạn để xem lại & xuất bản.
  async function writeNow(it: ExternalItem) {
    setWritingId(it.id);
    try {
      const data = await postImport([it], true);
      const row = data?.items?.[0];
      if (!row) return;
      onImported([row]);
      toast.success(data?.aiCount ? "AI đã viết xong bài — xem lại rồi bấm Xuất bản." : "Đã lấy nội dung bài gốc (không dùng AI) — biên tập lại rồi xuất bản.");
      setShow(false);
      router.push(`/admin/tin-tuc/bai-viet/${row.slug}/sua`);
    } finally {
      setWritingId(null);
    }
  }

  async function search() {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(`/api/admin/articles/external?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error || "Không lấy được tin.");
        setItems([]);
      } else {
        setItems(Array.isArray(data.items) ? data.items : []);
        setSel({});
      }
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  }

  function open() {
    setShow(true);
    if (!loaded) void search();
  }

  function toggle(id: string) {
    setSel((s) => ({ ...s, [id]: !s[id] }));
  }
  function toggleAll() {
    if (selected.length === items.length) setSel({});
    else setSel(Object.fromEntries(items.map((i) => [i.id, true])));
  }

  async function createDrafts() {
    if (!selected.length) {
      toast.error("Chọn ít nhất 1 tin.");
      return;
    }
    setCreating(true);
    try {
      const data = await postImport(selected, full && fullAllowed);
      const rows = data?.items ?? [];
      if (!rows.length) return;
      onImported(rows);
      // Chỉ 1 bài → mở thẳng trình soạn, khỏi phải tìm trong danh sách.
      if (rows.length === 1) {
        toast.success("Đã tạo bản nháp — xem lại rồi bấm Xuất bản.");
        setShow(false);
        router.push(`/admin/tin-tuc/bai-viet/${rows[0].slug}/sua`);
        return;
      }
      toast.success(`Đã tạo ${rows.length} bản nháp${data?.aiCount ? ` (AI viết ${data.aiCount} bài)` : ""}. Vào “Sửa” để xem lại rồi xuất bản.`);
      setShow(false);
      setSel({});
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <button type="button" className="qp-btn-outline" onClick={open}>↧ Tạo tin từ nguồn ngoài</button>

      {show && (
        <div className="qp-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShow(false); }}>
          <div className="qp-modal qp-admin-modal" style={{ width: "min(820px, 100%)" }}>
            <div className="qp-modal__head">
              <b>Tạo tin từ nguồn ngoài</b>
              <button type="button" className="qp-icon-btn" aria-label="Đóng" onClick={() => setShow(false)}>✕</button>
            </div>

            <div className="qp-modal__body" style={{ padding: "var(--space-5)" }}>
              <form
                className="qp-admin-toolbar"
                style={{ marginBottom: 16 }}
                onSubmit={(e) => { e.preventDefault(); void search(); }}
              >
                <input
                  className="qp-input qp-admin-toolbar__search"
                  placeholder="Từ khoá lọc… (để trống = tin mới nhất)"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                {categories.length > 0 && (
                  <select className="qp-select qp-extnews__cat" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Chuyên mục cho bài nhập" title="Chuyên mục gán cho bài nhập">
                    {!categories.some((c) => c.slug === "tin-tuc") && <option value="">Tin tức (chung)</option>}
                    {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                  </select>
                )}
                <button type="submit" className="qp-btn-primary" disabled={loading}>
                  {loading ? "Đang tìm…" : "Tìm"}
                </button>
              </form>

              {err && <div className="qp-alert is-error" style={{ marginBottom: 12 }}>{err}</div>}

              {!err && items.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <label className="qp-check">
                    <input
                      type="checkbox"
                      checked={selected.length === items.length}
                      ref={(el) => { if (el) el.indeterminate = selected.length > 0 && selected.length < items.length; }}
                      onChange={toggleAll}
                    />{" "}
                    Chọn tất cả ({items.length})
                  </label>
                  <span className="type-body-small text-muted">Đã chọn: {selected.length}</span>
                </div>
              )}

              <div style={{ maxHeight: 420, overflowY: "auto", display: "grid", gap: 8 }}>
                {loading && <div className="type-body-small text-muted">Đang tải tin…</div>}
                {!loading && !err && items.length === 0 && loaded && (
                  <div className="qp-empty"><div className="qp-empty__title">Không có tin phù hợp</div></div>
                )}
                {items.map((it) => (
                  <label
                    key={it.id}
                    style={{
                      display: "flex", gap: 12, padding: 12, cursor: "pointer", alignItems: "flex-start",
                      border: "1px solid var(--color-line, #E5E7EB)", borderRadius: "var(--radius-card, 10px)",
                      background: sel[it.id] ? "var(--color-indigo-pale, #EEF2FF)" : "transparent",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={!!sel[it.id]}
                      onChange={() => toggle(it.id)}
                      style={{ marginTop: 4 }}
                    />
                    {it.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={it.image}
                        alt=""
                        width={84}
                        height={56}
                        style={{ width: 84, height: 56, objectFit: "cover", borderRadius: 6, flexShrink: 0 }}
                        loading="lazy"
                      />
                    ) : null}
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{it.title}</div>
                      {it.description && (
                        <div className="type-body-small text-muted" style={{ marginTop: 2 }}>{it.description}</div>
                      )}
                      <div className="qp-extnews__foot">
                        <span className="type-body-small text-muted">
                          {[it.source, formatDate(it.publishedAt, "")].filter(Boolean).join(" • ")}
                        </span>
                        <button
                          type="button"
                          className="qp-extnews__write"
                          disabled={busy || !it.url}
                          // nằm trong <label> → chặn để không tick/bỏ tick ô chọn
                          onClick={(e) => { e.preventDefault(); void writeNow(it); }}
                          title={aiWriting ? "Tải bài gốc, AI viết lại đầy đủ rồi mở trình soạn" : "Tải nội dung bài gốc (chưa cấu hình AI / không phải admin) rồi mở trình soạn để biên tập"}
                        >
                          {writingId === it.id
                            ? (aiWriting ? "AI đang viết… (≈ 10–30 giây)" : "Đang lấy nội dung…")
                            : (aiWriting ? "✨ Viết bài bằng AI" : "↧ Lấy nội dung bài gốc")}
                        </button>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="qp-modal__foot qp-extnews__modalfoot">
              <label className="qp-check" style={{ marginRight: "auto" }} title={fullAllowed ? "" : `Lấy toàn văn tối đa ${FULL_MAX} tin mỗi lần`}>
                <input type="checkbox" checked={full && fullAllowed} disabled={!fullAllowed || busy} onChange={(e) => setFull(e.target.checked)} />{" "}
                {aiWriting ? "Lấy toàn văn & AI viết lại" : "Lấy toàn văn bài gốc"}
                <span className="type-body-small text-muted">{fullAllowed ? ` · tối đa ${FULL_MAX} tin` : ` · chỉ khi chọn ≤ ${FULL_MAX} tin`}</span>
              </label>
              <button type="button" className="qp-btn-outline" onClick={() => setShow(false)}>Huỷ</button>
              <button type="button" className="qp-btn-primary" disabled={busy || !selected.length} onClick={createDrafts}>
                {creating ? (full && fullAllowed ? "Đang lấy toàn văn…" : "Đang tạo…") : `Tạo ${selected.length || ""} bản nháp`.trim()}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
