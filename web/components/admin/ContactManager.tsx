"use client";

// Quản trị Liên hệ / phản ánh: xem chi tiết, đánh dấu đã xử lý, xoá.
import { useMemo, useState } from "react";
import { useModalDismiss } from "@/lib/use-modal-dismiss";
import { formatDateTime } from "@/lib/datetime";
import type { ContactRow } from "@/lib/contact";
import { RowActions } from "@/components/admin/RowActions";
import { Pagination } from "@/components/common/Pagination";
import { usePagination, PageSizeControl } from "@/components/admin/AdminPaging";
import { useToast } from "@/components/common/Toast";

export function ContactManager({ initial }: { initial: ContactRow[] }) {
  const [rows, setRows] = useState<ContactRow[]>(initial);
  const [q, setQ] = useState("");
  const [view, setView] = useState<"pending" | "handled" | "all">("pending");
  const [detail, setDetail] = useState<ContactRow | null>(null);
  useModalDismiss(!!detail, () => setDetail(null));
  const { toast } = useToast();

  const counts = useMemo(() => ({
    pending: rows.filter((r) => !r.handled).length,
    handled: rows.filter((r) => r.handled).length,
    all: rows.length,
  }), [rows]);

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return rows.filter((r) =>
      (view === "all" || (view === "pending" ? !r.handled : r.handled)) &&
      (!kw || r.name.toLowerCase().includes(kw) || r.email.toLowerCase().includes(kw) || r.message.toLowerCase().includes(kw)));
  }, [rows, q, view]);

  const pg = usePagination(filtered, 20);

  async function setHandled(r: ContactRow, handled: boolean) {
    setRows((cur) => cur.map((x) => (x.id === r.id ? { ...x, handled } : x)));
    const res = await fetch(`/api/admin/contact/${r.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ handled }) });
    if (!res.ok) setRows((cur) => cur.map((x) => (x.id === r.id ? { ...x, handled: !handled } : x)));
    else toast.success(handled ? "Đã đánh dấu xử lý." : "Đã chuyển về chờ xử lý.");
  }
  async function remove(r: ContactRow) {
    if (!confirm(`Xoá liên hệ từ "${r.name}"?`)) return;
    const res = await fetch(`/api/admin/contact/${r.id}`, { method: "DELETE" });
    if (res.ok) setRows((cur) => cur.filter((x) => x.id !== r.id));
  }

  return (
    <div className="qp-acc-page">
      <div className="qp-tabs" style={{ marginBottom: "var(--space-4)" }}>
        {(["pending", "handled", "all"] as const).map((v) => (
          <button key={v} type="button" className={`qp-tab${view === v ? " is-active" : ""}`} onClick={() => setView(v)}>
            {v === "pending" ? "Chờ xử lý" : v === "handled" ? "Đã xử lý" : "Tất cả"}
            <span className="qp-tab__count">{counts[v]}</span>
          </button>
        ))}
      </div>
      <div className="qp-admin-toolbar">
        <input className="qp-input qp-admin-toolbar__search" placeholder="Tìm theo tên / email / nội dung…" value={q} onChange={(e) => setQ(e.target.value)} />
        <span className="qp-admin-toolbar__spacer" />
        <PageSizeControl value={pg.pageSize} onChange={pg.setPageSize} total={filtered.length} />
      </div>

      {detail && (
        <div className="qp-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setDetail(null); }}>
          <div className="qp-modal qp-admin-modal">
            <div className="qp-modal__head"><b>Chi tiết liên hệ</b>
              <button type="button" className="qp-icon-btn" aria-label="Đóng" onClick={() => setDetail(null)}>✕</button></div>
            <div className="qp-modal__body" style={{ padding: "var(--space-5)" }}>
              <div className="qp-admin-spec">
                <div className="qp-admin-spec__k">Họ tên</div><div className="qp-admin-spec__v">{detail.name}</div>
                <div className="qp-admin-spec__k">Email</div><div className="qp-admin-spec__v">{detail.email}</div>
                <div className="qp-admin-spec__k">Điện thoại</div><div className="qp-admin-spec__v">{detail.phone || "—"}</div>
                <div className="qp-admin-spec__k">Loại</div><div className="qp-admin-spec__v">{detail.type}</div>
                <div className="qp-admin-spec__k">Thời gian</div><div className="qp-admin-spec__v">{formatDateTime(detail.createdAt)}</div>
              </div>
              <div className="qp-admin-section-title">Nội dung</div>
              <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{detail.message}</p>
            </div>
            <div className="qp-modal__foot" style={{ justifyContent: "space-between" }}>
              <a className="qp-btn-outline" href={`mailto:${detail.email}`}>Trả lời qua email</a>
              {detail.handled
                ? <button type="button" className="qp-btn-outline" onClick={() => { const d = detail; setDetail(null); setHandled(d, false); }}>Chuyển về chờ</button>
                : <button type="button" className="qp-btn-primary" onClick={() => { const d = detail; setDetail(null); setHandled(d, true); }}>Đánh dấu đã xử lý</button>}
            </div>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="qp-empty"><div className="qp-empty__title">Không có liên hệ</div></div>
      ) : (
        <div className="qp-table--wrap">
          <table className="qp-table">
            <thead><tr><th>Người gửi</th><th>Loại</th><th>Nội dung</th><th>Gửi lúc</th><th>Trạng thái</th><th></th></tr></thead>
            <tbody>
              {pg.paged.map((r) => (
                <tr key={r.id}>
                  <td><button type="button" className="qp-admin-link-btn" style={{ fontWeight: 700, color: "var(--color-navy)" }} onClick={() => setDetail(r)}>{r.name}</button><br /><span className="type-body-small text-muted">{r.email}</span></td>
                  <td>{r.type}</td>
                  <td className="type-body-small text-muted" style={{ maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.message}</td>
                  <td className="type-body-small text-muted">{formatDateTime(r.createdAt)}</td>
                  <td><span className={`qp-acc-badge is-${r.handled ? "active" : "pending"}`}>{r.handled ? "Đã xử lý" : "Chờ"}</span></td>
                  <td className="qp-admin-actions">
                    <RowActions actions={[
                      { value: "detail", label: "Chi tiết", run: () => setDetail(r) },
                      r.handled
                        ? { value: "unhandle", label: "Chuyển về chờ", run: () => setHandled(r, false) }
                        : { value: "handle", label: "Đánh dấu xử lý", run: () => setHandled(r, true) },
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
