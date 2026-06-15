"use client";

// Quản trị affiliate Shopee: bật/tắt, chữ nút, nhãn, và DANH SÁCH link (mỗi dòng 1 link).
// Hệ thống tự chọn ngẫu nhiên 1 link mỗi lượt bấm "Xem thêm" ở cuối bài.
import { useMemo, useState } from "react";
import { useToast } from "@/components/common/Toast";
import { isShopeeUrl, type AffiliateConfig } from "@/lib/affiliate-shared";

export function AffiliateManager({ initial }: { initial: AffiliateConfig }) {
  const [enabled, setEnabled] = useState(initial.enabled);
  const [label, setLabel] = useState(initial.label);
  const [note, setNote] = useState(initial.note);
  const [text, setText] = useState(initial.links.join("\n"));
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  // Phân tích từng dòng → đánh dấu link hợp lệ / sai để admin thấy ngay.
  const lines = useMemo(
    () => text.split("\n").map((s) => s.trim()).filter(Boolean),
    [text],
  );
  const validCount = useMemo(() => lines.filter(isShopeeUrl).length, [lines]);
  const invalid = useMemo(() => lines.filter((l) => !isShopeeUrl(l)), [lines]);

  async function save() {
    setBusy(true);
    try {
      const links = lines.filter(isShopeeUrl);
      const res = await fetch("/api/admin/affiliate", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: { enabled, label, note, links } }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(data.error || "Lưu thất bại."); return; }
      if (data.config) {
        setEnabled(data.config.enabled);
        setLabel(data.config.label);
        setNote(data.config.note);
        setText((data.config.links as string[]).join("\n"));
      }
      toast.success("Đã lưu cấu hình affiliate.");
    } finally { setBusy(false); }
  }

  return (
    <div className="qp-acc-page">
      <div className="qp-acc-card">
        <div className="qp-acc-card__title qp-acc-card__title--row" style={{ marginBottom: 12 }}>
          <span>Nút “Xem thêm” affiliate Shopee</span>
          <label className="qp-check" style={{ margin: 0 }}>
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} /> Bật nút
          </label>
        </div>
        <p className="type-body-small text-muted" style={{ marginBottom: 12 }}>
          Nút hiện ở cuối bài viết. Mỗi lượt bấm hệ thống chọn ngẫu nhiên 1 link trong danh sách bên dưới và chuyển sang Shopee
          qua đường dẫn trung gian <code>/di/shopee</code> (giúp link gọn và đỡ bị chặn).
        </p>

        <div className="qp-acc-grid2">
          <div className="qp-form-group">
            <label className="qp-label">Chữ trên nút</label>
            <input className="qp-input" maxLength={80} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Xem thêm trên Shopee" />
          </div>
          <div className="qp-form-group">
            <label className="qp-label">Nhãn nhỏ (để trống = ẩn)</label>
            <input className="qp-input" maxLength={40} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Tài trợ" />
          </div>
        </div>

        <div className="qp-form-group">
          <label className="qp-label">Danh sách link Shopee — mỗi dòng 1 link ({validCount} hợp lệ)</label>
          <textarea
            className="qp-textarea"
            rows={8}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"https://shopee.vn/...\nhttps://shp.ee/abcxyz"}
            style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 13 }}
          />
          <span className="type-body-small text-muted">Chỉ chấp nhận link shopee.vn, shp.ee, s.shopee.vn. Link sai sẽ bị bỏ khi lưu.</span>
          {invalid.length > 0 && (
            <p className="type-body-small" style={{ color: "var(--color-danger, #dc2626)", marginTop: 6 }}>
              {invalid.length} dòng không hợp lệ (sẽ bị bỏ): {invalid.slice(0, 3).join(", ")}{invalid.length > 3 ? "…" : ""}
            </p>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <button type="button" className="qp-btn-primary" onClick={save} disabled={busy}>{busy ? "Đang lưu…" : "Lưu cấu hình"}</button>
      </div>
    </div>
  );
}
