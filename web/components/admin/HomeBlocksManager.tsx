"use client";

// Admin → Trang chủ: bật/tắt & chỉnh các khối mới (Thông tin hôm nay, Truy cập nhanh, số liệu, lịch chợ…).
import { useState } from "react";
import { useToast } from "@/components/common/Toast";
import type { HomeBlocksConfig } from "@/lib/home-blocks";

type BoolKey = Exclude<keyof HomeBlocksConfig, "leagues" | "matches">;

const MAIN: { key: BoolKey; label: string; note: string }[] = [
  { key: "quick", label: "Truy cập nhanh", note: "Lưới biểu tượng tới các mục chính (Việc làm, Y tế, Trường học…)." },
  { key: "kpi", label: "Dải số liệu địa phương", note: "Dân số, diện tích, số tin việc làm đang tuyển… ngay dưới Truy cập nhanh." },
  { key: "market", label: "Lịch chợ phiên", note: "Tự lấy từ mục Chợ có ghi lịch họp; chưa có dữ liệu thì tự ẩn." },
  { key: "services", label: "Tiện ích & dịch vụ thiết yếu", note: "Các lối tắt dịch vụ công, giao thông, y tế, giáo dục." },
  { key: "hotline", label: "Đường dây nóng", note: "Số điện thoại khẩn cấp và cơ quan địa phương." },
];
const DAILY: { key: BoolKey; label: string }[] = [
  { key: "gold", label: "Giá vàng" },
  { key: "fx", label: "Tỷ giá ngoại tệ" },
  { key: "lottery", label: "Xổ số miền Bắc" },
  { key: "football", label: "Bóng đá" },
  { key: "weather", label: "Ô thời tiết ở đầu khối" },
];

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", minHeight: 36 }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ width: 20, height: 20 }} />
      <span style={{ fontWeight: 600 }}>{label}</span>
    </label>
  );
}

export function HomeBlocksManager({ initial, leagues }: { initial: HomeBlocksConfig; leagues: { code: string; name: string }[] }) {
  const [cfg, setCfg] = useState<HomeBlocksConfig>(initial);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const set = <K extends keyof HomeBlocksConfig>(k: K, v: HomeBlocksConfig[K]) => setCfg((c) => ({ ...c, [k]: v }));

  async function save() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/home-blocks", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ config: cfg }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(data.error || "Lưu thất bại."); return; }
      if (data.config) setCfg(data.config);
      toast.success("Đã lưu. Trang chủ cập nhật ngay.");
    } finally { setBusy(false); }
  }

  return (
    <div className="qp-acc-page" style={{ marginTop: "var(--space-8)" }}>
      <section className="qp-admin-card" style={{ cursor: "default", gap: "var(--space-3)" }}>
        <div className="qp-admin-card__label">Thông tin hôm nay</div>
        <p className="qp-admin-card__desc">Khối giá vàng, tỷ giá, xổ số, bóng đá ngay dưới slider trang chủ.</p>
        <Switch label="Hiện cả khối “Thông tin hôm nay”" checked={cfg.daily} onChange={(v) => set("daily", v)} />
        <fieldset disabled={!cfg.daily} style={{ border: 0, padding: 0, margin: 0, opacity: cfg.daily ? 1 : 0.5, display: "grid", gap: 4, paddingLeft: 28 }}>
          {DAILY.map((d) => <Switch key={d.key} label={d.label} checked={cfg[d.key] as boolean} onChange={(v) => set(d.key, v)} />)}
          <div style={{ marginTop: 10 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Giải bóng đá hiển thị</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 22px" }}>
              {leagues.map((l) => (
                <label key={l.code} style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 34, cursor: "pointer" }}>
                  <input type="checkbox" style={{ width: 18, height: 18 }} checked={cfg.leagues.includes(l.code)}
                    onChange={(e) => set("leagues", e.target.checked ? [...cfg.leagues, l.code] : cfg.leagues.filter((c) => c !== l.code))} />
                  {l.name}
                </label>
              ))}
            </div>
            {cfg.leagues.length === 0 && <p className="type-body-small" style={{ color: "var(--color-danger, #b91c1c)", margin: "6px 0 0" }}>Chưa chọn giải nào — thẻ Bóng đá sẽ trống.</p>}
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
            <span style={{ fontWeight: 700 }}>Số trận hiện ở trang chủ</span>
            <input type="number" className="qp-input" min={3} max={10} value={cfg.matches} style={{ width: 80 }}
              onChange={(e) => set("matches", Math.min(10, Math.max(3, Number(e.target.value) || 6)))} />
            <span className="type-body-small text-muted">(3–10)</span>
          </label>
        </fieldset>
      </section>

      <section className="qp-admin-card" style={{ cursor: "default", gap: "var(--space-2)" }}>
        <div className="qp-admin-card__label">Các khối khác trên trang chủ</div>
        {MAIN.map((m) => (
          <div key={m.key} style={{ paddingBlock: 6, borderTop: "1px solid var(--color-gray-border)" }}>
            <Switch label={m.label} checked={cfg[m.key] as boolean} onChange={(v) => set(m.key, v)} />
            <p className="type-body-small text-muted" style={{ margin: "0 0 0 30px" }}>{m.note}</p>
          </div>
        ))}
      </section>

      <div>
        <button type="button" className="qp-btn-primary" onClick={save} disabled={busy}>{busy ? "Đang lưu…" : "Lưu cấu hình khối mới"}</button>
      </div>
    </div>
  );
}
