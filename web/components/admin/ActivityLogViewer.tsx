"use client";

import { useState, useEffect, useCallback } from "react";
import { formatDateTime } from "@/lib/datetime";
import { Pagination } from "@/components/common/Pagination";

type LogRow = {
  id: string;
  userId: string | null;
  userName: string;
  userEmail: string;
  userRole: string;
  category: "auth" | "admin" | "user";
  action: string;
  target?: { type: string; id?: string; label?: string };
  success: boolean;
  detail?: string;
  ip?: string;
  createdAt: string;
};

type ApiResponse = { rows: LogRow[]; total: number; page: number; pageSize: number };

const ACTION_LABELS: Record<string, string> = {
  "auth.login":          "Đăng nhập",
  "auth.register":       "Đăng ký",
  "user.setRole":        "Đổi vai trò",
  "user.ban":            "Khóa tài khoản",
  "user.unban":          "Mở khóa tài khoản",
  "user.warn.add":       "Thêm cảnh báo",
  "user.warn.clear":     "Xóa cảnh báo",
  "user.delete":         "Xóa tài khoản",
  "article.approve":     "Duyệt bài viết",
  "article.reject":      "Từ chối bài viết",
  "article.submit":      "Gửi bài viết",
  "job.approve":         "Duyệt việc làm",
  "job.reject":          "Từ chối việc làm",
  "mua-ban.approve":     "Duyệt tin mua bán",
  "mua-ban.reject":      "Từ chối mua bán",
  "lost-found.approve":  "Duyệt tìm đồ rơi",
  "lost-found.reject":   "Từ chối tìm đồ rơi",
};

const CATEGORY_LABELS: Record<string, string> = {
  auth:  "Xác thực",
  admin: "Quản trị",
  user:  "Người dùng",
};

const ROLE_LABELS: Record<string, string> = {
  admin:  "Admin",
  editor: "BTV",
  user:   "User",
};

const CAT_COLORS: Record<string, { bg: string; color: string }> = {
  auth:  { bg: "rgba(59,130,246,0.1)",  color: "#2563eb" },
  admin: { bg: "rgba(239,68,68,0.1)",   color: "#dc2626" },
  user:  { bg: "rgba(16,185,129,0.1)",  color: "#059669" },
};

