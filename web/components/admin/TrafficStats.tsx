"use client";

// Admin → Thống kê truy cập: bài đọc nhiều · tổng quan · theo IP · lịch sử từng lượt truy cập.
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BarList } from "@/components/admin/charts/BarList";
import { TrendChart } from "@/components/admin/charts/TrendChart";
import { HourChart } from "@/components/admin/charts/HourChart";
import { Delta } from "@/components/admin/charts/Delta";
import { Pagination } from "@/components/common/Pagination";

type Tab = "top" | "summary" | "ip" | "log";
const TABS: { id: Tab; label: string }[] = [
  { id: "top", label: "Bài đọc nhiều" },
  { id: "summary", label: "Tổng quan truy cập" },
  { id: "ip", label: "Theo IP" },
  { id: "log", label: "Lịch sử truy cập" },
];

// ── Khoảng ngày (giờ Việt Nam) ──
const vnToday = () => new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);
const shift = (k: string, d: number) => new Date(Date.parse(`${k}T00:00:00Z`) + d * 86400_000).toISOString().slice(0, 10);
const monthStart = (k: string) => `${k.slice(0, 8)}01`;
const prevMonth = (k: string) => { const s = monthStart(k); const end = shift(s, -1); return { from: monthStart(end), to: end }; };
type Range = { from: string; to: string };
const PRESETS: { id: string; label: string; get: (t: string) => Range }[] = [
  { id: "today", label: "Hôm nay", get: (t) => ({ from: t, to: t }) },
  { id: "yesterday", label: "Hôm qua", get: (t) => ({ from: shift(t, -1), to: shift(t, -1) }) },
  { id: "7d", label: "7 ngày", get: (t) => ({ from: shift(t, -6), to: t }) },
  { id: "month", label: "Tháng này", get: (t) => ({ from: monthStart(t), to: t }) },
  { id: "pmonth", label: "Tháng trước", get: (t) => prevMonth(t) },
  { id: "30d", label: "30 ngày", get: (t) => ({ from: shift(t, -29), to: t }) },
];

