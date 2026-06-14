"use client";

// Quản trị Danh mục phân cấp (cây) theo từng module/phân hệ.
import { useCallback, useEffect, useRef, useState } from "react";
import { useModalDismiss } from "@/lib/use-modal-dismiss";
import { RowActions } from "@/components/admin/RowActions";
import { useToast } from "@/components/common/Toast";

type CatNode = {
  id: string; module: string; slug: string; name: string; parentId: string | null;
  depth: number; order: number; icon: string; href: string; description: string; active: boolean;
  children: CatNode[];
};

type Form = { id: string | null; parentId: string | null; name: string; order: string; icon: string; href: string; description: string; active: boolean };
const EMPTY: Form = { id: null, parentId: null, name: "", order: "0", icon: "", href: "", description: "", active: true };

export function CategoryManager() {
  const [modules, setModules] = useState<string[]>([]);
  const [module, setModule] = useState("");
  const [tree, setTree] = useState<CatNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [newModule, setNewModule] = useState("");
  const [form, setForm] = useState<Form>({ ...EMPTY });
  const [show, setShow] = useState(false);
  useModalDismiss(show, () => setShow(false));
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  function set<K extends keyof Form>(k: K, v: Form[K]) { setForm((f) => ({ ...f, [k]: v })); }

  // Chống race: đổi module nhanh → chỉ áp kết quả của request MỚI nhất
  // (fetch cũ về trễ sẽ bị bỏ qua, tránh hiển thị cây sai module đang chọn).
  const loadSeq = useRef(0);
  const loadTree = useCallback(async (mod: string) => {
    const seq = ++loadSeq.current;
    setLoading(true);
    const res = await fetch(`/api/admin/categories?module=${encodeURIComponent(mod)}`, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (seq !== loadSeq.current) return; // có request mới hơn → bỏ kết quả này
    if (Array.isArray(data.modules)) setModules(data.modules);
    setTree(Array.isArray(data.tree) ? data.tree : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/categories", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      const mods: string[] = Array.isArray(data.modules) ? data.modules : [];
      setModules(mods);
      if (mods.length) { setModule(mods[0]); await loadTree(mods[0]); }
      else setLoading(false);
    })();
  }, [loadTree]);

  function startAddRoot() { setForm({ ...EMPTY, parentId: null }); setShow(true); }
  function startAddChild(n: CatNode) { setForm({ ...EMPTY, parentId: n.id }); setShow(true); }
  function startEdit(n: CatNode) {
    setForm({ id: n.id, parentId: n.parentId, name: n.name, order: String(n.order), icon: n.icon, href: n.href, description: n.description, active: n.active });
    setShow(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const mod = module || newModule.trim();
    if (!mod) { toast.error("Chọn hoặc nhập tên module."); return; }
    if (!form.name.trim()) { toast.error("Nhập tên danh mục."); return; }
    setBusy(true);
    try {
      let res: Response;
      if (form.id) {
        res = await fetch(`/api/admin/categories/${form.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.name, order: Number(form.order) || 0, icon: form.icon, href: form.href, description: form.description, active: form.active }),
        });
      } else {
        res = await fetch("/api/admin/categories", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ module: mod, name: form.name, parentId: form.parentId, order: Number(form.order) || 0, icon: form.icon, href: form.href, description: form.description, active: form.active }),
        });
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(data.error || "Có lỗi xảy ra."); return; }
      setShow(false);
      toast.success(form.id ? "Đã cập nhật danh mục." : "Đã thêm danh mục.");
      if (!module && newModule.trim()) { setModule(newModule.trim()); setNewModule(""); await loadTree(newModule.trim()); }
      else await loadTree(mod);
    } finally { setBusy(false); }
  }

  async function remove(n: CatNode) {
    if (!confirm(`Xoá danh mục "${n.name}"?`)) return;
    const res = await fetch(`/api/admin/categories/${n.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { toast.error(data.error || "Không xoá được."); return; }
    await loadTree(module);
  }

  function Row({ n }: { n: CatNode }) {
    return (
      <>
        <tr>
          <td style={{ paddingLeft: 12 + n.depth * 22 }}>
            <span style={{ color: "var(--color-gray-text)" }}>{n.depth > 0 ? "└ " : ""}</span>
            <b>{n.name}</b> <span className="type-body-small text-muted">/{n.slug}</span>
          </td>
          <td>{n.order}</td>
          <td><span className={`qp-acc-badge is-${n.active ? "active" : "hidden"}`}>{n.active ? "Hiện" : "Ẩn"}</span></td>
          <td className="qp-admin-actions">
            <RowActions actions={[
              { value: "child", label: "+ Thêm con", run: () => startAddChild(n) },
              { value: "edit", label: "Sửa", run: () => startEdit(n) },
              { value: "delete", label: "Xoá", run: () => remove(n) },
            ]} />
          </td>
        </tr>
        {n.children.map((c) => <Row key={c.id} n={c} />)}
      </>
    );
  }

  return (
    <div className="qp-acc-page">
      <div className="qp-admin-toolbar">
        <select className="qp-select" style={{ maxWidth: 260 }} value={module}
          onChange={(e) => { setModule(e.target.value); loadTree(e.target.value); }}>
          {modules.length === 0 && <option value="">(chưa có module)</option>}
          {modules.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <input className="qp-input" style={{ maxWidth: 220 }} placeholder="hoặc tạo module mới…" value={newModule} onChange={(e) => setNewModule(e.target.value)} />
        <span className="qp-admin-toolbar__spacer" />
        <button type="button" className="qp-btn-primary" onClick={startAddRoot}>+ Thêm danh mục gốc</button>
      </div>

      {show && (
        <div className="qp-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShow(false); }}>
          <form className="qp-modal qp-admin-modal" onSubmit={submit}>
            <div className="qp-modal__head">
              <b>{form.id ? "Sửa danh mục" : form.parentId ? "Thêm danh mục con" : "Thêm danh mục gốc"}</b>
              <button type="button" className="qp-icon-btn" aria-label="Đóng" onClick={() => setShow(false)}>✕</button>
            </div>
            <div className="qp-modal__body" style={{ padding: "var(--space-5)" }}>
              <div className="qp-form-group"><label className="qp-label">Tên danh mục <span className="req">*</span></label>
                <input className="qp-input" value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
              <div className="qp-acc-grid2">
                <div className="qp-form-group"><label className="qp-label">Thứ tự</label>
                  <input type="number" className="qp-input" value={form.order} onChange={(e) => set("order", e.target.value)} /></div>
                <div className="qp-form-group"><label className="qp-label">Icon (tên/emoji)</label>
                  <input className="qp-input" value={form.icon} onChange={(e) => set("icon", e.target.value)} /></div>
              </div>
              <div className="qp-form-group"><label className="qp-label">Liên kết (href)</label>
                <input className="qp-input" value={form.href} onChange={(e) => set("href", e.target.value)} placeholder="/viec-lam" /></div>
              <div className="qp-form-group"><label className="qp-label">Mô tả</label>
                <textarea className="qp-textarea" value={form.description} onChange={(e) => set("description", e.target.value)} /></div>
              <label className="qp-check"><input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} /> Đang dùng</label>
            </div>
            <div className="qp-modal__foot">
              <button type="button" className="qp-btn-outline" onClick={() => setShow(false)}>Huỷ</button>
              <button type="submit" className="qp-btn-primary" disabled={busy}>{busy ? "Đang lưu…" : form.id ? "Lưu" : "Thêm"}</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="type-body-small text-muted">Đang tải…</p>
      ) : tree.length === 0 ? (
        <div className="qp-empty"><div className="qp-empty__title">Chưa có danh mục</div><p className="type-body-small">Chọn module rồi bấm “Thêm danh mục gốc”.</p></div>
      ) : (
        <div className="qp-table--wrap">
          <table className="qp-table">
            <thead><tr><th>Danh mục</th><th>Thứ tự</th><th>Trạng thái</th><th></th></tr></thead>
            <tbody>{tree.map((n) => <Row key={n.id} n={n} />)}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
