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
  // auth
  "auth.login":              "Đăng nhập",
  "auth.register":           "Đăng ký",
  // user management
  "user.setRole":            "Đổi vai trò",
  "user.ban":                "Khóa tài khoản",
  "user.unban":              "Mở khóa tài khoản",
  "user.warn.add":           "Thêm cảnh báo",
  "user.warn.clear":         "Xóa cảnh báo",
  "user.delete":             "Xóa tài khoản",
  // articles
  "article.approve":         "Duyệt bài viết",
  "article.reject":          "Từ chối bài viết",
  "article.submit":          "Gửi bài viết",
  "article.update":          "Sửa bài viết",
  "article.delete":          "Xóa bài viết",
  "article.import":          "Import tin ngoài",
  // jobs
  "job.approve":             "Duyệt việc làm",
  "job.reject":              "Từ chối việc làm",
  "job.create":              "Đăng việc làm",
  "job.update":              "Sửa việc làm",
  "job.delete":              "Xóa việc làm",
  // mua-ban
  "mua-ban.approve":         "Duyệt mua bán",
  "mua-ban.reject":          "Từ chối mua bán",
  "mua-ban.create":          "Đăng mua bán",
  "mua-ban.update":          "Sửa mua bán",
  "mua-ban.delete":          "Xóa mua bán",
  // lost-found
  "lost-found.approve":      "Duyệt tìm đồ rơi",
  "lost-found.reject":       "Từ chối tìm đồ rơi",
  "lost-found.create":       "Đăng tìm đồ rơi",
  "lost-found.update":       "Sửa tin tìm đồ rơi",
  "lost-found.delete":       "Xóa tin tìm đồ rơi",
  // contact
  "contact.submit":          "Gửi liên hệ",
  "contact.handle":          "Xử lý liên hệ",
  "contact.delete":          "Xóa liên hệ",
  // categories
  "category.create":         "Tạo danh mục",
  "category.update":         "Sửa danh mục",
  "category.delete":         "Xóa danh mục",
  // custom-roles
  "custom-role.create":      "Tạo vai trò",
  "custom-role.update":      "Sửa vai trò",
  "custom-role.delete":      "Xóa vai trò",
  // ads
  "ad.create":               "Tạo quảng cáo",
  "ad.update":               "Sửa quảng cáo",
  "ad.delete":               "Xóa quảng cáo",
  // notifications
  "notification.create":     "Tạo thông báo",
  "notification.personal":   "Gửi TB cá nhân",
  "notification.send":       "Gửi thông báo",
  "notification.delete":     "Xóa thông báo",
  // newsletter
  "newsletter.unsubscribe":  "Hủy đăng ký NL",
  // settings
  "settings.update":         "Cập nhật cài đặt",
  "page-seo.update":         "Cập nhật SEO",
  "home-sections.update":    "Cập nhật trang chủ",
  "news-page.update":        "Cập nhật trang tin",
  "role-permissions.update": "Cập nhật phân quyền",
  "affiliate.update":        "Cập nhật liên kết",
  // profanity
  "profanity.add":           "Thêm từ cấm",
  "profanity.update":        "Sửa từ cấm",
  "profanity.delete":        "Xóa từ cấm",
  "profanity.import":        "Import từ cấm",
  "profanity.seed":          "Seed từ cấm",
  // seed / ai
  "seed.run":                "Chạy seed dữ liệu",
  "ai.generate":             "Tạo nội dung AI",
  // places
  "truong-hoc.create":       "Tạo trường học",
  "truong-hoc.update":       "Sửa trường học",
  "truong-hoc.delete":       "Xóa trường học",
  "y-te.create":             "Tạo cơ sở y tế",
  "y-te.update":             "Sửa cơ sở y tế",
  "y-te.delete":             "Xóa cơ sở y tế",
  "cho.create":              "Tạo chợ",
  "cho.update":              "Sửa chợ",
  "cho.delete":              "Xóa chợ",
  "giao-thong.create":       "Tạo giao thông",
  "giao-thong.update":       "Sửa giao thông",
  "giao-thong.delete":       "Xóa giao thông",
  "di-tich.create":          "Tạo di tích",
  "di-tich.update":          "Sửa di tích",
  "di-tich.delete":          "Xóa di tích",
  "admin-units.create":      "Tạo đơn vị HC",
  "admin-units.update":      "Sửa đơn vị HC",
  "admin-units.delete":      "Xóa đơn vị HC",
};

