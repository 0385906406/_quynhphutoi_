"use client";

// Quản trị danh sách từ cấm (lọc từ ngữ thô tục): tìm kiếm, thêm, sửa trực tiếp
// trên bảng, bật/tắt từng từ, xoá, khôi phục danh sách mặc định.
import { useMemo, useState } from "react";
import { useToast } from "@/components/common/Toast";
import { Pagination } from "@/components/common/Pagination";
import { usePagination, PageSizeControl } from "@/components/admin/AdminPaging";
import { RowActions } from "@/components/admin/RowActions";
import type { ProfanityRow } from "@/lib/profanity";

export function ProfanityManager({ initial }: { initial: ProfanityRow[] }) {
  const [rows, setRows] = useState<ProfanityRow[]>(initial);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [q, setQ] = useState("");
  const [newText, setNewText] = useState("");
  const [newAccent, setNewAccent] = useState(false);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const counts = useMemo(() => ({
    all: rows.length,
    on: rows.filter((r) => r.enabled).length,
  }), [rows]);

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return kw ? rows.filter((r) => r.text.toLowerCase().includes(kw)) : rows;
  }, [rows, q]);
  const pg = usePagination(filtered, 50);

  async function patchRow(id: string, patch: Partial<Pick<ProfanityRow, "text" | "accentInsensitive" | "enabled">>) {
    const res = await fetch(`/api/admin/profanity/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { toast.error(data.error || "Không lưu được."); return false; }
    setRows((cur) => cur.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    return true;
  }

  async function commitText(r: ProfanityRow) {
    const val = (edits[r.id] ?? r.text).trim();
    setEdits((e) => { const n = { ...e }; delete n[r.id]; return n; });
    if (!val || val === r.text) return;
    const ok = await patchRow(r.id, { text: val });
    if (ok) toast.success("Đã lưu.");
  }

  async function toggle(r: ProfanityRow, key: "enabled" | "accentInsensitive") {
    await patchRow(r.id, { [key]: !r[key] } as Partial<ProfanityRow>);
  }

  async function remove(r: ProfanityRow) {
    if (!confirm(`Xoá từ cấm "${r.text}"?`)) return;
    const res = await fetch(`/api/admin/profanity/${r.id}`, { method: "DELETE" });
    if (res.ok) { setRows((cur) => cur.filter((x) => x.id !== r.id)); toast.success("Đã xoá."); }
    else toast.error("Xoá thất bại.");
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const text = newText.trim();
    if (!text || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/profanity", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, accentInsensitive: newAccent }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(data.error || "Không thêm được."); return; }
      setRows((cur) => [data.item, ...cur]);
      setNewText(""); setNewAccent(false);
      toast.success("Đã thêm từ cấm.");
    } finally { setBusy(false); }
  }

  async function restoreDefaults() {
    if (busy) return;
    if (!confirm("Nạp lại các từ cấm mặc định còn thiếu? (Không ghi đè từ đã chỉnh sửa)")) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/profanity/seed", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(data.error || "Không nạp được."); return; }
      if (data.added > 0) {
        const list = await fetch("/api/admin/profanity").then((r) => r.json()).catch(() => ({ items: rows }));
        setRows(list.items ?? rows);
        toast.success(`Đã thêm ${data.added} từ mặc định.`);
      } else toast.info("Danh sách đã đầy đủ, không có gì để thêm.");
    } finally { setBusy(false); }
  }

  const Switch = ({ on, onChange, title }: { on: boolean; onChange: () => void; title: string }) => (
    <span className="qp-switch" title={title}>
      <input type="checkbox" checked={on} onChange={onChange} aria-label={title} />
      <span className="qp-switch__track" />
    </span>
  );

  return (
    <div className="qp-acc-page">
      <div className="qp-admin-statline">
        <div className="qp-admin-statline__item"><span className="qp-admin-statline__num">{counts.all}</span><span className="qp-admin-statline__lbl">Tổng từ cấm</span></div>
        <div className="qp-admin-statline__item"><span className="qp-admin-statline__num">{counts.on}</span><span className="qp-admin-statline__lbl">Đang bật</span></div>
        <div className="qp-admin-statline__item"><span className="qp-admin-statline__num">{counts.all - counts.on}</span><span className="qp-admin-statline__lbl">Đang tắt</span></div>
      </div>

      <form className="qp-chart-card" onSubmit={add} style={{ display: "flex", gap: "var(--space-3)", alignItems: "flex-end", flexWrap: "wrap" }}>
        <div className="qp-form-group" style={{ flex: "1 1 240px", margin: 0 }}>
          <label className="qp-label">Thêm từ / cụm cần lọc</label>
          <input className="qp-input" value={newText} onChange={(e) => setNewText(e.target.value)} maxLength={80} placeholder="VD: thằng ngu, đồ vô học…" />
        </div>
        <label className="qp-switch-row" style={{ flex: "0 0 auto", gap: 10 }}>
          <span className="qp-switch-row__text"><b>Khớp cả không dấu</b><small>Bắt cả khi bỏ dấu (nên bật cho cụm dài / viết tắt)</small></span>
          <Switch on={newAccent} onChange={() => setNewAccent((v) => !v)} title="Khớp cả không dấu" />
        </label>
        <button type="submit" className="qp-btn-primary" disabled={busy || !newText.trim()}>Thêm</button>
      </form>

      <div className="qp-admin-toolbar">
        <input className="qp-input qp-admin-toolbar__search" placeholder="Tìm từ cấm…" value={q} onChange={(e) => setQ(e.target.value)} />
        <span className="qp-admin-toolbar__spacer" />
        <PageSizeControl value={pg.pageSize} onChange={pg.setPageSize} total={filtered.length} />
        <button type="button" className="qp-btn-outline" onClick={restoreDefaults} disabled={busy}>Khôi phục mặc định</button>
      </div>

      {filtered.length === 0 ? (
        <div className="qp-empty"><div className="qp-empty__title">Không có từ nào</div><p className="type-body-small">{q ? "Không tìm thấy từ khớp." : "Danh sách từ cấm trống — thêm từ ở trên."}</p></div>
      ) : (
        <div className="qp-table--wrap">
          <table className="qp-table">
            <thead>
              <tr>
                <th>Từ / cụm</th>
                <th style={{ width: 160, textAlign: "center" }}>Khớp không dấu</th>
                <th style={{ width: 100, textAlign: "center" }}>Bật lọc</th>
                <th style={{ width: 56 }} />
              </tr>
            </thead>
            <tbody>
              {pg.paged.map((r) => (
                <tr key={r.id}>
                  <td>
                    <input
                      className="qp-input"
                      value={edits[r.id] ?? r.text}
                      maxLength={80}
                      onChange={(e) => setEdits((s) => ({ ...s, [r.id]: e.target.value }))}
                      onBlur={() => commitText(r)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); (e.target as HTMLInputElement).blur(); } }}
                    />
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <Switch on={r.accentInsensitive} onChange={() => toggle(r, "accentInsensitive")} title="Khớp cả khi bỏ dấu" />
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <Switch on={r.enabled} onChange={() => toggle(r, "enabled")} title="Bật/tắt từ cấm này" />
                  </td>
                  <td className="qp-admin-actions">
                    <RowActions actions={[{ value: "delete", label: "Xoá", run: () => remove(r) }]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={pg.page} totalPages={pg.totalPages} onPage={pg.setPage} />
        </div>
      )}
    </div>
  );
}
