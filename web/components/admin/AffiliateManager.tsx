"use client";

// Quản trị affiliate Shopee: bật/tắt, chữ nút, nhãn, danh sách link CHUNG, nút nổi điện thoại,
// và link RIÊNG theo từng trang. Mỗi lượt bấm hệ thống chọn ngẫu nhiên 1 link (riêng của trang nếu có).
import { useMemo, useState } from "react";
import { useToast } from "@/components/common/Toast";
import { isShopeeUrl, AFFILIATE_PAGES, type AffiliateConfig, type AffiliatePageConfig } from "@/lib/affiliate-shared";

type PageDraft = { label: string; text: string };

const splitLines = (text: string) => text.split("\n").map((s) => s.trim()).filter(Boolean);

function toDrafts(pages: Record<string, AffiliatePageConfig>): Record<string, PageDraft> {
  return Object.fromEntries(
    AFFILIATE_PAGES.map((p) => [p.key, { label: pages[p.key]?.label ?? "", text: (pages[p.key]?.links ?? []).join("\n") }]),
  );
}

// Ô nhập danh sách link + báo dòng sai ngay khi gõ.
function LinkList({ text, onChange, rows, placeholder }: { text: string; onChange: (v: string) => void; rows: number; placeholder?: string }) {
  const lines = splitLines(text);
  const invalid = lines.filter((l) => !isShopeeUrl(l));
  return (
    <>
      <textarea
        className="qp-textarea"
        rows={rows}
        value={text}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "https://shopee.vn/...\nhttps://s.shopee.vn/abcxyz"}
        style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 13 }}
      />
      {invalid.length > 0 && (
        <p className="type-body-small" style={{ color: "var(--color-error)", marginTop: 6 }}>
          {invalid.length} dòng không hợp lệ (sẽ bị bỏ khi lưu): {invalid.slice(0, 3).join(", ")}{invalid.length > 3 ? "…" : ""}
        </p>
      )}
    </>
  );
}