const CATEGORY_LABELS: Record<string, string> = {
  auth:  "Xác thực",
  admin: "Quản trị",
  user:  "Người dùng",
};

const ROLE_LABELS: Record<string, string> = {
  superadmin: "Super",
  admin:      "Admin",
  editor:     "BTV",
  user:       "User",
};

const CAT_COLORS: Record<string, { bg: string; color: string }> = {
  auth:  { bg: "rgba(59,130,246,0.12)",  color: "#1d4ed8" },
  admin: { bg: "rgba(239,68,68,0.12)",   color: "#b91c1c" },
  user:  { bg: "rgba(16,185,129,0.12)",  color: "#047857" },
};

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  superadmin: { bg: "rgba(124,58,237,0.12)", color: "#6d28d9" },
  admin:      { bg: "rgba(239,68,68,0.12)",  color: "#b91c1c" },
  editor:     { bg: "rgba(59,130,246,0.12)", color: "#1d4ed8" },
  user:       { bg: "rgba(156,163,175,0.2)", color: "#4b5563" },
};

export function ActivityLogViewer() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [success, setSuccess] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Debounce search input 400ms
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]); // eslint-disable-line react-hooks/exhaustive-deps

  const doFetch = useCallback(async (signal: AbortSignal) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (search)   params.set("search", search);
    if (category) params.set("category", category);
    if (success)  params.set("success", success);
    if (dateFrom) params.set("from", dateFrom + "T00:00:00");
    if (dateTo)   params.set("to",   dateTo   + "T23:59:59");
    try {
      const res = await fetch(`/api/admin/activity-logs?${params}`, { signal });
      if (res.ok) setData(await res.json());
    } catch {
      // aborted or network error — ignore
    } finally {
      setLoading(false);
    }
  }, [search, category, success, dateFrom, dateTo, page, pageSize]);

  useEffect(() => {
    const ctrl = new AbortController();
    doFetch(ctrl.signal);
    return () => ctrl.abort();
  }, [doFetch]);

  function resetFilters() {
    setSearchInput(""); setSearch(""); setCategory(""); setSuccess("");
    setDateFrom(""); setDateTo(""); setPage(1);
  }

  function changeFilter<T>(setter: (v: T) => void) {
    return (v: T) => { setter(v); setPage(1); };
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / pageSize)) : 1;

  return (
    <div>
      {/* ── Filter bar ── */}
      <div
        className="qp-admin-toolbar"
        style={{ flexWrap: "wrap", gap: "var(--space-2)", marginBottom: "var(--space-4)", alignItems: "center" }}
      >
        {/* Search */}
        <input
          type="search"
          className="qp-input"
          placeholder="Tìm theo tên, hành động, đối tượng…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{ minWidth: 200, flex: "1 1 200px" }}
        />

        {/* Category */}
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

        {/* Success/Fail */}
        <select
          className="qp-select"
          value={success}
          onChange={(e) => changeFilter(setSuccess)(e.target.value)}
        >
          <option value="">Tất cả kết quả</option>
          <option value="true">Thành công</option>
          <option value="false">Thất bại</option>
        </select>

        {/* Date range */}
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

        {/* Page size */}
        <label style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
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
      <div className="qp-table--wrap" style={{ overflowX: "auto" }}>
        <table className="qp-table" style={{ minWidth: 900 }}>
          <thead>
            <tr>
              <th style={{ whiteSpace: "nowrap" }}>Thời gian</th>
              <th>Người thực hiện</th>
              <th>Vai trò</th>
              <th>Danh mục</th>
              <th>Hành động</th>
              <th>Đối tượng</th>
              <th>IP</th>
              <th style={{ textAlign: "center" }}>Kết quả</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--color-gray-muted)" }}>
                  Đang tải…
                </td>
              </tr>
            ) : !data || data.rows.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--color-gray-muted)" }}>
                  Chưa có nhật ký nào.
                </td>
              </tr>
            ) : (
              data.rows.map((row) => {
                const rolec = ROLE_COLORS[row.userRole] ?? ROLE_COLORS.user;
                const catc  = CAT_COLORS[row.category]  ?? { bg: "rgba(156,163,175,0.2)", color: "#6b7280" };
                return (
                  <tr
                    key={row.id}
                    style={{
                      background: row.success
                        ? "rgba(16,185,129,0.025)"
                        : "rgba(239,68,68,0.035)",
                    }}
                  >
                    {/* Thời gian */}
                    <td style={{ whiteSpace: "nowrap", fontSize: 12, color: "var(--color-gray-muted)" }}>
                      {formatDateTime(row.createdAt)}
                    </td>

                    {/* Người thực hiện */}
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.3 }}>
                        {row.userName || <span style={{ color: "var(--color-gray-muted)", fontWeight: 400 }}>Ẩn danh</span>}
                      </div>
                      {row.userEmail && (
                        <div style={{ fontSize: 11, color: "var(--color-gray-muted)", marginTop: 1 }}>{row.userEmail}</div>
                      )}
                    </td>

                    {/* Vai trò */}
                    <td>
                      {row.userRole && row.userRole !== "unknown" && (
                        <span style={{
                          display: "inline-block",
                          fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
                          background: rolec.bg, color: rolec.color,
                        }}>
                          {ROLE_LABELS[row.userRole] || row.userRole}
                        </span>
                      )}
                    </td>

                    {/* Danh mục */}
                    <td>
                      <span style={{
                        display: "inline-block", fontSize: 11, fontWeight: 600,
                        padding: "2px 8px", borderRadius: 4, whiteSpace: "nowrap",
                        background: catc.bg, color: catc.color,
                      }}>
                        {CATEGORY_LABELS[row.category] || row.category}
                      </span>
                    </td>

                    {/* Hành động */}
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>
                        {ACTION_LABELS[row.action] || row.action}
                      </div>
                      {row.detail && (
                        <div style={{ fontSize: 11, color: "var(--color-gray-muted)", marginTop: 2 }}>
                          {row.detail}
                        </div>
                      )}
                    </td>

                    {/* Đối tượng */}
                    <td>
                      {row.target ? (
                        <div>
                          <div style={{ fontSize: 11, color: "var(--color-gray-muted)" }}>
                            {row.target.type}
                          </div>
                          {row.target.label && (
                            <div style={{ fontSize: 12, fontWeight: 500, marginTop: 1 }}>{row.target.label}</div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: "var(--color-gray-muted)" }}>—</span>
                      )}
                    </td>

                    {/* IP */}
                    <td style={{
                      fontFamily: "monospace", fontSize: 11,
                      color: "var(--color-gray-muted)", whiteSpace: "nowrap",
                    }}>
                      {row.ip || <span>—</span>}
                    </td>

                    {/* Kết quả */}
                    <td style={{
                      background: row.success ? "rgba(16,185,129,0.18)" : "rgba(239,68,68,0.18)",
                      color: row.success ? "#065f46" : "#991b1b",
                      fontWeight: 700, fontSize: 12, textAlign: "center",
                      whiteSpace: "nowrap", padding: "0 12px",
                    }}>
                      {row.success ? "Thành công" : "Thất bại"}
                    </td>
                  </tr>
                );
              })
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
