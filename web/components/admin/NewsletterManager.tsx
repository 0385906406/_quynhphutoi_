"use client";

// Quản trị danh sách email đăng ký nhận tin: tìm, xoá, xuất CSV.
import { useMemo, useState } from "react";
import { useToast } from "@/components/common/Toast";
import { Pagination } from "@/components/common/Pagination";
import { usePagination, PageSizeControl } from "@/components/admin/AdminPaging";
import { RowActions } from "@/components/admin/RowActions";
import { formatDate } from "@/lib/datetime";
import type { SubscriberRow } from "@/lib/newsletter";

export function NewsletterManager({ initial }: { initial: SubscriberRow[] }) {
  const [rows, setRows] = useState<SubscriberRow[]>(initial);
  const [q, setQ] = useState("");
  const { toast } = useToast();

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return kw ? rows.filter((r) => r.email.toLowerCase().includes(kw)) : rows;
  }, [rows, q]);
  const pg = usePagination(filtered, 50);

  async function remove(r: SubscriberRow) {
    if (!confirm(`Xoá email "${r.email}"?`)) return;
    const res = await fetch(`/api/admin/newsletter?id=${r.id}`, { method: "DELETE" });
    if (res.ok) { setRows((cur) => cur.filter((x) => x.id !== r.id)); toast.success("Đã xoá."); }
    else toast.error("Xoá thất bại.");
  }

  function exportCsv() {
    const header = "email,source,createdAt\n";
    const body = rows.map((r) => `${r.email},${r.source},${r.createdAt}`).join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "newsletter-subscribers.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="qp-acc-page">
      <div className="qp-admin-toolbar">
        <input className="qp-input qp-admin-toolbar__search" placeholder="Tìm theo email…" value={q} onChange={(e) => setQ(e.target.value)} />
        <span className="qp-admin-toolbar__spacer" />
        <PageSizeControl value={pg.pageSize} onChange={pg.setPageSize} total={filtered.length} />
        <button type="button" className="qp-btn-outline" onClick={exportCsv} disabled={rows.length === 0}>Xuất CSV</button>
      </div>

      {filtered.length === 0 ? (
        <div className="qp-empty"><div className="qp-empty__title">Chưa có email đăng ký</div><p className="type-body-small">Email người dùng đăng ký nhận tin sẽ hiện ở đây.</p></div>
      ) : (
        <div className="qp-table--wrap">
          <table className="qp-table">
            <thead><tr><th>Email</th><th>Nguồn</th><th>Ngày đăng ký</th><th></th></tr></thead>
            <tbody>
              {pg.paged.map((r) => (
                <tr key={r.id}>
                  <td><b>{r.email}</b></td>
                  <td>{r.source || "—"}</td>
                  <td>{formatDate(r.createdAt)}</td>
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