export function AffiliateManager({ initial }: { initial: AffiliateConfig }) {
  const [enabled, setEnabled] = useState(initial.enabled);
  const [label, setLabel] = useState(initial.label);
  const [note, setNote] = useState(initial.note);
  const [text, setText] = useState(initial.links.join("\n"));
  const [floatEnabled, setFloatEnabled] = useState(initial.floatEnabled);
  const [floatLabel, setFloatLabel] = useState(initial.floatLabel);
  const [pages, setPages] = useState<Record<string, PageDraft>>(() => toDrafts(initial.pages ?? {}));
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const validCount = useMemo(() => splitLines(text).filter(isShopeeUrl).length, [text]);
  const pageCount = (key: string) => splitLines(pages[key]?.text ?? "").filter(isShopeeUrl).length;
  const setPage = (key: string, patch: Partial<PageDraft>) =>
    setPages((cur) => ({ ...cur, [key]: { ...cur[key], ...patch } }));

  async function save() {
    setBusy(true);
    try {
      const links = splitLines(text).filter(isShopeeUrl);
      const pagesOut: Record<string, AffiliatePageConfig> = {};
      for (const p of AFFILIATE_PAGES) {
        const d = pages[p.key];
        const l = splitLines(d?.text ?? "").filter(isShopeeUrl);
        if (l.length) pagesOut[p.key] = { label: d.label.trim(), links: l };
      }
      const res = await fetch("/api/admin/affiliate", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: { enabled, label, note, links, floatEnabled, floatLabel, pages: pagesOut } }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(data.error || "Lưu thất bại."); return; }
      if (data.config) {
        const c = data.config as AffiliateConfig;
        setEnabled(c.enabled);
        setLabel(c.label);
        setNote(c.note);
        setText(c.links.join("\n"));
        setFloatEnabled(c.floatEnabled);
        setFloatLabel(c.floatLabel);
        setPages(toDrafts(c.pages ?? {}));
      }
      toast.success("Đã lưu cấu hình affiliate.");
    } finally { setBusy(false); }
  }

  const configuredPages = AFFILIATE_PAGES.filter((p) => pageCount(p.key) > 0).length;

  return (
    <div className="qp-acc-page">
      <div className="qp-acc-card">
        <div className="qp-acc-card__title qp-acc-card__title--row" style={{ marginBottom: 12 }}>
          <span>Affiliate Shopee — cài đặt chung</span>
          <label className="qp-check" style={{ margin: 0 }}>
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} /> Bật affiliate
          </label>
        </div>
        <p className="type-body-small text-muted" style={{ marginBottom: 12 }}>
          Công tắc tổng: tắt ở đây thì cả nút “Xem thêm” cuối bài lẫn nút nổi trên điện thoại đều ẩn. Mỗi lượt bấm hệ thống
          chọn ngẫu nhiên 1 link (ưu tiên link riêng của trang đang xem) và chuyển qua đường dẫn trung gian <code>/di/shopee</code>.
        </p>

        <div className="qp-acc-grid2">
          <div className="qp-form-group">
            <label className="qp-label">Chữ trên nút “Xem thêm” cuối bài</label>
            <input className="qp-input" maxLength={80} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Xem thêm trên Shopee" />
          </div>
          <div className="qp-form-group">
            <label className="qp-label">Nhãn nhỏ (để trống = ẩn)</label>
            <input className="qp-input" maxLength={40} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Tài trợ" />
          </div>
        </div>

        <div className="qp-form-group">
          <label className="qp-label">Link chung — dùng cho trang chưa có link riêng ({validCount} hợp lệ)</label>
          <LinkList text={text} onChange={setText} rows={6} />
          <span className="type-body-small text-muted">Chỉ chấp nhận link shopee.vn, shp.ee, s.shopee.vn — mỗi dòng 1 link.</span>
        </div>
      </div>

      <div className="qp-acc-card">
        <div className="qp-acc-card__title qp-acc-card__title--row" style={{ marginBottom: 12 }}>
          <span>Nút nổi “Ưu đãi” trên điện thoại</span>
          <label className="qp-check" style={{ margin: 0 }}>
            <input type="checkbox" checked={floatEnabled} onChange={(e) => setFloatEnabled(e.target.checked)} /> Hiện nút
          </label>
        </div>
        <p className="type-body-small text-muted" style={{ marginBottom: 12 }}>
          Nút nhỏ màu xanh có icon hộp quà ở góc dưới bên trái, chỉ hiện trên điện thoại. Ở trang có link riêng, nút dùng
          link và chữ của trang đó. Người xem có thể bấm × để ẩn trong lượt truy cập đó.
        </p>
        <div className="qp-form-group">
          <label className="qp-label">Chữ chung trên nút nổi</label>
          <input className="qp-input" maxLength={30} value={floatLabel} onChange={(e) => setFloatLabel(e.target.value)} placeholder="Ưu đãi hôm nay" />
        </div>
      </div>

      <div className="qp-acc-card">
        <div className="qp-acc-card__title" style={{ marginBottom: 8 }}>
          Link theo từng trang <span className="text-muted" style={{ fontWeight: 500 }}>· {configuredPages}/{AFFILIATE_PAGES.length} trang đã có link</span>
        </div>
        <p className="type-body-small text-muted" style={{ marginBottom: 12 }}>
          Gắn sản phẩm hợp với nội dung trang (người xem có nhu cầu thật nên dễ ra đơn hơn). Áp dụng cho cả nút “Xem thêm” và
          nút nổi ở trang đó và các trang con (vd “Tin tức” gồm mọi bài viết). Để trống = dùng link chung.
        </p>
        <div className="qp-aff-pages">
          {AFFILIATE_PAGES.map((p) => {
            const n = pageCount(p.key);
            const d = pages[p.key];
            return (
              <details className="qp-aff-page" key={p.key}>
                <summary>
                  <span className="qp-aff-page__name">{p.label} <code>{p.key}</code></span>
                  <span className={`qp-aff-page__count${n ? " is-set" : ""}`}>{n ? `${n} link` : "Dùng link chung"}</span>
                </summary>
                <div className="qp-aff-page__body">
                  {p.hint && <p className="type-body-small text-muted" style={{ margin: 0 }}>Gợi ý sản phẩm: {p.hint}</p>}
                  <div className="qp-form-group">
                    <label className="qp-label">Chữ trên nút ở trang này (để trống = dùng chữ chung)</label>
                    <input className="qp-input" maxLength={30} value={d.label} onChange={(e) => setPage(p.key, { label: e.target.value })} placeholder={floatLabel} />
                  </div>
                  <div className="qp-form-group">
                    <label className="qp-label">Link Shopee cho trang này ({n} hợp lệ)</label>
                    <LinkList text={d.text} onChange={(v) => setPage(p.key, { text: v })} rows={4} />
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <button type="button" className="qp-btn-primary" onClick={save} disabled={busy}>{busy ? "Đang lưu…" : "Lưu cấu hình"}</button>
      </div>
    </div>
  );
}
