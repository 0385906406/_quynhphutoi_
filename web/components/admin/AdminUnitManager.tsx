"use client";

// Quản trị Đơn vị hành chính (xã/thị trấn cũ → xã mới sau sáp nhập 2025).
import { useMemo, useState } from "react";
import { useModalDismiss } from "@/lib/use-modal-dismiss";
import type { AdminUnitRow } from "@/lib/admin-units";
import { Pagination } from "@/components/common/Pagination";
import { usePagination, PageSizeControl } from "@/components/admin/AdminPaging";
import { RowActions } from "@/components/admin/RowActions";
import { useToast } from "@/components/common/Toast";

type Form = {
  slug: string; name: string; prefix: "Xã" | "Thị trấn"; district: string; province: string;
  newCommune: string; newProvince: string;
};
const EMPTY: Form = {
  slug: "", name: "", prefix: "Xã", district: "Huyện Quỳnh Phụ", province: "Tỉnh Thái Bình",
  newCommune: "", newProvince: "Tỉnh Hưng Yên",
};
const toForm = (r: AdminUnitRow): Form => ({
  slug: r.slug, name: r.name, prefix: r.prefix, district: r.district, province: r.province,
  newCommune: r.newCommune, newProvince: r.newProvince,
});

export function AdminUnitManager({ initial }: { initial: AdminUnitRow[] }) {
  const [rows, setRows] = useState<AdminUnitRow[]>(initial);
  const [q, setQ] = useState("");
  const [form, setForm] = useState<Form>({ ...EMPTY });
  const [editing, setEditing] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  useModalDismiss(show, () => setShow(false));
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  function set<K extends keyof Form>(k: K, v: Form[K]) { setForm((f) => ({ ...f, [k]: v })); }

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return rows.filter((r) => !kw || r.name.toLowerCase().includes(kw) || r.newCommune.toLowerCase().includes(kw));
  }, [rows, q]);

  const pg = usePagination(filtered, 20);

  function startNew() { setForm({ ...EMPTY }); setEditing(null); setShow(true); }
  function startEdit(r: AdminUnitRow) { setForm(toForm(r)); setEditing(r.slug); setShow(true); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Nhập tên đơn vị."); return; }
    setBusy(true);
    try {
      const body = { name: form.name, prefix: form.prefix, district: form.district, province: form.province, newCommune: form.newCommune, newProvince: form.newProvince };
      const res = await fetch(editing ? `/api/admin/admin-units/${editing}` : "/api/admin/admin-units", {
        method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(data.error || "Có lỗi xảy ra."); return; }
      if (editing) setRows((cur) => cur.map((r) => (r.slug === editing ? ({ ...r, ...body } as unknown as AdminUnitRow) : r)));
      else if (data.item) setRows((cur) => [...cur, data.item as AdminUnitRow].sort((a, b) => a.name.localeCompare(b.name, "vi")));
      setShow(false);
      toast.success(editing ? "Đã cập nhật." : "Đã thêm đơn vị.");
    } finally { setBusy(false); }
  }

  async function remove(r: AdminUnitRow) {
    if (!confirm(`Xoá "${r.name}"? Lưu ý các bản ghi đang tham chiếu xã này sẽ mất liên kết.`)) return;
    const res = await fetch(`/api/admin/admin-units/${r.slug}`, { method: "DELETE" });
    if (res.ok) setRows((cur) => cur.filter((x) => x.slug !== r.slug));
  }

  return (
    <div className="qp-acc-page">
      <div className="qp-admin-toolbar">
        <input className="qp-input qp-admin-toolbar__search" placeholder="Tìm theo tên xã / xã mới…" value={q} onChange={(e) => setQ(e.target.value)} />
        <span className="qp-admin-toolbar__spacer" />
        <PageSizeControl value={pg.pageSize} onChange={pg.setPageSize} total={filtered.length} />
        <button type="button" className="qp-btn-primary" onClick={startNew}>+ Thêm đơn vị</button>
      </div>

      {show && (
        <div className="qp-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShow(false); }}>
          <form className="qp-modal qp-admin-modal" onSubmit={submit}>
            <div className="qp-modal__head">
              <b>{editing ? "Sửa đơn vị hành chính" : "Thêm đơn vị hành chính"}</b>
              <button type="button" className="qp-icon-btn" aria-label="Đóng" onClick={() => setShow(false)}>✕</button>
            </div>
            <div className="qp-modal__body" style={{ padding: "var(--space-5)" }}>
              <div className="qp-acc-grid2">
                <div className="qp-form-group"><label className="qp-label">Tên đơn vị (cũ) <span className="req">*</span></label>
                  <input className="qp-input" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="VD: Xã An Vũ" /></div>
                <div className="qp-form-group"><label className="qp-label">Loại</label>
                  <select className="qp-select" value={form.prefix} onChange={(e) => set("prefix", e.target.value as "Xã" | "Thị trấn")}>
                    <option value="Xã">Xã</option><option value="Thị trấn">Thị trấn</option>
                  </select></div>
              </div>
              <div className="qp-acc-grid2">
                <div className="qp-form-group"><label className="qp-label">Huyện (cũ)</label>
                  <input className="qp-input" value={form.district} onChange={(e) => set("district", e.target.value)} /></div>
                <div className="qp-form-group"><label className="qp-label">Tỉnh (cũ)</label>
                  <input className="qp-input" value={form.province} onChange={(e) => set("province", e.target.value)} /></div>
              </div>
              <div className="qp-acc-grid2">
                <div className="qp-form-group"><label className="qp-label">Xã mới (sau sáp nhập) <span className="req">*</span></label>
                  <input className="qp-input" value={form.newCommune} onChange={(e) => set("newCommune", e.target.value)} placeholder="VD: Phụ Dực" /></div>
                <div className="qp-form-group"><label className="qp-label">Tỉnh mới</label>
                  <input className="qp-input" value={form.newProvince} onChange={(e) => set("newProvince", e.target.value)} /></div>
              </div>
            </div>
            <div className="qp-modal__foot">
              <button type="button" className="qp-btn-outline" onClick={() => setShow(false)}>Huỷ</button>
              <button type="submit" className="qp-btn-primary" disabled={busy}>{busy ? "Đang lưu…" : editing ? "Lưu" : "Thêm"}</button>
            </div>
          </form>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="qp-empty"><div className="qp-empty__title">Không có đơn vị nào</div></div>
      ) : (
        <div className="qp-table--wrap">
          <table className="qp-table">
            <thead><tr><th>Tên (cũ)</th><th>Huyện/Tỉnh cũ</th><th>Xã mới</th><th>Tỉnh mới</th><th></th></tr></thead>
            <tbody>
              {pg.paged.map((r) => (
                <tr key={r.slug}>
                  <td><b className="qp-clip" title={r.name}>{r.name}</b></td>
                  <td className="type-body-small text-muted">{r.district}, {r.province}</td>
                  <td>{r.newCommune}</td>
                  <td>{r.newProvince}</td>
                  <td className="qp-admin-actions">
                    <RowActions actions={[
                      { value: "edit", label: "Sửa", run: () => startEdit(r) },
                      { value: "delete", label: "Xoá", run: () => remove(r) },
                    ]} />
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