export function ActivityLogViewer() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [success, setSuccess] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const doFetch = useCallback(async (signal: AbortSignal) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (category) params.set("category", category);
    if (success) params.set("success", success);
    if (dateFrom) params.set("from", dateFrom + "T00:00:00");
    if (dateTo) params.set("to", dateTo + "T23:59:59");
    try {
      const res = await fetch(`/api/admin/activity-logs?${params}`, { signal });
      if (res.ok) setData(await res.json());
    } catch {
      // aborted or error — ignore
    } finally {
      setLoading(false);
    }
  }, [category, success, dateFrom, dateTo, page, pageSize]);

  useEffect(() => {
    const ctrl = new AbortController();
    doFetch(ctrl.signal);
    return () => ctrl.abort();
  }, [doFetch]);

  function resetFilters() {
    setCategory(""); setSuccess(""); setDateFrom(""); setDateTo(""); setPage(1);
  }

  function changeFilter<T>(setter: (v: T) => void) {
    return (v: T) => { setter(v); setPage(1); };
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / pageSize)) : 1;

  return (
    <div>
      {/* ── Filter bar ── */}
      <div className="qp-admin-toolbar" style={{ flexWrap: "wrap", gap: "var(--space-2)", marginBottom: "var(--space-4)" }}>
        <select
          className="qp-select"
          value={category}
          onChange={(e) => changeFilter(setCategory)(e.target.value)}
        >
          <option value="">Tất cả danh mục</option>
          <option value="auth">Xác thực</option>
          <option value="admin">Quản trị</option>
          <option value="user">Người dùng</option>
        </select>

        <select
          className="qp-select"
          value={success}
          onChange={(e) => changeFilter(setSuccess)(e.target.value)}
        >
          <option value="">Tất cả kết quả</option>
          <option value="true">Thành công</option>
          <option value="false">Thất bại</option>
        </select>

        <input
          type="date"
          className="qp-input"
          value={dateFrom}
          onChange={(e) => changeFilter(setDateFrom)(e.target.value)}
          title="Từ ngày"
          style={{ width: "auto" }}
        />
        <span style={{ alignSelf: "center", color: "var(--color-gray-muted)", fontSize: 13 }}>→</span>
        <input
          type="date"
          className="qp-input"
          value={dateTo}
          onChange={(e) => changeFilter(setDateTo)(e.target.value)}
          title="Đến ngày"
          style={{ width: "auto" }}
        />

        <span className="qp-admin-toolbar__spacer" />

        <label className="qp-admin-pagesize" style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <select
            className="qp-select"
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
          >
            {[20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <span className="type-body-small text-muted">
            dòng/trang{data ? ` · ${data.total.toLocaleString("vi-VN")} mục` : ""}
          </span>
        </label>

        <button type="button" className="qp-btn-outline" onClick={resetFilters}>Xóa lọc</button>
      </div>

      {/* ── Table ── */}
      <div className="qp-table--wrap">
        <table className="qp-table">
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Người thực hiện</th>
              <th>Danh mục</th>
              <th>Hành động</th>
              <th>Đối tượng</th>
              <th>Kết quả</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--color-gray-muted)" }}>
                  Đang tải…
                </td>
              </tr>
            ) : !data || data.rows.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--color-gray-muted)" }}>
                  Chưa có nhật ký nào.
                </td>
              </tr>
            ) : (
              data.rows.map((row) => (
                <tr key={row.id}>
                  {/* Thời gian */}
                  <td style={{ whiteSpace: "nowrap", fontSize: 13, color: "var(--color-gray-muted)" }}>
                    {formatDateTime(row.createdAt)}
                  </td>

                  {/* Người thực hiện */}
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.3 }}>
                      {row.userName || <span style={{ color: "var(--color-gray-muted)" }}>Ẩn danh</span>}
                    </div>
                    {row.userEmail && (
                      <div style={{ fontSize: 12, color: "var(--color-gray-muted)" }}>{row.userEmail}</div>
                    )}
                    {row.userRole && row.userRole !== "unknown" && (
                      <span style={{
                        display: "inline-block", marginTop: 2,
                        fontSize: 11, fontWeight: 600, padding: "1px 6px",
                        borderRadius: 4,
                        background: row.userRole === "admin" ? "rgba(239,68,68,0.1)" : row.userRole === "editor" ? "rgba(59,130,246,0.1)" : "rgba(156,163,175,0.2)",
                        color: row.userRole === "admin" ? "#dc2626" : row.userRole === "editor" ? "#2563eb" : "#6b7280",
                      }}>
                        {ROLE_LABELS[row.userRole] || row.userRole}
                      </span>
                    )}
                  </td>

                  {/* Danh mục */}
                  <td>
                    {(() => {
                      const c = CAT_COLORS[row.category] ?? { bg: "rgba(156,163,175,0.2)", color: "#6b7280" };
                      return (
                        <span style={{
                          display: "inline-block", fontSize: 11, fontWeight: 600,
                          padding: "2px 8px", borderRadius: 4, whiteSpace: "nowrap",
                          background: c.bg, color: c.color,
                        }}>
                          {CATEGORY_LABELS[row.category] || row.category}
                        </span>
                      );
                    })()}
                  </td>

                  {/* Hành động */}
                  <td>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>
                      {ACTION_LABELS[row.action] || row.action}
                    </div>
                    {row.detail && (
                      <div style={{ fontSize: 12, color: "var(--color-gray-muted)", marginTop: 2 }}>
                        {row.detail}
                      </div>
                    )}
                  </td>

                  {/* Đối tượng */}
                  <td>
                    {row.target ? (
                      <div>
                        <div style={{ fontSize: 12, color: "var(--color-gray-muted)" }}>
                          {row.target.type}
                        </div>
                        {row.target.label && (
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{row.target.label}</div>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: "var(--color-gray-muted)" }}>—</span>
                    )}
                  </td>

                  {/* Kết quả */}
                  <td>
                    <span style={{
                      display: "inline-block", fontSize: 12, fontWeight: 600,
                      padding: "2px 8px", borderRadius: 4, whiteSpace: "nowrap",
                      background: row.success ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                      color: row.success ? "#059669" : "#dc2626",
                    }}>
                      {row.success ? "Thành công" : "Thất bại"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div style={{ marginTop: "var(--space-4)", display: "flex", justifyContent: "center" }}>
          <Pagination page={page} totalPages={totalPages} onPage={setPage} />
        </div>
      )}
    </div>
  );
}