const n = (v: number) => v.toLocaleString("vi-VN");
const fmtTime = (iso: string) => new Date(iso).toLocaleString("vi-VN", { hour12: false, timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
const DEVICE_LABEL: Record<string, string> = { mobile: "Điện thoại", tablet: "Máy tính bảng", desktop: "Máy tính" };

type TopData = { items: { slug: string; title: string; category: string; views: number; total: number; today: number }[]; totalViews: number; articles: number; daily: { date: string; total: number }[] };
type Summary = { views: number; ips: number; devices: number; byDevice: { label: string; n: number }[]; byOs: { label: string; n: number }[]; byBrowser: { label: string; n: number }[]; topPaths: { label: string; n: number }[]; refs: { label: string; n: number }[]; byHour: { hour: number; n: number }[]; loggedIn: number; daily: { date: string; views: number; ips: number }[] };
type LogRow = { id: string; ip: string; vid: string; path: string; ref?: string; userId?: string; device: string; os: string; browser: string; model: string; createdAt: string };
type IpRow = { ip: string; views: number; first: string; last: string; devices: { device: string; os: string; browser: string; model: string }[]; deviceCount: number; pageCount: number };

function Stat({ label, value, sub, delta, accent = "var(--color-teal)" }: { label: string; value: string; sub?: string; delta?: React.ReactNode; accent?: string }) {
  return (
    <div className="qp-acc-stat" style={{ textAlign: "left", padding: "16px 18px", borderTop: `3px solid ${accent}` }}>
      <div className="qp-acc-stat__value" style={{ fontSize: 28, textAlign: "left", lineHeight: 1 }}>{value}</div>
      <div className="qp-acc-stat__label" style={{ textAlign: "left", marginTop: 6 }}>{label}</div>
      {delta && <div style={{ marginTop: 8 }}>{delta}</div>}
      {sub && <div style={{ marginTop: 6, fontSize: 12, color: "var(--color-gray-text)" }}>{sub}</div>}
    </div>
  );
}

// Tải bảng đang xem về CSV (mở được bằng Excel, có BOM cho tiếng Việt).
function downloadCsv(name: string, rows: (string | number)[][]) {
  const esc = (v: string | number) => "\"" + String(v).split("\"").join("\"\"") + "\"";
  const blob = new Blob(["\uFEFF" + rows.map((r) => r.map(esc).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// Kỳ liền trước có cùng độ dài (để so sánh tăng/giảm).
function prevRange(r: { from: string; to: string }) {
  const days = Math.round((Date.parse(r.to) - Date.parse(r.from)) / 86400_000) + 1;
  return { from: shift(r.from, -days), to: shift(r.from, -1) };
}
const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="qp-admin-card" style={{ cursor: "default" }}>
    <div className="qp-admin-card__label" style={{ marginBottom: 12 }}>{title}</div>
    {children}
  </div>
);
const Empty = ({ text = "Chưa có dữ liệu trong khoảng này." }: { text?: string }) => (
  <p style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--color-gray-muted)", margin: 0 }}>{text}</p>
);

export function TrafficStats() {
  const [tab, setTab] = useState<Tab>("top");
  const [preset, setPreset] = useState("today");
  const [range, setRange] = useState<Range>(() => PRESETS[0].get(vnToday()));
  const [ip, setIp] = useState("");
  const [device, setDevice] = useState("");
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [top, setTop] = useState<TopData | null>(null);
  const [sum, setSum] = useState<Summary | null>(null);
  const [ips, setIps] = useState<{ rows: IpRow[]; total: number } | null>(null);
  const [log, setLog] = useState<{ rows: LogRow[]; total: number } | null>(null);
  const [error, setError] = useState("");
  const [prevTop, setPrevTop] = useState<TopData | null>(null);
  const [prevSum, setPrevSum] = useState<Summary | null>(null);
  const [live, setLive] = useState<number | null>(null);
  const [auto, setAuto] = useState(false);
  const [tick, setTick] = useState(0);
  const PAGE = 30;

  useEffect(() => { const t = setTimeout(() => { setQ(qInput); setPage(1); }, 400); return () => clearTimeout(t); }, [qInput]);

  const query = useMemo(() => {
    const p = new URLSearchParams({ from: range.from, to: range.to, page: String(page), pageSize: String(PAGE) });
    if (ip) p.set("ip", ip);
    if (device) p.set("device", device);
    if (q) p.set("q", q);
    return p;
  }, [range, ip, device, q, page]);

  const load = useCallback(async (signal: AbortSignal) => {
    setLoading(true); setError("");
    const view = tab === "top" ? "top" : tab === "summary" ? "summary" : tab === "ip" ? "ip" : "log";
    try {
      const res = await fetch(`/api/admin/traffic?view=${view}&${query}`, { signal, cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      if (tab === "top") setTop(data); else if (tab === "summary") setSum(data); else if (tab === "ip") setIps(data); else setLog(data);
      // Kỳ trước (để hiện % tăng/giảm)
      if (tab === "top" || tab === "summary") {
        const pr = prevRange(range);
        const pq = new URLSearchParams({ from: pr.from, to: pr.to });
        const r2 = await fetch(`/api/admin/traffic?view=${view}&${pq}`, { signal, cache: "no-store" });
        if (r2.ok) { const d2 = await r2.json(); if (tab === "top") setPrevTop(d2); else setPrevSum(d2); }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError("Không tải được dữ liệu. Thử lại sau.");
    } finally { if (!signal.aborted) setLoading(false); }
  }, [tab, query, range]);

  // Người đang online (5 phút gần nhất) + tự làm mới 30s khi bật "Tự làm mới"
  useEffect(() => {
    let off = false;
    const poll = () => fetch("/api/admin/traffic?view=live", { cache: "no-store" }).then((r) => r.json()).then((d) => { if (!off) setLive(d.live ?? 0); }).catch(() => {});
    poll();
    const id = setInterval(() => { poll(); if (auto) setTick((t) => t + 1); }, 30_000);
    return () => { off = true; clearInterval(id); };
  }, [auto]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- tải dữ liệu theo bộ lọc (đồng bộ với API)
  useEffect(() => { const c = new AbortController(); void load(c.signal); return () => c.abort(); }, [load, tick]);

  function pickPreset(id: string) {
    const p = PRESETS.find((x) => x.id === id)!;
    setPreset(id); setRange(p.get(vnToday())); setPage(1);
  }
  function openIp(addr: string) { setIp(addr); setTab("log"); setPage(1); }
  const changeTab = (t: Tab) => { setTab(t); setPage(1); };
  function exportCsv() {
    const tag = `${range.from}_${range.to}`;
    if (tab === "top" && top) downloadCsv(`bai-doc-nhieu_${tag}.csv`, [["Hạng", "Bài viết", "Chuyên mục", "Lượt đọc (kỳ)", "Hôm nay", "Tổng từ trước"], ...top.items.map((a, i) => [i + 1, a.title, a.category, a.views, a.today, a.total])]);
    else if (tab === "summary" && sum) downloadCsv(`luot-truy-cap-theo-ngay_${tag}.csv`, [["Ngày", "Lượt xem", "IP khác nhau"], ...sum.daily.map((d) => [d.date, d.views, d.ips])]);
    else if (tab === "ip" && ips) downloadCsv(`theo-ip_${tag}.csv`, [["IP", "Lượt xem", "Số trang", "Số thiết bị", "Lần đầu", "Gần nhất"], ...ips.rows.map((r) => [r.ip, r.views, r.pageCount, r.deviceCount, fmtTime(r.first), fmtTime(r.last)])]);
    else if (tab === "log" && log) downloadCsv(`lich-su-truy-cap_${tag}.csv`, [["Thời gian", "IP", "Thiết bị", "Hệ điều hành", "Trình duyệt", "Dòng máy", "Trang", "Nguồn", "Tài khoản"], ...log.rows.map((r) => [fmtTime(r.createdAt), r.ip, DEVICE_LABEL[r.device] ?? r.device, r.os, r.browser, r.model, r.path, r.ref ?? "", r.userId ? "Đã đăng nhập" : "Khách"])]);
  }

  return (
    <div>
      {/* Tab */}
      <div role="tablist" aria-label="Thống kê" style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: "var(--space-4)" }}>
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} type="button" onClick={() => changeTab(t.id)}
            className={tab === t.id ? "qp-btn-primary" : "qp-btn-outline"} style={{ minHeight: 40 }}>{t.label}</button>
        ))}
      </div>

      {/* Khoảng ngày */}
      <div className="qp-admin-toolbar" style={{ flexWrap: "wrap", gap: "var(--space-2)", marginBottom: "var(--space-4)", alignItems: "center" }}>
        {PRESETS.map((p) => (
          <button key={p.id} type="button" onClick={() => pickPreset(p.id)} aria-pressed={preset === p.id}
            className={preset === p.id ? "qp-btn-primary" : "qp-btn-outline"} style={{ minHeight: 36, padding: "0 12px" }}>{p.label}</button>
        ))}
        <input type="date" className="qp-input" style={{ width: "auto" }} value={range.from} max={range.to} title="Từ ngày"
          onChange={(e) => { if (e.target.value) { setRange({ ...range, from: e.target.value }); setPreset(""); setPage(1); } }} />
        <span style={{ color: "var(--color-gray-muted)" }}>→</span>
        <input type="date" className="qp-input" style={{ width: "auto" }} value={range.to} min={range.from} title="Đến ngày"
          onChange={(e) => { if (e.target.value) { setRange({ ...range, to: e.target.value }); setPreset(""); setPage(1); } }} />
        {loading && <span className="type-body-small text-muted">Đang tải…</span>}
        <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {live !== null && (
            <span title="Số IP có truy cập trong 5 phút gần nhất" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 999, background: "var(--color-teal-pale)", color: "var(--color-teal-dark)", fontWeight: 700, fontSize: 13 }}>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: "var(--color-teal)", boxShadow: "0 0 0 3px rgba(0,169,143,.25)" }} />
              {n(live)} đang online
            </span>
          )}
          <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
            <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} /> Tự làm mới
          </label>
          <button type="button" className="qp-btn-outline" style={{ minHeight: 36, padding: "0 12px" }} onClick={() => setTick((t) => t + 1)}>Làm mới</button>
          <button type="button" className="qp-btn-outline" style={{ minHeight: 36, padding: "0 12px" }} onClick={exportCsv}>Tải CSV</button>
        </span>
      </div>
      {error && <div className="qp-alert is-error" role="alert" style={{ marginBottom: "var(--space-4)" }}><div className="qp-alert__body">{error}</div></div>}

      {/* ── Bài đọc nhiều ── */}
      {tab === "top" && (
        <div style={{ display: "grid", gap: "var(--space-4)" }}>
          <div style={{ display: "grid", gap: "var(--space-3)", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))" }}>
            <Stat label="Lượt đọc bài trong kỳ" value={n(top?.totalViews ?? 0)} delta={prevTop && top ? <Delta cur={top.totalViews} prev={prevTop.totalViews} /> : undefined} />
            <Stat label="Số bài được đọc" value={n(top?.articles ?? 0)} accent="#6366F1" delta={prevTop && top ? <Delta cur={top.articles} prev={prevTop.articles} /> : undefined} />
            <Stat label="Trung bình mỗi bài" value={top?.articles ? n(Math.round(top.totalViews / top.articles)) : "0"} accent="#F59E0B" />
          </div>
          {(top?.daily.length ?? 0) > 1 && <Card title="Lượt đọc theo ngày"><TrendChart points={top!.daily} /></Card>}
          <div className="qp-table--wrap" style={{ overflowX: "auto" }}>
            <table className="qp-table" style={{ minWidth: 640 }}>
              <thead><tr><th style={{ width: 48 }}>#</th><th>Bài viết</th><th>Chuyên mục</th><th style={{ textAlign: "right" }}>Lượt đọc (kỳ này)</th><th style={{ textAlign: "right" }}>Tỉ trọng</th><th style={{ textAlign: "right" }}>Hôm nay</th><th style={{ textAlign: "right" }}>Tổng từ trước</th></tr></thead>
              <tbody>
                {!top || top.items.length === 0 ? (
                  <tr><td colSpan={7}><Empty text={loading ? "Đang tải…" : "Chưa có lượt đọc nào được ghi trong khoảng này. Số liệu theo ngày bắt đầu được ghi từ khi bật tính năng này."} /></td></tr>
                ) : top.items.map((a, i) => {
                  const max = top.items[0].views || 1;
                  return (
                    <tr key={a.slug}>
                      <td style={{ fontWeight: 800, color: i < 3 ? "var(--color-teal-dark)" : "var(--color-gray-muted)" }}>{["🥇", "🥈", "🥉"][i] ?? i + 1}</td>
                      <td>
                        <Link href={`/tin-tuc/${a.slug}`} target="_blank" style={{ fontWeight: 600, color: "var(--color-navy-deep)" }}>{a.title}</Link>
                        <div style={{ height: 5, borderRadius: 99, background: "var(--color-navy-pale)", marginTop: 6, maxWidth: 360 }}>
                          <div style={{ height: "100%", width: `${Math.max(3, (a.views / max) * 100)}%`, borderRadius: 99, background: "var(--color-teal)" }} />
                        </div>
                      </td>
                      <td style={{ fontSize: 12.5 }}>{a.category}</td>
                      <td style={{ textAlign: "right", fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{n(a.views)}</td>
                      <td style={{ textAlign: "right", fontSize: 12.5, color: "var(--color-gray-text)" }}>{top.totalViews ? Math.round((a.views / top.totalViews) * 100) : 0}%</td>
                      <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{n(a.today)}</td>
                      <td style={{ textAlign: "right", color: "var(--color-gray-text)", fontVariantNumeric: "tabular-nums" }}>{n(a.total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tổng quan ── */}
      {tab === "summary" && (
        <div style={{ display: "grid", gap: "var(--space-4)" }}>
          <div style={{ display: "grid", gap: "var(--space-3)", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))" }}>
            <Stat label="Lượt xem trang" value={n(sum?.views ?? 0)} delta={prevSum && sum ? <Delta cur={sum.views} prev={prevSum.views} /> : undefined} />
            <Stat label="IP khác nhau" value={n(sum?.ips ?? 0)} accent="#6366F1" delta={prevSum && sum ? <Delta cur={sum.ips} prev={prevSum.ips} /> : undefined} sub="Gần đúng số người truy cập" />
            <Stat label="Thiết bị khác nhau" value={n(sum?.devices ?? 0)} accent="#F59E0B" sub="Theo IP + trình duyệt" />
            <Stat label="Trang / mỗi IP" value={sum?.ips ? (sum.views / sum.ips).toFixed(1).replace(".", ",") : "0"} accent="#0F4C81" sub={sum && sum.views ? `${Math.round((sum.loggedIn / sum.views) * 100)}% lượt từ người đã đăng nhập` : undefined} />
          </div>
          {sum && sum.daily.length === 0 && !loading && <Empty text="Chưa có lượt truy cập nào được ghi trong khoảng này." />}
          {(sum?.daily.length ?? 0) > 1 && <Card title="Lượt xem trang theo ngày"><TrendChart points={sum!.daily.map((d) => ({ date: d.date, total: d.views }))} /></Card>}
          {sum && sum.views > 0 && (
            <div style={{ display: "grid", gap: "var(--space-4)", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))" }}>
              <Card title="Khung giờ truy cập (giờ VN)"><HourChart data={sum.byHour} /></Card>
              <Card title="Nguồn truy cập">{sum.refs.length ? <BarList items={sum.refs.map((d) => ({ label: d.label, value: d.n, color: "#E1567C" }))} /> : <Empty text="Phần lớn truy cập trực tiếp, chưa có nguồn giới thiệu." />}</Card>
              <Card title="Loại thiết bị"><BarList items={sum.byDevice.map((d) => ({ label: DEVICE_LABEL[d.label] ?? d.label, value: d.n }))} /></Card>
              <Card title="Hệ điều hành"><BarList items={sum.byOs.map((d) => ({ label: d.label, value: d.n, color: "var(--color-indigo, #6366F1)" }))} /></Card>
              <Card title="Trình duyệt"><BarList items={sum.byBrowser.map((d) => ({ label: d.label, value: d.n, color: "#F59E0B" }))} /></Card>
              <Card title="Trang được xem nhiều"><BarList items={sum.topPaths.map((d) => ({ label: d.label, value: d.n, color: "#0F4C81" }))} /></Card>
            </div>
          )}
        </div>
      )}

      {/* ── Theo IP ── */}
      {tab === "ip" && (
        <>
          <div className="qp-table--wrap" style={{ overflowX: "auto" }}>
            <table className="qp-table" style={{ minWidth: 760 }}>
              <thead><tr><th>IP</th><th style={{ textAlign: "right" }}>Lượt xem</th><th style={{ textAlign: "right" }}>Số trang</th><th>Thiết bị</th><th>Lần đầu</th><th>Gần nhất</th><th /></tr></thead>
              <tbody>
                {!ips || ips.rows.length === 0 ? <tr><td colSpan={7}><Empty text={loading ? "Đang tải…" : undefined} /></td></tr> : ips.rows.map((r) => (
                  <tr key={r.ip}>
                    <td style={{ fontFamily: "monospace", fontSize: 12.5, whiteSpace: "nowrap" }}>{r.ip}</td>
                    <td style={{ textAlign: "right", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{n(r.views)}</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{n(r.pageCount)}</td>
                    <td style={{ fontSize: 12.5 }}>
                      {r.devices.map((d, i) => <div key={i}>{DEVICE_LABEL[d.device] ?? d.device} · {d.model || d.os} · {d.browser}</div>)}
                      {r.deviceCount > r.devices.length && <div style={{ color: "var(--color-gray-muted)" }}>+{r.deviceCount - r.devices.length} thiết bị khác</div>}
                    </td>
                    <td style={{ fontSize: 12, whiteSpace: "nowrap", color: "var(--color-gray-text)" }}>{fmtTime(r.first)}</td>
                    <td style={{ fontSize: 12, whiteSpace: "nowrap", color: "var(--color-gray-text)" }}>{fmtTime(r.last)}</td>
                    <td><button type="button" className="qp-btn-outline" style={{ minHeight: 32, padding: "0 10px" }} onClick={() => openIp(r.ip)}>Xem chi tiết</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {ips && Math.ceil(ips.total / PAGE) > 1 && <div style={{ marginTop: "var(--space-4)", display: "flex", justifyContent: "center" }}><Pagination page={page} totalPages={Math.ceil(ips.total / PAGE)} onPage={setPage} /></div>}
          {ips && <p className="type-body-small text-muted" style={{ marginTop: 8 }}>{n(ips.total)} IP trong khoảng đã chọn.</p>}
        </>
      )}

      {/* ── Lịch sử ── */}
      {tab === "log" && (
        <>
          <div className="qp-admin-toolbar" style={{ flexWrap: "wrap", gap: "var(--space-2)", marginBottom: "var(--space-3)", alignItems: "center" }}>
            <input type="search" className="qp-input" placeholder="Tìm IP, trang, trình duyệt, hệ điều hành…" value={qInput} onChange={(e) => setQInput(e.target.value)} style={{ minWidth: 220, flex: "1 1 220px" }} />
            <select className="qp-select" value={device} onChange={(e) => { setDevice(e.target.value); setPage(1); }}>
              <option value="">Mọi thiết bị</option><option value="mobile">Điện thoại</option><option value="tablet">Máy tính bảng</option><option value="desktop">Máy tính</option>
            </select>
            {ip && <button type="button" className="qp-btn-outline" onClick={() => { setIp(""); setPage(1); }} title="Bỏ lọc IP">IP: {ip} ✕</button>}
          </div>
          <div className="qp-table--wrap" style={{ overflowX: "auto" }}>
            <table className="qp-table" style={{ minWidth: 820 }}>
              <thead><tr><th>Thời gian</th><th>IP</th><th>Thiết bị</th><th>Trang</th><th>Nguồn</th><th>Tài khoản</th></tr></thead>
              <tbody>
                {!log || log.rows.length === 0 ? <tr><td colSpan={6}><Empty text={loading ? "Đang tải…" : undefined} /></td></tr> : log.rows.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontSize: 12, whiteSpace: "nowrap", color: "var(--color-gray-text)" }}>{fmtTime(r.createdAt)}</td>
                    <td style={{ fontFamily: "monospace", fontSize: 12 }}><button type="button" onClick={() => openIp(r.ip)} style={{ all: "unset", cursor: "pointer", textDecoration: "underline" }}>{r.ip}</button></td>
                    <td style={{ fontSize: 12.5 }}>{DEVICE_LABEL[r.device] ?? r.device} · {r.model || r.os}<div style={{ color: "var(--color-gray-muted)" }}>{r.browser}{r.model ? ` · ${r.os}` : ""}</div></td>
                    <td style={{ fontSize: 13, wordBreak: "break-all" }}><Link href={r.path} target="_blank">{r.path}</Link></td>
                    <td style={{ fontSize: 12.5 }}>{r.ref || <span style={{ color: "var(--color-gray-muted)" }}>Trực tiếp</span>}</td>
                    <td style={{ fontSize: 12 }}>{r.userId ? "Đã đăng nhập" : <span style={{ color: "var(--color-gray-muted)" }}>Khách</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {log && Math.ceil(log.total / PAGE) > 1 && <div style={{ marginTop: "var(--space-4)", display: "flex", justifyContent: "center" }}><Pagination page={page} totalPages={Math.ceil(log.total / PAGE)} onPage={setPage} /></div>}
          {log && <p className="type-body-small text-muted" style={{ marginTop: 8 }}>{n(log.total)} lượt truy cập. Dữ liệu tự xoá sau 90 ngày.</p>}
        </>
      )}
    </div>
  );
}
