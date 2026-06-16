"use client";

// Quản trị người dùng: tìm kiếm, đổi vai trò (admin/user), xác minh, xoá.
// Không cho tự gỡ quyền / tự xoá (server cũng chặn).
import { useMemo, useState } from "react";
import type { UserRow } from "@/lib/users";
import { Pagination } from "@/components/common/Pagination";
import { usePagination, PageSizeControl } from "@/components/admin/AdminPaging";
import { RowActions } from "@/components/admin/RowActions";
import { formatDate } from "@/lib/datetime";
import { useToast } from "@/components/common/Toast";

export function UserManager({ initial, me }: { initial: UserRow[]; me: string }) {
  const [rows, setRows] = useState<UserRow[]>(initial);
  const [q, setQ] = useState("");
  const [fRole, setFRole] = useState("");
  const { toast } = useToast();

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return rows.filter((r) =>
      (!fRole || r.role === fRole) &&
      (!kw || r.email.toLowerCase().includes(kw) || r.name.toLowerCase().includes(kw)));
  }, [rows, q, fRole]);

  const pg = usePagination(filtered, 20);

  async function patch(r: UserRow, body: Record<string, unknown>, optimistic: Partial<UserRow>) {
    setRows((cur) => cur.map((x) => (x.id === r.id ? { ...x, ...optimistic } : x)));
    const res = await fetch(`/api/admin/users/${r.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error || "Không cập nhật được.");
      setRows((cur) => cur.map((x) => (x.id === r.id ? r : x))); // hoàn tác
    }
  }

  function changeRole(r: UserRow, next: UserRow["role"]) {
    if (next === r.role) return;
    if (r.id === me) { toast.error("Không thể tự đổi quyền của chính mình."); return; }
    if (next === "admin" && !confirm(`Cấp quyền ADMIN (toàn quyền) cho ${r.email}?`)) return;
    patch(r, { role: next }, { role: next });
  }
  function toggleVerified(r: UserRow) { patch(r, { verified: !r.verified }, { verified: !r.verified }); }

  async function remove(r: UserRow) {
    if (r.id === me) { toast.error("Không thể tự xoá tài khoản của mình."); return; }
    if (!confirm(`Xoá tài khoản ${r.email}? Hành động không thể hoàn tác.`)) return;
    const res = await fetch(`/api/admin/users/${r.id}`, { method: "DELETE" });
    if (res.ok) setRows((cur) => cur.filter((x) => x.id !== r.id));
    else { const d = await res.json().catch(() => ({})); toast.error(d.error || "Không xoá được."); }
  }


  return (
    <div className="qp-acc-page">
      <div className="qp-admin-toolbar">
        <input className="qp-input qp-admin-toolbar__search" placeholder="Tìm theo email / tên…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="qp-select" style={{ maxWidth: 200 }} value={fRole} onChange={(e) => setFRole(e.target.value)}>
          <option value="">Tất cả vai trò</option>
          <option value="admin">Admin</option>
          <option value="editor">Biên tập viên</option>
          <option value="user">Người dùng</option>
        </select>
        <span className="qp-admin-toolbar__spacer" />
        <PageSizeControl value={pg.pageSize} onChange={pg.setPageSize} total={filtered.length} />
        <span className="type-body-small text-muted">{filtered.length} tài khoản</span>
      </div>

      {filtered.length === 0 ? (
        <div className="qp-empty"><div className="qp-empty__title">Không có người dùng</div></div>
      ) : (
        <div className="qp-table--wrap">
          <table className="qp-table">
            <thead><tr><th>Email</th><th>Tên</th><th>Vai trò</th><th>Xác minh</th><th>Ngày tạo</th><th></th></tr></thead>
            <tbody>
              {pg.paged.map((r) => (
                <tr key={r.id}>
                  <td><b>{r.email}</b>{r.id === me && <> <span className="qp-badge-g4">Bạn</span></>}</td>
                  <td>{r.name}</td>
                  <td>
                    <select
                      className="qp-select"
                      style={{ maxWidth: 170 }}
                      value={r.role}
                      disabled={r.id === me}
                      onChange={(e) => changeRole(r, e.target.value as UserRow["role"])}
                      title={r.id === me ? "Không thể tự đổi quyền của mình" : "Đổi vai trò"}
                    >
                      <option value="admin">Admin</option>
                      <option value="editor">Biên tập viên</option>
                      <option value="user">Người dùng</option>
                    </select>
                  </td>
                  <td>
                    <button type="button" className={`qp-acc-badge is-${r.verified ? "active" : "pending"}`} style={{ border: 0, cursor: "pointer" }} onClick={() => toggleVerified(r)} title="Bấm để đổi trạng thái xác minh">
                      {r.verified ? "Đã xác minh" : "Chưa"}
                    </button>
                  </td>
                  <td className="type-body-small text-muted">{formatDate(r.createdAt)}</td>
                  <td className="qp-admin-actions">
                    <RowActions actions={[
                      { value: "delete", label: "Xoá", hidden: r.id === me, run: () => remove(r) },
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
